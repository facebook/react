import {useCache} from './cache';

export async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const Delay = useCache(({id, ms, cache, children}) => {
  if (id === undefined) {
    id = Math.random()
      .toString(36)
      .substring(7);
  }
  cache.read(`delay:${id}`, () => delay(ms));
  return children !== undefined ? children : null;
});

export default Delay;
