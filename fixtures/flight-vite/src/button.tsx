"use client";

import { useFormStatus } from "react-dom";

import ErrorBoundary from "./error-boundary.js";

function ButtonDisabledWhilePending({
	action,
	children,
}: {
	action: (formData: FormData) => Promise<void>;
	children: React.ReactNode;
}) {
	const { pending } = useFormStatus();
	return (
		<button type="submit" disabled={pending} formAction={action}>
			{children}
		</button>
	);
}

export default function Button({
	action,
	children,
}: {
	action: (formData: FormData) => Promise<void>;
	children: React.ReactNode;
}) {
	return (
		<ErrorBoundary>
			<form>
				<ButtonDisabledWhilePending action={action}>
					{children}
				</ButtonDisabledWhilePending>
			</form>
		</ErrorBoundary>
	);
}
