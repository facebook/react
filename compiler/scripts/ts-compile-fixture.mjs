/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * TS test binary for the Rust port testing infrastructure.
 *
 * Takes a compiler pass name and a fixture path, runs the React Compiler
 * pipeline up to the target pass, and prints a detailed debug representation
 * of the HIR or ReactiveFunction state to stdout.
 *
 * Usage: node compiler/scripts/ts-compile-fixture.mjs <pass> <fixture-path>
 *
 * The script uses the built compiler dist bundle and calls compile() directly
 * (bypassing transformFromAstSync / BabelPluginReactCompiler) with a logger
 * to capture intermediate state at each pass checkpoint.
 */

import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default || _traverse;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { debugPrintHIR } from "./debug-print-hir.mjs";
import { debugPrintReactive } from "./debug-print-reactive.mjs";
import { debugPrintError } from "./debug-print-error.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// --- Arguments ---
const [passArg, fixturePath] = process.argv.slice(2);

if (!passArg || !fixturePath) {
  console.error(
    "Usage: node compiler/scripts/ts-compile-fixture.mjs <pass> <fixture-path>"
  );
  process.exit(1);
}

// --- Load compiler from dist ---
const COMPILER_DIST = path.resolve(
  __dirname,
  "../packages/babel-plugin-react-compiler/dist/index.js"
);

if (!fs.existsSync(COMPILER_DIST)) {
  console.error(
    `ERROR: Compiler dist not found at ${COMPILER_DIST}\nRun 'yarn --cwd compiler/packages/babel-plugin-react-compiler build' first.`
  );
  process.exit(1);
}

const compiler = require(COMPILER_DIST);
const compileFunction = compiler.compile;
const parseConfigPragmaForTests = compiler.parseConfigPragmaForTests;
const parsePluginOptions = compiler.parsePluginOptions;
const ProgramContext = compiler.ProgramContext;
const printFunctionWithOutlined = compiler.printFunctionWithOutlined;
const printReactiveFunctionWithOutlined =
  compiler.printReactiveFunctionWithOutlined;
const CompilerError = compiler.CompilerError;

// --- Pass name mapping ---
// Maps the plan doc's pass names to Pipeline.ts log() name strings.
const PASS_NAME_MAP = {
  HIR: "HIR",
  PruneMaybeThrows: "PruneMaybeThrows",
  DropManualMemoization: "DropManualMemoization",
  InlineIIFEs: "InlineImmediatelyInvokedFunctionExpressions",
  MergeConsecutiveBlocks: "MergeConsecutiveBlocks",
  SSA: "SSA",
  EliminateRedundantPhi: "EliminateRedundantPhi",
  ConstantPropagation: "ConstantPropagation",
  InferTypes: "InferTypes",
  OptimizePropsMethodCalls: "OptimizePropsMethodCalls",
  AnalyseFunctions: "AnalyseFunctions",
  InferMutationAliasingEffects: "InferMutationAliasingEffects",
  OptimizeForSSR: "OptimizeForSSR",
  DeadCodeElimination: "DeadCodeElimination",
  PruneMaybeThrows2: "PruneMaybeThrows",
  InferMutationAliasingRanges: "InferMutationAliasingRanges",
  InferReactivePlaces: "InferReactivePlaces",
  RewriteInstructionKinds: "RewriteInstructionKindsBasedOnReassignment",
  InferReactiveScopeVariables: "InferReactiveScopeVariables",
  MemoizeFbtOperands: "MemoizeFbtAndMacroOperandsInSameScope",
  NameAnonymousFunctions: "NameAnonymousFunctions",
  OutlineFunctions: "OutlineFunctions",
  AlignMethodCallScopes: "AlignMethodCallScopes",
  AlignObjectMethodScopes: "AlignObjectMethodScopes",
  PruneUnusedLabelsHIR: "PruneUnusedLabelsHIR",
  AlignReactiveScopesToBlockScopes: "AlignReactiveScopesToBlockScopesHIR",
  MergeOverlappingReactiveScopes: "MergeOverlappingReactiveScopesHIR",
  BuildReactiveScopeTerminals: "BuildReactiveScopeTerminalsHIR",
  FlattenReactiveLoops: "FlattenReactiveLoopsHIR",
  FlattenScopesWithHooksOrUse: "FlattenScopesWithHooksOrUseHIR",
  PropagateScopeDependencies: "PropagateScopeDependenciesHIR",
  BuildReactiveFunction: "BuildReactiveFunction",
  PruneUnusedLabels: "PruneUnusedLabels",
  PruneNonEscapingScopes: "PruneNonEscapingScopes",
  PruneNonReactiveDependencies: "PruneNonReactiveDependencies",
  PruneUnusedScopes: "PruneUnusedScopes",
  MergeReactiveScopesThatInvalidateTogether:
    "MergeReactiveScopesThatInvalidateTogether",
  PruneAlwaysInvalidatingScopes: "PruneAlwaysInvalidatingScopes",
  PropagateEarlyReturns: "PropagateEarlyReturns",
  PruneUnusedLValues: "PruneUnusedLValues",
  PromoteUsedTemporaries: "PromoteUsedTemporaries",
  ExtractScopeDeclarationsFromDestructuring:
    "ExtractScopeDeclarationsFromDestructuring",
  StabilizeBlockIds: "StabilizeBlockIds",
  RenameVariables: "RenameVariables",
  PruneHoistedContexts: "PruneHoistedContexts",
  Codegen: "Codegen",
};

