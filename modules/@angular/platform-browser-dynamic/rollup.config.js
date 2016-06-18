export default {
  entry: '../../../dist/packages-dist/platform-browser-dynamic/esm/index.js',
  dest: '../../../dist/packages-dist/platform-browser-dynamic/esm/platform-browser-dynamic.umd.js',
  format: 'umd',
  moduleName: 'ng.platformBrowserDynamic',
  globals: {
    '@angular/core': 'ng.core',
    '@angular/common': 'ng.common',
    '@angular/compiler': 'ng.compiler',
    '@angular/platform-browser': 'ng.platformBrowser',
    'rxjs/Subject': 'Rx',
    'rxjs/observable/PromiseObservable': 'Rx', // this is wrong, but this stuff has changed in rxjs b.6 so we need to fix it when we update.
    'rxjs/operator/toPromise': 'Rx.Observable.prototype',
    'rxjs/Observable': 'Rx'
  },
  plugins: [
//    nodeResolve({ jsnext: true, main: true }),
  ]
}