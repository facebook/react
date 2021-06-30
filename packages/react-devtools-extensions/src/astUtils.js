/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import traverse, {NodePath, Node} from '@babel/traverse';
import {File} from '@babel/types';

import type {HooksNode} from 'react-debug-tools/src/ReactDebugHooks';

export type SourceConsumer = any;

export type SourceFileASTWithHookDetails = {
  sourceFileAST: File,
  line: number,
  source: string,
};

export type SourceMap = {|
  mappings: string,
  names: Array<string>,
  sources: Array<string>,
  sourcesContent: Array<string>,
  version: number,
|};

const AST_NODE_TYPES = Object.freeze({
  CALL_EXPRESSION: 'CallExpression',
  MEMBER_EXPRESSION: 'MemberExpression',
  ARRAY_PATTERN: 'ArrayPattern',
  IDENTIFIER: 'Identifier',
  NUMERIC_LITERAL: 'NumericLiteral',
});

// Check if line number obtained from source map and the line number in hook node match
function checkNodeLocation(path: NodePath, line: number): boolean {
  const {start, end} = path.node.loc;
  return line >= start.line && line <= end.line;
}

// Checks whether hookNode is a member of targetHookNode
function filterMemberNodesOfTargetHook(
  targetHookNode: NodePath,
  hookNode: NodePath,
): boolean {
  const targetHookName = targetHookNode.node.id.name;
  return (
    targetHookName ===
      (hookNode.node.init.object && hookNode.node.init.object.name) ||
    targetHookName === hookNode.node.init.name
  );
}

// Checks whether hook is the first member node of a state variable declaration node
function filterMemberWithHookVariableName(hook: NodePath): boolean {
  return (
    hook.node.init.property.type === AST_NODE_TYPES.NUMERIC_LITERAL &&
    hook.node.init.property.value === 0
  );
}

// Returns all AST Nodes associated with 'potentialReactHookASTNode'
function getFilteredHookASTNodes(
  potentialReactHookASTNode: NodePath,
  potentialHooksFound: Array<NodePath>,
  source: string,
): Array<NodePath> {
  let nodesAssociatedWithReactHookASTNode: NodePath[] = [];
  if (nodeContainsHookVariableName(potentialReactHookASTNode)) {
    // made custom hooks to enter this, always
    // Case 1.
    // Directly usable Node -> const ref = useRef(null);
    //                      -> const [tick, setTick] = useState(1);
    // Case 2.
    // Custom Hooks -> const someVariable = useSomeCustomHook();
    //              -> const [someVariable, someFunction] = useAnotherCustomHook();
    nodesAssociatedWithReactHookASTNode.unshift(potentialReactHookASTNode);
  } else {
    // Case 3.
    // Indirectly usable Node -> const tickState = useState(1);
    //                           [tick, setTick] = tickState;
    //                        -> const tickState = useState(1);
    //                           const tick = tickState[0];
    //                           const setTick = tickState[1];
    nodesAssociatedWithReactHookASTNode = potentialHooksFound.filter(hookNode =>
      filterMemberNodesOfTargetHook(potentialReactHookASTNode, hookNode),
    );
  }
  return nodesAssociatedWithReactHookASTNode;
}

// Returns Hook name
export function getHookName(
  hook: HooksNode,
  originalSourceAST: mixed,
  originalSourceCode: string,
  originalSourceLineNumber: number,
): string | null {
  const hooksFromAST = getPotentialHookDeclarationsFromAST(originalSourceAST);

  const potentialReactHookASTNode = hooksFromAST.find(node => {
    const nodeLocationCheck = checkNodeLocation(
      node,
      ((originalSourceLineNumber: any): number),
    );
    const hookDeclaractionCheck = isConfirmedHookDeclaration(node);
    return nodeLocationCheck && hookDeclaractionCheck;
  });

  if (!potentialReactHookASTNode) {
    return null;
  }

  // nodesAssociatedWithReactHookASTNode could directly be used to obtain the hook variable name
  // depending on the type of potentialReactHookASTNode
  try {
    const nodesAssociatedWithReactHookASTNode = getFilteredHookASTNodes(
      potentialReactHookASTNode,
      hooksFromAST,
      originalSourceCode,
    );

    return getHookNameFromNode(
      hook,
      nodesAssociatedWithReactHookASTNode,
      potentialReactHookASTNode,
    );
  } catch (error) {
    console.error(error);
    return null;
  }
}

