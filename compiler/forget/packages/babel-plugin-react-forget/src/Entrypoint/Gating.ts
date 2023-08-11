import { NodePath } from "@babel/core";
import * as t from "@babel/types";
import { CompilerError } from "../CompilerError";
import { GeneratedSource } from "../HIR";
import { ExternalFunction, PluginOptions } from "./Options";

type GatingTestOptions = {
  originalFnDecl: NodePath<t.FunctionDeclaration>;
  compiledIdent: t.Identifier;
  originalIdent: t.Identifier;
  gating: ExternalFunction;
};
function buildGatingTest({
  originalFnDecl,
  compiledIdent,
  originalIdent,
  gating,
}: GatingTestOptions): t.Node | t.Node[] {
  const testVarDecl = t.variableDeclaration("const", [
    t.variableDeclarator(
      originalIdent,
      t.conditionalExpression(
        t.callExpression(t.identifier(gating.importSpecifierName), []),
        compiledIdent,
        originalFnDecl.node.id!
      )
    ),
  ]);

  // Re-export new declaration
  const parent = originalFnDecl.parentPath;
  if (t.isExportDefaultDeclaration(parent)) {
    // Re-add uncompiled function
    parent.replaceWith(originalFnDecl)[0].skip();

    // Add test and synthesize new export
    return [testVarDecl, t.exportDefaultDeclaration(originalIdent)];
  } else if (t.isExportNamedDeclaration(parent)) {
    // Re-add uncompiled function
    parent.replaceWith(originalFnDecl)[0].skip();

    // Add and export test
    return t.exportNamedDeclaration(testVarDecl);
  }

  // Just add the test, no need for re-export
  return testVarDecl;
}

function addSuffix(id: t.Identifier, suffix: string): t.Identifier {
  return t.identifier(`${id.name}${suffix}`);
}

export function insertGatedFunctionDeclaration(
  fnPath: NodePath<t.FunctionDeclaration>,
  compiled: t.FunctionDeclaration,
  originalIdent: t.Identifier,
  gating: NonNullable<PluginOptions["gating"]>
): NodePath<t.FunctionDeclaration> {
  // Rename existing function
  fnPath.node.id = addSuffix(originalIdent, "_uncompiled");

  // Rename and append compiled function
  CompilerError.invariant(compiled.id != null, {
    reason: "FunctionDeclaration must produce a name",
    description: null,
    loc: fnPath.node.loc ?? GeneratedSource,
    suggestions: null,
  });
  compiled.id = addSuffix(compiled.id, "_forget");
  const compiledFn = fnPath.insertAfter(compiled)[0];
  compiledFn.skip();

  // Build and append gating test
  compiledFn.insertAfter(
    buildGatingTest({
      originalFnDecl: fnPath,
      compiledIdent: compiled.id,
      originalIdent,
      gating,
    })
  );

  return compiledFn;
}
