import { Stringify } from "shared-runtime";

function Component({ config }) {
  const object = useMemo(() => {
    const a = (event) => {
      config?.onA?.(event);
    };

    const b = (event) => {
      config?.onB?.(event);
    };

    return {
      b,
      a,
    };
  }, [config]);

  return <Stringify value={object} />;
}