function getHookNameFromNode(
  originalHook: HooksNode,
  nodesAssociatedWithReactHookASTNode: NodePath[],
  potentialReactHookASTNode: NodePath,
): string | null {
  let hookVariableName: string | null;
  const isCustomHook = originalHook.id === null;

  switch (nodesAssociatedWithReactHookASTNode.length) {
    case 1:
      // CASE 1A (nodesAssociatedWithReactHookASTNode[0] !== potentialReactHookASTNode):
      // const flagState = useState(true); -> later referenced as
      // const [flag, setFlag] = flagState;
      //
      // CASE 1B (nodesAssociatedWithReactHookASTNode[0] === potentialReactHookASTNode):
      // const [flag, setFlag] = useState(true); -> we have access to the hook variable straight away
      //
      // CASE 1C (isCustomHook && nodesAssociatedWithReactHookASTNode[0] === potentialReactHookASTNode):
      // const someVariable = useSomeCustomHook(); -> we have access to hook variable straight away
      // const [someVariable, someFunction] = useAnotherCustomHook(); -> we ignore variable names in this case
      //                                                                 as it is unclear what variable name to show
      if (
        isCustomHook &&
        nodesAssociatedWithReactHookASTNode[0] === potentialReactHookASTNode
      ) {
        hookVariableName = getHookVariableName(
          potentialReactHookASTNode,
          isCustomHook,
        );
        break;
      }
      hookVariableName = getHookVariableName(
        nodesAssociatedWithReactHookASTNode[0],
      );
      break;

    case 2:
      // const flagState = useState(true); -> later referenced as
      // const flag = flagState[0];
      // const setFlag = flagState[1];
      nodesAssociatedWithReactHookASTNode = nodesAssociatedWithReactHookASTNode.filter(
        hookPath => filterMemberWithHookVariableName(hookPath),
      );

      if (nodesAssociatedWithReactHookASTNode.length !== 1) {
        // Something went wrong, only a single desirable hook should remain here
        throw new Error("Couldn't isolate AST Node containing hook variable.");
      }
      hookVariableName = getHookVariableName(
        nodesAssociatedWithReactHookASTNode[0],
      );
      break;

    default:
      // Case 0:
      // const flagState = useState(true); -> which is not accessed anywhere
      //
      // Case > 2 (fallback):
      // const someState = React.useState(() => 0)
      //
      // const stateVariable = someState[0]
      // const setStateVariable = someState[1]
      //
      // const [number2, setNumber2] = someState
      //
      // We assign the state variable for 'someState' to multiple variables,
      // and hence cannot isolate a unique variable name. In such cases,
      // default to showing 'someState'

      hookVariableName = getHookVariableName(potentialReactHookASTNode);
      break;
  }

  return hookVariableName;
}

// Extracts the variable name from hook node path
function getHookVariableName(
  hook: NodePath,
  isCustomHook: boolean = false,
): string | null {
  const nodeType = hook.node.id.type;
  switch (nodeType) {
    case AST_NODE_TYPES.ARRAY_PATTERN:
      return !isCustomHook ? hook.node.id.elements[0].name : null;

    case AST_NODE_TYPES.IDENTIFIER:
      return hook.node.id.name;

    default:
      throw new Error(`Invalid node type: ${nodeType}`);
  }
}

function getPotentialHookDeclarationsFromAST(sourceAST: File): NodePath[] {
  const potentialHooksFound: NodePath[] = [];
  traverse(sourceAST, {
    enter(path) {
      if (path.isVariableDeclarator() && isPotentialHookDeclaration(path)) {
        potentialHooksFound.push(path);
      }
    },
  });
  return potentialHooksFound;
}

// Check if 'path' contains declaration of the form const X = useState(0);
function isConfirmedHookDeclaration(path: NodePath): boolean {
  const node = path.node.init;
  if (node.type !== AST_NODE_TYPES.CALL_EXPRESSION) {
    return false;
  }
  const callee = node.callee;
  return isHook(callee);
}

