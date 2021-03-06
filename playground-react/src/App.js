import React, { useEffect, useState } from 'react';
import { listen, observer } from '@biscuit-store/react';
import { testStore, step, branchAction } from './store/test';
import { actions } from './store/combine';
import './styles.css';

(async function () {
	await actions.first.dispatch().wait;
	await actions.first.dispatch().wait;
	await actions.first.dispatch().wait;
})();

const Test = ({ field, test }) => {
	return (
		<div>
			{field}_{test.data}
		</div>
	);
};

const TestTwo = ({ field, test }) => {
	return (
		<div>
			two {test.value} {field}
		</div>
	);
};

const ListenTest = listen(testStore, { state: true }).replace(Test, TestTwo);

export default observer(
	({ test }) => {
		const { value, main } = test;
		const [count, setCount] = useState(0);

		useEffect(() => {
			const counter = setInterval(() => {
				step.dispatch((prev) => ({ value: (prev.value += 1) }));
				setCount((prev) => {
					const current = prev + 1;
					if (current === 5) {
						clearInterval(counter);
					}
					return current;
				});
			}, 1000);

			return () => clearInterval(counter);
		}, []);

		useEffect(() => {
			if (count === 5) {
				(async function () {
					await actions.last.dispatch().wait;
					await actions.last.dispatch().wait;
					await actions.last.dispatch().wait;
				})();
			}
		}, [count]);

		return (
			<div className='App'>
				<h1>Biscuit-store {main} playground-react</h1>
				<p>{value}</p>
				<ListenTest field={'test'} />
				<button
					onClick={() =>
						step.dispatch((prev) => ({
							state: !prev.state,
							data: 'ready',
						}))
					}>
					click
				</button>
			</div>
		);
	},
	[step, branchAction]
);