// Resolve the target pipeline log name
const pipelineLogName = PASS_NAME_MAP[passArg];
if (pipelineLogName === undefined) {
  console.error(`Unknown pass: ${passArg}`);
  console.error(`Valid passes: ${Object.keys(PASS_NAME_MAP).join(", ")}`);
  process.exit(1);
}

// For PruneMaybeThrows2, we want the second occurrence
const isPruneMaybeThrows2 = passArg === "PruneMaybeThrows2";

// --- Read fixture source ---
const source = fs.readFileSync(fixturePath, "utf8");
const firstLine = source.substring(0, source.indexOf("\n"));

// Determine language and source type
const language = firstLine.includes("@flow") ? "flow" : "typescript";
const sourceType = firstLine.includes("@script") ? "script" : "module";

// --- Parse config pragmas ---
const config = parseConfigPragmaForTests(firstLine, {
  compilationMode: "all",
});
const pluginOptions = {
  ...config,
  environment: {
    ...config.environment,
    assertValidMutableRanges: true,
  },
  enableReanimatedCheck: false,
  target: "19",
};

// --- Collect pass outputs via logger ---
// Each entry: { name, kind, printed }
const passOutputs = [];
let pruneMaybeThrowsCount = 0;

const logger = {
  logEvent: () => {},
  debugLogIRs: (value) => {
    let printed;
    switch (value.kind) {
      case "hir":
        printed = debugPrintHIR(printFunctionWithOutlined, value.value);
        break;
      case "reactive":
        printed = debugPrintReactive(
          printReactiveFunctionWithOutlined,
          value.value
        );
        break;
      case "debug":
        printed = value.value;
        break;
      case "ast":
        printed = "(ast)";
        break;
    }

    // Track PruneMaybeThrows occurrences
    let occurrence = 0;
    if (value.name === "PruneMaybeThrows") {
      pruneMaybeThrowsCount++;
      occurrence = pruneMaybeThrowsCount;
    }

    passOutputs.push({
      name: value.name,
      kind: value.kind,
      printed,
      occurrence,
    });
  },
};

// --- Parse the fixture ---
const plugins = language === "flow" ? ["flow", "jsx"] : ["typescript", "jsx"];
const inputAst = parse(source, {
  sourceFilename: path.basename(fixturePath),
  plugins,
  sourceType,
  errorRecovery: true,
});

// --- Find the first compilable function and run the pipeline ---
const filename = "/" + path.basename(fixturePath);
const parsedOpts = parsePluginOptions({ ...pluginOptions, logger });