// We consider hooks to be a hook name identifier or a member expression containing a hook name.
function isHook(node: Node): boolean {
  if (node.type === AST_NODE_TYPES.IDENTIFIER) {
    return isHookName(node.name);
  } else if (
    node.type === AST_NODE_TYPES.MEMBER_EXPRESSION &&
    !node.computed &&
    isHook(node.property)
  ) {
    const obj = node.object;
    const isPascalCaseNameSpace = /^[A-Z].*/;
    return (
      obj.type === AST_NODE_TYPES.IDENTIFIER &&
      isPascalCaseNameSpace.test(obj.name)
    );
  } else {
    // TODO Possibly handle inline require statements e.g. require("useStable")(...)
    // This does not seem like a high priority, since inline requires are probably
    // not common and are also typically in compiled code rather than source code.

    return false;
  }
}

// Catch all identifiers that begin with "use"
// followed by an uppercase Latin character to exclude identifiers like "user".
// Copied from packages/eslint-plugin-react-hooks/src/RulesOfHooks
function isHookName(name: string): boolean {
  return /^use[A-Z0-9].*$/.test(name);
}

// Determines whether incoming hook is a primitive hook that gets assigned to variables.
export function isNonDeclarativePrimitiveHook(hook: HooksNode) {
  return ['Effect', 'ImperativeHandle', 'LayoutEffect', 'DebugValue'].includes(
    hook.name,
  );
}

// Check if the AST Node COULD be a React Hook
function isPotentialHookDeclaration(path: NodePath): boolean {
  // The array potentialHooksFound will contain all potential hook declaration cases we support
  const nodePathInit = path.node.init;
  if (nodePathInit != null) {
    if (nodePathInit.type === AST_NODE_TYPES.CALL_EXPRESSION) {
      // CASE: CallExpression
      // 1. const [count, setCount] = useState(0); -> destructured pattern
      // 2. const [A, setA] = useState(0), const [B, setB] = useState(0); -> multiple inline declarations
      // 3. const [
      //      count,
      //      setCount
      //    ] = useState(0); -> multiline hook declaration
      // 4. const ref = useRef(null); -> generic hooks
      const callee = nodePathInit.callee;
      return isHook(callee);
    } else if (
      nodePathInit.type === AST_NODE_TYPES.MEMBER_EXPRESSION ||
      nodePathInit.type === AST_NODE_TYPES.IDENTIFIER
    ) {
      // CASE: MemberExpression
      //    const countState = React.useState(0);
      //    const count = countState[0];
      //    const setCount = countState[1]; -> Accessing members following hook declaration

      // CASE: Identifier
      //    const countState = React.useState(0);
      //    const [count, setCount] = countState; ->  destructuring syntax following hook declaration
      return true;
    }
  }
  return false;
}

/// Check whether 'node' is hook decalration of form useState(0); OR React.useState(0);
function isReactFunction(node: Node, functionName: string): boolean {
  return (
    node.name === functionName ||
    (node.type === 'MemberExpression' &&
      node.object.name === 'React' &&
      node.property.name === functionName)
  );
}

// Check if 'path' is either State or Reducer hook
function isStateOrReducerHook(path: NodePath): boolean {
  const callee = path.node.init.callee;
  return (
    isReactFunction(callee, 'useState') || isReactFunction(callee, 'useReducer')
  );
}

// Check whether hookNode of a declaration contains obvious variable name
function nodeContainsHookVariableName(hookNode: NodePath): boolean {
  // We determine cases where variable names are obvious in declarations. Examples:
  // const [tick, setTick] = useState(1); OR const ref = useRef(null);
  // Here tick/ref are obvious hook variables in the hook declaration node itself
  // 1. True for satisfying above cases
  // 2. False for everything else. Examples:
  //    const countState = React.useState(0);
  //    const count = countState[0];
  //    const setCount = countState[1]; -> not obvious, hook variable can't be determined
  //                                       from the hook declaration node alone
  // 3. For custom hooks we force pass true since we are only concerned with the AST node
  //    regardless of how it is accessed in source code. (See: getHookVariableName)

  const node = hookNode.node.id;
  if (
    node.type === AST_NODE_TYPES.ARRAY_PATTERN ||
    (node.type === AST_NODE_TYPES.IDENTIFIER && !isStateOrReducerHook(hookNode))
  ) {
    return true;
  }
  return false;
}
