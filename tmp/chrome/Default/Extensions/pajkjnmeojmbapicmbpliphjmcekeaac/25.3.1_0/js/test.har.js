(() => {
  "use strict";
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
  const isWebPage = once((() => [ "about:", "http:", "https:" ].includes(location.protocol))), isExtensionContext = once((() => "string" == typeof globalThis.chrome?.runtime?.id)), isSandboxedPage = once((() => location.protocol.endsWith("-extension:") && !isExtensionContext())), isContentScript = once((() => isExtensionContext() && isWebPage())), isBackgroundPage = once((() => {
    const manifest = getManifest();
    return !!manifest && (!!isCurrentPathname(manifest.background_page ?? manifest.background?.page) || Boolean(manifest.background?.scripts && isCurrentPathname("/_generated_background_page.html")));
  })), isBackgroundWorker = once((() => isCurrentPathname(getManifest()?.background?.service_worker))), isOptionsPage = (once((() => isBackgroundPage() && 2 === getManifest()?.manifest_version && !1 !== getManifest()?.background?.persistent)), 
  once((() => isCurrentPathname(getManifest()?.options_ui?.page ?? getManifest()?.options_page)))), isSidePanel = once((() => isCurrentPathname(getManifest()?.side_panel?.default_path))), isActionPopup = once((() => globalThis.outerHeight - globalThis.innerHeight == 14 || isCurrentPathname(getManifest()?.action?.default_popup ?? getManifest()?.browser_action?.default_popup))), isDevToolsPage = once((() => isExtensionContext() && Boolean(chrome.devtools) && isCurrentPathname(getManifest()?.devtools_page))), isOffscreenDocument = once((() => isExtensionContext() && "document" in globalThis && void 0 === globalThis.chrome?.extension)), contextChecks = {
    contentScript: isContentScript,
    background: () => isBackgroundPage() || isBackgroundWorker(),
    options: isOptionsPage,
    sidePanel: isSidePanel,
    actionPopup: isActionPopup,
    devTools: () => Boolean(globalThis.chrome?.devtools),
    devToolsPage: isDevToolsPage,
    offscreenDocument: isOffscreenDocument,
    extension: isExtensionContext,
    sandbox: isSandboxedPage,
    web: isWebPage
  };
  Object.keys(contextChecks);
  const globals = "function" != typeof importScripts || function() {
    for (const [name, test] of Object.entries(contextChecks)) if (test()) return name;
    return "unknown";
  }().includes("background") ? window : self;
  function replayEntry(entry) {
    return new Promise((resolve => {
      if ("fetch" === entry._resourceType) {
        const {request} = entry;
        return void globals.fetch(request.url, {
          method: request.method,
          headers: new Headers(request.headers.map((header => [ header.name, header.value ]))),
          body: request.postData?.text ?? ""
        }).then((response => {
          resolve({
            headers: {},
            response,
            entry
          });
        })).catch((err => {
          console.error(err), resolve({
            headers: {},
            response: null,
            entry
          });
        }));
      }
      const xhr = new XMLHttpRequest;
      xhr.onreadystatechange = function() {
        if (4 !== xhr.readyState) return;
        const headers = xhr.getAllResponseHeaders().split("\r\n").reduce(((acc, header) => {
          const [key, value] = header.split(": ");
          return acc[key] = value, acc;
        }), {});
        resolve({
          headers,
          response: xhr.response,
          entry
        });
      }, xhr.open(entry.request.method, entry.request.url, !0), entry.request.headers.forEach((header => {
        header.name.startsWith(":") || xhr.setRequestHeader(header.name, header.value);
      })), xhr.send(entry.request.postData?.text ?? "");
    }));
  }
  self.replay = function(entries, regexp, {bodyPart, responsePart, method} = {}) {
    const entry = function(entries, regexp, {bodyPart, responsePart, method, occurrence = 1} = {}) {
      const index = entries.findIndex((entry => {
        if (!regexp.test(entry.request.url)) return !1;
        let isValid = !0;
        return bodyPart && (isValid = bodyPart instanceof RegExp ? bodyPart.test(entry.request.postData?.text ?? "") : !!entry.request.postData?.text?.includes(bodyPart ?? "")), 
        method && (isValid = isValid && entry.request.method === method), responsePart && (isValid = isValid && !!entry.response.content?.text?.includes(responsePart)), 
        isValid && occurrence - 1 > 0 && (isValid = !1, occurrence--), isValid;
      }));
      if (-1 === index) throw new Error(`Cannot find entry for ${regexp}`);
      return index;
    }(entries, regexp, {
      bodyPart,
      responsePart,
      method
    });
    return replayEntry(entries[entry]);
  }, self.replayEntry = replayEntry;
})();