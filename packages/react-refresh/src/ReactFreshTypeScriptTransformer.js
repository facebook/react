/**
 * @param {opt} opts Options
 * @param {ts} ts TypeScript compiler
 * @returns {import('typescript').TransformerFactory<SourceFile>}
 */
export default function(opts = {}, ts = require('typescript')) {
  const refreshReg = ts.createIdentifier(opts.refreshReg || '$RefreshReg$');
  const refreshSig = ts.createIdentifier(opts.refreshSig || '$RefreshSig$');
  return context => {
    return file => {
      if (file.isDeclarationFile) return file;
      if (!containHooksLikeOrJSX()) return file;

      /** @type {Set<string>} */ const topLevelDeclaredName = new Set();
      // Collect top level local declarations
      for (const node of file.statements) {
        if (ts.isFunctionDeclaration(node) && node.name)
          topLevelDeclaredName.add(node.name.text);
        if (ts.isVariableStatement(node)) {
          for (const decl of node.declarationList.declarations) {
            if (ts.isIdentifier(decl.name)) {
              topLevelDeclaredName.add(decl.name.text);
            }
            // ? skip for deconstructing pattern
          }
        }
      }
      const {nextFile, usedComponent: usedJSXElementLike} = tractJSXUsage(); // ! This is a deep visit to the AST tree
      file = nextFile;

      context.startLexicalEnvironment();
      /** @type {Statement[]} */ const nextStatements = [];
      /** @type {Statement[]} */ const afterStatements = [];
      // Only visit top level declaration to find possible components
      for (const node of file.statements) {
        nextStatements.push(node);
        if (ts.isFunctionDeclaration(node)) {
          if (!node.name) continue;
          registerComponentAfterCurrent(node.name.text);
          continue;
        } else if (ts.isVariableStatement(node)) {
          /** @type {import('typescript').VariableDeclaration[]} */ const nextDeclarationList = [];
          /** @type {Statement[]} */ const deferredAppendStatements = [];
          for (const declaration of node.declarationList.declarations) {
            nextDeclarationList.push(declaration);
            const init = declaration.initializer;
            // Not handle complex declaration. e.g. [a, b] = [() => ..., () => ...]
            // or declaration without initializer
            if (!ts.isIdentifier(declaration.name) || !init) continue;
            // fast fail
            if (unwantedComponentLikeDefinition(init)) continue;
            const variable = declaration.name.text;
            if (usedJSXElementLike.has(variable) || ts.isFunctionLike(init)) {
              registerComponentAfterCurrent(variable, deferredAppendStatements);
              continue;
            }
            if (isHOCLike(init)) {
              nextDeclarationList.pop(); // replace the decl
              nextDeclarationList.push(
                ts.updateVariableDeclaration(
                  declaration,
                  declaration.name,
                  declaration.type,
                  registerHigherOrderFunction(init, variable),
                ),
              );
              registerComponentAfterCurrent(variable, deferredAppendStatements);
              continue;
            }
          }
          nextStatements.pop();
          nextStatements.push(
            ts.updateVariableStatement(
              node,
              node.modifiers,
              ts.updateVariableDeclarationList(
                node.declarationList,
                nextDeclarationList,
              ),
            ),
            ...deferredAppendStatements,
          );
        } else if (ts.isExportAssignment(node)) {
          if (isHOCLike(node.expression)) {
            const inner = registerHigherOrderFunction(
              node.expression,
              '%default%',
            );
            const uniq = createTempVariable();
            afterStatements.push(createRegister(uniq, '%default%'));
            nextStatements.pop();
            nextStatements.push(
              ts.updateExportAssignment(
                node,
                node.decorators,
                node.modifiers,
                ts.createAssignment(uniq, inner),
              ),
            );
            continue;
          }
        }
      }
      return ts.updateSourceFileNode(
        file,
        (context.endLexicalEnvironment() || []).concat(
          nextStatements.concat(afterStatements),
        ),
        false,
        file.referencedFiles,
        file.typeReferenceDirectives,
        file.hasNoDefaultLib,
        file.libReferenceDirectives,
      );

      function registerComponentAfterCurrent(
        /** @type {string} */ name,
        statements = nextStatements,
      ) {
        if (!startsWithLowerCase(name)) {
          const uniq = createTempVariable();
          // uniq = each
          const assignment = ts.createAssignment(
            uniq,
            ts.createIdentifier(name),
          );
          statements.push(ts.createExpressionStatement(assignment));
          // $reg$(uniq, "each")
          afterStatements.push(createRegister(uniq, name));
        }
      }
      /**
       * Please call isHOCLike before call this function
       * @param {CallExpression} callExpr Current visiting
       * @param {string} nameHint
       * @returns {import('typescript').BinaryExpression | CallExpression}
       */
      function registerHigherOrderFunction(callExpr, nameHint) {
        const uniq = createTempVariable();
        // Recursive case, if it is x(y(...)), recursive with y(...) to get inner expr
        const arg = callExpr.arguments[0];
        if (ts.isCallExpression(arg)) {
          const nextNameHint = nameHint + '$' + callExpr.expression.getText();
          const innerResult = registerHigherOrderFunction(arg, nextNameHint);
          afterStatements.push(createRegister(uniq, nextNameHint));
          return ts.updateCall(callExpr, callExpr.expression, void 0, [
            ts.createAssignment(uniq, innerResult),
            ...callExpr.arguments.slice(1),
          ]);
        }

        // Base case, it is x(function () {...}) or x(() => ...) or x(Identifier)
        if (!ts.isFunctionLike(arg) && !ts.isIdentifier(arg))
          throw new Error('Please call isHOCLike first');
        if (ts.isIdentifier(arg)) return callExpr;
        afterStatements.push(
          createRegister(uniq, nameHint + '$' + callExpr.expression.getText()),
        );
        return ts.updateCall(callExpr, callExpr.expression, void 0, [
          ts.createAssignment(uniq, arg),
          ...callExpr.arguments.slice(1),
        ]);
      }
      function createTempVariable() {
        return ts.createTempVariable(context.hoistVariableDeclaration);
      }
      /**
       * ! This function does not consider variable shadowing !
       */
      function tractJSXUsage() {
        /** @type {Set<string>} */ const usedComponent = new Set();
        /** @type {Set<FunctionLikeDeclaration>} */ const containingHooks = new Set();
        function visitor(/** @type {Node} */ node) {
          // Collect JSX create info
          // <abc /> or <abc>
          if (ts.isJsxOpeningLikeElement(node)) {
            const tag = node.tagName;
            if (ts.isIdentifier(tag) && !isIntrinsicElement(tag)) {
              const name = tag.text;
              if (topLevelDeclaredName.has(name)) usedComponent.add(name);
            }
            // Not tracking other kinds of tagNames like <A.B /> or <A:B />
          } else if (isJSXConstructingCallExpr(node)) {
            const arg0 = node.arguments[0];
            if (arg0 && ts.isIdentifier(arg0)) {
              const name = arg0.text;
              if (topLevelDeclaredName.has(name)) usedComponent.add(name);
            }
          }
          if (isReactHooksCall(node)) {
            // @ts-ignore
            /** @type {FunctionLikeDeclaration} */ const parent = findAncestor(
              node,
              ts.isFunctionLike,
            );
            if (parent) containingHooks.add(parent);
          }
          // Collect hooks
          const result = ts.visitEachChild(node, visitor, context);
          // @ts-ignore
          if (containingHooks.has(node)) {
            // @ts-ignore
            /** @type {FunctionLikeDeclaration} */ const f = result;
            if (!f.body) return result;
            const hooksTracker = createTempVariable();
            const createHooksTracker = ts.createExpressionStatement(
              ts.createBinary(
                hooksTracker,
                ts.createToken(ts.SyntaxKind.EqualsToken),
                ts.createCall(refreshSig, undefined, []),
              ),
            );
            // @ts-ignore
            context.addInitializationStatement(createHooksTracker);
            const callTracker = ts.createExpressionStatement(
              ts.createCall(hooksTracker, void 0, []),
            );
            const nextBody = ts.isBlock(f.body)
              ? ts.updateBlock(f.body, [callTracker, ...f.body.statements])
              : ts.createBlock([callTracker, ts.createReturn(f.body)]);
            return updateBody(node, nextBody);
          }
          return result;
        }
        return {
          nextFile: ts.visitEachChild(file, visitor, context),
          usedComponent,
        };
      }
      function containHooksLikeOrJSX() {
        return (
          file.languageVariant === ts.LanguageVariant.JSX ||
          file.text.includes('use')
        );
      }
    };
  };

  function updateBody(
    /** @type {Node} */ node,
    /** @type {import('typescript').Block} */ nextBody,
  ) {
    if (ts.isFunctionDeclaration(node)) {
      return ts.updateFunctionDeclaration(
        node,
        node.decorators,
        node.modifiers,
        node.asteriskToken,
        node.name,
        node.typeParameters,
        node.parameters,
        node.type,
        nextBody,
      );
    } else if (ts.isFunctionExpression(node)) {
      return ts.updateFunctionExpression(
        node,
        node.modifiers,
        node.asteriskToken,
        node.name,
        node.typeParameters,
        node.parameters,
        node.type,
        nextBody,
      );
    } else if (ts.isArrowFunction(node)) {
      return ts.updateArrowFunction(
        node,
        node.modifiers,
        node.typeParameters,
        node.parameters,
        node.type,
        node.equalsGreaterThanToken,
        nextBody,
      );
    }
    return node;
  }

  function isIntrinsicElement(/** @type {Identifier} */ id) {
    return (
      id.text.includes('-') ||
      startsWithLowerCase(id.text) ||
      id.text.includes(':')
    );
  }

  function isImportOrRequireLike(/** @type {Expression} */ expr) {
    if (!ts.isCallExpression(expr)) return false;
    const callee = expr.expression;
    if (callee.kind === ts.SyntaxKind.ImportKeyword) return true;
    if (ts.isIdentifier(callee) && callee.text.includes('require')) return true;
    return false;
  }

  function isReactHooksCall(/** @type {Node} */ expr) {
    if (!ts.isCallExpression(expr)) return false;
    const callee = expr.expression;
    if (ts.isIdentifier(callee) && callee.text.startsWith('use')) return true;
    if (
      ts.isPropertyAccessExpression(callee) &&
      callee.name.text.startsWith('use')
    )
      return true;
    return false;
  }

  function findAncestor(
    /** @type {Node} */ node,
    /** @type {(element: Node) => boolean | "quit"} */ callback,
  ) {
    while (node) {
      const result = callback(node);
      if (result === 'quit') {
        return undefined;
      } else if (result) {
        return node;
      }
      node = node.parent;
    }
    return undefined;
  }

  /** If it return true, don't track it even it is used as JSX component */
  function unwantedComponentLikeDefinition(/** @type {Expression} */ expr) {
    if (isImportOrRequireLike(expr)) return true;
    // `const A = B.X` or `const A = X`
    if (ts.isIdentifier(expr) || ts.isPropertyAccessExpression(expr))
      return true;
    if (ts.isConditionalExpression(expr))
      return (
        unwantedComponentLikeDefinition(expr.condition) ||
        unwantedComponentLikeDefinition(expr.whenFalse) ||
        unwantedComponentLikeDefinition(expr.whenTrue)
      );
    return false;
  }

  /**
   * @param {Expression} outExpr
   * @returns {outExpr is CallExpression}
   */
  function isHOCLike(outExpr) {
    let expr = outExpr;
    if (!ts.isCallExpression(outExpr)) return false;
    while (ts.isCallExpression(expr) && !isImportOrRequireLike(expr)) {
      const callee = expr.expression;
      // x.y() or x()
      const isValidCallee =
        ts.isPropertyAccessExpression(callee) || ts.isIdentifier(callee);
      if (isValidCallee) {
        expr = expr.arguments[0]; // check if arg is also a HOC
        if (!expr) return false;
      } else return false;
    }
    const isValidHOCArg =
      ts.isFunctionLike(expr) ||
      (ts.isIdentifier(expr) && !startsWithLowerCase(expr.text));
    return isValidHOCArg;
  }
  /**
   * Return `refreshReg(id, "name");`
   * @param {Identifier} id
   * @param {string} name
   */
  function createRegister(id, name) {
    return ts.createExpressionStatement(
      ts.createCall(refreshReg, void 0, [id, ts.createLiteral(name)]),
    );
  }
  /**
   * If the call expression seems like "jsx(...)" or "xyz.jsx(...)"
   * @param {Node} call
   * @returns {call is CallExpression}
   */
  function isJSXConstructingCallExpr(call) {
    if (!ts.isCallExpression(call)) return false;
    const callee = call.expression;
    let f = '';
    if (ts.isIdentifier(callee)) f = callee.text;
    if (ts.isPropertyAccessExpression(callee)) f = callee.name.text;
    if (['createElement', 'jsx', 'jsxs', 'jsxDEV'].includes(f)) return true;
    return false;
  }
}

/** @param {string} str */
function startsWithLowerCase(str) {
  return str[0].toLowerCase() === str[0];
}

/** @typedef {{refreshReg?: string, refreshSig?: string, emitFullSignatures?: boolean}} opt */
/** @typedef {import('typescript')} ts */
/** @typedef {import('typescript').Node} Node */
/** @typedef {import('typescript').Statement} Statement */
/** @typedef {import('typescript').CallExpression} CallExpression */
/** @typedef {import('typescript').Identifier} Identifier */
/** @typedef {import('typescript').Expression} Expression */
/** @typedef {import('typescript').SourceFile} SourceFile */
/** @typedef {import('typescript').FunctionLikeDeclaration} FunctionLikeDeclaration */
