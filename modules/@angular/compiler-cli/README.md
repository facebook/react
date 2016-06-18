# Angular Template Compiler

Angular applications are built with templates, which may be `.html` or `.css` files,
or may be inline `template` attributes on Decorators like `@Component`.

These templates are compiled into executable JS at application runtime (except in `interpretation` mode).
This compilation can occur on the client, but it results in slower bootstrap time, and also
requires that the compiler be included in the code downloaded to the client.

You can produce smaller, faster applications by running Angular's compiler as a build step,
and then downloading only the executable JS to the client.

## Install and use

```
# First install angular, see https://github.com/angular/angular/blob/master/CHANGELOG.md#200-rc0-2016-05-02
$ npm install @angular/compiler-cli typescript@next @angular/platform-server @angular/compiler
# Optional sanity check, make sure TypeScript can compile.
$ ./node_modules/.bin/tsc -p path/to/project
# ngc is a drop-in replacement for tsc.
$ ./node_modules/.bin/ngc -p path/to/project
```

In order to write a `bootstrap` that imports the generated code, you should first write your
top-level component, and run `ngc` once to produce a generated `.ngfactory.ts` file.
Then you can add an import statement in the `bootstrap` allowing you to bootstrap off the
generated code:

```typescript
import {ComponentResolver, ReflectiveInjector, coreBootstrap} from '@angular/core';
import {BROWSER_APP_PROVIDERS, browserPlatform} from '@angular/platform-browser';

import {MyComponentNgFactory} from './mycomponent.ngfactory';

const appInjector = ReflectiveInjector.resolveAndCreate(BROWSER_APP_PROVIDERS, browserPlatform().injector);
coreBootstrap(MyComponentNgFactory, appInjector);
```

## Configuration

The `tsconfig.json` file may contain an additional configuration block:
```
 "angularCompilerOptions": {
   "genDir": ".",
   "debug": true
 }
```

### `genDir`

the `genDir` option controls the path (relative to `tsconfig.json`) where the generated file tree
will be written. If `genDir` is not set, then the code will be generated in the source tree, next
to your original sources. More options may be added as we implement more features.

We recommend you avoid checking generated files into version control. This permits a state where
the generated files in the repository were created from sources that were never checked in,
making it impossible to reproduce the current state. Also, your changes will effectively appear
twice in code reviews, with the generated version inscrutible by the reviewer.

In TypeScript 1.8, the generated sources will have to be written alongside your originals,
so set `genDir` to the same location as your files (typicially the same as `rootDir`).
Add `**/*.ngfactory.ts` to your `.gitignore` or other mechanism for your version control system.

In TypeScript 1.9 and above, you can add a generated folder into your application,
such as `codegen`. Using the `rootDirs` option, you can allow relative imports like
`import {} from './foo.ngfactory'` even though the `src` and `codegen` trees are distinct.
Add `**/codegen` to your `.gitignore` or similar.

Note that in the second option, TypeScript will emit the code into two parallel directories
as well. This is by design, see https://github.com/Microsoft/TypeScript/issues/8245.
This makes the configuration of your runtime module loader more complex, so we don't recommend
this option yet.

### `debug`

Set the `debug` option to true to generate debug information in the generate files.
Default to `false`.

See the example in the `test/` directory for a working example.

## Compiler CLI

This program mimics the TypeScript tsc command line. It accepts a `-p` flag which points to a
`tsconfig.json` file, or a directory containing one.

This CLI is intended for demos, prototyping, or for users with simple build systems
that run bare `tsc`.

Users with a build system should expect an Angular 2 template plugin. Such a plugin would be
based on the `index.ts` in this directory, but should share the TypeScript compiler instance
with the one already used in the plugin for TypeScript typechecking and emit.

## Design
At a high level, this program
- collects static metadata about the sources using the `tsc-wrapped` package in angular2
- uses the `OfflineCompiler` from `angular2/src/compiler/compiler` to codegen additional `.ts` files
- these `.ts` files are written to the `genDir` path, then compiled together with the application.

## For developers
```
# Build angular2 and the compiler
./build.sh
# Copy over the package so we can test the compiler tests
$ cp tools/@angular/tsc-wrapped/package.json dist/tools/@angular/tsc-wrapped
# Run the test once
# (First edit the LINKABLE_PKGS to use npm link instead of npm install)
$ ./scripts/ci-lite/offline_compiler_test.sh
# Keep a package fresh in watch mode
./node_modules/.bin/tsc -p modules/@angular/compiler/tsconfig-es5.json -w
# Iterate on the test
cd /tmp/wherever/e2e_test.1464388257/
./node_modules/.bin/ngc
./node_modules/.bin/jasmine test/*_spec.js
```
