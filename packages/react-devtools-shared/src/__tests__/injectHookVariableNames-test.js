/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {parse} from '@babel/parser';
import {
  getHookVariableName,
  getPotentialHookDeclarationsFromAST,
  checkNodeLocation,
  isConfirmedHookDeclaration,
  getFilteredHookASTNodes,
  filterMemberWithHookVariableName,
  getHookNodeWithInjectedVariableName,
  isNonDeclarativePrimitiveHook,
  loadHookNamesFunction,
} from 'react-devtools-shared/src/utils';

describe('loadHookNamesFunction', () => {
  it('should test loadHookNamesFunction', async done => {
    const hookLog = [
      {
        id: 0,
        isStateEditable: true,
        name: 'State',
        value: false,
        subHooks: [],
        hookSource: {
          lineNumber: 151,
          functionName: 'Button',
          fileName: '/resources/bundle.js',
          columnNumber: 89,
        },
      },
      {
        id: 1,
        isStateEditable: true,
        name: 'State',
        value: 0,
        subHooks: [],
        hookSource: {
          lineNumber: 152,
          functionName: 'Button',
          fileName: '/resources/bundle.js',
          columnNumber: 62,
        },
      },
      {
        id: 2,
        isStateEditable: true,
        name: 'State',
        value: 2,
        subHooks: [],
        hookSource: {
          lineNumber: 160,
          functionName: 'Button',
          fileName: '/resources/bundle.js',
          columnNumber: 63,
        },
      },
      {
        id: null,
        isStateEditable: false,
        name: 'CustomHook',
        subHooks: [
          {
            id: 3,
            isStateEditable: false,
            name: 'Ref',
            value: null,
            subHooks: [],
            hookSource: {
              lineNumber: 115,
              functionName: 'useCustomHook',
              fileName: '/resources/bundle.js',
              columnNumber: 65,
            },
          },
          {
            id: 4,
            isStateEditable: false,
            name: 'Ref',
            subHooks: [],
            hookSource: {
              lineNumber: 116,
              functionName: 'useCustomHook',
              fileName: '/resources/bundle.js',
              columnNumber: 65,
            },
          },
        ],
        hookSource: {
          lineNumber: 163,
          columnNumber: 23,
          functionName: 'Button',
          fileName: '/resources/bundle.js',
        },
      },
      {
        id: null,
        isStateEditable: false,
        name: 'CustomHook',
        subHooks: [
          {
            id: 5,
            isStateEditable: false,
            name: 'Ref',
            value: null,
            subHooks: [],
            hookSource: {
              lineNumber: 115,
              functionName: 'useCustomHook',
              fileName: '/resources/bundle.js',
              columnNumber: 65,
            },
          },
          {
            id: 6,
            isStateEditable: false,
            name: 'Ref',
            subHooks: [],
            hookSource: {
              lineNumber: 116,
              functionName: 'useCustomHook',
              fileName: '/resources/bundle.js',
              columnNumber: 65,
            },
          },
        ],
        hookSource: {
          lineNumber: 164,
          columnNumber: 35,
          functionName: 'Button',
          fileName: '/resources/bundle.js',
        },
      },
      {
        id: null,
        isStateEditable: false,
        name: 'CustomHook',
        subHooks: [
          {
            id: 7,
            isStateEditable: false,
            name: 'Ref',
            value: null,
            subHooks: [],
            hookSource: {
              lineNumber: 115,
              functionName: 'useCustomHook',
              fileName: '/resources/bundle.js',
              columnNumber: 65,
            },
          },
          {
            id: 8,
            isStateEditable: false,
            name: 'Ref',
            subHooks: [],
            hookSource: {
              lineNumber: 116,
              functionName: 'useCustomHook',
              fileName: '/resources/bundle.js',
              columnNumber: 65,
            },
          },
        ],
        hookSource: {
          lineNumber: 168,
          columnNumber: 3,
          functionName: 'Button',
          fileName: '/resources/bundle.js',
        },
      },
      {
        id: 9,
        isStateEditable: false,
        name: 'Ref',
        subHooks: [],
        hookSource: {
          lineNumber: 169,
          functionName: 'Button',
          fileName: '/resources/bundle.js',
          columnNumber: 64,
        },
      },
      {
        id: 10,
        isStateEditable: true,
        name: 'State',
        value: 0,
        subHooks: [],
        hookSource: {
          lineNumber: 170,
          functionName: 'Button',
          fileName: '/resources/bundle.js',
          columnNumber: 72,
        },
      },
      {
        id: 11,
        isStateEditable: true,
        name: 'State',
        value: 1,
        subHooks: [],
        hookSource: {
          lineNumber: 171,
          functionName: 'Button',
          fileName: '/resources/bundle.js',
          columnNumber: 89,
        },
      },
      {
        id: 12,
        isStateEditable: true,
        name: 'State',
        value: 1,
        subHooks: [],
        hookSource: {
          lineNumber: 172,
          functionName: 'Button',
          fileName: '/resources/bundle.js',
          columnNumber: 82,
        },
      },
      {
        id: 13,
        isStateEditable: true,
        name: 'State',
        value: true,
        subHooks: [],
        hookSource: {
          lineNumber: 173,
          functionName: 'Button',
          fileName: '/resources/bundle.js',
          columnNumber: 66,
        },
      },
      {
        id: 14,
        isStateEditable: true,
        name: 'State',
        value: 0,
        subHooks: [],
        hookSource: {
          lineNumber: 174,
          functionName: 'Button',
          fileName: '/resources/bundle.js',
          columnNumber: 85,
        },
      },
      {
        id: 15,
        isStateEditable: false,
        name: 'Effect',
        value: {},
        subHooks: [],
        hookSource: {
          lineNumber: 175,
          functionName: 'Button',
          fileName: '/resources/bundle.js',
          columnNumber: 58,
        },
      },
    ];
    const newHookLog = await loadHookNamesFunction(hookLog);
    expect(newHookLog).toHaveLength(hookLog.length);
    done();
  });

  it('should identify variable names in destructed syntax', async done => {
    const componentSnippet = `
            const Example = () => {
                const [count, setCount] = React.useState(1);
                return count;
            };
        `;

    const ast = parse(componentSnippet, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
    });
    const hookAstNodes = getPotentialHookDeclarationsFromAST(ast);

    // Only one hook node is present in the source code
    expect(hookAstNodes).toHaveLength(1);

    const hookName = getHookVariableName(hookAstNodes[0]);
    expect(hookName).toBe('count');
    done();
  });

  it('should identify variable names in direct assignment', async done => {
    const componentSnippet = `
            const Example = () => {
                const count = React.useState(1);
                return count;
            };
        `;

    const ast = parse(componentSnippet, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
    });
    const hookAstNodes = getPotentialHookDeclarationsFromAST(ast);

    // Only one hook node is present in the source code
    expect(hookAstNodes).toHaveLength(1);

    const hookName = getHookVariableName(hookAstNodes[0]);
    expect(hookName).toBe('count');
    done();
  });

  it('should identify variable names in case of destructured assignment', async done => {
    const componentSnippet = `
            const Example = () => {
                const countState = React.useState(1);
                const [count, setCount] = countState;
                return countState;
            };
        `;

    const ast = parse(componentSnippet, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
    });
    // hookAstNodes captures lines of interest: 3 & 4
    const hookAstNodes = getPotentialHookDeclarationsFromAST(ast);
    expect(hookAstNodes).toHaveLength(2);
    // This line number corresponds to where the hook is present
    const lineNumber = 3;

    // Isolate the Hook AST Node
    const potentialReactHookASTNode = hookAstNodes.find(
      node =>
        checkNodeLocation(node, lineNumber) && isConfirmedHookDeclaration(node),
    );
    // Find the nodes that are associated with the React Hook found - in this case we obtain the [count, setCount] line
    const nodesAssociatedWithReactHookASTNode = getFilteredHookASTNodes(
      potentialReactHookASTNode,
      hookAstNodes,
      'example-app',
      new Map(),
    );

    // Only one node should be found here
    expect(nodesAssociatedWithReactHookASTNode).toHaveLength(1);
    const relatedNode = nodesAssociatedWithReactHookASTNode[0];

    // The [count, setCount] destructuring is on line 4
    expect(relatedNode.node.loc.start.line).toBe(4);

    const hookName = getHookVariableName(relatedNode);
    expect(hookName).toBe('count');
    done();
  });

  it('should identify variable names in case of assignment from object members', async done => {
    const componentSnippet = `
            const Example = () => {
                const countState = useState(1);
                const count = countState[0];
                const setCount = countState[1];
                return countState;
            };
        `;

    const ast = parse(componentSnippet, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
    });
    // hookAstNodes captures lines of interest: 3, 4 & 5
    const hookAstNodes = getPotentialHookDeclarationsFromAST(ast);
    expect(hookAstNodes).toHaveLength(3);
    // This line number corresponds to where the hook is present
    const lineNumber = 3;

    // Isolate the Hook AST Node
    const potentialReactHookASTNode = hookAstNodes.find(
      node =>
        checkNodeLocation(node, lineNumber) && isConfirmedHookDeclaration(node),
    );
    // Find the nodes that are associated with the React Hook found - in this case we obtain the lines
    // -> const count = countState[0];
    // -> const setCount = countState[1];
    const nodesAssociatedWithReactHookASTNode = getFilteredHookASTNodes(
      potentialReactHookASTNode,
      hookAstNodes,
      'example-app',
      new Map(),
    );

    // Two nodes should be found here
    expect(nodesAssociatedWithReactHookASTNode).toHaveLength(2);
    const nodeAssociatedWithReactHookASTNode = nodesAssociatedWithReactHookASTNode.filter(
      hookPath => filterMemberWithHookVariableName(hookPath),
    );

    // Node containing the variable name should be isolated here
    expect(nodeAssociatedWithReactHookASTNode).toHaveLength(1);
    const relatedNode = nodeAssociatedWithReactHookASTNode[0];

    // The const count = countState[0] assignment is on line 4
    expect(relatedNode.node.loc.start.line).toBe(4);

    const hookName = getHookVariableName(relatedNode);
    expect(hookName).toBe('count');
    done();
  });

  it('should identify variable names in case of inline assignment from object members', async done => {
    const componentSnippet = `
            const Example = () => {
                const countState = useState(1);
                const count = countState[0], setCount = countState[1];
                return countState;
            };
        `;

    const ast = parse(componentSnippet, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
    });
    // hookAstNodes captures lines of interest: 3 & 4
    const hookAstNodes = getPotentialHookDeclarationsFromAST(ast);
    expect(hookAstNodes).toHaveLength(3);
    // This line number corresponds to where the hook is present
    const lineNumber = 3;

    // Isolate the Hook AST Node
    const potentialReactHookASTNode = hookAstNodes.find(
      node =>
        checkNodeLocation(node, lineNumber) && isConfirmedHookDeclaration(node),
    );
    // Find the nodes that are associated with the React Hook found - in this case we obtain the line
    // -> const count = countState[0], setCount = countState[1];
    const nodesAssociatedWithReactHookASTNode = getFilteredHookASTNodes(
      potentialReactHookASTNode,
      hookAstNodes,
      'example-app',
      new Map(),
    );

    // Two nodes should be found here
    expect(nodesAssociatedWithReactHookASTNode).toHaveLength(2);
    const nodeAssociatedWithReactHookASTNode = nodesAssociatedWithReactHookASTNode.filter(
      hookPath => filterMemberWithHookVariableName(hookPath),
    );

    // Node containing the variable name should be isolated here
    expect(nodeAssociatedWithReactHookASTNode).toHaveLength(1);
    const relatedNode = nodeAssociatedWithReactHookASTNode[0];

    // The const count = countState[0] assignment is on line 4
    expect(relatedNode.node.loc.start.line).toBe(4);

    const hookName = getHookVariableName(relatedNode);
    expect(hookName).toBe('count');
    done();
  });

  it('should default to original variable name in case of repeated references', async done => {
    const componentSnippet = `
            const Example = () => {
                const countState = useState(1);
                const count = countState[0];
                const setCount = countState[1];
                const [anotherCount, setAnotherCount] = countState;
                return countState;
            };
        `;

    const ast = parse(componentSnippet, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
    });
    // hookAstNodes captures lines of interest: 3, 4, 5 & 6
    const hookAstNodes = getPotentialHookDeclarationsFromAST(ast);
    expect(hookAstNodes).toHaveLength(4);
    // This line number corresponds to where the hook is present
    const lineNumber = 3;

    // Isolate the Hook AST Node
    const potentialReactHookASTNode = hookAstNodes.find(
      node =>
        checkNodeLocation(node, lineNumber) && isConfirmedHookDeclaration(node),
    );
    // Find the nodes that are associated with the React Hook found - in this case we obtain the lines
    // -> const count = countState[0];
    // -> const setCount = countState[1];
    // -> const [anotherCount, setAnotherCount] = countState;
    let nodesAssociatedWithReactHookASTNode = [];
    nodesAssociatedWithReactHookASTNode = getFilteredHookASTNodes(
      potentialReactHookASTNode,
      hookAstNodes,
      'example-app',
      new Map(),
    );

    // Three nodes should be found here
    expect(nodesAssociatedWithReactHookASTNode).toHaveLength(3);

    // More than 2 nodes indicate there are multiple references of a hook assignment
    // In such cases we default to the statement const countState = useState(1);
    const hookName = getHookVariableName(potentialReactHookASTNode);
    expect(hookName).toBe('countState');
    done();
  });

  it('should default to original variable name in case of no found references', async done => {
    const componentSnippet = `
            const Example = () => {
                const countState = useState(1);
                return countState;
            };
        `;

    const ast = parse(componentSnippet, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
    });
    // hookAstNodes captures lines of interest: 3
    const hookAstNodes = getPotentialHookDeclarationsFromAST(ast);
    expect(hookAstNodes).toHaveLength(1);

    // Only one node of interest found
    const hookName = getHookVariableName(hookAstNodes[0]);
    expect(hookName).toBe('countState');
    done();
  });

  it('should ignore non declarative primitive hooks', async done => {
    const componentSnippet = `
            const Example = (props, ref) => {
                const [flag, toggleFlag] = useState(false);
                const inputRef = useRef();
                useDebugValue(flag ? 'Set' : 'Reset');
                useImperativeHandle(ref, () => ({
                  focus: () => {
                    inputRef.current.focus();
                  }
                }));
                useEffect(() => {
                  toggleFlag(true);
                }, []);
                useLayoutEffect(() => {
                  console.log(flag)
                }, []);
                return <input ref={inputRef} />;
            };
        `;

    const ast = parse(componentSnippet, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
    });

    // hookAstNodes captures lines of interest: 3 & 4
    // Should not capture any of the non declarative primitive hooks
    const hookAstNodes = getPotentialHookDeclarationsFromAST(ast);
    expect(hookAstNodes).toHaveLength(2);
    done();
  });

  it('should identify variable names for multiple hooks in one app', async done => {
    const componentSnippet = `
        const Example = () => {
            const countState = React.useState(() => 1);
            const [count, setCount] = countState;
            const [toggle, setToggle] = useState(false);
            return [count, toggle];
        };
      `;

    const ast = parse(componentSnippet, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
    });

    // hookAstNodes captures lines of interest: 3, 4 & 5
    // Two valid node paths found
    const hookAstNodes = getPotentialHookDeclarationsFromAST(ast);
    expect(hookAstNodes).toHaveLength(3);
    // This line number corresponds to where the hooks are present
    const lineNumber1 = 3;
    const lineNumber2 = 5;

    // Both node paths are valid hook declarations
    const isValidNode1 =
      checkNodeLocation(hookAstNodes[0], lineNumber1) &&
      isConfirmedHookDeclaration(hookAstNodes[0]);
    const isValidNode2 =
      checkNodeLocation(hookAstNodes[2], lineNumber2) &&
      isConfirmedHookDeclaration(hookAstNodes[2]);
    expect(isValidNode1).toBe(true);
    expect(isValidNode2).toBe(true);

    // Find the nodes that are associated with the React Hook found - in this case we obtain
    // -> const ref = React.useRef(null);
    // -> const [ticker, setTicker] = useState(() => 0);
    const node1AssociatedWithReactHookASTNode = getFilteredHookASTNodes(
      hookAstNodes[0],
      hookAstNodes,
      'example-app',
      new Map(),
    );
    const node2AssociatedWithReactHookASTNode = getFilteredHookASTNodes(
      hookAstNodes[1],
      hookAstNodes,
      'example-app',
      new Map(),
    );

    // Node associated with "countState" useState hook
    expect(node1AssociatedWithReactHookASTNode).toHaveLength(1);
    const hookNameOfNode1 = getHookVariableName(
      node1AssociatedWithReactHookASTNode[0],
    );
    expect(hookNameOfNode1).toBe('count');

    // Node associated with "toggle" useState hook
    expect(node2AssociatedWithReactHookASTNode).toHaveLength(1);
    const hookNameOfNode2 = getHookVariableName(
      node2AssociatedWithReactHookASTNode[0],
    );
    expect(hookNameOfNode2).toBe('toggle');

    done();
  });

  it('should identify variable names for multiple hooks declared inline in one app', async done => {
    const componentSnippet = `
        const Example = () => {
            const ref = React.useRef(null), [ticker, setTicker] = useState(() => 0);
            return [ref, ticker];
        };
      `;

    const ast = parse(componentSnippet, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
    });

    // hookAstNodes captures lines of interest: 3
    // Two valid node paths found
    const hookAstNodes = getPotentialHookDeclarationsFromAST(ast);
    expect(hookAstNodes).toHaveLength(2);
    // This line number corresponds to where the hooks are present
    const lineNumber = 3;

    // Both node paths are identified as valid hook declarations
    const isValidNode1 =
      checkNodeLocation(hookAstNodes[0], lineNumber) &&
      isConfirmedHookDeclaration(hookAstNodes[0]);
    const isValidNode2 =
      checkNodeLocation(hookAstNodes[1], lineNumber) &&
      isConfirmedHookDeclaration(hookAstNodes[1]);
    expect(isValidNode1).toBe(true);
    expect(isValidNode2).toBe(true);

    // Find the nodes that are associated with the React Hook found - in this case we obtain
    // -> const ref = React.useRef(null);
    // -> const [ticker, setTicker] = useState(() => 0);
    // both the nodes in the same line
    const node1AssociatedWithReactHookASTNode = getFilteredHookASTNodes(
      hookAstNodes[0],
      hookAstNodes,
      'example-app',
      new Map(),
    );
    const node2AssociatedWithReactHookASTNode = getFilteredHookASTNodes(
      hookAstNodes[0],
      hookAstNodes,
      'example-app',
      new Map(),
    );

    // Node associated with useRef hook
    expect(node1AssociatedWithReactHookASTNode).toHaveLength(1);
    const hookNameOfNode1 = getHookVariableName(
      node1AssociatedWithReactHookASTNode[0],
    );
    expect(hookNameOfNode1).toBe('ref');

    // Node associated with useState hook
    expect(node2AssociatedWithReactHookASTNode).toHaveLength(1);
    const hookNameOfNode2 = getHookVariableName(
      node2AssociatedWithReactHookASTNode[0],
    );
    expect(hookNameOfNode2).toBe('ticker');

    done();
  });

  it('should identify variable names for custom hooks', async done => {
    const componentSnippet = `
        function useCustomHook() {
            const [flag, setFlag] = React.useState(0);
            return flag;
        }
        const Example = () => {
            const customFlag = useCustomHook();
            return customFlag ? 'custom' : 'primitive';
        };
      `;

    const ast = parse(componentSnippet, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
    });

    // hookAstNodes captures lines of interest: 3 & 7
    // Two valid node paths found
    const hookAstNodes = getPotentialHookDeclarationsFromAST(ast);
    expect(hookAstNodes).toHaveLength(2);

    // Isolate the Custom Hook AST Node on line 7
    const lineNumber = 7;
    const potentialReactHookASTNode = hookAstNodes.find(
      node =>
        checkNodeLocation(node, lineNumber) && isConfirmedHookDeclaration(node),
    );

    // Find the nodes that are associated with the Custom hook - here we find the only obvious one
    // -> const customFlag = useCustomHook();
    const nodesAssociatedWithReactHookASTNode = getFilteredHookASTNodes(
      potentialReactHookASTNode,
      hookAstNodes,
      'example-app',
      new Map(),
    );
    // One node should be found here
    expect(nodesAssociatedWithReactHookASTNode).toHaveLength(1);
    const hookName = getHookVariableName(
      nodesAssociatedWithReactHookASTNode[0],
    );
    expect(hookName).toBe('customFlag');

    done();
  });

  it('should bypass custom hooks not assigned to variables', async done => {
    const componentSnippet = `
        function useCustomHook() {
            useEffect(() => {
              console.log('This is a custom hook');
            }, []);
        }
        const Example = () => {
            useCustomHook();
            const exampleRef = useRef();
            return exampleRef;
        };
      `;

    const ast = parse(componentSnippet, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
    });

    // hookAstNodes captures lines having hooks with variable declarations - useRef in this case
    // One valid node path found
    const hookAstNodes = getPotentialHookDeclarationsFromAST(ast);
    expect(hookAstNodes).toHaveLength(1);

    // Isolate the Custom Hook AST Node on line 8
    const lineNumber = 8;
    const potentialReactHookASTNode = hookAstNodes.find(
      node =>
        checkNodeLocation(node, lineNumber) && isConfirmedHookDeclaration(node),
    );

    // Isolating potential hook nodes unsuccessful
    // Custom hooks not assigned to any variables are ignored
    expect(potentialReactHookASTNode).toBeUndefined();
    done();
  });

  it('should ignore custom hooks assigned to multiple variables', async done => {
    const componentSnippet = `
        function useCustomHook() {
            const [flag, setFlag] = useState(0);
            const someRef = React.useRef();
            return [flag, someRef];
        }
        const Example = () => {
            const [customFlag, customRef] = useCustomHook();
            return customFlag ? 'custom' : 'primitive';
        };
      `;

    const ast = parse(componentSnippet, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
    });

    // hookAstNodes captures lines of interest: 3, 4 & 8
    // Three valid node paths found
    const hookAstNodes = getPotentialHookDeclarationsFromAST(ast);
    expect(hookAstNodes).toHaveLength(3);

    // Isolate the Custom Hook AST Node on line 8
    const lineNumber = 8;
    const potentialReactHookASTNode = hookAstNodes.find(
      node =>
        checkNodeLocation(node, lineNumber) && isConfirmedHookDeclaration(node),
    );

    // Find the nodes that are associated with the Custom hook - here we find the only obvious one
    // -> const customFlag = useCustomHook();
    const nodesAssociatedWithReactHookASTNode = getFilteredHookASTNodes(
      potentialReactHookASTNode,
      hookAstNodes,
      'example-app',
      new Map(),
    );
    // One node should be found here
    expect(nodesAssociatedWithReactHookASTNode).toHaveLength(1);

    // Empty string for hook variable name of such custom hooks
    const isCustomHook = true;
    const hookName = getHookVariableName(
      nodesAssociatedWithReactHookASTNode[0],
      isCustomHook,
    );
    expect(hookName).toBeFalsy();

    done();
  });

  it('should create hookLog injected with variable names for destructured assignment', async done => {
    const componentSnippet = `
            const Example = () => {
                const [count, setCount] = React.useState(1);
                const [flag, setFlag] = useState(() => false);
                const ref = useRef();
                return [count, ref];
            };
        `;
    const snippetHookLog = [
      {
        id: 0,
        isStateEditable: true,
        name: 'State',
        value: 0,
        subHooks: [],
        hookSource: {
          lineNumber: 3,
          functionName: 'Example',
          fileName: 'example-app.js',
          columnNumber: 49,
        },
      },
      {
        id: 1,
        isStateEditable: true,
        name: 'State',
        value: false,
        subHooks: [],
        hookSource: {
          lineNumber: 4,
          functionName: 'Example',
          fileName: 'example-app.js',
          columnNumber: 41,
        },
      },
      {
        id: 2,
        isStateEditable: false,
        name: 'Ref',
        value: undefined,
        subHooks: [],
        hookSource: {
          lineNumber: 5,
          functionName: 'Example',
          fileName: 'example-app.js',
          columnNumber: 29,
        },
      },
    ];

    const ast = parse(componentSnippet, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
    });

    const hookAstNodes = getPotentialHookDeclarationsFromAST(ast);
    let lineNumber = 3;

    const modifiedSnippetHookLog = snippetHookLog.map(hook => {
      const potentialReactHookASTNode = hookAstNodes.find(
        node =>
          checkNodeLocation(node, lineNumber) &&
          isConfirmedHookDeclaration(node),
      );
      lineNumber++;
      const nodesAssociatedWithReactHookASTNode = getFilteredHookASTNodes(
        potentialReactHookASTNode,
        hookAstNodes,
        'example-app',
        new Map(),
      );
      const newHook = getHookNodeWithInjectedVariableName(
        hook,
        nodesAssociatedWithReactHookASTNode,
        potentialReactHookASTNode,
      );
      return newHook;
    });
    expect(modifiedSnippetHookLog).toMatchSnapshot('modified hook log');
    done();
  });

  it('should create hookLog injected with variable names for inline/multi-line member expressions', async done => {
    const componentSnippet = `
            const Example = () => {
                const countState = React.useState(1);
                const [count, setCount] = countState;
                const flagState = useState(() => false);
                const flag = flagState[0];
                const setFlag = flagState[1];
                const tickState = React.useState(0);
                const tick = tickState[0], setTick = tickState[1];
                return [count, flag, tick];
            };
        `;
    const snippetHookLog = [
      {
        id: 0,
        isStateEditable: true,
        name: 'State',
        value: 1,
        subHooks: [],
        hookSource: {
          lineNumber: 3,
          functionName: 'Example',
          fileName: 'example-app.js',
          columnNumber: 42,
        },
      },
      {
        id: 1,
        isStateEditable: true,
        name: 'State',
        value: false,
        subHooks: [],
        hookSource: {
          lineNumber: 5,
          functionName: 'Example',
          fileName: 'example-app.js',
          columnNumber: 35,
        },
      },
      {
        id: 2,
        isStateEditable: true,
        name: 'State',
        value: 0,
        subHooks: [],
        hookSource: {
          lineNumber: 8,
          functionName: 'Example',
          fileName: 'example-app.js',
          columnNumber: 41,
        },
      },
    ];

    const ast = parse(componentSnippet, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
    });

    const hookAstNodes = getPotentialHookDeclarationsFromAST(ast);
    const lineNumbers = [3, 5, 8];
    const potentialHooksMap = new Map();
    let line = 0;

    potentialHooksMap.set('example-app', hookAstNodes);
    const modifiedSnippetHookLog = snippetHookLog.map(hook => {
      const potentialReactHookASTNode = hookAstNodes.find(
        node =>
          checkNodeLocation(node, lineNumbers[line]) &&
          isConfirmedHookDeclaration(node),
      );
      line++;
      if (!potentialReactHookASTNode) return hook;
      const nodesAssociatedWithReactHookASTNode = getFilteredHookASTNodes(
        potentialReactHookASTNode,
        hookAstNodes,
        'example-app',
        potentialHooksMap,
      );
      const newHook = getHookNodeWithInjectedVariableName(
        hook,
        nodesAssociatedWithReactHookASTNode,
        potentialReactHookASTNode,
      );
      return newHook;
    });
    expect(modifiedSnippetHookLog).toMatchSnapshot('modified hook log');
    done();
  });

  it('should create hookLog injected with default variable names for no/multiple references', async done => {
    const componentSnippet = `
            const Example = () => {
                const countState = React.useState(1);
                const [count, setCount] = countState;
                const flagState = useState(() => false);
                const tick = countState[0];
                const setTick = countState[1];
                return [count, flag, tick];
            };
        `;
    const snippetHookLog = [
      {
        id: 0,
        isStateEditable: true,
        name: 'State',
        value: 1,
        subHooks: [],
        hookSource: {
          lineNumber: 3,
          functionName: 'Example',
          fileName: 'example-app.js',
          columnNumber: 42,
        },
      },
      {
        id: 1,
        isStateEditable: true,
        name: 'State',
        value: false,
        subHooks: [],
        hookSource: {
          lineNumber: 5,
          functionName: 'Example',
          fileName: 'example-app.js',
          columnNumber: 35,
        },
      },
    ];

    const ast = parse(componentSnippet, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
    });

    const hookAstNodes = getPotentialHookDeclarationsFromAST(ast);
    const lineNumbers = [3, 5];
    const potentialHooksMap = new Map();
    let line = 0;

    potentialHooksMap.set('example-app', hookAstNodes);
    const modifiedSnippetHookLog = snippetHookLog.map(hook => {
      const potentialReactHookASTNode = hookAstNodes.find(
        node =>
          checkNodeLocation(node, lineNumbers[line]) &&
          isConfirmedHookDeclaration(node),
      );
      line++;
      if (!potentialReactHookASTNode) return hook;
      const nodesAssociatedWithReactHookASTNode = getFilteredHookASTNodes(
        potentialReactHookASTNode,
        hookAstNodes,
        'example-app',
        potentialHooksMap,
      );
      const newHook = getHookNodeWithInjectedVariableName(
        hook,
        nodesAssociatedWithReactHookASTNode,
        potentialReactHookASTNode,
      );
      return newHook;
    });
    expect(modifiedSnippetHookLog).toMatchSnapshot('modified hook log');
    done();
  });

  it('should not inject hookLog with variable names for non declarative primitive hooks', async done => {
    const componentSnippet = `
            const Example = (props, ref) => {
                const [flag, toggleFlag] = useState(false);
                const inputRef = React.useRef();
                useDebugValue(flag ? 'Set' : 'Reset');
                useEffect(() => {
                  toggleFlag(true);
                }, []);
                useLayoutEffect(() => {
                  console.log(flag)
                }, []);
                return <input ref={inputRef} />;
            };
        `;

    function effect() {}
    const snippetHookLog = [
      {
        id: 0,
        isStateEditable: true,
        name: 'State',
        value: false,
        subHooks: [],
        hookSource: {
          lineNumber: 3,
          functionName: 'Example',
          fileName: 'example-app.js',
          columnNumber: 44,
        },
      },
      {
        id: 1,
        isStateEditable: false,
        name: 'Ref',
        value: undefined,
        subHooks: [],
        hookSource: {
          lineNumber: 4,
          functionName: 'Example',
          fileName: 'example-app.js',
          columnNumber: 40,
        },
      },
      {
        id: 2,
        isStateEditable: false,
        name: 'Effect',
        value: effect,
        subHooks: [],
        hookSource: {
          lineNumber: 6,
          functionName: 'Example',
          fileName: 'example-app.js',
          columnNumber: 17,
        },
      },
      {
        id: 3,
        isStateEditable: false,
        name: 'LayoutEffect',
        value: effect,
        subHooks: [],
        hookSource: {
          lineNumber: 9,
          functionName: 'Example',
          fileName: 'example-app.js',
          columnNumber: 17,
        },
      },
    ];

    const ast = parse(componentSnippet, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
    });
    const hookAstNodes = getPotentialHookDeclarationsFromAST(ast);
    const lineNumbers = [3, 4, 6, 9];
    const potentialHooksMap = new Map();
    let line = 0;

    potentialHooksMap.set('example-app', hookAstNodes);
    const modifiedSnippetHookLog = snippetHookLog.map(hook => {
      const potentialReactHookASTNode = hookAstNodes.find(
        node =>
          checkNodeLocation(node, lineNumbers[line]) &&
          isConfirmedHookDeclaration(node),
      );
      line++;
      if (!potentialReactHookASTNode) {
        expect(isNonDeclarativePrimitiveHook(hook)).toBe(true);
        return hook;
      }
      const nodesAssociatedWithReactHookASTNode = getFilteredHookASTNodes(
        potentialReactHookASTNode,
        hookAstNodes,
        'example-app',
        potentialHooksMap,
      );
      const newHook = getHookNodeWithInjectedVariableName(
        hook,
        nodesAssociatedWithReactHookASTNode,
        potentialReactHookASTNode,
      );
      return newHook;
    });
    expect(modifiedSnippetHookLog).toMatchSnapshot('modified hook log');
    done();
  });
});
