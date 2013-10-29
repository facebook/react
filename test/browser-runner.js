;(function(){
  console.log('# ' + location);

  var __filename = (function(){
    var scripts = document.getElementsByTagName('script');
    var a = document.createElement('a');
    a.href = scripts[scripts.length-1].src;
    return a.protocol + '//' + a.hostname + ':' + a.port + a.pathname.replace(/^\/?/,'/');
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

  var urls = [
    __dirname + '/../build/jasmine.js',
    __dirname + '/../build/react.js',
    __dirname + '/../build/react-test.js',
    __dirname + '/../node_modules/jasmine-tapreporter/src/tapreporter.js',
    __dirname + '/../test/the-files-to-test.generated.js',
    __dirname + '/../test/jasmine-execute.js',
  ];
  
  urls.forEach(function(url){
    document.write('<script src="' + url + cacheBust + '"><\/script>');
  })

}());
