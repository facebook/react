import {generateComponentTree} from './reactDevTools';
import {Fiber} from './reactDevToolsTypes';

/**
 * Interface representing a node in the component tree
 */
export interface ComponentTreeNode {
  id: number;
  name: string;
  type: string | number;
  key: string | null;
  children: ComponentTreeNode[];
  props?: Record<string, any> | undefined;
  state?: Record<string, any> | undefined;
  fiber?: Fiber | undefined;
}

/**
 * Extracts the component tree from the React DevTools implementation
 * @param renderer The React renderer
 * @param fiber The root fiber to start from
 * @returns The component tree as a structured object
 */
export function extractComponentTree(
  renderer: any,
  fiber: Fiber,
): ComponentTreeNode | null {
  const result = generateComponentTree(renderer, fiber, false);

  const idToDevToolsInstanceMap = (result as any).idToDevToolsInstanceMap;
  const currentRoot = (result as any).currentRoot;

  if (!currentRoot || !idToDevToolsInstanceMap) {
    console.error(
      'Failed to extract component tree - internal structures not available',
    );
    return null;
  }

  return convertDevToolsInstanceToTreeNode(currentRoot);

  /**
   * Helper function to convert a DevTools instance to our tree node format
   */
  function convertDevToolsInstanceToTreeNode(instance: any): ComponentTreeNode {
    // Extract name based on instance kind
    let name = 'Unknown';
    let type: string | number = 'Unknown';
    let key: string | null = null;
    let props: Record<string, any> | undefined = undefined;
    let state: Record<string, any> | undefined = undefined;
    let fiberData: Fiber | undefined = undefined;

    if (instance.kind === 0) {
      // FIBER_INSTANCE
      const fiber = instance.data;
      fiberData = fiber;

      // @ts-ignore - Accessing private function
      const getDisplayNameForFiber = (result as any).getDisplayNameForFiber;
      if (typeof getDisplayNameForFiber === 'function') {
        name = getDisplayNameForFiber(fiber) || 'Unknown';
      } else {
        // Fallback to type name if available
        name =
          fiber.type?.displayName ||
          fiber.type?.name ||
          (typeof fiber.type === 'string' ? fiber.type : 'Unknown');
      }

      // Get element type
      // @ts-ignore - Accessing private function
      const getElementTypeForFiber = (result as any).getElementTypeForFiber;
      if (typeof getElementTypeForFiber === 'function') {
        type = getElementTypeForFiber(fiber);
      }

      // Get key
      key = fiber.key !== null ? String(fiber.key) : null;

      // Get props and state if available
      if (fiber.memoizedProps) {
        props = {...fiber.memoizedProps};
      }

      if (fiber.memoizedState) {
        // For hooks, this might be complex, so we'll just indicate it exists
        state =
          typeof fiber.memoizedState === 'object'
            ? {...fiber.memoizedState}
            : {value: fiber.memoizedState};
      }
    } else if (instance.kind === 1) {
      // VIRTUAL_INSTANCE
      name = instance.data.name || 'Virtual';
      type = 'Virtual';
      key = instance.data.key != null ? String(instance.data.key) : null;

      // Add environment if it exists
      if (instance.data.env) {
        props = {env: instance.data.env};
      }
    } else if (instance.kind === 2) {
      // FILTERED_FIBER_INSTANCE
      name = 'Filtered';
      type = 'Filtered';
    }

    // Create the node
    const node: ComponentTreeNode = {
      id: instance.id,
      name,
      type,
      key,
      children: [],
      props,
      state: state,
      fiber: fiberData,
    };

    // Add children recursively
    let child = instance.firstChild;
    while (child) {
      node.children.push(convertDevToolsInstanceToTreeNode(child));
      child = child.nextSibling;
    }

    return node;
  }
}

/**
 * Formats the component tree as a string
 * @param tree The component tree to format
 * @param options Options for formatting
 * @returns A formatted string representation of the component tree
 */
