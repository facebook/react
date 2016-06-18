# TL;DR;

* If you write ES5 use _one_ of the `UMD` bundles.
* If you experiment with Angular2 using online prototyping tools like [plnkr](http://plnkr.co/) or similar use `System.register` bundles with SystemJS loader.
* If you use build tools like Browserify or WebPack - bundle Angular2 as part of your build.
* For all the above cases you must use `angular2-polyfills.js` in a `script` tag to easily include polyfills and external dependencies.

# Modules, barrels and bundles

Angular2 source code is authored using the ES2015 standardized module format where one module corresponds to exactly one file. Multiple modules (files) can be logically grouped into so-called "barrels".
 A bundle is a file that contains all the code for one or more barrels.
  
Most bundles come in several flavors:
* regular and minified (got `.min` in their name);
* regular and "development" (have `.dev` in their name) - "development" bundles contain in-line source maps and don't have minified flavor (minification removes in-lined source maps). 
  
# Bundles, their content and usage scenarios
  
Angular 2 distributes several types of bundles targeted at specific usages:
  * users writing ES5 code without any transpilation steps
  * users experimenting with Angular 2 and TypeScript/ES2015 using online tools like plunker, jsbin or similar
  
Since each identified scenario has slightly different requirements and constraints there are specific bundles for each use-case.

## ES5 and ngUpgrade users

ES5 users and AngularJS 1.x users interested in the `ngUpgrade` path can take advantage of the bundles in the [UMD format](https://github.com/umdjs/umd).
 Those are coarse-grained bundles that combine many barrels in one final file.  

filename    | list of barrels   | dev/prod | minified? 
------------|-------------------|----------|-------------|--------------|-------------
`angular2-all.umd.js` | `angular2/core`, `angular2/common`, `angular2/compiler`, `angular2/platform/browser`, `angular2/platform/common_dom`, `angular2/http`, `angular2/router`, `angular2/instrumentation`, `angular2/upgrade`| prod | no
`angular2-all.umd.min.js` | `angular2/core`, `angular2/common`, `angular2/compiler`, `angular2/platform/browser`, `angular2/platform/common_dom`, `angular2/http`, `angular2/router`, `angular2/instrumentation`, `angular2/upgrade` | prod | yes
`angular2-all.umd.dev.js` | `angular2/core`, `angular2/common`, `angular2/compiler`, `angular2/platform/browser`, `angular2/platform/common_dom`, `angular2/http`, `angular2/router`, `angular2/instrumentation`, `angular2/upgrade` | dev | no
`angular2-all-testing.umd.dev.js` | `angular2/core`, `angular2/common`, `angular2/compiler`, `angular2/platform/browser`, `angular2/platform/common_dom`, `angular2/http`, `angular2/router`, `angular2/instrumentation`, `angular2/upgrade`, `angular2/testing`, `angular2/http/testing`, `angular2/router/testing`, `angular2/platform/testing/browser` | dev | no

**Warning**: bundles in the `UMD` format are _not_ "additive". A single application should use only one bundle from the above list.

## SystemJS loader users

[SystemJS loader](https://github.com/systemjs/systemjs) with on-the-fly (in a browser) transpilations support is very useful for quick experiments using tools like plunker, jsbin or similar.
For this scenario Angular 2 is distributed with bundles in the [System.register format](https://github.com/ModuleLoader/es6-module-loader/wiki/System.register-Explained):

filename    | list of barrels   | dev/prod | minified? 
------------|-------------------|----------|-------------|--------------|-------------
`angular2.js` | `angular2/core`, `angular2/common`, `angular2/compiler`, `angular2/platform/browser`, `angular2/platform/common_dom`, `angular2/instrumentation`| prod | no
`angular2.min.js` | `angular2/core`, `angular2/common`, `angular2/compiler`, `angular2/platform/browser`, `angular2/platform/common_dom`, `angular2/instrumentation`| prod | yes
`angular2.dev.js` | `angular2/core`, `angular2/common`, `angular2/compiler`, `angular2/platform/browser`, `angular2/platform/common_dom`, `angular2/instrumentation`| dev | no
`http.js` | `angular2/http` | prod | no
`http.min.js` | `angular2/http` | prod | yes
`http.dev.js` | `angular2/http` | dev | no
`router.js` | `angular2/router` | prod | no
`router.min.js` | `angular2/router` | prod | yes
`router.dev.js` | `angular2/router` | dev | no
`upgrade.js` | `angular2/upgrade` | prod | no
`upgrade.min.js` | `angular2/upgrade` | prod | yes
`upgrade.dev.js` | `angular2/upgrade` | dev | no
`testing.dev.js` | `angular2/testing`, `angular2/http/testing`, `angular2/router/testing`, `angular2/platform/testing/browser` | dev | no

**Note**: bundles in the `System.register` format are "additive" - it is quite common to include several bundles in one application.
For example people using Angular 2 with `http` and `router` would include: `angular2.js`, `http.js` and `router.js`.

## Browserify / JSPM / Rollup / WebPack users

Angular 2 doesn't provide any bundles for use with packaging tools Browserify or WebPack. Those tools are sophisticated enough to build optimal bundles for production use from individual Angular 2 files distributed in the npm package.
An example of an Angular 2 project built with WebPack can be found in the [angular2-seed](https://github.com/angular/angular2-seed) repository.      


# Polyfills and external dependencies

## Required Polyfills

Polyfills are required for Angular 2 to function properly (the exact list depends on the browser used) and external dependencies ([zone.js](https://github.com/angular/zone.js)).
To ease setup of Angular 2 applications there is one file - `angular2-polyfills.js` - that combines:
* a polyfill mandatory for all browsers: [reflect-metadata](https://www.npmjs.com/package/reflect-metadata)
* [zone.js](https://github.com/angular/zone.js)     

**Note**: `angular2-polyfills.js` contains code that should be loaded into the browser as the very first code of the web application even before the module loader. The preferred solution is to load the mentioned file in a `script` tag as early as possible. 


## RxJS

[RxJS](https://github.com/ReactiveX/RxJS) is a required dependency of Angular 2.

You should include RxJS in your project by declaring a dependency on the [`rxjs` npm package](https://www.npmjs.com/package/rxjs).

Depending on if you are using Angular bundles or not you can either use RxJS bundles from `node_modules/rxjs/bundles/` or configure your bundler to pull in the individual files from the npm package.


## ES6 shims (optional)

Users of pre-ES6 browsers might need to add an ES6 shim (e.g. [es6-shim](https://github.com/paulmillr/es6-shim))
