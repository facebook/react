UglifyJS 2
==========
[![Build Status](https://travis-ci.org/mishoo/UglifyJS2.png)](https://travis-ci.org/mishoo/UglifyJS2)

UglifyJS is a JavaScript parser, minifier, compressor or beautifier toolkit.

This page documents the command line utility.  For
[API and internals documentation see my website](http://lisperator.net/uglifyjs/).
There's also an
[in-browser online demo](http://lisperator.net/uglifyjs/#demo) (for Firefox,
Chrome and probably Safari).

Install
-------

First make sure you have installed the latest version of [node.js](http://nodejs.org/)
(You may need to restart your computer after this step).

From NPM for use as a command line app:

    npm install uglify-js -g

From NPM for programmatic use:

    npm install uglify-js

From Git:

    git clone git://github.com/mishoo/UglifyJS2.git
    cd UglifyJS2
    npm link .

Usage
-----

    uglifyjs [input files] [options]

UglifyJS2 can take multiple input files.  It's recommended that you pass the
input files first, then pass the options.  UglifyJS will parse input files
in sequence and apply any compression options.  The files are parsed in the
same global scope, that is, a reference from a file to some
variable/function declared in another file will be matched properly.

If you want to read from STDIN instead, pass a single dash instead of input
files.

The available options are:

    --source-map       Specify an output file where to generate source map.
                                                                          [string]
    --source-map-root  The path to the original source to be included in the
                       source map.                                        [string]
    --source-map-url   The path to the source map to be added in //@
                       sourceMappingURL.  Defaults to the value passed with
                       --source-map.                                      [string]
    --in-source-map    Input source map, useful if you're compressing JS that was
                       generated from some other original code.
    --screw-ie8        Pass this flag if you don't care about full compliance with
                       Internet Explorer 6-8 quirks (by default UglifyJS will try
                       to be IE-proof).
    -p, --prefix       Skip prefix for original filenames that appear in source
                       maps. For example -p 3 will drop 3 directories from file
                       names and ensure they are relative paths.
    -o, --output       Output file (default STDOUT).
    -b, --beautify     Beautify output/specify output options.            [string]
    -m, --mangle       Mangle names/pass mangler options.                 [string]
    -r, --reserved     Reserved names to exclude from mangling.
    -c, --compress     Enable compressor/pass compressor options. Pass options
                       like -c hoist_vars=false,if_return=false. Use -c with no
                       argument to use the default compression options.   [string]
    -d, --define       Global definitions                                 [string]
    --comments         Preserve copyright comments in the output. By default this
                       works like Google Closure, keeping JSDoc-style comments
                       that contain "@license" or "@preserve". You can optionally
                       pass one of the following arguments to this flag:
                       - "all" to keep all comments
                       - a valid JS regexp (needs to start with a slash) to keep
                       only comments that match.
                       Note that currently not *all* comments can be kept when
                       compression is on, because of dead code removal or
                       cascading statements into sequences.               [string]
    --stats            Display operations run time on STDERR.            [boolean]
    --acorn            Use Acorn for parsing.                            [boolean]
    --spidermonkey     Assume input files are SpiderMonkey AST format (as JSON).
                                                                         [boolean]
    --self             Build itself (UglifyJS2) as a library (implies
                       --wrap=UglifyJS --export-all)                     [boolean]
    --wrap             Embed everything in a big function, making the “exports”
                       and “global” variables available. You need to pass an
                       argument to this option to specify the name that your
                       module will take when included in, say, a browser.
                                                                          [string]
    --export-all       Only used when --wrap, this tells UglifyJS to add code to
                       automatically export all globals.                 [boolean]
    --lint             Display some scope warnings                       [boolean]
    -v, --verbose      Verbose                                           [boolean]
    -V, --version      Print version number and exit.                    [boolean]

Specify `--output` (`-o`) to declare the output file.  Otherwise the output
goes to STDOUT.

## Source map options

UglifyJS2 can generate a source map file, which is highly useful for
debugging your compressed JavaScript.  To get a source map, pass
`--source-map output.js.map` (full path to the file where you want the
source map dumped).

Additionally you might need `--source-map-root` to pass the URL where the
original files can be found.  In case you are passing full paths to input
files to UglifyJS, you can use `--prefix` (`-p`) to specify the number of
directories to drop from the path prefix when declaring files in the source
map.

For example:

    uglifyjs /home/doe/work/foo/src/js/file1.js \
             /home/doe/work/foo/src/js/file2.js \
             -o foo.min.js \
             --source-map foo.min.js.map \
             --source-map-root http://foo.com/src \
             -p 5 -c -m

The above will compress and mangle `file1.js` and `file2.js`, will drop the
output in `foo.min.js` and the source map in `foo.min.js.map`.  The source
mapping will refer to `http://foo.com/src/js/file1.js` and
`http://foo.com/src/js/file2.js` (in fact it will list `http://foo.com/src`
as the source map root, and the original files as `js/file1.js` and
`js/file2.js`).

### Composed source map

When you're compressing JS code that was output by a compiler such as
CoffeeScript, mapping to the JS code won't be too helpful.  Instead, you'd
like to map back to the original code (i.e. CoffeeScript).  UglifyJS has an
option to take an input source map.  Assuming you have a mapping from
CoffeeScript → compiled JS, UglifyJS can generate a map from CoffeeScript →
compressed JS by mapping every token in the compiled JS to its original
location.

To use this feature you need to pass `--in-source-map
/path/to/input/source.map`.  Normally the input source map should also point
to the file containing the generated JS, so if that's correct you can omit
input files from the command line.

## Mangler options

To enable the mangler you need to pass `--mangle` (`-m`).  The following
(comma-separated) options are supported:

- `sort` — to assign shorter names to most frequently used variables.  This
  saves a few hundred bytes on jQuery before gzip, but the output is
  _bigger_ after gzip (and seems to happen for other libraries I tried it
  on) therefore it's not enabled by default.

- `toplevel` — mangle names declared in the toplevel scope (disabled by
  default).

- `eval` — mangle names visible in scopes where `eval` or `when` are used
  (disabled by default).

When mangling is enabled but you want to prevent certain names from being
mangled, you can declare those names with `--reserved` (`-r`) — pass a
comma-separated list of names.  For example:

    uglifyjs ... -m -r '$,require,exports'

to prevent the `require`, `exports` and `$` names from being changed.

## Compressor options

You need to pass `--compress` (`-c`) to enable the compressor.  Optionally
you can pass a comma-separated list of options.  Options are in the form
`foo=bar`, or just `foo` (the latter implies a boolean option that you want
to set `true`; it's effectively a shortcut for `foo=true`).

- `sequences` -- join consecutive simple statements using the comma operator
- `properties` -- rewrite property access using the dot notation, for
  example `foo["bar"] → foo.bar`
- `dead_code` -- remove unreachable code
- `drop_debugger` -- remove `debugger;` statements
- `unsafe` (default: false) -- apply "unsafe" transformations (discussion below)
- `conditionals` -- apply optimizations for `if`-s and conditional
  expressions
- `comparisons` -- apply certain optimizations to binary nodes, for example:
  `!(a <= b) → a > b` (only when `unsafe`), attempts to negate binary nodes,
  e.g. `a = !b && !c && !d && !e → a=!(b||c||d||e)` etc.
- `evaluate` -- attempt to evaluate constant expressions
- `booleans` -- various optimizations for boolean context, for example `!!a
  ? b : c → a ? b : c`
- `loops` -- optimizations for `do`, `while` and `for` loops when we can
  statically determine the condition
- `unused` -- drop unreferenced functions and variables
- `hoist_funs` -- hoist function declarations
- `hoist_vars` (default: false) -- hoist `var` declarations (this is `false`
  by default because it seems to increase the size of the output in general)
- `if_return` -- optimizations for if/return and if/continue
- `join_vars` -- join consecutive `var` statements
- `cascade` -- small optimization for sequences, transform `x, x` into `x`
  and `x = something(), x` into `x = something()`
- `warnings` -- display warnings when dropping unreachable code or unused
  declarations etc.

### The `unsafe` option

It enables some transformations that *might* break code logic in certain
contrived cases, but should be fine for most code.  You might want to try it
on your own code, it should reduce the minified size.  Here's what happens
when this flag is on:

- `new Array(1, 2, 3)` or `Array(1, 2, 3)` → `[1, 2, 3 ]`
- `new Object()` → `{}`
- `String(exp)` or `exp.toString()` → `"" + exp`
- `new Object/RegExp/Function/Error/Array (...)` → we discard the `new`
- `typeof foo == "undefined"` → `foo === void 0`
- `void 0` → `"undefined"` (if there is a variable named "undefined" in
  scope; we do it because the variable name will be mangled, typically
  reduced to a single character).

### Conditional compilation

You can use the `--define` (`-d`) switch in order to declare global
variables that UglifyJS will assume to be constants (unless defined in
scope).  For example if you pass `--define DEBUG=false` then, coupled with
dead code removal UglifyJS will discard the following from the output:
```javascript
if (DEBUG) {
	console.log("debug stuff");
}
```

UglifyJS will warn about the condition being always false and about dropping
unreachable code; for now there is no option to turn off only this specific
warning, you can pass `warnings=false` to turn off *all* warnings.

Another way of doing that is to declare your globals as constants in a
separate file and include it into the build.  For example you can have a
`build/defines.js` file with the following:
```javascript
const DEBUG = false;
const PRODUCTION = true;
// etc.
```

and build your code like this:

    uglifyjs build/defines.js js/foo.js js/bar.js... -c

UglifyJS will notice the constants and, since they cannot be altered, it
will evaluate references to them to the value itself and drop unreachable
code as usual.  The possible downside of this approach is that the build
will contain the `const` declarations.

<a name="codegen-options"></a>
## Beautifier options

The code generator tries to output shortest code possible by default.  In
case you want beautified output, pass `--beautify` (`-b`).  Optionally you
can pass additional arguments that control the code output:

- `beautify` (default `true`) -- whether to actually beautify the output.
  Passing `-b` will set this to true, but you might need to pass `-b` even
  when you want to generate minified code, in order to specify additional
  arguments, so you can use `-b beautify=false` to override it.
- `indent-level` (default 4)
- `indent-start` (default 0) -- prefix all lines by that many spaces
- `quote-keys` (default `false`) -- pass `true` to quote all keys in literal
  objects
- `space-colon` (default `true`) -- insert a space after the colon signs
- `ascii-only` (default `false`) -- escape Unicode characters in strings and
  regexps
- `inline-script` (default `false`) -- escape the slash in occurrences of
  `</script` in strings
- `width` (default 80) -- only takes effect when beautification is on, this
  specifies an (orientative) line width that the beautifier will try to
  obey.  It refers to the width of the line text (excluding indentation).
  It doesn't work very well currently, but it does make the code generated
  by UglifyJS more readable.
- `max-line-len` (default 32000) -- maximum line length (for uglified code)
- `ie-proof` (default `true`) -- generate “IE-proof” code (for now this
  means add brackets around the do/while in code like this: `if (foo) do
  something(); while (bar); else ...`.
- `bracketize` (default `false`) -- always insert brackets in `if`, `for`,
  `do`, `while` or `with` statements, even if their body is a single
  statement.
- `semicolons` (default `true`) -- separate statements with semicolons.  If
  you pass `false` then whenever possible we will use a newline instead of a
  semicolon, leading to more readable output of uglified code (size before
  gzip could be smaller; size after gzip insignificantly larger).
- `negate-iife` (default `!beautify`) -- prefer negation, rather than
  parens, for "Immediately-Called Function Expressions".  This defaults to
  `true` when beautification is off, and `false` if beautification is on;
  pass it manually to force a value.

### Keeping copyright notices or other comments

You can pass `--comments` to retain certain comments in the output.  By
default it will keep JSDoc-style comments that contain "@preserve",
"@license" or "@cc_on" (conditional compilation for IE).  You can pass
`--comments all` to keep all the comments, or a valid JavaScript regexp to
keep only comments that match this regexp.  For example `--comments
'/foo|bar/'` will keep only comments that contain "foo" or "bar".

Note, however, that there might be situations where comments are lost.  For
example:
```javascript
function f() {
	/** @preserve Foo Bar */
	function g() {
	  // this function is never called
	}
	return something();
}
```

Even though it has "@preserve", the comment will be lost because the inner
function `g` (which is the AST node to which the comment is attached to) is
discarded by the compressor as not referenced.

The safest comments where to place copyright information (or other info that
needs to be kept in the output) are comments attached to toplevel nodes.

## Support for the SpiderMonkey AST

UglifyJS2 has its own abstract syntax tree format; for
[practical reasons](http://lisperator.net/blog/uglifyjs-why-not-switching-to-spidermonkey-ast/)
we can't easily change to using the SpiderMonkey AST internally.  However,
UglifyJS now has a converter which can import a SpiderMonkey AST.

For example [Acorn][acorn] is a super-fast parser that produces a
SpiderMonkey AST.  It has a small CLI utility that parses one file and dumps
the AST in JSON on the standard output.  To use UglifyJS to mangle and
compress that:

    acorn file.js | uglifyjs --spidermonkey -m -c

The `--spidermonkey` option tells UglifyJS that all input files are not
JavaScript, but JS code described in SpiderMonkey AST in JSON.  Therefore we
don't use our own parser in this case, but just transform that AST into our
internal AST.

### Use Acorn for parsing

More for fun, I added the `--acorn` option which will use Acorn to do all
the parsing.  If you pass this option, UglifyJS will `require("acorn")`.

Acorn is really fast (e.g. 250ms instead of 380ms on some 650K code), but
converting the SpiderMonkey tree that Acorn produces takes another 150ms so
in total it's a bit more than just using UglifyJS's own parser.

API Reference
-------------

Assuming installation via NPM, you can load UglifyJS in your application
like this:
```javascript
var UglifyJS = require("uglify-js");
```

It exports a lot of names, but I'll discuss here the basics that are needed
for parsing, mangling and compressing a piece of code.  The sequence is (1)
parse, (2) compress, (3) mangle, (4) generate output code.

### The simple way

There's a single toplevel function which combines all the steps.  If you
don't need additional customization, you might want to go with `minify`.
Example:
```javascript
var result = UglifyJS.minify("/path/to/file.js");
console.log(result.code); // minified output
// if you need to pass code instead of file name
var result = UglifyJS.minify("var b = function () {};", {fromString: true});
```

You can also compress multiple files:
```javascript
var result = UglifyJS.minify([ "file1.js", "file2.js", "file3.js" ]);
console.log(result.code);
```

To generate a source map:
```javascript
var result = UglifyJS.minify([ "file1.js", "file2.js", "file3.js" ], {
	outSourceMap: "out.js.map"
});
console.log(result.code); // minified output
console.log(result.map);
```

Note that the source map is not saved in a file, it's just returned in
`result.map`.  The value passed for `outSourceMap` is only used to set the
`file` attribute in the source map (see [the spec][sm-spec]).

You can also specify sourceRoot property to be included in source map:
```javascript
var result = UglifyJS.minify([ "file1.js", "file2.js", "file3.js" ], {
	outSourceMap: "out.js.map",
	sourceRoot: "http://example.com/src"
});
```

If you're compressing compiled JavaScript and have a source map for it, you
can use the `inSourceMap` argument:
```javascript
var result = UglifyJS.minify("compiled.js", {
	inSourceMap: "compiled.js.map",
	outSourceMap: "minified.js.map"
});
// same as before, it returns `code` and `map`
```

The `inSourceMap` is only used if you also request `outSourceMap` (it makes
no sense otherwise).

Other options:

- `warnings` (default `false`) — pass `true` to display compressor warnings.

- `fromString` (default `false`) — if you pass `true` then you can pass
  JavaScript source code, rather than file names.

- `mangle` — pass `false` to skip mangling names.

- `output` (default `null`) — pass an object if you wish to specify
  additional [output options][codegen].  The defaults are optimized
  for best compression.

- `compress` (default `{}`) — pass `false` to skip compressing entirely.
  Pass an object to specify custom [compressor options][compressor].

We could add more options to `UglifyJS.minify` — if you need additional
functionality please suggest!

### The hard way

Following there's more detailed API info, in case the `minify` function is
too simple for your needs.

#### The parser
```javascript
var toplevel_ast = UglifyJS.parse(code, options);
```

`options` is optional and if present it must be an object.  The following
properties are available:

- `strict` — disable automatic semicolon insertion and support for trailing
  comma in arrays and objects
- `filename` — the name of the file where this code is coming from
- `toplevel` — a `toplevel` node (as returned by a previous invocation of
  `parse`)

The last two options are useful when you'd like to minify multiple files and
get a single file as the output and a proper source map.  Our CLI tool does
something like this:
```javascript
var toplevel = null;
files.forEach(function(file){
	var code = fs.readFileSync(file);
	toplevel = UglifyJS.parse(code, {
		filename: file,
		toplevel: toplevel
	});
});
```

After this, we have in `toplevel` a big AST containing all our files, with
each token having proper information about where it came from.

#### Scope information

UglifyJS contains a scope analyzer that you need to call manually before
compressing or mangling.  Basically it augments various nodes in the AST
with information about where is a name defined, how many times is a name
referenced, if it is a global or not, if a function is using `eval` or the
`with` statement etc.  I will discuss this some place else, for now what's
important to know is that you need to call the following before doing
anything with the tree:
```javascript
toplevel.figure_out_scope()
```

#### Compression

Like this:
```javascript
var compressor = UglifyJS.Compressor(options);
var compressed_ast = toplevel.transform(compressor);
```

The `options` can be missing.  Available options are discussed above in
“Compressor options”.  Defaults should lead to best compression in most
scripts.

The compressor is destructive, so don't rely that `toplevel` remains the
original tree.

#### Mangling

After compression it is a good idea to call again `figure_out_scope` (since
the compressor might drop unused variables / unreachable code and this might
change the number of identifiers or their position).  Optionally, you can
call a trick that helps after Gzip (counting character frequency in
non-mangleable words).  Example:
```javascript
compressed_ast.figure_out_scope();
compressed_ast.compute_char_frequency();
compressed_ast.mangle_names();
```

#### Generating output

AST nodes have a `print` method that takes an output stream.  Essentially,
to generate code you do this:
```javascript
var stream = UglifyJS.OutputStream(options);
compressed_ast.print(stream);
var code = stream.toString(); // this is your minified code
```

or, for a shortcut you can do:
```javascript
var code = compressed_ast.print_to_string(options);
```

As usual, `options` is optional.  The output stream accepts a lot of otions,
most of them documented above in section “Beautifier options”.  The two
which we care about here are `source_map` and `comments`.

#### Keeping comments in the output

In order to keep certain comments in the output you need to pass the
`comments` option.  Pass a RegExp or a function.  If you pass a RegExp, only
those comments whose body matches the regexp will be kept.  Note that body
means without the initial `//` or `/*`.  If you pass a function, it will be
called for every comment in the tree and will receive two arguments: the
node that the comment is attached to, and the comment token itself.

The comment token has these properties:

- `type`: "comment1" for single-line comments or "comment2" for multi-line
  comments
- `value`: the comment body
- `pos` and `endpos`: the start/end positions (zero-based indexes) in the
  original code where this comment appears
- `line` and `col`: the line and column where this comment appears in the
  original code
- `file` — the file name of the original file
- `nlb` — true if there was a newline before this comment in the original
  code, or if this comment contains a newline.

Your function should return `true` to keep the comment, or a falsy value
otherwise.

#### Generating a source mapping

You need to pass the `source_map` argument when calling `print`.  It needs
to be a `SourceMap` object (which is a thin wrapper on top of the
[source-map][source-map] library).

Example:
```javascript
var source_map = UglifyJS.SourceMap(source_map_options);
var stream = UglifyJS.OutputStream({
	...
	source_map: source_map
});
compressed_ast.print(stream);

var code = stream.toString();
var map = source_map.toString(); // json output for your source map
```

The `source_map_options` (optional) can contain the following properties:

- `file`: the name of the JavaScript output file that this mapping refers to
- `root`: the `sourceRoot` property (see the [spec][sm-spec])
- `orig`: the "original source map", handy when you compress generated JS
  and want to map the minified output back to the original code where it
  came from.  It can be simply a string in JSON, or a JSON object containing
  the original source map.

  [acorn]: https://github.com/marijnh/acorn
  [source-map]: https://github.com/mozilla/source-map
  [sm-spec]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit
  [codegen]: http://lisperator.net/uglifyjs/codegen
  [compressor]: http://lisperator.net/uglifyjs/compress
