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

export async function Resources({nonce}: {nonce?: string}) {
  let {css, js} = assetsManifest.entry.deps as {css: string[]; js: string[]};

  if (import.meta.env.DEV) {
    // for build, css in rsc environment is included in client entry css
    const rscCss = await import('virtual:vite-rsc/rsc-css' as string);
    css = [...css, ...rscCss.default];
  }

  const cssLinks = css.map(href => (
    <link
      key={href}
      rel="stylesheet"
      href={href}
      precedence="high"
      nonce={nonce}
    />
  ));

  const jsLinks = js.map(href => (
    <link key={href} rel="modulepreload" href={href} nonce={nonce} />
  ));

  // https://vite.dev/guide/features.html#content-security-policy-csp
  const viteCsp = nonce && <meta property="csp-nonce" nonce={nonce} />;

  return (
    <>
      {cssLinks}
      {jsLinks}
      {viteCsp}
    </>
  );
}
