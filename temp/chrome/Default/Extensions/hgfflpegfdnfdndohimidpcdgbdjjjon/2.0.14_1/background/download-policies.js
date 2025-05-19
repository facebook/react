/*
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Download Policies
 *
 * @providesModule download_policies
 * @format
 */

'use strict';

const any = array => array.reduce((x, y) => x || y);
const all = array => array.reduce((x, y) => x && y);
const regexMatch = (regex, string) => regex.exec(string) != null;
const anyStringMatch = (sarray, str) => {
  return any(sarray.map(s => s.includes(str)));
};
const anyRegexMatch = (rarray, str) => {
  return any(rarray.map(r => regexMatch(r, str)));
};
const anyRegexMatchForList = (rarray, slist) => {
  return any(slist.map(s => anyRegexMatch(rarray, s)));
};
const anyStringMatchForList = (sarry, slist) => {
  return any(slist.map(s => anyStringMatch(sarry, s)));
};
const firstElems = x => x.map(r => r[0]);
const secondElems = x => x.map(r => r[1]);
const secondElemsNotEmpty = x => secondElems(x).filter(f => f != '');

var isWarningBeingDisplayed = false;

/*
 * Download Policies
 */
const noAdwareTopLevelDomains = {
  name: 'NoAdwareTopLevelDomains',
  desc: 'Download comes from a suspicious TLD.',
  owner: 'gmilani',
  oncall: 'cert',
  check: item => {
    let domainBlocklist = [
      /.*\.word\/.*/,
      /.*\.site\/.*/,
      /.*\.pw\/.*/,
      /.*\.win\/.*/,
      /.*\.icu\/.*/,
      /.*\.pro\/.*/,
      /.*\.tech\/.*/,
      /.*\.aero\/.*/,
      /.*\.space\/.*/,
    ];
    let blocklist =
      item.filename.includes('.dmg') ||
      item.filename.includes('.iso') ||
      item.filename.includes('.pkg') ||
      item.filename.includes('.zip') ||
      item.filename.includes('.rar');
    let isAdwareTld = anyRegexMatch(domainBlocklist, item.finalUrl);
    return isAdwareTld && blocklist;
  },
};

const noAdwareLandingPages = {
  name: 'NoAdwareLandingPages',
  desc:
    'Download comes from a URL that matches pattern of known Fake Flash Player Adware.',
  owner: 'gmilani',
  oncall: 'cert',
  check: item => {
    let urls = [item.url, item.finalUrl, item.referrer];
    let maliciousUrls = [
      /\/installer-download.*click-id.*/i,
      /(\/|\?)software=.*clickid.*/i,
      /\/source=.*&client=.*/i,
      /\/installer.*&affiliate.*/i,
      /https:\/\/s3.*amazonaws\.com\/.*click_id=.*source=.*/i,
      /https:\/\/s3.*amazonaws\.com\/.*(adobe[ _]?|flash[ _]?|player[ _]?)+.*\.(dmg|iso|pkg|zip|rar).*/i,
      /https:\/\/s3.*amazonaws\.com\/.*fn=.*sub=.*tkrch=.*client=.*/i,
    ];
    return anyRegexMatchForList(maliciousUrls, urls);
  },
};

const noKeygen = {
  name: 'NoKeygen',
  desc: 'Download has been identified as a KeyGen file.',
  owner: 'kosullivan',
  oncall: 'cert',
  check: item => {
    let filePath = item.filename.toLowerCase();
    let keygenPath = /keygen/i;
    return regexMatch(keygenPath, filePath);
  },
};

const noFakeFlashFilename = {
  name: 'NoFakeFlashFilename',
  desc:
    'Download file name claims to be Flash Player, but does not come from Adobe.',
  owner: 'gmilani',
  oncall: 'cert',
  check: item => {
    let filePath = item.filename.toLowerCase();
    let urls = [item.url, item.finalUrl, item.referrer];
    let allowlist =
      filePath.includes('mplayer') ||
      anyStringMatch(urls, '.adobe.com/') ||
      anyStringMatch(urls, '.macromedia.com/') ||
      anyStringMatch(urls, '.nowtv.com/') ||
      anyStringMatch(urls, '.facebook.com/') ||
      anyStringMatch(urls, '.internalfb.com/') ||
      anyStringMatch(urls, '.workplace.com/') ||
      anyStringMatch(urls, '.fburl.com/');
    let maliciousFiles = [
      /.*(adobe[ _]?|flash[ _]?)+.*\.(dmg|iso|pkg|zip|rar)/i,
    ];
    let isFakeFlash = anyRegexMatch(maliciousFiles, filePath);
    return isFakeFlash && !allowlist;
  },
};

