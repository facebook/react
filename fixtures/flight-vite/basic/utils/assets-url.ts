// https://github.com/vitejs/vite/blob/2a7473cfed96237711cda9f736465c84d442ddef/packages/vite/src/node/plugins/importAnalysisBuild.ts#L222-L230
export function assetsURL(dep: string) {
  return import.meta.env.BASE_URL + dep.slice(1);
}
