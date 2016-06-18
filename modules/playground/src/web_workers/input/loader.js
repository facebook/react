importScripts("../../../vendor/es6-shim.js",
  "../../../vendor/zone.js",
  "../../../vendor/long-stack-trace-zone.js",
  "../../../vendor/system.src.js",
  "../../../vendor/Reflect.js");


System.config({
  baseURL: '/all',

  map: {'rxjs': '/all/playground/vendor/rxjs'},

  packages: {
    '@angular/core': {main: 'index.js', defaultExtension: 'js'},
    '@angular/compiler': {main: 'index.js', defaultExtension: 'js'},
    '@angular/common': {main: 'index.js', defaultExtension: 'js'},
    '@angular/platform-browser': {main: 'index.js', defaultExtension: 'js'},
    '@angular/platform-browser-dynamic': {main: 'index.js', defaultExtension: 'js'},
    '@angular/router': {main: 'index.js', defaultExtension: 'js'},
    'rxjs': {
      defaultExtension: 'js'
    }
  },

  defaultJSExtensions: true
});

System.import("playground/src/web_workers/input/background_index")
  .then(
    function(m) {
      try {
        m.main();
      } catch (e) {
        console.error(e);
      }
    },
    function(error) { console.error("error loading background", error); });
