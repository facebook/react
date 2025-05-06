import * as babel from '@babel/core';
import puppeteer from 'puppeteer';
import {readFileSync} from 'fs';
import * as path from 'path';
// @ts-ignore
import * as babelPresetTypescript from '@babel/preset-typescript';
// @ts-ignore
import * as babelPresetEnv from '@babel/preset-env';
// @ts-ignore
import * as babelPresetReact from '@babel/preset-react';

function delay(time: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

export async function parseReactComponentTree(code: string): Promise<string> {
  const babelOptions: babel.TransformOptions = {
    filename: 'anonymous.tsx',
    configFile: false,
    babelrc: false,
    presets: [babelPresetTypescript, babelPresetEnv, babelPresetReact],
  };

  const parsed = await babel.parseAsync(code, babelOptions);
  if (!parsed) {
    throw new Error('Failed to parse code');
  }

  const transformResult = await babel.transformFromAstAsync(parsed, undefined, {
    ...babelOptions,
    plugins: [
      () => ({
        visitor: {
          ImportDeclaration(
            path: babel.NodePath<babel.types.ImportDeclaration>,
          ) {
            const value = path.node.source.value;
            if (value === 'react' || value === 'react-dom') {
              path.remove();
            }
          },
        },
      }),
    ],
  });

  const transpiled = transformResult?.code || undefined;
  if (!transpiled) {
    throw new Error('Failed to transpile code');
  }

  // Path to the Chrome extension - using path.join to handle spaces properly
  const extensionPath = path.join('/Users', 'jorgecab', 'react', 'compiler',
    'packages', 'react-mcp-server', 'src', 'extensions', 'react-devtools');

  console.log(`Attempting to load extension from: ${extensionPath}`);

    // Launch browser with more debugging options
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        // Remove quotes around paths to avoid command line parsing issues
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        // Add additional arguments that might help
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      // Increase timeout to give more time for browser to launch
      timeout: 60000
    });

    const page = await browser.newPage();
    return '';

  //   // Navigate to a simple page to check if the extension is loaded
  //   await page.goto('about:blank');

  //   // Check if React DevTools extension is loaded by looking for the global hook
  //   const isExtensionLoaded = await page.evaluate(() => {
  //     return typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined';
  //   });

  //   console.log(`React DevTools extension loaded: ${isExtensionLoaded ? 'YES ✅' : 'NO ❌'}`);

  //   if (!isExtensionLoaded) {
  //     console.warn('React DevTools extension is not loaded. Check the extension path and permissions.');
  //     console.log(`Extension path used: ${extensionPath}`);
  //   } else {
  //     console.log('React DevTools extension loaded successfully!');
  //   }

  //   // Keep the early return for debugging purposes
  //   await browser.close();
  //   return '';
  // } catch (error) {
  //   console.error('Error launching browser or loading extension:', error);
  //   return `Error: ${error.message}`;
  // }

  // const html = buildHtml(transpiled);

  // await page.setContent(html, {waitUntil: 'networkidle0'});

  // await delay(2000);

  // const componentTree = await page.evaluate(() => {
  //   // Helper function to find a React root element
  //   function findReactRootElement() {
  //     // Common root element IDs used in React apps
  //     const commonRootIds = ['root', 'app', 'react-root', 'react-app'];
  //     let rootElement = null;

  //     // Try to find root by common IDs
  //     for (const id of commonRootIds) {
  //       const element = document.getElementById(id);
  //       if (element) {
  //         rootElement = element;
  //         break;
  //       }
  //     }

  //     // If no root found by ID, use the first child of body
  //     if (!rootElement && document.body.children.length > 0) {
  //       rootElement = document.body.children[0];
  //     }

  //     // Last resort: use body itself
  //     if (!rootElement) {
  //       rootElement = document.body;
  //     }

  //     return rootElement;
  //   }

  //   // Function to find the React Fiber node from a DOM element
  //   function findFiberNode(domElement) {
  //     // Look for React Fiber node property (naming convention changes between versions)
  //     const fiberPropKeys = Object.keys(domElement).filter(
  //       key =>
  //         key.startsWith('__reactFiber$') ||
  //         key.startsWith('__reactInternalInstance$') ||
  //         key.startsWith('__reactContainer$') ||
  //         key.startsWith('_reactInternal'),
  //     );

  //     // Return the Fiber node if found
  //     if (fiberPropKeys.length > 0) {
  //       return domElement[fiberPropKeys[0]];
  //     }

  //     // Try different approach for React 18+ with createRoot
  //     const containerPropKeys = Object.keys(domElement).filter(key =>
  //       key.startsWith('__reactContainer$'),
  //     );

  //     if (containerPropKeys.length > 0) {
  //       const container = domElement[containerPropKeys[0]];
  //       // In React 18+, the container holds the hostRoot's Fiber
  //       return container.current || container;
  //     }

  //     return null;
  //   }

  //   // Get component name from fiber node
  //   function getComponentName(fiber) {
  //     if (!fiber) {
  //       return 'Unknown';
  //     }

  //     const type = fiber.type;

  //     // For host components (DOM elements)
  //     if (typeof type === 'string') {
  //       return type;
  //     }

  //     // For class and function components
  //     if (type) {
  //       return type.displayName || type.name || 'Anonymous';
  //     }

  //     // For fragments, providers, etc.
  //     if (fiber.tag) {
  //       const tagMap = {
  //         0: 'FunctionComponent',
  //         1: 'ClassComponent',
  //         2: 'IndeterminateComponent',
  //         3: 'HostRoot',
  //         4: 'HostPortal',
  //         5: 'HostComponent',
  //         6: 'HostText',
  //         7: 'Fragment',
  //         8: 'Mode',
  //         9: 'ContextConsumer',
  //         10: 'ContextProvider',
  //         11: 'ForwardRef',
  //         12: 'Profiler',
  //         13: 'SuspenseComponent',
  //         14: 'MemoComponent',
  //         15: 'SimpleMemoComponent',
  //         16: 'LazyComponent',
  //         // Add more tag types as needed
  //       };

  //       return tagMap[fiber.tag] || `UnknownTag(${fiber.tag})`;
  //     }

  //     return 'Unknown';
  //   }

  //   // Extract props from a fiber node
  //   function extractProps(fiber) {
  //     const props = {};

  //     if (!fiber || !fiber.memoizedProps) {
  //       return props;
  //     }

  //     try {
  //       // Get serializable props only
  //       const memoizedProps = fiber.memoizedProps;

  //       if (typeof memoizedProps !== 'object' || memoizedProps === null) {
  //         return {};
  //       }

  //       Object.keys(memoizedProps).forEach(key => {
  //         try {
  //           const value = memoizedProps[key];
  //           const valueType = typeof value;

  //           // Include only simple values directly
  //           if (
  //             valueType === 'string' ||
  //             valueType === 'number' ||
  //             valueType === 'boolean'
  //           ) {
  //             props[key] = value;
  //           } else if (valueType === 'function') {
  //             props[key] = '[Function]';
  //           } else if (valueType === 'object') {
  //             if (value === null) {
  //               props[key] = null;
  //             } else if (Array.isArray(value)) {
  //               props[key] = '[Array]';
  //             } else {
  //               props[key] = '[Object]';
  //             }
  //           } else {
  //             props[key] = `[${valueType}]`;
  //           }
  //         } catch (e) {
  //           props[key] = '[Error extracting prop]';
  //         }
  //       });
  //     } catch (e) {
  //       return {error: 'Error extracting props'};
  //     }

  //     return props;
  //   }

  //   // Extract state from a fiber node
  //   function extractState(fiber) {
  //     if (!fiber) {
  //       return null;
  //     }

  //     try {
  //       // For class components
  //       if (fiber.stateNode && fiber.stateNode.state) {
  //         return {hasState: true, type: 'ClassState'};
  //       }

  //       // For hooks
  //       if (fiber.memoizedState) {
  //         return {hasState: true, type: 'HooksState'};
  //       }

  //       return null;
  //     } catch (e) {
  //       return {error: 'Error extracting state'};
  //     }
  //   }

  //   // Traverse the fiber tree and build a component tree
  //   function buildComponentTree(fiber, depth = 0) {
  //     if (!fiber) {
  //       return null;
  //     }

  //     // Create a node for this component
  //     const node = {
  //       name: getComponentName(fiber),
  //       depth,
  //       id: fiber._debugID || depth + '-' + Math.floor(Math.random() * 10000),
  //       children: [],
  //     };

  //     // Add props if available
  //     const props = extractProps(fiber);
  //     if (Object.keys(props).length > 0) {
  //       node.props = props;
  //     }

  //     // Add state info if available
  //     const stateInfo = extractState(fiber);
  //     if (stateInfo) {
  //       node.state = stateInfo;
  //     }

  //     // Handle child fibers
  //     let childFiber = fiber.child;
  //     while (childFiber) {
  //       const childNode = buildComponentTree(childFiber, depth + 1);
  //       if (childNode) {
  //         node.children.push(childNode);
  //       }
  //       childFiber = childFiber.sibling;
  //     }

  //     return node;
  //   }

  //   // Main function to extract the component tree
  //   function extractComponentTree() {
  //     try {
  //       // Find the root DOM element
  //       const rootElement = findReactRootElement();
  //       if (!rootElement) {
  //         return {error: 'Could not find React root element'};
  //       }

  //       // Get the fiber node from the root element
  //       let rootFiber = findFiberNode(rootElement);

  //       // If we found a container instead of a fiber, navigate to the current
  //       if (rootFiber && rootFiber.current) {
  //         rootFiber = rootFiber.current;
  //       }

  //       if (!rootFiber) {
  //         return {error: 'Could not find React Fiber on root element'};
  //       }

  //       // In some cases, we need to navigate up the fiber tree to find the actual component root
  //       // Try to find the HostRoot fiber, which is the top of the React tree
  //       let hostRootFiber = rootFiber;
  //       while (hostRootFiber.return) {
  //         hostRootFiber = hostRootFiber.return;
  //       }

  //       // Build the component tree starting from the component under the host root
  //       if (hostRootFiber.child) {
  //         return buildComponentTree(hostRootFiber.child);
  //       }

  //       // Fallback to using the original fiber we found
  //       return buildComponentTree(rootFiber);
  //     } catch (error) {
  //       return {
  //         error: 'Error extracting component tree: ' + error.message,
  //         stack: error.stack,
  //       };
  //     }
  //   }

  //   return extractComponentTree();
  // });

  // return JSON.stringify(componentTree, null, 2);
}

function buildHtml(transpiled: string) {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>React Performance Test</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <style>
      body { margin: 0; }
      #root { padding: 20px; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
      try {
        ${transpiled}

        window.App = App;

        const AppComponent = window.App || (() => React.createElement('div', null, 'No App component exported'));

        const root = ReactDOM.createRoot(document.getElementById('root'), {
          onUncaughtError: (error, errorInfo) => {
            window.__RESULT__.error = error;
          }
        });

        root.render(
          React.createElement(AppComponent)
        );
      } catch (error) {
        console.error('Error rendering component:', error);
        window.__RESULT__.error = error;
      }
    </script>
    <script>
      window.onerror = function(message, url, lineNumber) {
        const formattedMessage = message + '@' + lineNumber;
        if (window.__RESULT__.error && window.__RESULT__.error.message != null) {
          window.__RESULT__.error = window.__RESULT__.error + '\n\n' + formattedMessage;
        } else {
          window.__RESULT__.error = message + formattedMessage;
        }
      };
    </script>
  </body>
  </html>
  `;

  return html;
}
