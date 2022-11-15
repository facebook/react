const { argv } = require("node:process");
const generate = require("@babel/generator").default;
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { Environment } = require("../dist/HIR/HIRBuilder");
const { lower } = require("../dist/HIR/BuildHIR");
const codegen = require("../dist/HIR/Codegen").default;
const enterSSA = require("../dist/HIR/EnterSSA").default;
const { eliminateRedundantPhi } = require("../dist/HIR/EliminateRedundantPhi");
const inferReferenceEffects =
  require("../dist/HIR/InferReferenceEffects").default;
const { inferMutableRanges } = require("../dist/HIR/InferMutableLifetimes");
const leaveSSA = require("../dist/HIR/LeaveSSA").default;
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
          const env = new Environment();
          const ir = lower(nodePath, env);
          enterSSA(ir, env);
          eliminateRedundantPhi(ir);
          inferReferenceEffects(ir);
          inferMutableRanges(ir);
          leaveSSA(ir);
          const ast = codegen(ir);
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
    test.result = {
      stderr: `${error.name}: ${error.message}\n`,
      stdout: "",
      error,
    };
  }

  return test;
};
