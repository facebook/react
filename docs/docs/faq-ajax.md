---
id: faq-ajax
title: AJAX and APIs
permalink: docs/faq-ajax.html
layout: docs
category: FAQ
---

### How can I make an AJAX call?

You can use an AJAX library you like with React. Some popular ones are [Axios](https://github.com/axios/axios), [jQuery AJAX](https://api.jquery.com/jQuery.ajax/), and the browser built-in [window.fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).

### Where in the component lifecycle should I make an AJAX call?

You should populate data with AJAX calls in the [`componentDidMount`](https://reactjs.org/docs/react-component.html#mounting) lifecycle method. This is so you can use `setState` to update your component when the data is retrieved.
