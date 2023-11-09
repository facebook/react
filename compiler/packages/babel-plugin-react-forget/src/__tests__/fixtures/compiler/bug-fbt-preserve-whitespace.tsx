import fbt from "fbt";
/**
 * TODO: remove this from SproutTodoFilter when fixed.
 */

function Component({ value }: { value: string }) {
  return (
    <fbt desc="descdesc">
      Before text
      <fbt:param name="paramName">{value}</fbt:param>
    </fbt>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: "hello world" }],
};
