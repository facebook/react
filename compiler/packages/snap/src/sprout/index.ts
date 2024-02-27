import { EvaluatorResult, doEval } from "./evaluator";

export type SproutResult =
  | { kind: "success"; value: string }
  | { kind: "invalid"; value: string };

function stringify(result: EvaluatorResult): string {
  return `(kind: ${result.kind}) ${result.value}${
    result.logs.length > 0 ? `\nlogs: [${result.logs.toString()}]` : ""
  }`;
}
function makeError(description: string, value: string): SproutResult {
  return {
    kind: "invalid",
    value: description + "\n" + value,
  };
}
function logsEqual(a: Array<string>, b: Array<string>) {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((val, idx) => val === b[idx]);
}
export function runSprout(
  originalCode: string,
  forgetCode: string
): SproutResult {
  const nonForgetResult = doEval(originalCode);
  const forgetResult = doEval(forgetCode);

  if (forgetResult.kind === "UnexpectedError") {
    return makeError("Unexpected error in Forget runner", forgetResult.value);
  } else if (nonForgetResult.kind === "UnexpectedError") {
    return makeError(
      "Unexpected error in non-forget runner",
      nonForgetResult.value
    );
  } else if (
    forgetResult.kind !== nonForgetResult.kind ||
    forgetResult.value !== nonForgetResult.value ||
    !logsEqual(forgetResult.logs, nonForgetResult.logs)
  ) {
    return makeError(
      "Found differences in evaluator results",
      `Non-forget (expected):
${stringify(nonForgetResult)}
Forget:
${stringify(forgetResult)}
`
    );
  } else {
    return {
      kind: "success",
      value: stringify(forgetResult),
    };
  }
}
