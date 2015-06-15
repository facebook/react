# [Jest](http://facebook.github.io/jest/) [![Build Status](https://travis-ci.org/facebook/jest.svg?branch=master)](https://travis-ci.org/facebook/jest)

Painless JavaScript Unit Testing

- **Familiar Approach**: Built on top of the Jasmine test framework, using familiar expect(value).toBe(other) assertions

- **Mock by Default**: Automatically mocks CommonJS modules returned by require(), making most existing code testable

- **Short Feedback Loop**: DOM APIs are mocked and tests run in parallel via a small node.js command line utility

## Getting Started

Check out the [Getting Started](http://facebook.github.io/jest/docs/getting-started.html) tutorial. It's pretty simple!

## API

<generated_api_start />
#### The `jest` object

  - [`jest.autoMockOff()`](http://facebook.github.io/jest/docs/api.html#jest-automockoff)
  - [`jest.autoMockOn()`](http://facebook.github.io/jest/docs/api.html#jest-automockon)
  - [`jest.clearAllTimers()`](http://facebook.github.io/jest/docs/api.html#jest-clearalltimers)
  - [`jest.dontMock(moduleName)`](http://facebook.github.io/jest/docs/api.html#jest-dontmock-modulename)
  - [`jest.genMockFromModule(moduleName)`](http://facebook.github.io/jest/docs/api.html#jest-genmockfrommodule-modulename)
  - [`jest.genMockFunction()`](http://facebook.github.io/jest/docs/api.html#jest-genmockfunction)
  - [`jest.genMockFn()`](http://facebook.github.io/jest/docs/api.html#jest-genmockfn)
  - [`jest.mock(moduleName)`](http://facebook.github.io/jest/docs/api.html#jest-mock-modulename)
  - [`jest.runAllTicks()`](http://facebook.github.io/jest/docs/api.html#jest-runallticks)
  - [`jest.runAllTimers()`](http://facebook.github.io/jest/docs/api.html#jest-runalltimers)
  - [`jest.runOnlyPendingTimers()`](http://facebook.github.io/jest/docs/api.html#jest-runonlypendingtimers)
  - [`jest.setMock(moduleName, moduleExports)`](http://facebook.github.io/jest/docs/api.html#jest-setmock-modulename-moduleexports)

#### Mock functions

  - [`mockFn.mock.calls`](http://facebook.github.io/jest/docs/api.html#mockfn-mock-calls)
  - [`mockFn.mock.instances`](http://facebook.github.io/jest/docs/api.html#mockfn-mock-instances)
  - [`mockFn.mockClear()`](http://facebook.github.io/jest/docs/api.html#mockfn-mockclear)
  - [`mockFn.mockImplementation(fn)`](http://facebook.github.io/jest/docs/api.html#mockfn-mockimplementation-fn)
  - [`mockFn.mockImpl(fn)`](http://facebook.github.io/jest/docs/api.html#mockfn-mockimpl-fn)
  - [`mockFn.mockReturnThis()`](http://facebook.github.io/jest/docs/api.html#mockfn-mockreturnthis)
  - [`mockFn.mockReturnValue(value)`](http://facebook.github.io/jest/docs/api.html#mockfn-mockreturnvalue-value)
  - [`mockFn.mockReturnValueOnce(value)`](http://facebook.github.io/jest/docs/api.html#mockfn-mockreturnvalueonce-value)

#### Config options

  - [`config.cacheDirectory` [string]](http://facebook.github.io/jest/docs/api.html#config-cachedirectory-string)
  - [`config.collectCoverage` [boolean]](http://facebook.github.io/jest/docs/api.html#config-collectcoverage-boolean)
  - [`config.collectCoverageOnlyFrom` [object]](http://facebook.github.io/jest/docs/api.html#config-collectcoverageonlyfrom-object)
  - [`config.globals` [object]](http://facebook.github.io/jest/docs/api.html#config-globals-object)
  - [`config.moduleFileExtensions` [array<string>]](http://facebook.github.io/jest/docs/api.html#config-modulefileextensions-array-string)
  - [`config.modulePathIgnorePatterns` [array<string>]](http://facebook.github.io/jest/docs/api.html#config-modulepathignorepatterns-array-string)
  - [`config.rootDir` [string]](http://facebook.github.io/jest/docs/api.html#config-rootdir-string)
  - [`config.scriptPreprocessor` [string]](http://facebook.github.io/jest/docs/api.html#config-scriptpreprocessor-string)
  - [`config.setupEnvScriptFile` [string]](http://facebook.github.io/jest/docs/api.html#config-setupenvscriptfile-string)
  - [`config.setupTestFrameworkScriptFile` [string]](http://facebook.github.io/jest/docs/api.html#config-setuptestframeworkscriptfile-string)
  - [`config.testDirectoryName` [string]](http://facebook.github.io/jest/docs/api.html#config-testdirectoryname-string)
  - [`config.testFileExtensions` [array<string>]](http://facebook.github.io/jest/docs/api.html#config-testfileextensions-array-string)
  - [`config.testPathDirs` [array<string>]](http://facebook.github.io/jest/docs/api.html#config-testpathdirs-array-string)
  - [`config.testPathIgnorePatterns` [array<string>]](http://facebook.github.io/jest/docs/api.html#config-testpathignorepatterns-array-string)
  - [`config.testPathPattern` [string]](http://facebook.github.io/jest/docs/api.html#config-testpathpattern-string)
  - [`config.unmockedModulePathPatterns` [array<string>]](http://facebook.github.io/jest/docs/api.html#config-unmockedmodulepathpatterns-array-string)

#### Globally injected variables

  - `afterEach(fn)`
  - `beforeEach(fn)`
  - `describe(name, fn)`
  - `it(name, fn)`
  - `it.only(name, fn)` executes [only](https://github.com/davemo/jasmine-only) this test. Useful when investigating a failure
  - [`jest`](http://facebook.github.io/jest/docs/api.html#the-jest-object)
  - `pit(name, fn)` [helper](https://www.npmjs.org/package/jasmine-pit) for promises
  - `require(module)`
  - `require.requireActual(module)`
  - `xdescribe(name, fn)`
  - `xit(name, fn)`

#### `expect(value)`

  - `.not` inverse the next comparison
  - `.toThrow(?message)`
  - `.toBe(value)` comparison using `===`
  - `.toEqual(value)` deep comparison. Use [`jasmine.any(type)`](http://jasmine.github.io/1.3/introduction.html#section-Matching_Anything_with_<code>jasmine.any</code>) to be softer
  - `.toBeFalsy()`
  - `.toBeTruthy()`
  - `.toBeNull()`
  - `.toBeUndefined()`
  - `.toBeDefined()`
  - `.toMatch(regexp)`
  - `.toContain(string)`
  - `.toBeCloseTo(number, delta)`
  - `.toBeGreaterThan(number)`
  - `.toBeLessThan(number)`
  - `.toBeCalled()`
  - `.toBeCalledWith(arg, um, ents)`
  - `.lastCalledWith(arg, um, ents)`

<generated_api_end />
