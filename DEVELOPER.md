# Building and Testing Angular 2 for JS and Dart

This document describes how to set up your development environment to build and test Angular, both
JS and Dart versions. It also explains the basic mechanics of using `git`, `node`, and `npm`.

* [Prerequisite Software](#prerequisite-software)
* [Getting the Sources](#getting-the-sources)
* [Environment Variable Setup](#environment-variable-setup)
* [Installing NPM Modules and Dart Packages](#installing-npm-modules-and-dart-packages)
* [Build commands](#build-commands)
* [Running Tests Locally](#running-tests-locally)
* [Code Style](#code-style)
* [Project Information](#project-information)
* [CI using Travis](#ci-using-travis)
* [Transforming Dart code](#transforming-dart-code)
* [Debugging](#debugging)

See the [contribution guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md)
if you'd like to contribute to Angular.

## Prerequisite Software

Before you can build and test Angular, you must install and configure the
following products on your development machine:

* [Git](http://git-scm.com) and/or the **GitHub app** (for [Mac](http://mac.github.com) or
  [Windows](http://windows.github.com)); [GitHub's Guide to Installing
  Git](https://help.github.com/articles/set-up-git) is a good source of information.

* [Node.js](http://nodejs.org), (version `>=5.4.1 <6`) which is used to run a development web server,
  run tests, and generate distributable files. We also use Node's Package Manager, `npm`
  (version `>=3.5.3 <4.0`), which comes with Node. Depending on your system, you can install Node either from
  source or as a pre-packaged bundle.

* *Optional*: [Dart](https://www.dartlang.org) (version `>=1.13.2 <2.0.0`), specifically the Dart SDK and
  Dartium (a version of [Chromium](http://www.chromium.org) with native support for Dart through
  the Dart VM). Visit Dart's [Downloads page](https://www.dartlang.org/downloads) page for
  instructions. You can also download both **stable** and **dev** channel versions from the
  [download archive](https://www.dartlang.org/downloads/archive/). In that case, on Windows, Dart
  must be added to the `PATH` (e.g. `path-to-dart-sdk-folder\bin`) and a new `DARTIUM_BIN`
  environment variable must be created, pointing to the executable (e.g.
  `path-to-dartium-folder\chrome.exe`).

* [Java Development Kit](http://www.oracle.com/technetwork/es/java/javase/downloads/index.html) which is used
  to execute the selenium standalone server for e2e testing.

## Getting the Sources

Fork and clone the Angular repository:

1. Login to your GitHub account or create one by following the instructions given
   [here](https://github.com/signup/free).
2. [Fork](http://help.github.com/forking) the [main Angular
   repository](https://github.com/angular/angular).
3. Clone your fork of the Angular repository and define an `upstream` remote pointing back to
   the Angular repository that you forked in the first place.

```shell
# Clone your GitHub repository:
git clone git@github.com:<github username>/angular.git

# Go to the Angular directory:
cd angular

# Add the main Angular repository as an upstream remote to your repository:
git remote add upstream https://github.com/angular/angular.git
```

## Environment Variable Setup

Define the environment variables listed below. These are mainly needed for the testing. The
notation shown here is for [`bash`](http://www.gnu.org/software/bash); adapt as appropriate for
your favorite shell.

Examples given below of possible values for initializing the environment variables assume **Mac OS
X** and that you have installed the Dart Editor in the directory named by
`DART_EDITOR_DIR=/Applications/dart`. This is only for illustrative purposes.

```shell
# DARTIUM_BIN: path to a Dartium browser executable; used by Karma to run Dart tests
export DARTIUM_BIN="$DART_EDITOR_DIR/chromium/Chromium.app/Contents/MacOS/Chromium"
```

Add the Dart SDK `bin` directory to your path and/or define `DART_SDK` (this is also detailed
[here](https://www.dartlang.org/tools/pub/installing.html)):

```shell
# DART_SDK: path to a Dart SDK directory
export DART_SDK="$DART_EDITOR_DIR/dart-sdk"

# Update PATH to include the Dart SDK bin directory
PATH+=":$DART_SDK/bin"
```

And specify where the pub’s dependencies are downloaded. By default, this directory is located under .pub_cache
in your home directory (on Mac and Linux), or in AppData\Roaming\Pub\Cache (on Windows).

```shell
# PUB_CACHE: location of pub dependencies
export PUB_CACHE="/Users/<user>/.pub-cache"
```

## Installing NPM Modules and Dart Packages

Next, install the JavaScript modules and Dart packages needed to build and test Angular:

```shell
# Install Angular project dependencies (package.json)
npm install
```

**Optional**: In this document, we make use of project local `npm` package scripts and binaries
(stored under `./node_modules/.bin`) by prefixing these command invocations with `$(npm bin)`; in
particular `gulp` and `protractor` commands. If you prefer, you can drop this path prefix by either:

*Option 1*: globally installing these two packages as follows:

* `npm install -g gulp` (you might need to prefix this command with `sudo`)
* `npm install -g protractor` (you might need to prefix this command with `sudo`)

Since global installs can become stale, and required versions can vary by project, we avoid their
use in these instructions.

*Option 2*: defining a bash alias like `alias nbin='PATH=$(npm bin):$PATH'` as detailed in this
[Stackoverflow answer](http://stackoverflow.com/questions/9679932/how-to-use-package-installed-locally-in-node-modules/15157360#15157360) and used like this: e.g., `nbin gulp build`.

## Build commands

To build Angular and prepare tests, run:

```shell
$(npm bin)/gulp build
```

Notes:
* Results are put in the `dist` folder.
* This will also run `pub get` for the subfolders in `modules` and run `dartanalyzer` for
  every file that matches `<module>/src/<module>.dart`, e.g. `di/src/di.dart`.

You can selectively build either the JS or Dart versions as follows:

* `$(npm bin)/gulp build.js`
* `$(npm bin)/gulp build.dart`

To clean out the `dist` folder, run:

```shell
$(npm bin)/gulp clean
```

## Running Tests Locally

### Full test suite

* `npm test`: full test suite for both JS and Dart versions of Angular. These are the same tests
  that run on Travis.

You can selectively run either the JS or Dart versions as follows:

* `$(npm bin)/gulp test.all.js`
* `$(npm bin)/gulp test.all.dart`

### Unit tests

You can run just the unit tests as follows:

* `$(npm bin)/gulp test.unit.js`: JS tests in a browser; runs in **watch mode** (i.e.
   watches the test files for changes and re-runs tests when files are updated).
* `$(npm bin)/gulp test.unit.cjs`: JS tests in NodeJS; runs in **watch mode**.
* `$(npm bin)/gulp test.unit.dart`: Dart tests in Dartium; runs in **watch mode**.

If you prefer running tests in "single-run" mode rather than watch mode use:

* `$(npm bin)/gulp test.unit.js/ci`
* `$(npm bin)/gulp test.unit.cjs/ci`
* `$(npm bin)/gulp test.unit.dart/ci`

The task updates the dist folder with transpiled code whenever a source or test file changes, and
Karma is run against the new output.

**Note**: If you want to only run a single test you can alter the test you wish to run by changing
`it` to `iit` or `describe` to `ddescribe`. This will only run that individual test and make it
much easier to debug. `xit` and `xdescribe` can also be useful to exclude a test and a group of
tests respectively.

**Note**: **watch mode** needs symlinks to work, so if you're using Windows, ensure you have the
rights to built them in your operating system. On Windows, only administrators can create symbolic links by default, but you may change the policy. (see [here](https://technet.microsoft.com/library/cc766301.aspx?f=255&MSPPError=-2147217396).)

### Unit tests with Sauce Labs or Browser Stack

First, in a terminal, create a tunnel with [Sauce Connect](https://docs.saucelabs.com/reference/sauce-connect/) or [Browser Stack Local](https://www.browserstack.com/local-testing#command-line), and valid credentials.  

Then, in another terminal:
 - Define the credentials as environment variables, e.g.:
```
export SAUCE_USERNAME='my_user'; export SAUCE_ACCESS_KEY='my_key';
export BROWSER_STACK_USERNAME='my_user'; export BROWSER_STACK_ACCESS_KEY='my_key';
```
 - Then run `gulp test.unit.js.(sauce|browserstack) --browsers=option1,option2,..,optionN`  
The options are any mix of browsers and aliases which are defined in the [browser-providers.conf.js](https://github.com/angular/angular/blob/master/browser-providers.conf.js) file.  
They are case insensitive, and the `SL_` or `BS_` prefix must not be added for browsers.

Some examples of commands:
```
gulp test.unit.js.sauce --browsers=Safari8,ie11  //run in Sauce Labs with Safari 8 and IE11
gulp test.unit.js.browserstack --browsers=Safari,IE  //run in Browser Stack with Safari 7, Safari 8, Safari 9, IE 9, IE 10 and IE 11
gulp test.unit.js.sauce --browsers=IOS,safari8,android5.1  //run in Sauce Labs with iOS 7, iOS 8, iOs 9, Safari 8 and Android 5.1
```

### E2E tests

1. `$(npm bin)/gulp build.js.cjs` (builds benchpress and tests into `dist/js/cjs` folder).
2. `$(npm bin)/gulp serve.js.prod serve.dart` (runs a local webserver).
3. `$(npm bin)/protractor protractor-js.conf.js`: JS e2e tests.
4. `$(npm bin)/protractor protractor-dart2js.conf.js`: dart2js e2e tests.

Angular specific command line options when running protractor:
  - `$(npm bin)/protractor protractor-{js|dart2js}-conf.js --ng-help`

### Performance tests

1. `$(npm bin)/gulp build.js.cjs` (builds benchpress and tests into `dist/js/cjs` folder)
2. `$(npm bin)/gulp serve.js.prod serve.dart` (runs a local webserver)
3. `$(npm bin)/protractor protractor-js.conf.js --benchmark`: JS performance tests
4. `$(npm bin)/protractor protractor-dart2js.conf.js --benchmark`: dart2js performance tests

Angular specific command line options when running protractor (e.g. force gc, ...):
`$(npm bin)/protractor protractor-{js|dart2js}-conf.js --ng-help`

## Code Style

### Formatting with <a name="clang-format">clang-format</a>

We use [clang-format](http://clang.llvm.org/docs/ClangFormat.html) to automatically enforce code
style for our TypeScript code. This allows us to focus our code reviews more on the content, and
less on style nit-picking. It also lets us encode our style guide in the `.clang-format` file in the
repository, allowing many tools and editors to share our settings.

To check the formatting of your code, run

    gulp lint

Note that the continuous build on CircleCI will fail the build if files aren't formatted according
to the style guide.

Your life will be easier if you include the formatter in your standard workflow. Otherwise, you'll
likely forget to check the formatting, and waste time waiting for a build on Travis that fails due
to some whitespace difference.

* Use `gulp format` to format everything.
* Use `gulp lint` to check if your code is `clang-format` clean. This also gives
  you a command line to format your code.
* `clang-format` also includes a git hook, run `git clang-format` to format all files you
  touched.
* You can run this as a **git pre-commit hook** to automatically format your delta regions when you
  commit a change. In the angular repo, run

```
    $ echo -e '#!/bin/sh\nexec git clang-format --style file' > .git/hooks/pre-commit
    $ chmod u+x !$
```

**NOTE**: To use ```git clang-format``` use have to make sure that ```git-clang-format``` is in your
```PATH```. The easiest way is probably to just ```npm install -g clang-format``` as it comes with
```git-clang-format```.

* **WebStorm** can run clang-format on the current file.
  1. Under Preferences, open Tools > External Tools.
  1. Plus icon to Create Tool
  1. Fill in the form:
    - Name: clang-format
    - Description: Format
    - Synchronize files after execution: checked
    - Open console: not checked
    - Show in: Editor menu
    - Program: `$ProjectFileDir$/node_modules/.bin/clang-format`
    - Parameters: `-i -style=file $FilePath$`
    - Working directory: `$ProjectFileDir$`
* `clang-format` integrations are also available for many popular editors (`vim`, `emacs`,
  `Sublime Text`, etc.).

### Linting

We use [tslint](https://github.com/palantir/tslint) for linting. See linting rules in [gulpfile](gulpfile.js). To lint, run

```shell
$ gulp lint
```

## Generating the API documentation

The following gulp task will generate the API docs in the `dist/angular.io/partials/api/angular2`:  

```shell
$(npm bin)/gulp docs/angular.io
```

You can serve the generated documentation to check how it would render on [angular.io](https://angular.io/):
- check out the [angular.io repo](https://github.com/angular/angular.io) locally,
- install dependencies as described in the [angular.io README](https://github.com/angular/angular.io/blob/master/README.md),
- copy the generated documentation from your local angular repo at `angular/dist/angular.io/partials/api/angular2` to your local angular.io repo at `angular.io/public/docs/js/latest/api`,
- run `harp compile` at the root of the angular.io repo to check the generated documentation for errors,
- run `harp server` and open a browser at `http://localhost:9000/docs/js/latest/api/` to check the rendered documentation.

## Project Information

### Folder structure

* `modules/*`: modules that will be loaded in the browser
* `tools/*`: tools that are needed to build Angular
* `dist/*`: build files are placed here.

### File suffixes

* `*.ts`: TypeScript files that get transpiled to Dart and EcmaScript 5/6
* `*.dart`: Dart files that don't get transpiled

## CI using Travis

For instructions on setting up Continuous Integration using Travis, see the instructions given
[here](https://github.com/angular/angular.dart/blob/master/travis.md).

## Transforming Dart code

See the [wiki](//github.com/angular/angular/wiki/Angular-2-Dart-Transformer).

## Debugging

### Debug the transpiler

If you need to debug the transpiler:

- add a `debugger;` statement in the transpiler code,
- from the root folder, execute `node debug $(npm bin)/gulp build` to enter the node
  debugger
- press "c" to execute the program until you reach the `debugger;` statement,
- you can then type "repl" to enter the REPL and inspect variables in the context.

See the [Node.js manual](http://nodejs.org/api/debugger.html) for more information.

Notes:
- You can also execute `node $(npm bin)/karma start karma-dart.conf.js` depending on which
  code you want to debug (the former will process the "modules" folder while the later processes
  the transpiler specs).
- You can also add `debugger;` statements in the specs (JavaScript). The execution will halt when
  the developer tools are opened in the browser running Karma.

### Debug the tests

If you need to debug the tests:

- add a `debugger;` statement to the test you want to debug (or the source code),
- execute karma `$(npm bin)/gulp test.js`,
- press the top right "DEBUG" button,
- open the DevTools and press F5,
- the execution halts at the `debugger;` statement

**Note (WebStorm users)**:

1. Create a Karma run config from WebStorm.
2. Then in the "Run" menu, press "Debug 'karma-js.conf.js'", and WebStorm will stop in the generated
   code on the `debugger;` statement.
3. You can then step into the code and add watches.

The `debugger;` statement is needed because WebStorm will stop in a transpiled file. Breakpoints in
the original source files are not supported at the moment.
