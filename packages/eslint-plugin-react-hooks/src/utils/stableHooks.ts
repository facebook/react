/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Scope} from 'eslint';
import type {
  Expression,
  PrivateIdentifier,
  Property,
  Super,
  VariableDeclarator,
} from 'estree';

/**
 * Checks if a hook's return value is configured as stable
 * @param hookName The name of the hook
 * @param stableValueHooks Map of hook names to their stable properties/indexes
 * @returns true if the hook is configured as stable, false otherwise
 */
export function isStableValueHook(
  hookName: string,
  stableValueHooks: Map<string, null | Array<number> | Array<string>>,
): boolean {
  return stableValueHooks.has(hookName);
}

/**
 * Checks if a specific property or index from a hook's return value is configured as stable
 * @param hookName The name of the hook
 * @param propertyOrIndex The property name or array index
 * @param stableValueHooks Map of hook names to their stable properties/indexes
 * @returns true if the property/index is configured as stable, false otherwise
 */
export function isStablePropertyOrIndex(
  hookName: string,
  propertyOrIndex: string | number,
  stableValueHooks: Map<string, null | Array<number> | Array<string>>,
): boolean {
  const config = stableValueHooks.get(hookName);

  // If the entire hook return value is stable
  if (config === null) {
    return true;
  }

  // If specific properties/indexes are stable
  if (Array.isArray(config)) {
    return config.some(item => item === propertyOrIndex);
  }

  return false;
}

/**
 * Checks if a variable is a primitive constant
 * @param resolved The resolved variable
 * @param componentScope The component scope
 * @returns true if the variable is a primitive constant, false otherwise
 */
export function isPrimitiveConstant(
  resolved: Scope.Variable,
  componentScope?: Scope.Scope | null,
): boolean {
  if (!Array.isArray(resolved.defs)) {
    return false;
  }

  const def = resolved.defs[0];
  if (def == null) {
    return false;
  }

  // Look for `let stuff = ...`
  const defNode: VariableDeclarator = def.node;
  if (defNode.type !== 'VariableDeclarator') {
    return false;
  }

  let init = defNode.init;
  if (init == null) {
    return false;
  }

  while (init.type === 'TSAsExpression' || init.type === 'AsExpression') {
    init = init.expression;
  }

  // Detect primitive constants
  // const foo = 42
  const declaration = defNode.parent;
  if (declaration == null && componentScope != null) {
    // This might happen if variable is declared after the callback.
    // In that case ESLint won't set up .parent refs.
    // We can't set them up manually here, so we'll just return false.
    return false;
  }

  if (
    declaration != null &&
    'kind' in declaration &&
    declaration.kind === 'const' &&
    init.type === 'Literal' &&
    (typeof init.value === 'string' ||
      typeof init.value === 'number' ||
      init.value === null)
  ) {
    // Definitely stable
    return true;
  }

  return false;
}

/**
 * Checks if a variable is a stable value from a built-in React hook
 * @param resolved The resolved variable
 * @param setStateCallSites WeakMap to track setState call sites
 * @param stateVariables WeakSet to track state variables
 * @param useEffectEventVariables WeakSet to track useEffectEvent variables
 * @param componentScope The component scope
 * @returns true if the variable is a stable value from a built-in hook, false otherwise
 */
