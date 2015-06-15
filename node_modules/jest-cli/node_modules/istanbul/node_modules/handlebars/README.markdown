[![Travis Build Status](https://img.shields.io/travis/wycats/handlebars.js/master.svg)](https://travis-ci.org/wycats/handlebars.js)
[![Selenium Test Status](https://saucelabs.com/buildstatus/handlebars)](https://saucelabs.com/u/handlebars)

Handlebars.js
=============

Handlebars.js is an extension to the [Mustache templating
language](http://mustache.github.com/) created by Chris Wanstrath.
Handlebars.js and Mustache are both logicless templating languages that
keep the view and the code separated like we all know they should be.

Checkout the official Handlebars docs site at
[http://www.handlebarsjs.com](http://www.handlebarsjs.com).

Installing
----------
Installing Handlebars is easy. Simply download the package [from the official site](http://handlebarsjs.com/) or the [bower repository][bower-repo] and add it to your web pages (you should usually use the most recent version).

For web browsers, a free CDN is available at [jsDelivr](http://www.jsdelivr.com/#!handlebarsjs).  Advanced usage, such as [version aliasing & concocting](https://github.com/jsdelivr/jsdelivr#usage), is available. 

Alternatively, if you prefer having the latest version of handlebars from
the 'master' branch, passing builds of the 'master' branch are automatically
published to S3. You may download the latest passing master build by grabbing
a `handlebars-latest.js` file from the [builds page][builds-page]. When the
build is published, it is also available as a `handlebars-gitSHA.js` file on
the builds page if you need a version to refer to others.
`handlebars-runtime.js` builds are also available.

**Note**: The S3 builds page is provided as a convenience for the community,
but you should not use it for hosting Handlebars in production.

Usage
-----
In general, the syntax of Handlebars.js templates is a superset
of Mustache templates. For basic syntax, check out the [Mustache
manpage](http://mustache.github.com/mustache.5.html).

Once you have a template, use the `Handlebars.compile` method to compile
the template into a function. The generated function takes a context
argument, which will be used to render the template.

```js
var source = "<p>Hello, my name is {{name}}. I am from {{hometown}}. I have " +
             "{{kids.length}} kids:</p>" +
             "<ul>{{#kids}}<li>{{name}} is {{age}}</li>{{/kids}}</ul>";
var template = Handlebars.compile(source);

var data = { "name": "Alan", "hometown": "Somewhere, TX",
             "kids": [{"name": "Jimmy", "age": "12"}, {"name": "Sally", "age": "4"}]};
var result = template(data);

// Would render:
// <p>Hello, my name is Alan. I am from Somewhere, TX. I have 2 kids:</p>
// <ul>
//   <li>Jimmy is 12</li>
//   <li>Sally is 4</li>
// </ul>
```


Registering Helpers
-------------------

You can register helpers that Handlebars will use when evaluating your
template. Here's an example, which assumes that your objects have a URL
embedded in them, as well as the text for a link:

```js
Handlebars.registerHelper('link_to', function() {
  return new Handlebars.SafeString("<a href='" + Handlebars.Utils.escapeExpression(this.url) + "'>" + Handlebars.Utils.escapeExpression(this.body) + "</a>");
});

var context = { posts: [{url: "/hello-world", body: "Hello World!"}] };
var source = "<ul>{{#posts}}<li>{{link_to}}</li>{{/posts}}</ul>"

var template = Handlebars.compile(source);
template(context);

// Would render:
//
// <ul>
//   <li><a href='/hello-world'>Hello World!</a></li>
// </ul>
```

Helpers take precedence over fields defined on the context. To access a field
that is masked by a helper, a path reference may be used. In the example above
a field named `link_to` on the `context` object would be referenced using:

```
{{./link_to}}
```

Escaping
--------

By default, the `{{expression}}` syntax will escape its contents. This
helps to protect you against accidental XSS problems caused by malicious
data passed from the server as JSON.

To explicitly *not* escape the contents, use the triple-mustache
(`{{{}}}`). You have seen this used in the above example.


Differences Between Handlebars.js and Mustache
----------------------------------------------
Handlebars.js adds a couple of additional features to make writing
templates easier and also changes a tiny detail of how partials work.

### Paths

Handlebars.js supports an extended expression syntax that we call paths.
Paths are made up of typical expressions and `.` characters. Expressions
allow you to not only display data from the current context, but to
display data from contexts that are descendants and ancestors of the
current context.

To display data from descendant contexts, use the `.` character. So, for
example, if your data were structured like:

```js
var data = {"person": { "name": "Alan" }, "company": {"name": "Rad, Inc." } };
```

You could display the person's name from the top-level context with the
following expression:

```
{{person.name}}
```

You can backtrack using `../`. For example, if you've already traversed
into the person object you could still display the company's name with
an expression like `{{../company.name}}`, so:

```
{{#with person}}{{name}} - {{../company.name}}{{/with}}
```

would render:

```
Alan - Rad, Inc.
```

### Strings

When calling a helper, you can pass paths or Strings as parameters. For
instance:

```js
Handlebars.registerHelper('link_to', function(title, options) {
  return "<a href='/posts" + this.url + "'>" + title + "!</a>"
});

var context = { posts: [{url: "/hello-world", body: "Hello World!"}] };
var source = '<ul>{{#posts}}<li>{{{link_to "Post"}}}</li>{{/posts}}</ul>'

var template = Handlebars.compile(source);
template(context);

// Would render:
//
// <ul>
//   <li><a href='/posts/hello-world'>Post!</a></li>
// </ul>
```

When you pass a String as a parameter to a helper, the literal String
gets passed to the helper function.


### Block Helpers

Handlebars.js also adds the ability to define block helpers. Block
helpers are functions that can be called from anywhere in the template.
Here's an example:

```js
var source = "<ul>{{#people}}<li>{{#link}}{{name}}{{/link}}</li>{{/people}}</ul>";
Handlebars.registerHelper('link', function(options) {
  return '<a href="/people/' + this.id + '">' + options.fn(this) + '</a>';
});
var template = Handlebars.compile(source);

var data = { "people": [
    { "name": "Alan", "id": 1 },
    { "name": "Yehuda", "id": 2 }
  ]};
template(data);

// Should render:
// <ul>
//   <li><a href="/people/1">Alan</a></li>
//   <li><a href="/people/2">Yehuda</a></li>
// </ul>
```

Whenever the block helper is called it is given one or more parameters,
any arguments that are passed into the helper in the call, and an `options`
object containing the `fn` function which executes the block's child.
The block's current context may be accessed through `this`.

Block helpers have the same syntax as mustache sections but should not be
confused with one another. Sections are akin to an implicit `each` or
`with` statement depending on the input data and helpers are explicit
pieces of code that are free to implement whatever behavior they like.
The [mustache spec](http://mustache.github.io/mustache.5.html)
defines the exact behavior of sections. In the case of name conflicts,
helpers are given priority.

### Partials

You can register additional templates as partials, which will be used by
Handlebars when it encounters a partial (`{{> partialName}}`). Partials
can either be String templates or compiled template functions. Here's an
example:

```js
var source = "<ul>{{#people}}<li>{{> link}}</li>{{/people}}</ul>";

Handlebars.registerPartial('link', '<a href="/people/{{id}}">{{name}}</a>')
var template = Handlebars.compile(source);

var data = { "people": [
    { "name": "Alan", "id": 1 },
    { "name": "Yehuda", "id": 2 }
  ]};

template(data);

// Should render:
// <ul>
//   <li><a href="/people/1">Alan</a></li>
//   <li><a href="/people/2">Yehuda</a></li>
// </ul>
```

### Comments

You can add comments to your templates with the following syntax:

```js
{{! This is a comment }}
```

You can also use real html comments if you want them to end up in the output.

```html
<div>
    {{! This comment will not end up in the output }}
    <!-- This comment will show up in the output -->
</div>
```


### Compatibility

There are a few Mustache behaviors that Handlebars does not implement.
- Handlebars deviates from Mustache slightly in that it does not perform recursive lookup by default. The compile time `compat` flag must be set to enable this functionality. Users should note that there is a performance cost for enabling this flag. The exact cost varies by template, but it's recommended that performance sensitive operations should avoid this mode and instead opt for explicit path references.
- The optional Mustache-style lambdas are not supported. Instead Handlebars provides it's own lambda resolution that follows the behaviors of helpers.
- Alternative delimeters are not supported.


Precompiling Templates
----------------------

Handlebars allows templates to be precompiled and included as javascript
code rather than the handlebars template allowing for faster startup time.

### Installation
The precompiler script may be installed via npm using the `npm install -g handlebars`
command.

### Usage

<pre>
Precompile handlebar templates.
Usage: handlebars template...

Options:
  -a, --amd            Create an AMD format function (allows loading with RequireJS)          [boolean]
  -f, --output         Output File                                                            [string]
  -k, --known          Known helpers                                                          [string]
  -o, --knownOnly      Known helpers only                                                     [boolean]
  -m, --min            Minimize output                                                        [boolean]
  -s, --simple         Output template function only.                                         [boolean]
  -r, --root           Template root. Base value that will be stripped from template names.   [string]
  -c, --commonjs       Exports CommonJS style, path to Handlebars module                      [string]
  -h, --handlebarPath  Path to handlebar.js (only valid for amd-style)                        [string]
  -n, --namespace      Template namespace                                                     [string]
  -p, --partial        Compiling a partial template                                           [boolean]
  -d, --data           Include data when compiling                                            [boolean]
  -e, --extension      Template extension.                                                    [string]
  -b, --bom            Removes the BOM (Byte Order Mark) from the beginning of the templates. [boolean]
</pre>

If using the precompiler's normal mode, the resulting templates will be
stored to the `Handlebars.templates` object using the relative template
name sans the extension. These templates may be executed in the same
manner as templates.

If using the simple mode the precompiler will generate a single
javascript method. To execute this method it must be passed to
the `Handlebars.template` method and the resulting object may be used as normal.

### Optimizations

- Rather than using the full _handlebars.js_ library, implementations that
  do not need to compile templates at runtime may include _handlebars.runtime.js_
  whose min+gzip size is approximately 1k.
- If a helper is known to exist in the target environment they may be defined
  using the `--known name` argument may be used to optimize accesses to these
  helpers for size and speed.
- When all helpers are known in advance the `--knownOnly` argument may be used
  to optimize all block helper references.
- Implementations that do not use `@data` variables can improve performance of
  iteration centric templates by specifying `{data: false}` in the compiler options.

Supported Environments
----------------------

Handlebars has been designed to work in any ECMAScript 3 environment. This includes

- Node.js
- Chrome
- Firefox
- Safari 5+
- Opera 11+
- IE 6+

Older versions and other runtimes are likely to work but have not been formally
tested. The compiler requires `JSON.stringify` to be implemented natively or via a polyfill. If using the precompiler this is not necessary.

[![Selenium Test Status](https://saucelabs.com/browser-matrix/handlebars.svg)](https://saucelabs.com/u/handlebars)

Performance
-----------

In a rough performance test, precompiled Handlebars.js templates (in
the original version of Handlebars.js) rendered in about half the
time of Mustache templates. It would be a shame if it were any other
way, since they were precompiled, but the difference in architecture
does have some big performance advantages. Justin Marney, a.k.a.
[gotascii](http://github.com/gotascii), confirmed that with an
[independent test](http://sorescode.com/2010/09/12/benchmarks.html). The
rewritten Handlebars (current version) is faster than the old version,
with many [performance tests](https://travis-ci.org/wycats/handlebars.js/builds/33392182#L538) being 5 to 7 times faster than the Mustache equivalent.


Upgrading
---------

See [release-notes.md](https://github.com/wycats/handlebars.js/blob/master/release-notes.md) for upgrade notes.

Known Issues
------------

See [FAQ.md](https://github.com/wycats/handlebars.js/blob/master/FAQ.md) for known issues and common pitfalls.


Handlebars in the Wild
----------------------

* [Assemble](http://assemble.io), by [@jonschlinkert](https://github.com/jonschlinkert)
  and [@doowb](https://github.com/doowb), is a static site generator that uses Handlebars.js
  as its template engine.
* [CoSchedule](http://coschedule.com) An editorial calendar for WordPress that uses Handlebars.js
* [Ember.js](http://www.emberjs.com) makes Handlebars.js the primary way to
  structure your views, also with automatic data binding support.
* [Ghost](https://ghost.org/) Just a blogging platform.
* [handlebars_assets](http://github.com/leshill/handlebars_assets): A Rails Asset Pipeline gem
  from Les Hill (@leshill).
* [handlebars-helpers](https://github.com/assemble/handlebars-helpers) is an extensive library
  with 100+ handlebars helpers.
* [hbs](http://github.com/donpark/hbs): An Express.js view engine adapter for Handlebars.js,
  from Don Park.
* [koa-hbs](https://github.com/jwilm/koa-hbs): [koa](https://github.com/koajs/koa) generator based
  renderer for Handlebars.js.
* [jblotus](http://github.com/jblotus) created [http://tryhandlebarsjs.com](http://tryhandlebarsjs.com)
  for anyone who would like to try out Handlebars.js in their browser.
* [jQuery plugin](http://71104.github.io/jquery-handlebars/): allows you to use
  Handlebars.js with [jQuery](http://jquery.com/).
* [Lumbar](http://walmartlabs.github.io/lumbar) provides easy module-based template management for
  handlebars projects.
* [sammy.js](http://github.com/quirkey/sammy) by Aaron Quint, a.k.a. quirkey,
  supports Handlebars.js as one of its template plugins.
* [SproutCore](http://www.sproutcore.com) uses Handlebars.js as its main
  templating engine, extending it with automatic data binding support.
* [YUI](http://yuilibrary.com/yui/docs/handlebars/) implements a port of handlebars
* [Swag](https://github.com/elving/swag) by [@elving](https://github.com/elving) is a growing collection of helpers for handlebars.js. Give your handlebars.js templates some swag son!
* [DOMBars](https://github.com/blakeembrey/dombars) is a DOM-based templating engine built on the Handlebars parser and runtime

External Resources
------------------

* [Gist about Synchronous and asynchronous loading of external handlebars templates](https://gist.github.com/2287070)

Have a project using Handlebars? Send us a [pull request][pull-request]!

License
-------
Handlebars.js is released under the MIT license.

[bower-repo]: https://github.com/components/handlebars.js
[builds-page]: http://builds.handlebarsjs.com.s3.amazonaws.com/bucket-listing.html?sort=lastmod&sortdir=desc
[pull-request]: https://github.com/wycats/handlebars.js/pull/new/master
