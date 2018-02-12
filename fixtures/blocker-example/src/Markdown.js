import React from 'react';
import snarkdown from 'snarkdown';
import {useCache} from './cache';

async function fetchText(url) {
  const response = await fetch(url);
  return response.text();
}

function Markdown({url, cache}) {
  const md = cache.read(url, () => fetchText(url));
  const html = snarkdown(md);
  return <div dangerouslySetInnerHTML={{__html: html}} />;
}

export default useCache(Markdown);
