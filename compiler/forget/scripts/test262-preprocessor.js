const BabelPluginReactForget = require("../dist/Babel/BabelPlugin").default;
const transformSync = require("@babel/core").transformSync;

// Preprocessor that runs Forget on the test262 test prior to execution. Compilation errors short
// circuit test execution and report an error immediately.
module.exports = (test) => {
  try {
    const generated = transformSync(test.contents, {
      filename: test.file,
      plugins: [BabelPluginReactForget],
    });
    if (generated.code != null && generated.code !== "") {
      test.contents = generated.code;
    } else {
      throw new Error("Codegen returned an empty string");
    }
  } catch (error) {
    // We use the `stderr` output to group errors so we can count them, so we need to dedupe errors
    // that are the same but differ slightly.
    let { name, message } = error;
    message = message.replace(/\/.*\.js:\s/, ""); // babel seems to output filenames
    message = message.split(/\(\d+:\d+\)/)[0]; // some errors report line numbers and codeframes
    message = message.trim();

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