export function isStableBuiltInHookValue(
  resolved: Scope.Variable,
  setStateCallSites?: WeakMap<Expression | Super, any>,
  stateVariables?: WeakSet<any>,
  useEffectEventVariables?: WeakSet<Expression>,
  componentScope?: Scope.Scope | null,
): boolean {
  // Check if it's a primitive constant first
  if (isPrimitiveConstant(resolved, componentScope)) {
    return true;
  }

  if (!Array.isArray(resolved.defs)) {
    return false;
  }

  const def = resolved.defs[0];
  if (def == null) {
    return false;
  }

  // Look for `let stuff = ...`
  const defNode: VariableDeclarator = def.node;
  if (defNode.type !== 'VariableDeclarator') {
    return false;
  }

  let init = defNode.init;
  if (init == null) {
    return false;
  }

  while (init.type === 'TSAsExpression' || init.type === 'AsExpression') {
    init = init.expression;
  }

  // Detect known Hook calls
  // const [_, setState] = useState()
  if (init.type !== 'CallExpression') {
    return false;
  }

  let callee: Expression | PrivateIdentifier | Super = init.callee;
  // Step into `= React.something` initializer.
  if (
    callee.type === 'MemberExpression' &&
    'name' in callee.object &&
    callee.object.name === 'React' &&
    callee.property != null &&
    !callee.computed
  ) {
    callee = callee.property;
  }

  if (callee.type !== 'Identifier') {
    return false;
  }

  const definitionNode: VariableDeclarator = def.node;
  const id = definitionNode.id;
  const hookName = callee.name;

  // Handle built-in React hooks
  if (hookName === 'useRef' && id.type === 'Identifier') {
    // useRef() return value is stable.
    return true;
  } else if (
    isUseEffectEventIdentifier(callee) &&
    id.type === 'Identifier' &&
    useEffectEventVariables
  ) {
    if (resolved.references) {
      resolved.references.forEach(ref => {
        // @ts-expect-error These types are not compatible (Reference and Identifier)
        if (ref !== id) {
          useEffectEventVariables.add(ref.identifier);
        }
      });
    }
    // useEffectEvent() return value is always unstable.
    return true;
  } else if (
    (hookName === 'useState' ||
      hookName === 'useReducer' ||
      hookName === 'useActionState') &&
    id.type === 'ArrayPattern' &&
    id.elements.length === 2 &&
    Array.isArray(resolved.identifiers)
  ) {
    // Is second tuple value the same reference we're checking?
    if (id.elements[1] === resolved.identifiers[0]) {
      if (hookName === 'useState' && setStateCallSites) {
        const references = resolved.references;
        let writeCount = 0;
        let shouldReturn = false;
        references.forEach(reference => {
          if (shouldReturn) return;

          if (reference.isWrite()) {
            writeCount++;
          }
          if (writeCount > 1) {
            shouldReturn = true;
            return;
          }
          setStateCallSites.set(reference.identifier, id.elements[0]);
        });

        if (shouldReturn) {
          return false;
        }
      }
      // Setter is stable.
      return true;
    } else if (id.elements[0] === resolved.identifiers[0] && stateVariables) {
      if (hookName === 'useState') {
        const references = resolved.references;
        if (references) {
          references.forEach(reference => {
            stateVariables.add(reference.identifier);
          });
        }
      }
      // State variable itself is dynamic.
      return false;
    }
  } else if (
    hookName === 'useTransition' &&
    id.type === 'ArrayPattern' &&
    id.elements.length === 2 &&
    Array.isArray(resolved.identifiers) &&
    id.elements[1] === resolved.identifiers[0]
  ) {
    // Only consider second value in initializing tuple stable.
    // Is second tuple value the same reference we're checking?
    // Setter is stable.
    return true;
  }

  return false;
}

/**
 * Checks if a variable is a stable value based on its definition
 * 
 * Some are known to be stable based on Hook calls.
 * const [state, setState] = useState() / React.useState()
 *               ^^^ true for this reference
 * const [state, dispatch] = useReducer() / React.useReducer()
 *               ^^^ true for this reference
 * const [state, dispatch] = useActionState() / React.useActionState()
 *               ^^^ true for this reference
 * const ref = useRef()
 *       ^^^ true for this reference
 * const onStuff = useEffectEvent(() => {})
         ^^^ true for this reference
 * Users can also provide a configuration to mark specific hooks and destructured properties/indexes as stable.
 * False for everything else.
 * 
 * @param resolved The resolved variable
 * @param stableValueHooks Map of hook names to their stable properties/indexes
 * @param setStateCallSites WeakMap to track setState call sites
 * @param stateVariables WeakSet to track state variables
 * @param useEffectEventVariables WeakSet to track useEffectEvent variables
 * @returns true if the variable is a stable value, false otherwise
 */
