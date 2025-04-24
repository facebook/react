// @ts-ignore
import serverReferences from 'virtual:vite-rsc/server-references';
// @ts-ignore
import assetsManifest from 'virtual:vite-rsc/assets-manifest';

export {assetsManifest};

export function loadModule(id: string) {
  if (import.meta.env.DEV) {
    return import(/* @vite-ignore */ id);
  } else {
    return serverReferences[id]();
  }
}

export async function importSsr<T>(): Promise<T> {
  const mod = await import('virtual:vite-rsc/import-ssr' as any);
  if (import.meta.env.DEV) {
    return mod.default();
  } else {
    return mod;
  }
}
