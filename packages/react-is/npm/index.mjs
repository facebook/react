import * as dev from './esm/react-is.development.mjs';
import * as prod from './esm/react-is.production.min.mjs';

const isProduction = process.env.NODE_ENV === 'production';
function select(key) {
  return isProduction ? prod[key] : dev[key]
}

// AsyncMode should be deprecated
export const isAsyncMode = select('isAsyncMode');
export const isConcurrentMode = select('isConcurrentMode');
export const isContextConsumer = select('isContextConsumer');
export const isContextProvider = select('isContextProvider');
export const isElement = select('isElement');
export const isForwardRef = select('isForwardRef');
export const isFragment = select('isFragment');
export const isLazy = select('isLazy');
export const isMemo = select('isMemo');
export const isPortal = select('isPortal');
export const isProfiler = select('isProfiler');
export const isStrictMode = select('isStrictMode');
export const isSuspense = select('isSuspense');
