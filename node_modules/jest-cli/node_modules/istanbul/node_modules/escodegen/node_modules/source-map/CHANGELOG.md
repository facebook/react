# Change Log

## 0.1.43

* Performance improvements for `SourceMapGenerator` and `SourceNode`. See issue
  #148 for some discussion and issues #150, #151, and #152 for implementations.

## 0.1.42

* Fix an issue where `SourceNode`s from different versions of the source-map
  library couldn't be used in conjunction with each other. See issue #142.

## 0.1.41

* Fix a bug with getting the source content of relative sources with a "./"
  prefix. See issue #145 and [Bug 1090768](bugzil.la/1090768).

* Add the `SourceMapConsumer.prototype.computeColumnSpans` method to compute the
  column span of each mapping.

* Add the `SourceMapConsumer.prototype.allGeneratedPositionsFor` method to find
  all generated positions associated with a given original source and line.

## 0.1.40

* Performance improvements for parsing source maps in SourceMapConsumer.

## 0.1.39

* Fix a bug where setting a source's contents to null before any source content
  had been set before threw a TypeError. See issue #131.

## 0.1.38

* Fix a bug where finding relative paths from an empty path were creating
  absolute paths. See issue #129.

## 0.1.37

* Fix a bug where if the source root was an empty string, relative source paths
  would turn into absolute source paths. Issue #124.

## 0.1.36

* Allow the `names` mapping property to be an empty string. Issue #121.

## 0.1.35

* A third optional parameter was added to `SourceNode.fromStringWithSourceMap`
  to specify a path that relative sources in the second parameter should be
  relative to. Issue #105.

* If no file property is given to a `SourceMapGenerator`, then the resulting
  source map will no longer have a `null` file property. The property will
  simply not exist. Issue #104.

* Fixed a bug where consecutive newlines were ignored in `SourceNode`s.
  Issue #116.

## 0.1.34

* Make `SourceNode` work with windows style ("\r\n") newlines. Issue #103.

* Fix bug involving source contents and the
  `SourceMapGenerator.prototype.applySourceMap`. Issue #100.

## 0.1.33

* Fix some edge cases surrounding path joining and URL resolution.

* Add a third parameter for relative path to
  `SourceMapGenerator.prototype.applySourceMap`.

* Fix issues with mappings and EOLs.

## 0.1.32

* Fixed a bug where SourceMapConsumer couldn't handle negative relative columns
  (issue 92).

* Fixed test runner to actually report number of failed tests as its process
  exit code.

* Fixed a typo when reporting bad mappings (issue 87).

## 0.1.31

* Delay parsing the mappings in SourceMapConsumer until queried for a source
  location.

* Support Sass source maps (which at the time of writing deviate from the spec
  in small ways) in SourceMapConsumer.

## 0.1.30

* Do not join source root with a source, when the source is a data URI.

* Extend the test runner to allow running single specific test files at a time.

* Performance improvements in `SourceNode.prototype.walk` and
  `SourceMapConsumer.prototype.eachMapping`.

* Source map browser builds will now work inside Workers.

* Better error messages when attempting to add an invalid mapping to a
  `SourceMapGenerator`.

## 0.1.29

* Allow duplicate entries in the `names` and `sources` arrays of source maps
  (usually from TypeScript) we are parsing. Fixes github issue 72.

## 0.1.28

* Skip duplicate mappings when creating source maps from SourceNode; github
  issue 75.

## 0.1.27

* Don't throw an error when the `file` property is missing in SourceMapConsumer,
  we don't use it anyway.

## 0.1.26

* Fix SourceNode.fromStringWithSourceMap for empty maps. Fixes github issue 70.

## 0.1.25

* Make compatible with browserify

## 0.1.24

* Fix issue with absolute paths and `file://` URIs. See
  https://bugzilla.mozilla.org/show_bug.cgi?id=885597

## 0.1.23

* Fix issue with absolute paths and sourcesContent, github issue 64.

## 0.1.22

* Ignore duplicate mappings in SourceMapGenerator. Fixes github issue 21.

## 0.1.21

* Fixed handling of sources that start with a slash so that they are relative to
  the source root's host.

## 0.1.20

* Fixed github issue #43: absolute URLs aren't joined with the source root
  anymore.

## 0.1.19

* Using Travis CI to run tests.

## 0.1.18

* Fixed a bug in the handling of sourceRoot.

## 0.1.17

* Added SourceNode.fromStringWithSourceMap.

## 0.1.16

* Added missing documentation.

* Fixed the generating of empty mappings in SourceNode.

## 0.1.15

* Added SourceMapGenerator.applySourceMap.

## 0.1.14

* The sourceRoot is now handled consistently.

## 0.1.13

* Added SourceMapGenerator.fromSourceMap.

## 0.1.12

* SourceNode now generates empty mappings too.

## 0.1.11

* Added name support to SourceNode.

## 0.1.10

* Added sourcesContent support to the customer and generator.
