# react
This repo holds source code for the [React](http://reactjs.org/) library.
It is updated regularly to match react-devtools, but you may still be missing the latest
code.

You will be required to run your `npm run dev` node command to build it.

## Dependencies
The npm package installs all dependencies for this library. This means you need to install the
`react-devtools` package, or at least install some of the dependencies, depending on your
development environment.

```
npm install react-devtools
```

## Development

You should have some of the following packages installed:

```bash
npm install -g -g node
npm install -g git
npm install -g jshint -g jshint-lint
```

## Development environment
You will need to run a `node` command to be able to build the library, but this command runs as
a `production` command, meaning you will be able to view the devtools.

```bash
npm run dev
```

The `dev` command will use jshint and jshint-lint to ensure that the code is well-formed.
It also uses `node-prebuilt` for some common file types.

## Dependencies
This package also requires the `react-jsx` package (see [npm package summary](http://www.npmjs.org/package/react-jsx) for a list of dependencies).
```bash
npm install -g react-jsx
```

## Build

Build is a simple one line command. You need to include all required packages

```bash
npm run build
```

## Usage

To run `npm run dev`, run:

```bash
npm run dev
```

You should be able to access the `devtools`, `dev` and `watch` views of this library.

## Tests

* run `npm run test` to run the unit test suite
* run `npm run test--coverage` to run all unit test coverage tests

## License
This library is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
