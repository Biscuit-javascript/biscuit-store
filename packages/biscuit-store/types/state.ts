/**
 * This type defines the payload in the dispatch
 */
export type DispatchPayload = (<T>(prev: T) => object) | object;

/**
 * This type defines the subscription function
 */
export type SubscribeListner<T> = (state: T) => void;

/**
 * This type defines the dispatch function
 */
export type Dispatch = <T>(payload: T) => Dispatcher;

/** The interface defines the action parameters for the state */
export interface StateAction {
	name: string;
	type: string;
	dispatch: Dispatch;
	subscribe: <T>(fn?: SubscribeListner<T>) => Promise<T>;
	getState: <T>() => T;
}

/** This interface defines the initialization state parameter */
export interface StateObject {
	/** The action name string */
	name: string;
	/** Whether to make the state a separate branch */
	branch?: boolean;
	/** If the state is a branch you can set the initial parameters */
	initial?: object;
}

/**
 * This interface defines the optimal state parameters
 * for initialization via createActionTo
 */
export interface StateOptions<T> {
	branch: boolean;
	initial?: T;
}

/**
 * This interface defines
 * the state parameters initialization
 */
export interface StateItem {
	name: string;
	options?: StateOptions<object>;
}

/**
 * This interface defines a field parameter
 * for initializing states in createStore
 */
export interface StateCollectionRepo {
	[propName: string]: StateAction[];
}

/**
 * The interface defines a set of returned
 * methods from stateCollection
 */
export interface StateCollection {
	/**
	 * compile state collection
	 * @param actions actions args
	 * @return actions collection
	 */
	compile: (...actions: StateAction[]) => StateCollectionRepo;
	/**
	 * Get the entire collection actions
	 * @return collections instance
	 */
	all: () => StateCollectionRepo;
	/**
	 * Get a collection by matching the store name
	 * @param repo storage name
	 * @return collections instance
	 */
	fromRepo: (repo: string) => StateAction[];
	/**
	 * Get the result filtered by state name
	 * @param stateName state name
	 * @return collections instance
	 */
	outOfState: (stateName: string) => StateAction;
}

/**
 * This interface describes
 * the methods returned by dispatch
 */
export interface Dispatcher {
	/**
	 * Call before state change
	 * @param fn callback
	 */
	before: <T>(fn: SubscribeListner<T>) => void;
	/**
	 * Call after state change
	 * @param fn callback
	 * @async
	 */
	after: <T>(fn: SubscribeListner<T>) => void;
	/**
	 * Merge state into store
	 */
	merge: () => void;

	/**
	 * Return promise
	 */
	wait: Promise<boolean>;
}

/**
 * This interface describes the methods
 * that createActionTo returns
 */
export interface ActionCreator {
	/**
	 * This method binds the state to the selected storagee
	 * @param action state name
	 * @param options state options
	 * @return new action
	 */
	bind: <T>(action: string, options?: StateOptions<T>) => StateAction;
	/** store name */
	name: string;
}

/**
 * This interface describes
 * the methods that manager returns
 */
export interface Manager {
	/**
	 * This method will combine data
	 * from the state with data from the store.
	 */
	merge: () => void;
	/**
	 * This method will merge data
	 * from the storage with data from the state.
	 */
	pull: () => void;
	/**
	 * This method will replace the data
	 * from the storage with state data.
	 */
	replaceRepo: () => void;
	/**
	 * This method will replace the data
	 * from the state with the storage data.
	 */
	replaceState: () => void;
	/**
	 * This method will merge the data of the selected state
	 * with the data of the state specified in the arguments.
	 * @param targetAction action for merge
	 * the action that you want to merge
	 */
	mergeState: (targetAction: AnyAction) => void;
	/**
	 * This method compares two states for identity
	 * WARNING: states should not contain methods
	 * @param targetAction action for compare
	 * the action that you want to compare
	 * @return boolean
	 */
	compareStates: (targetAction: AnyAction) => boolean;
	/**
	 * Сompare state and store
	 * WARNING: states should not contain methods
	 * @return boolean
	 */
	compareWithState: () => boolean;
	/**
	 * compare state and instance object
	 * WARNING: states should not contain methods
	 * @param instance object for compare
	 * @return boolean
	 */
	compareStateWithInstance: <T>(instance: T) => boolean;
	/**
	 * compare store and instance object
	 * WARNING: states should not contain methods
	 * @param instance object for compare
	 * @return boolean
	 */
	compareRepoWithInstance: <T>(instance: T) => boolean;

	/**
	 * Updates the status of the store.
	 * This method is equivalent to dispatch(...)
	 */
	update: () => void;
	/**
	 * Returns parameters of the selected action
	 */
	props: StateAction;
}

/** Static action params */
export interface StaticAction {
	name: string;
	type: string;
}

/** Static action or  StateAction */
export type AnyAction = StateAction | StaticAction;
