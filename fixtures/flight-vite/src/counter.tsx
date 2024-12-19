"use client";

import { useActionState } from "react";

export function Counter({
	incrementAction,
}: {
	incrementAction: (n: number) => Promise<number>;
}) {
	const [count, incrementFormAction] = useActionState(incrementAction, 0);

	return (
		<form>
			<button type="submit" formAction={incrementFormAction}>
				Count: {count}
			</button>
		</form>
	);
}
