import { Suspense } from "react";

import { greet, increment, like, logMessage } from "./actions.js";
import Button from "./button.js";
import { Counter } from "./counter.js";
import ErrorBoundary from "./error-boundary.js";
import Form from "./form.js";
import { context, url } from "./server-context.js";

export async function Home() {
	const promisedText = new Promise<string>((resolve) =>
		setTimeout(() => resolve("deferred text"), 10),
	);

	return (
		<main>
			<title>Home</title>
			<h1>{context<string>("state") || "Hello World"}</h1>
			<Suspense fallback={<p>...</p>}>
				<p data-testid="promise-as-a-child-test">
					Promise as a child hydrates without errors: {promisedText}
				</p>
			</Suspense>
			<Counter incrementAction={increment} />
			<form action={logMessage}>
				<input type="text" name="message" />
				<button type="submit">Log Message</button>
			</form>
			<Form action={greet} />
			<div>
				<Button action={like}>Like</Button>
			</div>
			<ErrorBoundary>
				<Suspense fallback={<p>Loading todos...</p>}>
					<Todos />
				</Suspense>
			</ErrorBoundary>
		</main>
	);
}

async function Todos() {
	if (url().searchParams.has("error")) {
		await Promise.reject(new Error("artificial error"));
	}

	const [todos] = await Promise.all([
		fetch("https://jsonplaceholder.typicode.com/todos").then((response) =>
			response.json(),
		) as Promise<{ id: number; title: string; completed: boolean }[]>,
		// new Promise((resolve) => setTimeout(resolve, 1000)),
	]);

	return (
		<ul>
			{todos.map((todo) => (
				<li key={todo.id}>{todo.title}</li>
			))}
		</ul>
	);
}
