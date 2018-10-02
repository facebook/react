import {createCache} from 'react-cache';

export let cache;
function initCache() {
  cache = createCache(initCache);
}
initCache();
