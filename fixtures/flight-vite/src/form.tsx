"use client";

import { useFormStatus } from "react-dom";
import ErrorBoundary from "./error-boundary.js";

function Status() {
	const { pending } = useFormStatus();
	return pending ? "Saving..." : null;
}

export default function Form({
	action,
}: {
	action: (formData: FormData) => Promise<void>;
}) {
	return (
		<ErrorBoundary>
			<form action={action}>
				<label>
					Name: <input name="name" />
				</label>
				<button type="submit">Say Hi</button>
				<Status />
			</form>
		</ErrorBoundary>
	);
}
