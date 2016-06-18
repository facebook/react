// helper script that will read out the url parameters
// and store them in appropriate form fields on the page
(function() {
  var regex = /(\w+)=(\w+)/g;
  var search = decodeURIComponent(location.search);
  while (match = regex.exec(search)) {
    var name = match[1];
    var value = match[2];
    var els = document.querySelectorAll('input[name="'+name+'"]');
    var el;
    for (var i=0; i<els.length; i++) {
      el = els[i];
      if (el.type === 'radio' || el.type === 'checkbox') {
        el.checked = el.value === value;
      } else {
        el.value = value;
      }
    }
  }
})();