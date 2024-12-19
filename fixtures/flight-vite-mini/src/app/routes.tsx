import type React from "react";
import { IndexPage } from ".";
import { Layout } from "./layout";
import OtherPage from "./other";

const routes: Record<string, React.ReactNode> = {
	"/": <IndexPage />,
	"/other": <OtherPage />,
};

export function Router(props: { url: URL }) {
	const page = routes[props.url.pathname] ?? <h4>Not found</h4>;
	return <Layout>{page}</Layout>;
}
