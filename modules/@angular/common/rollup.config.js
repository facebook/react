
export default {
  entry: '../../../dist/packages-dist/common/esm/index.js',
  dest: '../../../dist/packages-dist/common/esm/common.umd.js',
  format: 'umd',
  moduleName: 'ng.common',
  globals: {
    '@angular/core': 'ng.core',
    'rxjs/Subject': 'Rx',
    'rxjs/observable/PromiseObservable': 'Rx', // this is wrong, but this stuff has changed in rxjs b.6 so we need to fix it when we update.
    'rxjs/operator/toPromise': 'Rx.Observable.prototype',
    'rxjs/Observable': 'Rx'
  },
  plugins: [
//    nodeResolve({ jsnext: true, main: true }),
  ]
}
