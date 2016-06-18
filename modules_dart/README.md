This directory contains pure Dart packages that use standard pub layout.

# Working with an existing package

1. Run `gulp build.dart`
1. Open the package in any Dart IDE of your choice
1. Tada!

You do not need to rerun step 1 if you are only making changes in
`modules_dart`. However, you do need to run it again after you make a change
in `modules`. This is because these packages depend on code inside the `dist`
directory via `dependency_overrides`. Code in `modules` need to be transpiled
into `dist` before the IDE can "feel" your changes in `modules`.

# Creating a new package

1. Create a new directory with its own `pubspec.yaml` and standard pub layout.
1. Add both a normal dependency on `angular2` _and_ a `dependency_overrides`,
   like this:

```yaml
version: 0.0.0
dependencies:
  angular2: '0.0.0'
dependency_overrides:
  angular2:
    path: ../../dist/dart/angular2
```

The publishing script will automatically rewrite version numbers, so use
`0.0.0` both for your package and `angular2` version. Similarly, do not
include `authors` and `homepage`, as they will be auto-populated. However,
do provide `description`, `name` (prefixed with `angular2_`), `dependencies`,
and `dev_dependencies`.
