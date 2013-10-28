;(function(){

  var __filename = (function(){
    var scripts = document.getElementsByTagName('script');
    var a = document.createElement('a');
    a.href = scripts[scripts.length-1].src;
    return a.pathname;
  }());

  var __dirname = __filename.split('/').reverse().slice(1).reverse().join('/');

  document.head.appendChild(function(){
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = __dirname + '/../vendor/jasmine/jasmine.css';
    return link;
  }());

  var cacheBust = '?_=' + Date.now().toString(36);

  window.ReactWebWorker_URL = __dirname + '/../src/test/worker.js' + cacheBust;

  document.write('<script src="' + __dirname + '/../build/jasmine.js' + cacheBust + '"><\/script>');
  document.write('<script src="' + __dirname + '/../build/react.js' + cacheBust + '"><\/script>');
  document.write('<script src="' + __dirname + '/../build/react-test.js' + cacheBust + '"><\/script>');
  document.write('<script src="' + __dirname + '/../node_modules/jasmine-tapreporter/src/tapreporter.js' + cacheBust + '"><\/script>');
  document.write('<script src="' + __dirname + '/../test/the files to test.generated.js' + cacheBust + '"><\/script>');
  document.write('<script src="' + __dirname + '/../test/jasmine-execute.js' + cacheBust + '"><\/script>');

}());
