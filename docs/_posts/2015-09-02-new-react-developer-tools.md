---
title: "New React Developer Tools"
layout: post
author: [sophiebits]
---

A month ago, we [posted a beta](/blog/2015/08/03/new-react-devtools-beta.html) of the new React developer tools. Today, we're releasing the first stable version of the new devtools. We're calling it version 0.14, but it's a full rewrite so we think of it more like a 2.0 release.

![Video/screenshot of new devtools](../img/blog/devtools-full.gif)

It contains a handful of new features, including:

* Built entirely with React, making it easier to develop and extend
* Firefox support
* Selected component instance is available as `$r` from the console
* More detail is shown in props in the component tree
* Right-click any node and choose "Show Source" to jump to the `render` method in the Sources panel
* Right-click any props or state value to make it available as `$tmp` from the console
* Full React Native support

## Installation

Download the new devtools from the [Chrome Web Store](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) and on [Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/) for Firefox. If you're developing using React, we highly recommend installing these devtools.

If you already have the Chrome extension installed, it should autoupdate within the next week. You can also head to `chrome://extensions` and click "Update extensions now" if you'd like to get the new version today. If you installed the devtools beta, please remove it and switch back to the version from the store to make sure you always get the latest updates and bug fixes.

If you run into any issues, please post them on our [react-devtools GitHub repo](https://github.com/facebook/react-devtools).
