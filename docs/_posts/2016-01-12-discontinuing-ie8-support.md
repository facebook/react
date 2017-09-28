---
title: "Discontinuing IE 8 Support in React DOM"
author: [sophiebits]
---

Since its 2013 release, React has supported all popular browsers, including Internet Explorer 8 and above. We handle normalizing many quirks present in old browser versions, including event system differences, so that your app code doesn't have to worry about most browser bugs.

Today, Microsoft [discontinued support for older versions of IE](https://www.microsoft.com/en-us/WindowsForBusiness/End-of-IE-support). Starting with React v15, we're discontinuing React DOM's support for IE 8. We've heard that most React DOM apps already don't support old versions of Internet Explorer, so this shouldn't affect many people. This change will help us develop faster and make React DOM even better. (We won't actively remove IE 8–related code quite yet, but we will deprioritize new bugs that are reported. If you need to support IE 8 we recommend you stay on React v0.14.)

React DOM will continue to support IE 9 and above for the foreseeable future.
