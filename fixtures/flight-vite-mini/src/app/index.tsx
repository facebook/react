import { changeCounter, getCounter } from "./action";
import { Calculator, Counter, Hydrated } from "./client";

export async function IndexPage() {
	return (
		<div>
			<div>server random: {Math.random().toString(36).slice(2)}</div>
			<Hydrated />
			<Counter />
			<form
				action={changeCounter}
				data-testid="server-counter"
				style={{ padding: "0.5rem" }}
			>
				<div>Server counter: {getCounter()}</div>
				<div>
					<button name="change" value="-1">
						-
					</button>
					<button name="change" value="+1">
						+
					</button>
				</div>
			</form>
			<Calculator />
		</div>
	);
}
