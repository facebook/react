// Do not delete or move this file.
// Many fiddles reference it so we have to keep it here.
(function() {
  var tag = document.querySelector(
    'script[type="application/javascript;version=1.7"]'
  );
  if (!tag || tag.textContent.indexOf('window.onload=function(){') !== -1) {
    alert('Bad JSFiddle configuration, please fork the original React JSFiddle');
  }
  tag.setAttribute('type', 'text/babel');
  tag.textContent = tag.textContent.replace(/^\/\/<!\[CDATA\[/, '');
})();
