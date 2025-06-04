// @ts-ignore
import clientReferences from 'virtual:vite-rsc/client-references';

export const clientManifest = {};

export function loadModule(id: string) {
  id = id.slice('client:'.length);
  if (import.meta.env.DEV) {
    // @ts-ignore
    return __vite_rsc_raw_import__(/* @vite-ignore */ id);
  } else {
    return clientReferences[id]();
  }
}

export function findSourceMapURL(filename: string, environmentName: string) {
  if (!import.meta.env.DEV) return null;
  const url = new URL('/__vite_rsc_source_map', window.location.origin);
  url.searchParams.set('filename', filename);
  url.searchParams.set('environmentName', environmentName);
  return url.toString();
}

export const callServer = (...args: any[]) => callServer_(...args);

let callServer_: any;

export function setCallServer(fn: any) {
  callServer_ = fn;
}
