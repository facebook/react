/* globals chrome */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  // Make links work
  const links = document.getElementsByTagName('a');
  for (let i = 0; i < links.length; i++) {
    (function () {
      const ln = links[i];
      const location = ln.href;
      ln.onclick = function () {
        chrome.tabs.create({active: true, url: location});
        return false;
      };
    })();
  }

  // Work around https://bugs.chromium.org/p/chromium/issues/detail?id=428044
  document.body.style.opacity = 0;
  document.body.style.transition = 'opacity ease-out .4s';
  requestAnimationFrame(function () {
    document.body.style.opacity = 1;
  });

  // Only show React Conf message in popup before and during
  // the conference (May 15th-16th, 2024)
  const today = new Date();
  const may16 = new Date(2024, 4, 16); // May is month 5 in JavaScript
  if (today < may16) {
    document.getElementById('message').style.display = 'block';
  }

  // Remove the notifiaction badge when the popup is opened
  chrome.storage.local.get(['notifications'], function (data) {
    if (data.notifications === undefined) {
      chrome.action.setBadgeText({text: ''});
      chrome.storage.local.set({notifications: false});
    }
  });
});
