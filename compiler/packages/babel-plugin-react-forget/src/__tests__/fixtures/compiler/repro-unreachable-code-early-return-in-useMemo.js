// @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
import { useMemo, useState } from "react";
import { Stringify, identity } from "shared-runtime";

function Component({ value }) {
  "use no forget";
  const result = useValue(value);
  return <Validate inputs={[value]} output={result} />;
}

function Validate({ inputs, output }) {
  "use no forget";
  const [previousInputs, setPreviousInputs] = useState(inputs);
  const [previousOutput, setPreviousOutput] = useState(output);
  if (
    inputs.length !== previousInputs.length ||
    inputs.some((item, i) => item !== previousInputs[i])
  ) {
    // Some input changed, we expect the output to change
    setPreviousInputs(inputs);
    setPreviousOutput(output);
  } else if (output !== previousOutput) {
    // Else output should be stable
    throw new Error("Output identity changed but inputs did not");
  }
  return <Stringify inputs={inputs} output={output} />;
}

function useValue(value) {
  return useMemo(() => {
    if (value == null) {
      return null;
    }
    try {
      return { value };
    } catch (e) {
      return null;
    }
  }, [value]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: null }],
  sequentialRenders: [
    { value: null },
    { value: null },
    { value: 42 },
    { value: 42 },
    { value: null },
    { value: 42 },
    { value: null },
    { value: 42 },
  ],
};
