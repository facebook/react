NW.Dom.shortcuts = (function() {

  // match missing R/L context
  var nextID = 0,
  reLeftContext = /^[\x20\t\n\r\f]*[>+~]/,
  reRightContext = /[>+~][\x20\t\n\r\f]*$/;

  return function(selector, from, alt) {

    // add left context if missing
    if (reLeftContext.test(selector)) {
      if (from.nodeType == 9) {
        selector = '* ' + selector;
      } else if (/html|body/i.test(from.nodeName)) {
        selector = from.nodeName + ' ' + selector;
      } else if (alt) {
        selector = NW.Dom.shortcuts(selector, alt);
      } else if (from.nodeType == 1 && from.id) {
        selector = '#' + from.id + ' ' + selector;
      } else {
        ++nextID;
        selector = '#' + (from.id = 'NW' + nextID) + ' ' + selector;
        //NW.Dom.emit('Unable to resolve a context for the shortcut selector "' + selector + '"');
      }
    }

    // add right context if missing
    if (reRightContext.test(selector)) {
      selector += ' *';
    }

    return selector;
  };

})();
