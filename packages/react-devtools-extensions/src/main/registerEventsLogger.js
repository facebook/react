/* global chrome */

import {registerDevToolsEventLogger} from 'react-devtools-shared/src/registerDevToolsEventLogger';

function registerEventsLogger() {
  registerDevToolsEventLogger('extension', async () => {
    // TODO: after we upgrade to Firefox Manifest V3, chrome.tabs.query returns a Promise without the callback.
    return new Promise(resolve => {
      chrome.tabs.query({active: true}, tabs => {
        resolve({
          page_url: tabs[0]?.url,
        });
      });
    });
  });
}

export default registerEventsLogger;
