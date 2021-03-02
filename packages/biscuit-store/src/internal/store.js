import {
    repositories,
    states,
} from './repositories';
import {
    emitter,
} from './emitter';
import {
    gettter,
    getStateLink,
    getStoreContent,
    compareObject,
    actionError,
    getStoreName,
} from './helper';
import { dispatchProto, dispatchInitMiddleware } from './dispatch';
import { CreateError } from './debugger';
import { typeOf } from './utils';
import { messages } from './messages';
import { newStore } from './creator';
/**
 * Allows you to subscribe to the store. and tracks its change.
 * @param {string} name store name
 * @param {function} fn callback
 * @param {string} type state name
 * @return {Promise}
 * @async
 */
const subscriber = function (name, fn, type) {
    let task;
    const promise = new Promise((resolve) => {
        task = emitter.subscribeAction(name, () => {
            /** if there is a state then pick it up */
            const data = type
                ? getState({ name, type })
                : getStore(name);
            fn(data, task);
            resolve({ data });
        }, type);
    });

    const resolve = this.resolve(promise);
    resolve['unsubscribe'] = task.remove;

    return resolve;
};

/**
 * This method allows you to add new values to the store.
 * Accepts the storage name and object.
 * @param {string | import('../../../types').Store} target store name or store
 * @param {object} instance object with added data
 * @public
 */
export function addStore(target, instance) {
    const name = getStoreName(target);
    if (!repositories[name]) {
        throw new CreateError(messages.noStore(name));
    }

    if (typeOf(instance) !== 'object') {
        throw new CreateError(messages.initialType);
    }

    repositories[name].content = {
        ...getStoreContent(name),
        ...instance,
    };
}

/**
 * This method is used to get data from the storage by its key.
 * Warning: Storage data cannot be changed directly.
 * You can replace the values either with the "addStore"
 * method or with state injection via "manager".
 * @param {string | import('../../../types').Store} target store name or store
 * @return {object} storage data
 * @public
 */
export function getStore(target) {
    const name = getStoreName(target);

    if (!repositories[name]) {
        throw new CreateError(messages.noStore(name));
    }

    return gettter({ ...getStoreContent(name) });
}

/**
 * This method is needed to get the storage state
 * Warning: Storage data cannot be changed directly.
 * You can replace the values either with the "dispatch (...)"
 * method or with an implementation via "manager".
 * @param {import('../../types/state').AnyAction} action the parameters of the action
 * @return {object} state data
 * @public
 */
export function getState(action) {
    actionError(action);
    return gettter({ ...getStateLink(action).content });
}

/**
 * This is one of the most important methods.
 * allows you to asynchronously update and change the state of the storage.
 *
 * The first argument accepts action parameters,
 * the second argument accepts an object with new data
 * or a callback function that returns the past state
 * as an argument and returns a new state.
 *
 * Dispatch also returns several methods for working with states.
 * @param {import('../../types/state').AnyAction} action the parameters of the action
 * @param {object | import('../../types/state').DispatchPayload} payload
 * payload data or callback function
 * @return {import('../../types/state').Dispatcher}
 * returns methods: before, after, merge
 * @async
 * @public
 */
export function dispatch(action, payload = {}) {
    const voids = {};

    actionError(action);

    if (typeOf(payload) !== 'function' && typeOf(payload) !== 'object') {
        throw new CreateError('The payload must be an object or function.', action.name);
    }

    async function promise() {
        const state = getStateLink(action);
        const prev = { ...state.content };

        /** if the function
         * then pass the current state to the callback  */
        let payData = typeof payload === 'function'
            ? payload(prev)
            : payload;

        dispatchProto.call(voids, {
            action,
            prev,
            payData,
        });

        /** initial middlewares */
        payData = await dispatchInitMiddleware({ action, payData, prev });

        /** update state data */
        getStateLink(action).content = {
            ...state.content,
            ...payData,
        };

        /** create dispatch action */
        emitter.dispatchAction(action);
        return true;
    };

    const task = promise();

    return { wait: task, ...voids };
}

/**
 * This is one of the most important methods.
 * Allows you to subscribe to the state. and tracks its change.
 * The first argument takes the parameters of the action.
 * results can be obtained through the callback of the second
 * argument or through the return promise.
 * @param {import('../../types/state').AnyAction} action the parameters of the action
 * @param {import('../../types/subscribe').SubscribeListner} fn callback
 * @return {Promise<any>}
 * @async
 * @public
 */
export function subscribeToState(action, fn = () => undefined) {
    const that = Promise;
    try {
        actionError(action);
        return subscriber.call(that, action.name, fn, action.type);
    } catch (e) {
        return that.reject(e);
    }
}