export function formatComponentTree(
  tree: ComponentTreeNode | null,
  options: {
    maxDepth?: number;
    showIds?: boolean;
    showProps?: boolean;
    showState?: boolean;
  } = {},
): string {
  if (!tree) {
    return 'No component tree available';
  }

  const {
    maxDepth = Infinity,
    showIds = true,
    showProps = false,
    showState = false,
  } = options;

  const lines: string[] = ['React Component Tree:'];

  function formatNode(node: ComponentTreeNode, depth: number = 0) {
    if (depth > maxDepth) return;

    const indent = '  '.repeat(depth);
    let output = `${indent}${node.name}`;

    if (node.key) {
      output += ` key="${node.key}"`;
    }

    if (showIds) {
      output += ` (id: ${node.id})`;
    }

    lines.push(output);

    // Format props if requested
    if (showProps && node.props) {
      const propsStr = JSON.stringify(node.props, null, 2)
        .split('\n')
        .map(line => `${indent}  ${line}`)
        .join('\n');
      lines.push(`${indent}  Props: ${propsStr}`);
    }

    // Format state if requested
    if (showState && node.state) {
      const stateStr = JSON.stringify(node.state, null, 2)
        .split('\n')
        .map(line => `${indent}  ${line}`)
        .join('\n');
      lines.push(`${indent}  State: ${stateStr}`);
    }

    // Format children recursively
    for (const child of node.children) {
      formatNode(child, depth + 1);
    }
  }

  formatNode(tree);
  return lines.join('\n');
}

/**
 * Prints the component tree to the console
 * @param tree The component tree to print
 * @param options Options for printing
 */
export function printExtractedComponentTree(
  tree: ComponentTreeNode | null,
  options: {
    maxDepth?: number;
    showIds?: boolean;
    showProps?: boolean;
    showState?: boolean;
  } = {},
) {
  const formattedTree = formatComponentTree(tree, options);
  console.log(formattedTree);
}

/**
 * Helper function to extract and format the component tree in one step
 * @param renderer The React renderer
 * @param fiber The root fiber
 * @param options Options for formatting
 * @returns An object containing the tree and its formatted string representation
 */
export function extractAndFormatComponentTree(
  renderer: any,
  fiber: Fiber,
  options: {
    maxDepth?: number;
    showIds?: boolean;
    showProps?: boolean;
    showState?: boolean;
  } = {},
) {
  const tree = extractComponentTree(renderer, fiber);
  const formattedTree = formatComponentTree(tree, options);
  return {
    tree,
    formattedTree,
  };
}

/**
 * Helper function to extract and print the component tree in one step
 * @param renderer The React renderer
 * @param fiber The root fiber
 * @param options Options for printing
 * @returns The extracted component tree
 */
export function extractAndPrintComponentTree(
  renderer: any,
  fiber: Fiber,
  options: {
    maxDepth?: number;
    showIds?: boolean;
    showProps?: boolean;
    showState?: boolean;
  } = {},
) {
  const {tree, formattedTree} = extractAndFormatComponentTree(
    renderer,
    fiber,
    options,
  );
  console.log(formattedTree);
  return tree;
}

/**
 * Helper function to extract the component tree from the React DevTools hook
 * @param options Options for formatting
 * @returns An object containing the tree and its formatted string representation, or null if extraction fails
 */
export default function extractComponentTreeFromDevTools(
  hook: any,
  renderers: Map<number, any>,
  fiberRoots: Map<number, any>,
) {
  if (!hook) {
    console.error(
      'React DevTools hook is not available. Make sure React DevTools extension is installed.',
    );
    return null;
  }

  console.log('test');
  console.log(renderers.size);

  if (renderers.size === 0) {
    console.error('No React renderers found.');
    return null;
  }

  for (const [rendererID, renderer] of renderers) {
    const fiberRoots: any = Array.from(hook.getFiberRoots(rendererID));
    if (fiberRoots.length === 0) {
      console.error('No fiber roots found.');
      return null;
    }

    const currentFiber = fiberRoots[0].current;

    const options: any = {
      maxDepth: 3,
      showIds: true,
      showProps: true,
      showState: true,
    };

    return extractAndFormatComponentTree(renderer, currentFiber, options);
  }

  return null;
}
