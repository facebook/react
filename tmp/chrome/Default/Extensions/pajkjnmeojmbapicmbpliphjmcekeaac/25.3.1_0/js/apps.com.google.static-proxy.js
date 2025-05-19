(() => {
  "use strict";
  var __webpack_require__ = {};
  __webpack_require__.g = function() {
    if ("object" == typeof globalThis) return globalThis;
    try {
      return this || new Function("return this")();
    } catch (e) {
      if ("object" == typeof window) return window;
    }
  }();
  let cache = !0;
  function isCurrentPathname(path) {
    if (!path) return !1;
    try {
      const {pathname} = new URL(path, location.origin);
      return pathname === location.pathname;
    } catch {
      return !1;
    }
  }
  function getManifest(_version) {
    return globalThis.chrome?.runtime?.getManifest?.();
  }
  function once(function_) {
    let result;
    return () => (cache && void 0 !== result || (result = function_()), result);
  }
  const webext_detect_isWebPage = once((() => [ "about:", "http:", "https:" ].includes(location.protocol))), isExtensionContext = once((() => "string" == typeof globalThis.chrome?.runtime?.id)), isSandboxedPage = once((() => location.protocol.endsWith("-extension:") && !isExtensionContext())), webext_detect_isContentScript = once((() => isExtensionContext() && webext_detect_isWebPage())), isBackgroundPage = once((() => {
    const manifest = getManifest();
    return !!manifest && (!!isCurrentPathname(manifest.background_page ?? manifest.background?.page) || Boolean(manifest.background?.scripts && isCurrentPathname("/_generated_background_page.html")));
  })), isBackgroundWorker = once((() => isCurrentPathname(getManifest()?.background?.service_worker))), isOptionsPage = (once((() => isBackgroundPage() && 2 === getManifest()?.manifest_version && !1 !== getManifest()?.background?.persistent)), 
  once((() => isCurrentPathname(getManifest()?.options_ui?.page ?? getManifest()?.options_page)))), isSidePanel = once((() => isCurrentPathname(getManifest()?.side_panel?.default_path))), isActionPopup = once((() => globalThis.outerHeight - globalThis.innerHeight == 14 || isCurrentPathname(getManifest()?.action?.default_popup ?? getManifest()?.browser_action?.default_popup))), isDevToolsPage = once((() => isExtensionContext() && Boolean(chrome.devtools) && isCurrentPathname(getManifest()?.devtools_page))), isOffscreenDocument = once((() => isExtensionContext() && "document" in globalThis && void 0 === globalThis.chrome?.extension)), contextChecks = {
    contentScript: webext_detect_isContentScript,
    background: () => isBackgroundPage() || isBackgroundWorker(),
    options: isOptionsPage,
    sidePanel: isSidePanel,
    actionPopup: isActionPopup,
    devTools: () => Boolean(globalThis.chrome?.devtools),
    devToolsPage: isDevToolsPage,
    offscreenDocument: isOffscreenDocument,
    extension: isExtensionContext,
    sandbox: isSandboxedPage,
    web: webext_detect_isWebPage
  };
  Object.keys(contextChecks);
  const globals_isWebWorkerContext = () => "function" == typeof importScripts && !function() {
    for (const [name, test] of Object.entries(contextChecks)) if (test()) return name;
    return "unknown";
  }().includes("background");
  globals_isWebWorkerContext() ? self : window, new AbortController, globalThis?.document?.currentScript?.getAttribute("scriptid");
  let currentScriptAttributes;
  "undefined" != typeof window && window.document && (currentScriptAttributes = document?.currentScript?.attributes);
  globals_isWebWorkerContext() || document.currentScript;
  Math.floor(1e3 * Math.random());
  globals_isWebWorkerContext();
  __webpack_require__.g.browser || __webpack_require__.g.chrome;
  const manifest = chrome.runtime.getManifest();
  function getAbsoluteUrl(scriptUrl) {
    const bundleName = function(path) {
      const parts = /src\/(.*)\.ts$/.exec(path.replace(/\\/g, "/"));
      if (parts?.[1]) return parts?.[1].replace(/[//]([a-zA-Z])/g, ".$1");
      throw new Error("Invalid script path");
    }(scriptUrl);
    return chrome.runtime.getURL(`js/${bundleName}.js`);
  }
  function injectScript(scriptId = "cyberhaven_script", scriptUrl, extras = {}) {
    return new Promise((resolve => {
      const newScript = document.createElement("script");
      newScript.src = getAbsoluteUrl(scriptUrl), newScript.onload = () => {
        newScript.remove(), resolve();
      }, newScript.onerror = () => {
        newScript.remove(), resolve();
      }, newScript.id = scriptId, newScript.setAttribute("data-version", manifest.version), 
      newScript.setAttribute("scriptId", scriptId), newScript.setAttribute("scriptOriginalFileName", scriptUrl.split("/").pop());
      for (const [key, value] of Object.entries(extras)) newScript.dataset[key] = value.toString();
      document.documentElement.prepend(newScript);
    }));
  }
  injectScript("google_proxy", "src/apps/com.google/static-proxy.web.ts");
})();