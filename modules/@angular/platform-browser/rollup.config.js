
export default {
  entry: '../../../dist/packages-dist/platform-browser/esm/index.js',
  dest: '../../../dist/packages-dist/platform-browser/esm/platform-browser.umd.js',
  format: 'umd',
  moduleName: 'ng.platformBrowser',
  globals: {
    '@angular/core': 'ng.core',
    '@angular/common': 'ng.common',
    'rxjs/Subject': 'Rx',
    'rxjs/observable/PromiseObservable': 'Rx', // this is wrong, but this stuff has changed in rxjs b.6 so we need to fix it when we update.
    'rxjs/operator/toPromise': 'Rx.Observable.prototype',
    'rxjs/Observable': 'Rx'
  },
  plugins: [
//    nodeResolve({ jsnext: true, main: true }),
  ]
}
