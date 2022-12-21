const BabelPluginReactForget = require("../dist/BabelPlugin").default;
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
    error.message = error.message.replace(/ \(\d+:\d+\)/, "");
    test.result = {
      stderr: `${error.name}: ${error.message}\n`,
      stdout: "",
      error,
    };
  }

  return test;
};
