import React from 'react';
import {useCache} from './cache';

function loadImage(src) {
  const image = new Image();
  return new Promise(resolve => {
    image.onload = () => resolve();
    image.src = src;
  });
}

function Img({cache, src, ...props}) {
  cache.read(`img:${src}`, () => loadImage(src));
  return <img src={src} {...props} />;
}

export default useCache(Img);
