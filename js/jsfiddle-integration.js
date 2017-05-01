'use strict';

(function () {
  var tag = document.querySelector('script[type="application/javascript;version=1.7"]');
  if (!tag || tag.textContent.indexOf('window.onload=function(){') !== -1) {
    alert('Bad JSFiddle configuration, please fork the original React JSFiddle');
  }
  tag.setAttribute('type', 'text/jsx;harmony=true');
  tag.textContent = tag.textContent.replace(/^\/\/<!\[CDATA\[/, '');
})();