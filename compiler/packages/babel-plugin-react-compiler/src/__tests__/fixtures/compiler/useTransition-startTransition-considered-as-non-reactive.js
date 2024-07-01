import { useTransition, useState } from "react";

function Component() {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState(1);
  return (
    <div onClick={() => startTransition(() => setState((prev) => prev + 1))}>
      {isPending ? "pending" : state}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};
