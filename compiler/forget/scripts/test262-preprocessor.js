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
    // that are the same but differ slightly
    error.message = error.message.replace(/ \(\d+:\d+\)/, ""); // some errors report line numbers
    error.message = error.message.replace(/\/.*\.js:\s/, ""); // babel seems to output filenames
    test.result = {
      stderr: `${error.name}: ${error.message}\n`,
      stdout: "",
      error,
    };
  }

  return test;
};
