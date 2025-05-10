// @ts-ignore
import clientReferences from 'virtual:vite-rsc/client-references';
// @ts-ignore
import assetsManifest from 'virtual:vite-rsc/assets-manifest';

import * as ReactDOM from 'react-dom';

export {assetsManifest};

export async function loadModule(id: string) {
  if (import.meta.env.DEV) {
    const mod = await import(/* @vite-ignore */ id);
    const modCss = await import(
      /* @vite-ignore */ '/@id/__x00__virtual:vite-rsc/css/dev-ssr/' + id
    );
    for (const href of modCss.default) {
      ReactDOM.preinit(href, {as: 'style'});
    }
    return mod;
  } else {
    return clientReferences[id]();
  }
}

export function prepareDestination(id: string) {
  if (import.meta.env.DEV) {
    // no-op on dev
  } else {
    const deps = assetsManifest.clientReferenceDeps[id];
    for (const href of deps.js) {
      ReactDOM.preloadModule(href, {
        as: 'script',
        // vite doesn't allow configuring crossorigin at the moment, so we can hard code it as well.
        // https://github.com/vitejs/vite/issues/6648
        crossOrigin: '',
      });
    }
    for (const href of deps.css) {
      ReactDOM.preinit(href, {as: 'style'});
    }
  }
}

export const findSourceMapURL = undefined;
export const callServer = undefined;
