Angular2
=========

The sources for this package are in the main [Angular2](https://github.com/angular/angular) repo. Please file issues and pull requests against that repo. This is the repository for the upcoming 2.0 version. If you're looking for the current official version of Angular you should go to [angular/angular.js](https://github.com/angular/angular.js)

This package contains different sources for different users:

1. The files located in the root folder can be consumed using CommonJS.
2. The files under `/es6` are es6 compatible files that can be transpiled to
   es5 using any transpiler. This contains:
    * `dev/`: a development version that includes runtime type assertions
    * `prod/`: a production version that does not include runtime type assertions
3. The files under `/ts` are the TypeScript source files.

License: Apache MIT 2.0
