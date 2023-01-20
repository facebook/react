const runReactForgetBabelPlugin =
  require("../dist/Babel/RunReactForgetBabelPlugin").default;

// Preprocessor that runs Forget on the test262 test prior to execution. Compilation errors short
// circuit test execution and report an error immediately.
module.exports = (test) => {
  try {
    test.contents = runReactForgetBabelPlugin(test.contents, test.file).code;
  } catch (error) {
    // We use the `stderr` output to group errors so we can count them, so we need to dedupe errors
    // that are the same but differ slightly.
    let { name, message } = error;
    message = message.replace(/^\/.*?:\s/, ""); // babel seems to output filenames
    message = message.split(/\(\d+:\d+\)/)[0]; // some errors report line numbers and codeframes
    message = message.trim();
    message = formatReactForgetErrorMessage(message);

    // For unknown reasons I don't have the energy to dig into some Babel error instances can't be
    // written to, so we construct a psedudo object here so the correctly formatted error messages
    // are emitted
    test.result = {
      stderr: `${name}: ${message}\n`,
      stdout: "",
      error: { name, message },
    };
  }

  return test;
};

function formatReactForgetErrorMessage(message) {
  // Strip codeframes so we can group errors
  const matches = message.match(/^\[ReactForget\].*\n?/);
  if (Array.isArray(matches) && matches.length > 0) {
    return matches[0].replace("\n", "");
  }
  return message;
}
