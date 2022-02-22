import type {Fiber} from './ReactInternalTypes';
import type {
  ReactProviderType,
  ServerContextValuesArray,
  ReactServerContext,
} from 'shared/ReactTypes';

import {
  REACT_PROVIDER_TYPE,
  REACT_SERVER_CONTEXT_TYPE,
} from 'shared/ReactSymbols';

export function readServerContextsForRefetch(
  fiber: Fiber,
): ServerContextValuesArray {
  return getContexts(fiber, false);
}

export function readServerContextsForSSR(
  fiber: Fiber,
): ServerContextValuesArray {
  return getContexts(fiber, true);
}

function getContexts(
  fiber: Fiber,
  includeOverrides?: boolean,
): ServerContextValuesArray {
  let next = fiber.return;
  const added = new Set();
  const contexts: ServerContextValuesArray = [];
  while (next) {
    if (next.type && next.type.$$typeof === REACT_PROVIDER_TYPE) {
      const provider = (next.type: ReactProviderType<any>);
      const context = provider._context;
      if (context.$$typeof === REACT_SERVER_CONTEXT_TYPE) {
        if (
          includeOverrides ||
          (context: ReactServerContext)._ServerProvider === provider
        ) {
          if (!added.has(context.displayName)) {
            added.add(context.displayName);
            contexts.push([context.displayName, next.memoizedProps.value]);
          }
        }
      }
    }
    next = next.return;
  }
  return contexts;
}
