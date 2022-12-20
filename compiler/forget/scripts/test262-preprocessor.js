const generate = require("@babel/generator").default;
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const run = require("../dist/HIR/Pipeline").default;
const prettier = require("prettier");

// Preprocessor that runs Forget on the test262 test prior to execution. Compilation errors short
// circuit test execution and report an error immediately.
module.exports = (test) => {
  try {
    let codegenText = null;
    // todo: replace with a better entrypoint
    const sourceAst = parser.parse(test.contents, {
      sourceFilename: test.file,
      plugins: ["jsx"],
    });
    traverse(sourceAst, {
      FunctionDeclaration: {
        enter(nodePath) {
          const { ast } = run(nodePath, {
            eliminateRedundantPhi: true,
            inferReferenceEffects: true,
            inferTypes: true,
            inferMutableRanges: true,
            inferReactiveScopeVariables: true,
            inferReactiveScopes: true,
            inferReactiveScopeDependencies: true,
            leaveSSA: true,
            codegen: true,
          });
          codegenText = prettier.format(
            generate(ast).code.replace("\n\n", "\n"),
            {
              semi: true,
              parser: "babel-ts",
            }
          );
        },
      },
    });
    if (codegenText != null) {
      test.contents = codegenText;
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
