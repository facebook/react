/**
 * Persist the scroll position of the left-hand nav
 * when loading a new page
 */

ready(function() {
  if (typeof Storage === "undefined") return;
  var fixedPanel = document.querySelector('.nav-docs');
  var links = document.querySelectorAll('.nav-docs a');
  var scrollTop = localStorage.getItem('navScrollPosition');
  var prevSecs = localStorage.getItem('navScrollPositionTime');
  var nowSecs = getTimeInSeconds();
  if (scrollTop && prevSecs && (nowSecs - prevSecs) < 10) {
    fixedPanel.scrollTop = scrollTop;
  }
  for (var i = 0; i < links.length; ++i) {
    links[i].addEventListener('click', function() {
      localStorage.setItem('navScrollPosition', fixedPanel.scrollTop);
      localStorage.setItem('navScrollPositionTime', getTimeInSeconds());
    });
  }
});

function getTimeInSeconds() {
  return Math.round(new Date().getTime() / 1000);
}

function ready(fn) {
 if (document.readyState != 'loading') {
  fn();
 } else {
  document.addEventListener('DOMContentLoaded', fn);
 }
}
