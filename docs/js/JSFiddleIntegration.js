var tag = document.querySelector('script[type="application/javascript;version=1.7"]');
tag.setAttribute('type', 'text/jsx');
tag.textContent = '/** @jsx React.DOM */' + tag.textContent.substr(12, tag.textContent.length - 17);
