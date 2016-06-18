# tsc-wrapped

This package is an internal dependency used by @angular/compiler-cli. Please use that instead.

This is a wrapper around TypeScript's `tsc` program that allows us to hook in extra extensions.
TypeScript will eventually have an extensibility model for arbitrary extensions. We don't want
to constrain their design with baggage from a legacy implementation, so this wrapper only
supports specific extensions developed by the Angular team:

- tsickle down-levels Decorators into Annotations so they can be tree-shaken
- tsickle can also optionally produce Closure Compiler-friendly code
- ./collector.ts emits an extra `.metadata.json` file for every `.d.ts` file written, 
  which retains metadata about decorators that is lost in the TS emit
- @angular/compiler-cli extends this library to additionally generate template code

## TypeScript Decorator metadata collector

The `.d.ts` format does not preserve information about the Decorators applied to symbols.
Some tools, such as Angular 2 template compiler, need access to statically analyzable
information about Decorators, so this library allows programs to produce a `foo.metadata.json`
to accompany a `foo.d.ts` file, and preserves the information that was lost in the declaration
emit.

## Releasing
```
$ $(npm bin)/tsc -p tools
$ cp tools/tsc-wrapped/package.json dist/tools/@angular/tsc-wrapped/
$ npm login [angular]
$ npm publish dist/tools/@angular/tsc-wrapped
```
