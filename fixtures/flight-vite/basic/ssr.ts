// @ts-ignore
import clientReferences from 'virtual:vite-rsc/client-references';
// @ts-ignore
import assetsManifest from 'virtual:vite-rsc/assets-manifest';

export {assetsManifest};

export function loadModule(id: string) {
  if (import.meta.env.DEV) {
    return import(/* @vite-ignore */ id);
  } else {
    return clientReferences[id]();
  }
}

export function getModuleLoading() {
  // ssr modulepreload is build only since unbundled dev waterfall is a known trade off.
  if (import.meta.env.DEV) return null;

  const prepareDestinationManifest = Object.fromEntries(
    Object.entries(assetsManifest.clientReferenceDeps).map(
      ([id, deps]: any) => [id, deps.js],
    ),
  );
  return {
    prepareDestinationManifest,
    // vite doesn't allow configuring crossorigin at the moment,
    // so we can hard code it as well.
    // https://github.com/vitejs/vite/issues/6648
    crossOrigin: '',
  };
}

export const findSourceMapURL = undefined;
export const callServer = undefined;
