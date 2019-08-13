// @flow

function ignoreStrings(
  methodName: string,
  stringsToIgnore: Array<string>
): void {
  const originalMethod = console[methodName];
  console[methodName] = (...args) => {
    const maybeString = args[0];
    if (typeof maybeString === 'string') {
      for (let i = 0; i < stringsToIgnore.length; i++) {
        if (maybeString.startsWith(stringsToIgnore[i])) {
          return;
        }
      }
    }
    originalMethod(...args);
  };
}

export function ignoreErrors(errorsToIgnore: Array<string>): void {
  ignoreStrings('error', errorsToIgnore);
}

export function ignoreWarnings(warningsToIgnore: Array<string>): void {
  ignoreStrings('warn', warningsToIgnore);
}
