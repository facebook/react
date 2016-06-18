# Developer Tools for Dart

Use these tools and techniques to increase your app's performance
and reliability.

* [Angular debugging tools](#angular-debugging-tools)
* [Code size](#code-size)
* [Performance](#performance)


## Angular debugging tools

Starting with alpha.38, Angular provides a set of debugging tools
that are accessible from any browser's developer console.
In Chrome, you can get to the dev console by pressing
Ctrl + Shift + J (on Mac: Cmd + Opt + J).

### Enabling the debugging tools

By default the debugging tools are disabled.
Enable the debugging tools as follows:

```dart
import 'package:angular2/platform/browser.dart';

main() async {
  var appRef = await bootstrap(Application);
  enableDebugTools(appRef);
}
```

<!-- Change function name to enableDebuggingTools? -->


### Using the debugging tools

In the browser, open the dev console. The top-level object is called `ng` and
contains more specific tools inside it.

For example, to run the change detection profiler on your app:

```javascript
// In the dev console:
ng.profiler.timeChangeDetection();
```

The [Change detection profiler](#change-detection-profiler) section
has more details.
<!-- Point to API docs when they're published, if they're useful.
They should be under
http://www.dartdocs.org/documentation/angular2/latest
and/or
https://angular.io/docs/js/latest/api/. -->


## Code size

Code must be downloaded, parsed, and executed. Too much code can lead to
slow application start-up time, especially on slow networks and low-end devices.
The tools and techniques in this section can help you to identify
unnecessarily large code and to reduce code size.

### Finding contributors to code size

Options for investigating code size include the `--dump-info` dart2js option,
ng2soyc, `reflector.trackUsage()`, and code coverage information
from the Dart VM.

#### Use --dump-info

The `--dump-info` option of `dart2js` outputs information about what happened
during compilation. You can specify `--dump-info` in `pubspec.yaml`:

```yaml
transformers:
...
- $dart2js:
    commandLineOptions:
    - --dump-info
```

The [Dump Info Visualizer](https://github.com/dart-lang/dump-info-visualizer)
can help you analyze the output.
For more information, see the
[dart2js_info API reference](http://dart-lang.github.io/dart2js_info/doc/api/).

#### Use ng2soyc.dart

[ng2soyc](https://github.com/angular/ng2soyc.dart) is a utility for analyzing
code size contributors in Angular 2 applications. It groups code size by
library and, assuming your library names follow
[standard naming conventions](https://www.dartlang.org/articles/style-guide/#do-prefix-library-names-with-the-package-name-and-a-dot-separated-path)
(package.library.sublibrary...), gives the code size breakdown at
each level. To reduce noise in the output of very large apps, ng2soyc provides
an option to hide libraries that are too small, so you can focus on the biggest
contributors.

#### Find unused reflection data

Your app might have types that are annotated with `@Component` or `@Injectable`
but never used.
To find these unused types, use `reflector.trackUsage()` and then,
after exercising your app, `reflector.listUnusedKeys()`.
For example:

```
import 'package:angular2/src/core/reflection/reflection.dart';
...
main() async {
  reflector.trackUsage();
  await bootstrap(AppComponent);
  print('Unused keys: ${reflector.listUnusedKeys()}');
}
```

When you run that code (in Dartium or another browser),
you'll see a list of types that Angular _can_ inject but hasn't needed to.
Consider removing those types or their `@Component`/`@Injectable` annotation
to decrease your app's code size.

Three conditions must be true for `listUnusedKeys()` to return helpful data:

1. The angular2 transformer must run on the app.
2. If you're running a JavaScript version of the app,
   the app must not be minified, so that the names are readable.
3. You must exercise your app in as many ways as possible
   before calling `listUnusedKeys()`.
   Otherwise, you might get false positives:
   keys that haven't been used only because you didn't exercise
   the relevant feature of the app.

To run the angular2 transformer, first specify it in `pubspec.yaml`:

```
name: hello_world
...
transformers:
- angular2:
    entry_points: web/main.dart
```

Then use pub to run the transformer. If you use `pub serve`,
it provides both Dart and unminified (by default) JavaScript versions.
If you want to serve actual files, then use `pub build` in debug mode
to generate Dart and unminified JavaScript files:
`pub build --mode=debug`.

The `reflector.trackUsage()` method makes Angular track the reflection
information used by the app. Reflection information (`ReflectionInfo`) is a data
structure that stores information that Angular uses for locating DI factories
and for generating change detectors and other code related to a
given type.

#### Use code coverage to find dead code

When running in Dartium (or in the Dart VM, in general) you can request code
coverage information from the VM. You can either use
[observatory](https://www.dartlang.org/tools/observatory/) or download
the coverage file and use your own tools to inspect it. Lines of code that are
not covered are top candidates for dead code.

Keep in mind, however, that uncovered code is not sufficient evidence of dead
code, only necessary evidence. It is perfectly possible that you simply didn't
exercise your application in a way that triggers the execution of uncovered
code. A common example is error handling code. Just because your testing never
encountered an error does not mean the error won't happen in production. You
therefore don't have to rush and remove all the `catch` blocks.

### Reducing code size

To reduce code size, you can disable reflection,
enable minification, and manually remove dead code.
You can also try less safe options such as
telling dart2js to trust type annotations.


#### Disable reflection

`dart:mirrors` allows discovering program metadata at runtime. However, this
means that `dart2js` needs to retain that metadata and thus increase the size
of resulting JS output. In practice, however, it is possible to extract most
metadata necessary for your metaprogramming tasks statically using a
transformer and `package:analyzer`, and act on it before compiling to JS.

#### Enable minification

Minification shortens all your `longMethodNames` into 2- or 3-letter long
symbols. `dart2js` ensures that this kind of renaming is done safely, without
breaking the functionality of your programs. You can enable it in `pubspec.yaml`
under `$dart2js` transformer:

```yaml
transformers:
...
- $dart2js:
    minify: true
```

#### Manually remove dead code

`dart2js` comes with dead code elimination out-of-the-box. However, it may not
always be able to tell if a piece of code could be used. Consider the following
example:

```dart
/// This function decides which serialization format to use
void setupSerializers() {
  if (server.doYouSupportProtocolBuffers()) {
    useProtobufSerializers();
  } else {
    useJsonSerializers();
  }
}
```

In this example the application asks the server what kind of serialization
format it uses and dynamically chooses one or the other. `dart2js` can't
tell whether the server responds with yes or no, so it must retain both
kinds of serializers. However, if you know that your server supports
protocol buffers, you can remove that `if` block entirely and default to
protocol buffers.

Code coverage (see above) is a good way to find dead code in your app.

#### Unsafe options

Dart also provides more aggressive optimization options. However, you have to
be careful when using them and as of today the benefits aren't that clear. If
your type annotations are inaccurate you may end up with non-Darty runtime
behavior, including the classic "undefined is not a function" tautology, as
well as the "keep on truckin'" behavior, e.g. `null + 1 == 1` and
`{} + [] == 0`.

`--trust-type-annotations` tells `dart2js` to trust that your type annotations
are correct. So if you have a function `foo(Bar bar)` the compiler can omit the
check that `bar` is truly `Bar` when calling methods on it.

`--trust-primitives` tells `dart2js` that primitive types, such as numbers and
booleans are never `null` when performing arithmetic, and that your program
does not run into range error when operating on lists, letting the compiler
remove some of the error checking code.

Specify these options in `pubspec.yaml`.

Example:

```yaml
transformers:
...
- $dart2js:
    commandLineOptions:
    - --trust-type-annotations
    - --trust-primitives
```

## Performance

### Change detection profiler

If your application is janky (it misses frames) or is slow according to other
metrics, you need to find out why. This tool helps by measuring the average
speed of _change detection_, a phase in Angular's
lifecycle that detects changes in values that are bound to the UI.
Janky UI updates can result from slowness either in _computing_ the changes or
in _applying_ those changes to the UI.

For your app to be performant, the process of _computing_ changes must be very
fast—preferably **under 3 milliseconds**.
Fast change computation leaves room for
the application logic, UI updates, and browser rendering pipeline
to fit within a 16 ms frame (assuming a target frame rate of 60 FPS).

The change detection profiler repeatedly performs change detection
without invoking any user actions, such as clicking buttons or entering
text in input fields. It then computes the average amount of time
(in milliseconds) to perform a single cycle of change detection and
prints that to the console. This number depends on the current state of the UI. You are likely to see different numbers
as you go from one screen in your application to another.

#### Running the profiler

Before running the profiler, enable the debugging tools
and put the app into the state you want to measure:

1. If you haven't already done so,
   [enable the debugging tools](#enabling-the-debugging-tools).
2. Navigate the app to a screen whose performance you want to profile.
3. Make sure the screen is in a state that you want to measure.
   For example, you might want to profile the screen several times,
   with different amounts and kinds of data.

To run the profiler, enter the following in the dev console:

```javascript
ng.profiler.timeChangeDetection();
```

The results are visible in the console.


#### Recording CPU profiles

To record a profile, pass `{record: true}` to `timeChangeDetection()`:

```javascript
ng.profiler.timeChangeDetection({record: true});
```

Then open the **Profiles** tab. The recorded profile has the title
**Change Detection**. In Chrome, if you record the profile repeatedly, all the
profiles are nested under Change Detection.


#### Interpreting the numbers

In a properly designed application, repeated attempts to detect changes without
any user actions result in no changes to the UI. It is
also desirable to have the cost of a user action be proportional to the amount
of UI changes required. For example, popping up a menu with 5 items should be
vastly faster than rendering a table of 500 rows and 10 columns. Therefore,
change detection with no UI updates should be as fast as possible.

#### Investigating slow change detection

So you found a screen in your application on which the profiler reports a very
high number (i.e. >3ms). This is where a recorded CPU profile can help. Enable
recording while profiling:

```javascript
ng.profiler.timeChangeDetection({record: true});
```

Then look for hot spots using
[Chrome CPU profiler](https://developer.chrome.com/devtools/docs/cpu-profiling).

#### Reducing change detection cost

There are many reasons for slow change detection. To gain intuition about
possible causes it helps to understand how change detection works. Such a
discussion is outside the scope of this document,
but here are some key concepts.

<!-- TODO: link to change detection docs -->

By default, Angular uses a _dirty checking_ mechanism to find model changes.
This mechanism involves evaluating every bound expression that's active on the
UI. These usually include text interpolation via `{{expression}}` and property
bindings via `[prop]="expression"`. If any of the evaluated expressions are
costly to compute, they might contribute to slow change detection. A good way to
speed things up is to use plain class fields in your expressions and avoid any
kind of computation. For example:

```dart
@View(
  template: '<button [enabled]="isEnabled">{{title}}</button>'
)
class FancyButton {
  // GOOD: no computation, just returns the value
  bool isEnabled;

  // BAD: computes the final value upon request
  String _title;
  String get title => _title.trim().toUpperCase();
}
```

Most cases like these can be solved by precomputing the value and storing the
final value in a field.

Angular also supports a second type of change detection: the _push_ model. In
this model, Angular does not poll your component for changes. Instead, the
component tells Angular when it changes, and only then does Angular perform
the update. This model is suitable in situations when your data model uses
observable or immutable objects.

<!-- TODO: link to discussion of push model -->
