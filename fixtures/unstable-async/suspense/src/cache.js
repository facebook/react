import {createCache} from 'simple-cache-provider';

export let cache;
function initCache() {
  cache = createCache(initCache);
}
initCache();
