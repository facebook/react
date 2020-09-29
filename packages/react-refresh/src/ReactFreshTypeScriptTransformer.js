/**
 * Create a ReactRefresh transformer for TypeScript.
 *
 * This transformer should run in the before stage.
 *
 * This transformer requires TypeScript to be at least 3.9.
 *
 * @param {opt} opts Options
 * @returns {import('typescript').TransformerFactory<SourceFile>}
 */
export default function(opts = {}) {
  const ts = opts.ts || require('typescript');
  {
    const [major, minor] = ts.version.split('.');
    const num = parseInt(major);
    const msg = 'TypeScript should be at least 3.9';
    if (num < 3) throw new Error(msg);
    if (num === 3 && parseInt(minor) !== 9) throw new Error(msg);
  }
  const refreshReg = ts.createIdentifier(opts.refreshReg || '$RefreshReg$');
  const refreshSig = ts.createIdentifier(opts.refreshSig || '$RefreshSig$');
  return context => {
    let uniqueName = 0;
    return file => {
      if (file.isDeclarationFile) return file;
      const containHooksLikeOrJSX =
        file.languageVariant === ts.LanguageVariant.JSX ||
        file.text.includes('use');
      if (!containHooksLikeOrJSX) return file;
      const globalRequireForceRefresh = file.text.includes('@refresh reset'); // TODO: change to scan comment?

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
      // track all JSX usage and transform non-top level hooks
      const {nextFile, usedAsJSXElement, hooksSignatureMap} = visitDeep(
        file,
        topLevelDeclaredName,
        globalRequireForceRefresh,
      );
      file = nextFile;

      return updateStatements(file, statements =>
        ts.visitLexicalEnvironment(
          statements,
          node => visitTopLevel(usedAsJSXElement, hooksSignatureMap, node),
          context,
        ),
      );
    };

    /** @return {import('typescript').VisitResult<Node>} */
    // Only visit top level declaration to find possible components
    function visitTopLevel(
      /** @type {ReadonlySet<string>} */ usedAsJSXElement,
      /** @type {Map<HandledFunction, CallExpression>} */ hooksSignatureMap,
      /** @type {Node} */ node,
    ) {
      if (ts.isFunctionDeclaration(node)) {
        if (!node.name || !node.body) return node;
        return [node, ...registerComponent(node.name)];
      } else if (ts.isVariableStatement(node)) {
        /** @type {Statement[]} */ const deferredStatements = [];
        const nextDeclarationList = ts.visitEachChild(
          node.declarationList,
          declaration => {
            if (!ts.isVariableDeclaration(declaration)) return declaration;
            const init = declaration.initializer;
            // Not handle complex declaration. e.g. [a, b] = [() => ..., () => ...]
            // or declaration without initializer
            if (!ts.isIdentifier(declaration.name) || !init) return declaration;
            const declarationUsedAsJSX = usedAsJSXElement.has(
              declaration.name.text,
            );
            if (
              declarationUsedAsJSX ||
              isFunctionExpressionLikeOrFunctionDeclaration(init)
            ) {
              if (!unwantedComponentLikeDefinition(init)) {
                deferredStatements.push(...registerComponent(declaration.name));
              }
              if (
                isFunctionExpressionLikeOrFunctionDeclaration(init) &&
                hooksSignatureMap.has(init)
              ) {
                return ts.updateVariableDeclaration(
                  declaration,
                  declaration.name,
                  declaration.type,
                  hooksSignatureMap.get(init),
                );
              }
              return declaration;
            }
            if (isHigherOrderComponentLike(init)) {
              const {registers, call} = registerHigherOrderComponent(
                hooksSignatureMap,
                init,
                declaration.name.text,
              );
              deferredStatements.push(
                ...registers,
                ...registerComponent(declaration.name),
              );
              return ts.updateVariableDeclaration(
                declaration,
                declaration.name,
                declaration.type,
                call,
              );
            }
            return declaration;
          },
          context,
        );
        return [
          ts.updateVariableStatement(node, node.modifiers, nextDeclarationList),
          ...deferredStatements,
        ];
      } else if (ts.isExportAssignment(node)) {
        if (isHigherOrderComponentLike(node.expression)) {
          const {registers, call} = registerHigherOrderComponent(
            hooksSignatureMap,
            node.expression,
            '%default%',
          );
          const temp = createTempVariable();
          return [
            ts.updateExportAssignment(
              node,
              node.decorators,
              node.modifiers,
              ts.createAssignment(temp, call),
            ),
            createComponentRegisterCall(temp, '%default%'),
            ...registers,
          ];
        } else if (
          isFunctionExpressionLikeOrFunctionDeclaration(node.expression)
        ) {
          const expr = hooksSignatureMap.get(node.expression);
          if (expr) {
            return ts.updateExportAssignment(
              node,
              node.decorators,
              node.modifiers,
              expr,
            );
          }
        }
      }
      return node;
    }

    function registerComponent(/** @type {Identifier} */ name) {
      if (!startsWithLowerCase(name.text)) {
        const temp = createTempVariable();
        // uniq = name
        const assignment = ts.createAssignment(
          temp,
          ts.createIdentifier(name.text),
        );
        // $reg$(uniq, "name")
        return [
          ts.createExpressionStatement(assignment),
          createComponentRegisterCall(temp, name.text),
        ];
      }
      return [];
    }
    /**
     * Please call isHOCLike before call this function
     * @param {ReadonlyMap<HandledFunction, CallExpression>} hooksSignatureMap
     * @param {CallExpression} callExpr Current visiting
     * @param {string} nameHint
     * @returns {{call: CallExpression, registers: Statement[]}}
     */
    function registerHigherOrderComponent(
      hooksSignatureMap,
      callExpr,
      nameHint,
    ) {
      // Recursive case, if it is x(y(...)), recursive with y(...) to get inner expr
      const arg0 = callExpr.arguments[0];
      if (ts.isCallExpression(arg0)) {
        const tempVar = createTempVariable();
        const nextNameHint = nameHint + '$' + printNode(callExpr.expression);
        const {registers, call: innerResult} = registerHigherOrderComponent(
          hooksSignatureMap,
          arg0,
          nextNameHint,
        );
        return {
          call: ts.updateCall(callExpr, callExpr.expression, void 0, [
            ts.createAssignment(tempVar, innerResult),
            ...callExpr.arguments.slice(1),
          ]),
          registers: registers.concat(
            createComponentRegisterCall(tempVar, nextNameHint),
          ),
        };
      }

      // Base case, it is x(function () {...}) or x(() => ...) or x(Identifier)
      if (
        !isFunctionExpressionLikeOrFunctionDeclaration(arg0) &&
        !ts.isIdentifier(arg0)
      ) {
        throw new Error(
          'This is an error of react-refresh/typescript. Please report this problem: Call isHOC before register it',
        );
      }
      if (ts.isIdentifier(arg0)) return {call: callExpr, registers: []};
      const tempVar = createTempVariable();
      return {
        call: ts.updateCall(callExpr, callExpr.expression, void 0, [
          ts.createAssignment(tempVar, hooksSignatureMap.get(arg0) || arg0),
          ...callExpr.arguments.slice(1),
        ]),
        registers: [
          createComponentRegisterCall(
            tempVar,
            nameHint + '$' + printNode(callExpr.expression),
          ),
        ],
      };
    }
    function createTempVariable() {
      const id = ts.createFileLevelUniqueName('$c' + uniqueName++);
      context.hoistVariableDeclaration(id);
      return id;
    }
    /**
     * ! This function does not consider variable shadowing !
     */
    /**
     * @param {SourceFile} file
     * @param {ReadonlySet<string>} topLevelDeclaredName
     * @param {boolean} globalRequireForceRefresh
     */
    function visitDeep(file, topLevelDeclaredName, globalRequireForceRefresh) {
      /** @type {Set<string>} */ const usedAsJSXElement = new Set();
      /** @type {Map<HandledFunction, CallExpression[]>} */ const containingHooksOldMap = new Map();
      /** @type {Map<HandledFunction, CallExpression>} */ const hooksSignatureMap = new Map();
      function trackHooks(
        /** @type {HandledFunction} */ comp,
        /** @type {CallExpression} */ call,
      ) {
        const arr = containingHooksOldMap.get(comp) || [];
        arr.push(call);
        containingHooksOldMap.set(comp, arr);
      }
      function visitor(/** @type {Node} */ node) {
        // Collect JSX create info
        // <abc /> or <abc>
        if (ts.isJsxOpeningLikeElement(node)) {
          const tag = node.tagName;
          if (ts.isIdentifier(tag) && !isIntrinsicElement(tag)) {
            const name = tag.text;
            if (topLevelDeclaredName.has(name)) usedAsJSXElement.add(name);
          }
          // Not tracking other kinds of tagNames like <A.B /> or <A:B />
        } else if (isJSXConstructingCallExpr(node)) {
          const arg0 = node.arguments[0];
          if (arg0 && ts.isIdentifier(arg0)) {
            const name = arg0.text;
            if (topLevelDeclaredName.has(name)) usedAsJSXElement.add(name);
          }
        }
        if (isReactHooksCall(node)) {
          // @ts-ignore
          /** @type {HandledFunction} */ const parent = findAncestor(
            node,
            isFunctionExpressionLikeOrFunctionDeclaration,
          );
          if (parent) trackHooks(parent, node);
        }
        const oldNode = node;
        // Collect hooks
        node = ts.visitEachChild(node, visitor, context);
        // @ts-ignore
        const hooksCalls = containingHooksOldMap.get(oldNode);
        if (
          hooksCalls &&
          isFunctionExpressionLikeOrFunctionDeclaration(node) &&
          node.body
        ) {
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
          const callTracker = ts.createCall(hooksTracker, void 0, []);
          const nextBody = ts.isBlock(node.body)
            ? updateStatements(node.body, r => [
                ts.createExpressionStatement(callTracker),
                ...r,
              ])
            : ts.createComma(callTracker, node.body);
          // @ts-ignore
          const newFunction = updateBody(node, nextBody);
          const hooksSignature = hooksCallsToSignature(hooksCalls);
          const {force: forceRefresh, hooks: hooksArray} = needForceRefresh(
            hooksCalls,
          );
          const requireForceRefresh = forceRefresh || globalRequireForceRefresh;
          if (ts.isFunctionDeclaration(newFunction)) {
            if (newFunction.name) {
              hooksSignatureMap.set(
                newFunction,
                createHooksRegisterCall(
                  hooksTracker,
                  newFunction.name,
                  hooksSignature,
                  requireForceRefresh,
                  hooksArray,
                ),
              );
            }
            node = newFunction;
          } else {
            const wrapped = createHooksRegisterCall(
              hooksTracker,
              newFunction,
              hooksSignature,
              requireForceRefresh,
              hooksArray,
            );
            hooksSignatureMap.set(newFunction, wrapped);
            node = newFunction;
            // if it is an inner decl, we can update it safely
            if (findAncestor(oldNode.parent, ts.isFunctionLike)) node = wrapped;
          }
        }
        return updateStatements(node, addSignatureReport);
      }
      function addSignatureReport(
        /** @type {ReadonlyArray<Statement>} */ statements,
      ) {
        /** @type {Statement[]} */ const next = [];
        for (const statement of statements) {
          // @ts-ignore
          const signatureReport = hooksSignatureMap.get(statement);
          next.push(statement);
          if (signatureReport)
            next.push(ts.createExpressionStatement(signatureReport));
        }
        return next;
      }

      const nextFile = updateStatements(
        ts.visitEachChild(file, visitor, context),
        addSignatureReport,
      );
      return {
        nextFile,
        usedAsJSXElement,
        hooksSignatureMap,
      };
    }

    function printNode(/** @type {Node} */ node) {
      try {
        return node.getText();
      } catch {
        return '';
      }
    }
    function hooksCallsToSignature(/** @type {CallExpression[]} */ calls) {
      const signature = calls
        .map(x => {
          let assignTarget = '';
          if (x.parent && ts.isVariableDeclaration(x.parent)) {
            assignTarget = printNode(x.parent.name);
          }

          let hooksName = printNode(x.expression);
          let shouldCaptureArgs = 0; // bit-wise parameter position
          if (ts.isPropertyAccessExpression(x.expression)) {
            const left = x.expression.expression;
            if (ts.isIdentifier(left) && left.text === 'React') {
              hooksName = printNode(x.expression.name);
            }
          }
          if (hooksName === 'useState') shouldCaptureArgs = 1 << 0;
          else if (hooksName === 'useReducer') shouldCaptureArgs = 1 << 1;

          const args = x.arguments.reduce((last, val, index) => {
            if ((1 << index) & shouldCaptureArgs) {
              if (last) last += ',';
              last += printNode(val);
            }
            return last;
          }, '');
          return `${hooksName}{${assignTarget}${args ? `(${args})` : ''}}`;
        })
        .join('\n');

      if (typeof require === 'function' && !opts.emitFullSignatures) {
        // Prefer to hash when we can (e.g. outside of ASTExplorer).
        // This makes it deterministically compact, even if there's
        // e.g. a useState initializer with some code inside.
        // We also need it for www that has transforms like cx()
        // that don't understand if something is part of a string.
        try {
          return require('crypto')
            .createHash('sha1')
            .update(signature)
            .digest('base64');
        } catch (e) {}
      }
      return signature;
    }
    function needForceRefresh(/** @type {CallExpression[]} */ calls) {
      /** @type {Expression[]} */ const externalHooks = [];
      return {
        hooks: externalHooks,
        force: calls.some(x => {
          const ownerFunction = findAncestor(
            x,
            isFunctionExpressionLikeOrFunctionDeclaration,
          );
          const callee = x.expression;
          if (!ownerFunction) return true;
          if (ts.isPropertyAccessExpression(callee)) {
            const left = callee.expression;
            if (ts.isIdentifier(left)) {
              if (left.text === 'React') return false;
              const hasDecl = hasDeclarationInScope(ownerFunction, left.text);
              if (hasDecl) externalHooks.push(callee);
              return !hasDecl;
            }
            return true;
          } else if (ts.isIdentifier(callee)) {
            if (isBuiltinHook(callee.text)) return false;
            const hasDecl = hasDeclarationInScope(ownerFunction, callee.text);
            if (hasDecl) externalHooks.push(callee);
            return !hasDecl;
          }
          return true;
        }),
      };
    }
  };

  /**
   * @param {string} hookName
   */
  function isBuiltinHook(hookName) {
    switch (hookName) {
      case 'useState':
      case 'useReducer':
      case 'useEffect':
      case 'useLayoutEffect':
      case 'useMemo':
      case 'useCallback':
      case 'useRef':
      case 'useContext':
      case 'useImperativeHandle':
      case 'useDebugValue':
        return true;
      default:
        return false;
    }
  }

  function hasDeclarationInScope(
    /** @type {Node} */ node,
    /** @type {string} */ name,
  ) {
    while (node) {
      if (ts.isSourceFile(node) && hasDeclaration(node.statements, name))
        return true;
      if (ts.isBlock(node) && hasDeclaration(node.statements, name))
        return true;
      node = node.parent;
    }
    return false;
  }
  // This function does not consider uncommon and unrecommended practice like declare use var in a inner scope
  function hasDeclaration(
    /** @type {readonly Statement[]} */ nodes,
    /** @type {string} */ name,
  ) {
    for (const node of nodes) {
      if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          // binding pattern not checked
          if (ts.isIdentifier(decl.name) && decl.name.text === name)
            return true;
        }
      } else if (ts.isImportDeclaration(node)) {
        const clause = node.importClause;
        const defaultImport = clause && clause.name;
        const namedImport = clause && clause.namedBindings;
        if (defaultImport && defaultImport.text === name) return true;
        if (namedImport && ts.isNamespaceImport(namedImport)) {
          if (namedImport.name.text === name) return true;
        } else if (namedImport && ts.isNamedImports(namedImport)) {
          const hasBinding = namedImport.elements.some(
            x => x.name.text === name,
          );
          if (hasBinding) return true;
        }
      } else if (ts.isFunctionDeclaration(node)) {
        if (!node.body) continue;
        if (node.name && node.name.text === name) return true;
      }
    }
    return false;
  }

  /**
   * @template {Node} T
   * @returns {T}
   */
  function updateStatements(
    /** @type {T} */ node,
    /** @type {(s: import('typescript').NodeArray<Statement>) => readonly Statement[]} */ f,
  ) {
    if (ts.isSourceFile(node))
      // @ts-ignore
      return ts.updateSourceFileNode(
        node,
        f(node.statements),
        node.isDeclarationFile,
        node.referencedFiles,
        node.typeReferenceDirectives,
        node.hasNoDefaultLib,
        node.libReferenceDirectives,
      );
    if (ts.isCaseClause(node))
      // @ts-ignore
      return ts.updateCaseClause(node, node.expression, f(node.statements));
    if (ts.isDefaultClause(node))
      // @ts-ignore
      return ts.updateDefaultClause(node, f(node.statements));
    if (ts.isModuleBlock(node))
      // @ts-ignore
      return ts.updateModuleBlock(node, f(node.statements));
    if (ts.isBlock(node))
      // @ts-ignore
      return ts.updateBlock(node, f(node.statements));
    return node;
  }

  /** @returns {HandledFunction} */
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
    // @ts-ignore
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

  /** @returns {expr is CallExpression} */
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

  /**
   * If it return true, don't track it even it is used as JSX component
   * @return {boolean}
   */
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
  function isHigherOrderComponentLike(outExpr) {
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
      isFunctionExpressionLikeOrFunctionDeclaration(expr) ||
      (ts.isIdentifier(expr) && !startsWithLowerCase(expr.text));
    return isValidHOCArg;
  }

  /** @returns {node is HandledFunction} */
  function isFunctionExpressionLikeOrFunctionDeclaration(
    /** @type {Node} */ node,
  ) {
    if (ts.isFunctionDeclaration(node)) return true;
    if (ts.isArrowFunction(node)) return true;
    if (ts.isFunctionExpression(node)) return true;
    return false;
  }
  /**
   * @param {Identifier} id
   * @param {string} name
   */
  function createComponentRegisterCall(id, name) {
    return ts.createExpressionStatement(
      ts.createCall(refreshReg, void 0, [id, ts.createLiteral(name)]),
    );
  }
  /**
   * @param {Identifier} instance The identifier of the sig instance
   * @param {Expression} component The binding component
   * @param {string} signature The signature of the function
   * @param {boolean} forceRefresh Does forceRefresh enabled?
   * @param {Expression[]} trackers A list of custom hooks references
   */
  function createHooksRegisterCall(
    instance,
    component,
    signature,
    forceRefresh,
    trackers,
  ) {
    const args = [component];
    if (signature.includes('\n'))
      args.push(ts.createNoSubstitutionTemplateLiteral(signature, signature));
    else args.push(ts.createLiteral(signature));

    if (forceRefresh || trackers.length)
      args.push(ts.createLiteral(forceRefresh));
    if (trackers.length)
      args.push(
        ts.createArrowFunction(
          void 0,
          void 0,
          [],
          void 0,
          ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          ts.createArrayLiteral(trackers),
        ),
      );
    return ts.createCall(instance, void 0, args);
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

/** @typedef {{refreshReg?: string, refreshSig?: string, emitFullSignatures?: boolean, ts?: ts}} opt */
/** @typedef {import('typescript')} ts */
/** @typedef {import('typescript').Node} Node */
/** @typedef {import('typescript').Statement} Statement */
/** @typedef {import('typescript').CallExpression} CallExpression */
/** @typedef {import('typescript').Identifier} Identifier */
/** @typedef {import('typescript').Expression} Expression */
/** @typedef {import('typescript').SourceFile} SourceFile */
/** @typedef {import('typescript').FunctionDeclaration | import('typescript').FunctionExpression | import('typescript').ArrowFunction} HandledFunction */
