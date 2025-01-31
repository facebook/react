"use client";

import * as React from "react";

export default class ErrorBoundary extends React.Component<{
	children?: React.ReactNode;
}> {
	state = {} as { error?: unknown };

	static getDerivedStateFromError(error: unknown) {
		return { error };
	}

	render() {
		if ("error" in this.state) {
			return <div>Caught an error: {String(this.state.error)}</div>;
		}
		return this.props.children;
	}
}