// Traverse to find the first function
let functionPath = null;
traverse(inputAst, {
  FunctionDeclaration(nodePath) {
    if (!functionPath) {
      functionPath = nodePath;
      nodePath.stop();
    }
  },
  FunctionExpression(nodePath) {
    if (!functionPath) {
      functionPath = nodePath;
      nodePath.stop();
    }
  },
  ArrowFunctionExpression(nodePath) {
    if (!functionPath) {
      functionPath = nodePath;
      nodePath.stop();
    }
  },
});

if (!functionPath) {
  console.error("No function found in fixture");
  process.exit(1);
}

// Create ProgramContext - need a program path for scope
let programPath = null;
traverse(inputAst, {
  Program(nodePath) {
    programPath = nodePath;
    nodePath.stop();
  },
});

const programContext = new ProgramContext({
  program: programPath,
  opts: parsedOpts,
  filename,
  code: source,
  suppressions: [],
  hasModuleScopeOptOut: false,
});

// Determine function type (component, hook, or other)
function getFnType(fnPath) {
  const node = fnPath.node;
  if (fnPath.isFunctionDeclaration() && node.id) {
    const name = node.id.name;
    if (/^[A-Z]/.test(name)) {
      return "Component";
    }
    if (/^use[A-Z]/.test(name)) {
      return "Hook";
    }
  }
  return "Other";
}

const fnType = getFnType(functionPath);

// Run the compiler pipeline directly via compile()
try {
  const result = compileFunction(
    functionPath,
    parsedOpts.environment,
    fnType,
    "client", // outputMode
    programContext,
    logger,
    filename,
    source,
  );

  // compile() returns a Result type
  if (result.isErr()) {
    const err = result.unwrapErr();
    // Check if the target pass output was captured before the error
    const targetOutput = findTargetOutput();
    if (targetOutput) {
      process.stdout.write(targetOutput.printed);
      if (!targetOutput.printed.endsWith("\n")) {
        process.stdout.write("\n");
      }
    } else {
      // Print compiler errors in debug format
      process.stdout.write(debugPrintError(err));
      process.exit(0);
    }
  } else {
    // Find the target pass output
    const targetOutput = findTargetOutput();
    if (targetOutput) {
      process.stdout.write(targetOutput.printed);
      if (!targetOutput.printed.endsWith("\n")) {
        process.stdout.write("\n");
      }
    } else {
      console.error(`Pass "${passArg}" did not produce output (may be conditional on config)`);
      process.exit(1);
    }
  }
} catch (e) {
  if (e.name === "ReactCompilerError" || e instanceof CompilerError) {
    // Check if the target pass output was captured before the error
    const targetOutput = findTargetOutput();
    if (targetOutput) {
      process.stdout.write(targetOutput.printed);
      if (!targetOutput.printed.endsWith("\n")) {
        process.stdout.write("\n");
      }
    } else {
      // Print compiler errors in debug format
      process.stdout.write(debugPrintError(e));
      process.exit(0);
    }
  } else {
    // Check if the target pass output was captured before the error
    const targetOutput = findTargetOutput();
    if (targetOutput) {
      process.stdout.write(targetOutput.printed);
      if (!targetOutput.printed.endsWith("\n")) {
        process.stdout.write("\n");
      }
    } else {
      // Re-throw non-compiler errors if we didn't capture target pass output
      throw e;
    }
  }
}

function findTargetOutput() {
  for (let i = passOutputs.length - 1; i >= 0; i--) {
    const entry = passOutputs[i];
    if (entry.name === pipelineLogName) {
      if (isPruneMaybeThrows2) {
        // Want the second occurrence
        if (entry.occurrence === 2) {
          return entry;
        }
      } else if (pipelineLogName === "PruneMaybeThrows") {
        // Want the first occurrence
        if (entry.occurrence === 1) {
          return entry;
        }
      } else {
        return entry;
      }
    }
  }
  return null;
}
