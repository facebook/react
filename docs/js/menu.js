/**
 * Responsive menu.
 *
 * @author Martin Bean <martin@martinbean.co.uk>
 */

window.onload = function() {
  var navSite = document.getElementsByClassName('nav-site');
  var navToggle = document.getElementsByClassName('nav-toggle');

  function classToggle(element, tclass) {
    var classes = element.className;
    var pattern = new RegExp(tclass);
    var hasClass = pattern.test(classes);
    
    classes = hasClass ? classes.replace(pattern, '') : classes + ' ' + tclass;
    element.className = classes.trim();
  };
  
  navToggle[0].onclick = function() {
    classToggle(navSite[0], 'open');
  };
};