const noSuspiciousFilename = {
  name: 'NoSuspiciousFilename',
  desc: 'Download file name matches that of known adware',
  owner: 'kosullivan',
  oncall: 'cert',
  check: item => {
    let filePath = item.filename.toLowerCase();
    let maliciousFiles = [
      /.*Your[_ ]File[_ ]Is[_ ]Ready[_ ]To[_ ]Download.*\.(dmg|iso|pkg|zip|rar|msi|exe)/i,
      /.*TV[_ ]SHOWS.*\.(dmg|iso|pkg|zip|rar)/i,
    ];
    let isSuspiciousFilename = anyRegexMatch(maliciousFiles, filePath);
    return isSuspiciousFilename;
  },
};

const noFilezilla = {
  name: 'NoFilezilla',
  desc: 'Filename includes Filezilla, which is banned at Facebook',
  owner: 'kosullivan',
  oncall: 'cert',
  check: item => {
    let filePath = item.filename.toLowerCase();
    let maliciousFiles = [/.*filezilla.*\.(dmg|iso|pkg|zip|rar|exe|msi)/i];
    let isSuspiciousFilename = anyRegexMatch(maliciousFiles, filePath);
    return isSuspiciousFilename;
  },
};

class NativeBridge {
  getFileHash(downloadItem, cb) {
    this.port = chrome.runtime.connectNative(
      'com.facebook.protego.download_helper',
    );
    this.port.onDisconnect.addListener(() => (this.port = null));
    this.port.onMessage.addListener(message => {
      this._disconnect();
      cb(message, downloadItem);
    });
    this.port.postMessage({
      filePath: downloadItem.filename,
      id: downloadItem.id,
    });
  }

  _disconnect() {
    this.port.disconnect();
    this.port = null;
  }
}

class DownloadInterceptor {
  constructor() {
    this.downloadItems = {};
    chrome.downloads.onCreated.addListener(this.downloadStarted.bind(this));
    chrome.downloads.onChanged.addListener(this.downloadChanged.bind(this));
  }

  downloadStarted(downloadItem) {
    this.downloadItems[downloadItem.id] = downloadItem;
  }

  async isMalicious(hash, origUrl) {
    const token = await getCSRF();
    const url_params = new URLSearchParams({
      file_sha256: hash,
      fb_dtsg: token,
      orig_url: origUrl,
    });
    const response = await fetch(
      'https://www.internalfb.com/intern/security/malware/hash_lookup',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: url_params,
      },
    );
    const data = await response.text();

    const offset_for_loop = 9;
    const parsed_threat_response = JSON.parse(data.slice(offset_for_loop));
    const threat_status = parsed_threat_response['threat_status'];
    return threat_status;
  }

  handleFileHash({digest, id}) {
    const url = this.downloadItems[id].url;
    (async digest => {
      const isBad = await this.isMalicious(digest, url);
      if (isBad && !isWarningBeingDisplayed) {
        sendLog(
          'PROTEGO_DOWNLOADS',
          {
            ...prepareDownloadItem('dl_complete', downloadItems[id]),
            digest: digest,
            is_malicious: isBad,
          },
          protegoVersion,
        );
        displayDownloadWarning(this.downloadItems[id]);
      }
      if (isWarningBeingDisplayed) {
        isWarningBeingDisplayed = false;
      }
      delete this.downloadItems[id];
    })(digest);
  }

  getCurrentFromDelta(delta) {
    const currents = {};
    for (var key of Object.keys(delta)) {
      if (key == 'id') {
        currents[key] = delta[key];
      } else {
        currents[key] = delta[key].current;
      }
    }
    return currents;
  }

  downloadChanged(downloadItemDelta) {
    this.downloadItems[downloadItemDelta.id] = {
      ...this.downloadItems[downloadItemDelta.id],
      ...this.getCurrentFromDelta(downloadItemDelta),
    };
    if (
      downloadItemDelta.state &&
      downloadItemDelta.state['current'] == 'complete'
    ) {
      const nb = new NativeBridge();
      this.start = new Date();
      nb.getFileHash(
        this.downloadItems[downloadItemDelta.id],
        this.handleFileHash.bind(this),
      );
    }
  }
}

// Note, there was code here that never actually would work since the
// beta features were disabled (plus it was missing a semi-colon so it
// would crash if used). More references in D20119423 since it looks
// like a soon-to-be-released feature?
//
// new DownloadInterceptor();

downloadPolicies = [
  noAdwareLandingPages,
  noKeygen,
  noFakeFlashFilename,
  noAdwareTopLevelDomains,
  noSuspiciousFilename,
  noFilezilla,
];

// definitions are in download_policies_helpers
chrome.downloads.onCreated.addListener(addNewDownloadItem);
chrome.downloads.onChanged.addListener(logDownloadItem);
