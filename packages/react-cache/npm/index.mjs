import * as dev from './esm/react-cache.development.mjs';
import * as prod from './esm/react-cache.production.min.mjs';

const isProduction = process.env.NODE_ENV === 'production';
function select(key) {
  return isProduction ? prod[key] : dev[key]
}

export const unstable_createResource = select('unstable_createResource');
export const unstable_setGlobalCacheLimit = select('unstable_setGlobalCacheLimit');

