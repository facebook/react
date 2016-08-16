---
id: error-decoder
title: Error Decoder
permalink: docs/error-decoder.html
---

In the minified production build of React, we avoid sending down full error messages in order to reduce the number of bytes sent over the wire.

We highly recommend using the development build locally when debugging your app since it tracks additional debug info and provides helpful warnings about potential problems in your apps, but if you encounter an exception while using the production build, this page will reassemble the original text of the error.

<script src="/react/js/errorMap.js"></script>
<div class="error-decoder-container"></div>
<script src="/react/js/ErrorDecoderComponent.js"></script>