/**
 * This is one of the most important methods.
 * Allows you to subscribe to the store. and tracks its change.
 * The first argument takes the name store.
 * results can be obtained through the callback of the
 * second argument or through the return promise.
 * @param {string | import('../../../types').Store} target store name or store
 * @param {import('../../types/state').SubscribeListner} fn callback
 * @callback
 * @async
 * @public
 */
export function subscribeToStore(target, fn = () => undefined) {
    const storeName = getStoreName(target);
    const that = Promise;
    try {
        if (!repositories[storeName]) {
            throw new CreateError(messages.noStore(storeName));
        }

        return subscriber.call(that, storeName, fn);
    } catch (e) {
        return that.reject(e);
    }
}

/**
 * The State Manager allows you to manage the storage and its state.
 * Provides a set of methods for two-way merge, replace, copy,
 * and other actions between the selected storage and state.
 * @param {import('../../types/state').AnyAction} action the parameters of the action
 * @return {object} returns a set of methods
 * @public
 */
export function createManager(action) {
    actionError(action);
    return {
        /**
         * This method will combine data from the state with data from the storage.
         * @public
         */
        merge: () => {
            repositories[action.name].content = {
                ...getStoreContent(action.type),
                ...getStateLink(action).content,
            };
        },

        /**
         * This method will merge data from the storage with data from the state.
         * @public
         */
        pull: () => {
            getStateLink(action).content = {
                ...getStateLink(action).content,
                ...getStoreContent(action.name),
            };
        },

        /**
         * This method will replace the data from the storage with state data.
         * @public
         */
        replaceStore: () => {
            repositories[action.name].content = {
                ...getStateLink(action).content,
            };
        },

        /**
         * This method will replace the data from the state with the storage data.
         * @public
         */
        replaceState: () => {
            getStateLink(action).content = {
                ...getStoreContent(action.name),
            };
        },

        /**
         * This method will merge the data of the selected state
         * with the data of the state specified in the arguments.
         * @param {import('../../types/state').AnyAction} targetAction
         * the action that you want to merge
         * @public
         */
        mergeState: (targetAction) => {
            actionError(targetAction);
            getStateLink(action).content = {
                ...getStateLink({
                    type: targetAction.type,
                    name: action.name,
                }).content,
                ...getStateLink(action).content,
            };
        },

        /**
         * This method removes the storage and its copies from all states.
         * WARNING: This method can be useful for optimization,
         * but it can make the code non-obvious,
         * which will lead to difficulties in support.
         * @public
         */
        remove: () => {
            delete repositories[action.name];
            Object.keys(states[`"${action.type}"`]).forEach((item) => {
                if (item === action.name) {
                    delete states[`"${action.type}"`][action.name];
                }
            });
        },

        /**
         * This method compares two states
         * WARNING: states should not contain methods
         * @param {import('../../types/state').AnyAction} targetAction
         * the action that you want to compare
         * @return {bool}
         * @public
         */
        compareStates: (targetAction) => {
            actionError(targetAction);
            return compareObject(
                getStateLink(action).content,
                getStateLink(targetAction).content,
            );
        },

        /**
         * Сompare state and store
         * WARNING: states should not contain methods
         * @return {bool}
         * @public
         */
        compareWithState: () => {
            return compareObject(
                getStoreContent(action.name),
                getStateLink(action).content
            );
        },

        /**
         * compare state and instance object
         * WARNING: states should not contain methods
         * @param {object} instance object instance
         * @return {bool}
         * @public
         */
        compareStateWithInstance: (instance) => {
            return compareObject(getStateLink(action).content, instance);
        },

        /**
         * \
         * WARNING: states should not contain methods
         * @param {object} instance object instance
         * @return {bool}
         * @public
         */
        compareStoreWithInstance: (instance) => {
            return compareObject(getStoreContent(action.name), instance);
        },

        /**
         * Clones the selected storage and its state.
         * WARNING: It is best to avoid using this method,
         * as the best practice would be to do initialization of stores in one place.
         * Copying the store can lead to code support difficulties.
         * @param {string} name name for the new storage
         * @public
         */
        clone: (name) => {
            const store = newStore(name, { ...getStoreContent(action.name) });
            states[`"${action.type}"`][name] = {
                content: { ...getStateLink(action).content },
            };

            return store;
        },

        /**
         * Updates the status of the store.
         * This method is equivalent to dispatch(...)
         * @public
         */
        update: () => {
            dispatch(action, {});
        },

        /**
         * Returns parameters of the selected action
         * @public
         */
        props: action,
    };
}
