import React from 'react';
import {createNewCache} from './cache';

const moduleCache = createNewCache();

function loadComponent(importPromise) {
  const miss = () => importPromise;
  moduleCache.preload(importPromise, miss);
  function Component(props) {
    const result = moduleCache.read(importPromise, miss);
    const ComponentType = result.default;
    return <ComponentType {...props} />;
  }
  return Component;
}

export default loadComponent;