export function isStableHookValue(
  resolved: Scope.Variable,
  stableValueHooks: Map<string, null | Array<number> | Array<string>>,
  setStateCallSites?: WeakMap<Expression | Super, any>,
  stateVariables?: WeakSet<any>,
  useEffectEventVariables?: WeakSet<Expression>,
): boolean {
  // First check if it's a stable built-in hook value
  if (
    isStableBuiltInHookValue(
      resolved,
      setStateCallSites,
      stateVariables,
      useEffectEventVariables,
    )
  ) {
    return true;
  }

  if (!Array.isArray(resolved.defs)) {
    return false;
  }

  const def = resolved.defs[0];
  if (def == null) {
    return false;
  }

  // Look for `let stuff = ...`
  const defNode: VariableDeclarator = def.node;
  if (defNode.type !== 'VariableDeclarator') {
    return false;
  }

  let init = defNode.init;
  if (init == null) {
    return false;
  }

  while (init.type === 'TSAsExpression' || init.type === 'AsExpression') {
    init = init.expression;
  }

  // Detect known Hook calls
  // const [_, setState] = useState()
  if (init.type !== 'CallExpression') {
    return false;
  }

  let callee: Expression | PrivateIdentifier | Super = init.callee;
  // Step into `= React.something` initializer.
  if (
    callee.type === 'MemberExpression' &&
    'name' in callee.object &&
    callee.object.name === 'React' &&
    callee.property != null &&
    !callee.computed
  ) {
    callee = callee.property;
  }

  if (callee.type !== 'Identifier') {
    return false;
  }

  const definitionNode: VariableDeclarator = def.node;
  const id = definitionNode.id;

  if (callee.type === 'Identifier') {
    const hookName = callee.name;
    if (stableValueHooks.has(hookName)) {
      const config = stableValueHooks.get(hookName);
      if (config == null) {
        // No properties or indexes were provided, so the whole value is stable
        return id.type === 'Identifier';
      } else {
        /* An array of properties or indexes was provided.
         * We need to check if this variable is a destructured property or index
         * from the hook's return value.
         */
        if (id.type === 'ArrayPattern') {
          // Find the index for the identifier we're checking
          const identifierIndex = id.elements.findIndex(
            el => el === resolved.identifiers[0],
          );

          if (identifierIndex !== -1) {
            // Check if this index is in the configured list of stable indexes
            return config.some(idx => idx === identifierIndex);
          }
        } else if (id.type === 'ObjectPattern') {
          // Find the destructured property for the identifier we're checking
          return id.properties.some(property => {
            if (
              property.type === 'Property' &&
              property.value.type === 'Identifier' &&
              property.value === resolved.identifiers[0] &&
              property.key.type === 'Identifier' &&
              'name' in property.key
            ) {
              // Check if this property name is in the configured list of stable properties
              return config.some(prop => {
                if (typeof prop === 'string' && 'name' in property.key) {
                  return prop === property.key.name;
                }
                return false;
              });
            }
            return false;
          });
        }
        return false;
      }
    }
  }

  // By default assume it's not stable
  return false;
}

/**
 * Checks if a node is a useEffectEvent identifier
 * @param node The node to check
 * @returns true if the node is a useEffectEvent identifier, false otherwise
 */
export function isUseEffectEventIdentifier(
  node: Expression | PrivateIdentifier | Super,
): boolean {
  if (typeof __EXPERIMENTAL__ !== 'undefined' && __EXPERIMENTAL__) {
    return (
      node.type === 'Identifier' &&
      'name' in node &&
      node.name === 'useEffectEvent'
    );
  }
  return false;
}

/**
 * Extracts the hook name from a call expression
 * @param callee The callee node
 * @returns The hook name
 */
export function getHookName(
  callee: Expression | PrivateIdentifier | Super,
): string | null {
  // Step into `React.something` initializer.
  if (
    callee.type === 'MemberExpression' &&
    'name' in callee.object &&
    callee.object.name === 'React' &&
    callee.property != null &&
    !callee.computed
  ) {
    callee = callee.property;
  }

  // Only Identifier nodes have a name property we can access
  if (callee.type === 'Identifier') {
    return callee.name;
  }

  return null;
}

/**
 * Checks if a return statement matches the configuration for a stable value hook
 * @param returnNode The return statement node
 * @param hookName The name of the hook
 * @param stableValueHooks Map of hook names to their stable properties/indexes
 * @returns true if the return statement matches the configuration, false otherwise
 */
export function validateStableValueHookReturn(
  returnNode: Expression,
  hookName: string,
  stableValueHooks: Map<string, null | Array<number> | Array<string>>,
): boolean {
  const config = stableValueHooks.get(hookName);

  // If the entire hook return value is stable, any return value is valid
  if (config === null) {
    return true;
  }

  // For array or object patterns, we need to check if the specified properties/indexes are stable
  if (returnNode.type === 'ArrayExpression') {
    // Check if all configured indexes exist in the array
    const elements = returnNode.elements;
    if (Array.isArray(config)) {
      return config.every(index => {
        if (typeof index === 'number') {
          return index < elements.length;
        }
        return true;
      });
    }
    return true;
  } else if (returnNode.type === 'ObjectExpression') {
    // Check if all configured properties exist in the object
    const properties = returnNode.properties;
    const propertyNames = properties
      .filter(
        (prop): prop is Property =>
          prop.type === 'Property' && prop.key.type === 'Identifier',
      )
      .map(prop => (prop.key.type === 'Identifier' ? prop.key.name : null))
      .filter(Boolean);

    if (Array.isArray(config)) {
      return config.every(prop => {
        if (typeof prop === 'string') {
          return propertyNames.includes(prop);
        }
        return true;
      });
    }
    return true;
  }

  // For other return types, we can't validate
  return false;
}
