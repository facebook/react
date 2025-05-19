const TLS_PROXYPORT = 10053;
const PROXYPORT = 10054;
const VM_LABEL_PATTERNS = [
  '[a-z0-9-]+\\.sb', // <username>.sb
  '\\d+\\.od', // <odnumber>.od
  'dev(?:vm|big|gpu)\\d+\\.[a-z]+\\d?', // dev{vm,big,gpu}<number>.<region>
];
const DNS_LABEL = '(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)';
const MAYBE_SUBDOMAINS = `(?:${DNS_LABEL}\\.){0,2}`; // 0-2 subdomains, e.g. www, graph.svcscm
const TOP_LEVEL_DOMAIN = `(?:\\.${DNS_LABEL}){1,3}\\.?`; // 1-3 dns labels with optional trailing dot
const URL_PATTERN = `^https://${MAYBE_SUBDOMAINS}(?:${VM_LABEL_PATTERNS.join('|')})${TOP_LEVEL_DOMAIN}(:443|/|$)`;
// restrict domain to fbinfra.net for secure web apps
const PLAIN_HTTP_SECURE_APPS_URL_PATTERN = `^http://(${VM_LABEL_PATTERNS.join('|')})(.fbinfra.net:4410[0-9]|/|$)`;
const HTTPS_SECURE_APPS_URL_PATTERN = `^https://(${VM_LABEL_PATTERNS.join('|')})(.fbinfra.net:4420[0-9]|/|$)`;
// *.internalfb.com CNAMEs to intern-managed-client.c10r.facebook.com and *.workplace.com to
// star.workplace.com while on the internets, so the pattern of attempting to connect directly
// then falling back to VPNLess isn't viable for these domains.
const PUBLIC_DNS_RESOLVES_PATTERN = `\.(workplace|internalfb)\.com$`;
const PAC_FILE = `
function FindProxyForURL(url, host) {
  var urlPattern = ${JSON.stringify(URL_PATTERN)};
  var httpsSecureAppsUrlPattern = ${JSON.stringify(HTTPS_SECURE_APPS_URL_PATTERN)};
  var plainHttpSecureAppsUrlPattern = ${JSON.stringify(PLAIN_HTTP_SECURE_APPS_URL_PATTERN)};
  if (new RegExp(urlPattern).test(url)) {
    var hostPattern = ${JSON.stringify(PUBLIC_DNS_RESOLVES_PATTERN)};
    if (new RegExp(hostPattern).test(host)) {
      // If <sandbox>.internalfb.com isResolvable that means we're off corp because isResolvable is
      // IPv4-only (https://issues.chromium.org/issues/40320322) and sandboxes are v6-only.
      if (isResolvable(host)) {
        return 'PROXY localhost:${TLS_PROXYPORT}';
      }
      // We're likely on corp so go directly to sandbox.
      return "DIRECT";
    }
    // Attempt to go directly to sandbox and fallback to vpnless.
    return 'DIRECT; PROXY localhost:${TLS_PROXYPORT}';
  }
  if (new RegExp(httpsSecureAppsUrlPattern).test(url)) {
    return 'PROXY localhost:${TLS_PROXYPORT}';
  }
  if (new RegExp(plainHttpSecureAppsUrlPattern).test(url)) {
    return 'PROXY localhost:${PROXYPORT}';
  }
  if (host == 'www.edge.x2p.facebook.net') {
    return 'PROXY localhost:${PROXYPORT}';
  }
  return 'DIRECT';
}`;

// toggle proxyDisabled on icon click
chrome.action.onClicked.addListener(() => {
  chrome.storage.local.get(['proxyDisabled']).then(({ proxyDisabled }) => {
    if (proxyDisabled) {
      chrome.storage.local.remove('proxyDisabled');
    } else {
      chrome.storage.local.set({ proxyDisabled: true });
    }
  });
});

// converge proxy and UI state on proxyDisabled change
chrome.storage.onChanged.addListener(({ proxyDisabled }, _) => {
  if (proxyDisabled.newValue) {
    disableProxy();
    onProxyDisabled();
  } else {
    enableProxy();
    onProxyEnabled();
  }
});

// re-enable proxy on extension install/update
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason == 'install' || reason == 'update') {
    chrome.storage.local.set({ proxyDisabled: true }, () => {
      chrome.storage.local.remove('proxyDisabled');
    });
  }
});

// set icon based on proxyDisabled on extension startup
chrome.storage.local.get(['proxyDisabled']).then(({ proxyDisabled }) => {
  if (proxyDisabled) {
    onProxyDisabled();
  } else {
    onProxyEnabled();
  }
});

function onProxyEnabled() {
  chrome.webNavigation.onErrorOccurred.addListener(onWebNavigationError, {
    url: [{ urlMatches: URL_PATTERN }],
  });
  chrome.action.setBadgeText({ text: '' });
  chrome.action.setTitle({ title: 'VPNLess WWW proxy enabled' });
}

function onProxyDisabled() {
  chrome.webNavigation.onErrorOccurred.removeListener(onWebNavigationError);
  chrome.action.setBadgeText({ text: '❌' });
  chrome.action.setTitle({ title: 'VPNLess WWW proxy disabled' });
}

function enableProxy() {
  chrome.proxy.settings.set(
    {
      value: {
        mode: 'pac_script',
        pacScript: { data: PAC_FILE },
      },
    },
    () => {
      chrome.proxy.settings.get({ incognito: false }, (effectiveConfig) => {
        let actualPac = effectiveConfig?.value?.pacScript?.data;
        if (actualPac != PAC_FILE) {
          console.log(
            'Failed to set proxy config: ',
            actualPac,
            '!=',
            PAC_FILE,
          );
          chrome.storage.local.set({ proxyDisabled: true });
        }
      });
    },
  );
}

function disableProxy() {
  chrome.proxy.settings.clear({});
}

function onWebNavigationError(details) {
  if (
    isProxyError(details.error) &&
    details.documentLifecycle == 'active' &&
    details.frameId == 0
  ) {
    chrome.tabs.update(details.tabId, {
      url:
        chrome.runtime.getURL('/error.html') +
        '?url=' +
        encodeURIComponent(details.url),
    });
  }
}

function isProxyError(error) {
  return (
    error == 'net::ERR_TUNNEL_CONNECTION_FAILED' ||
    error == 'net::ERR_PROXY_CONNECTION_FAILED'
  );
}
