Contains helpers to run unit tests for angular2 components and injectables,
backed by the `package:test` [library](https://pub.dartlang.org/packages/test).

Usage
-----


Update the dev dependencies in your `pubspec.yaml` to include the angular testing
and test packages:

```yaml
dev_dependencies:
  test: '^0.12.6'
  angular2_testing: any
  
```

Then in your test files, use angular2_testing helpers in place of `setUp` and `test`:

```dart
import 'package:test/test.dart';
import 'package:angular2_testing/angular2_testing.dart';

void main() {
  // This must be called at the beginning of your tests.
  initAngularTests();

  // Initialize the injection tokens you will use in your tests.
  setUpProviders(() => [provide(MyToken, useValue: 'my string'), TestService]);

  // You can then get tokens from the injector via ngSetUp and ngTest.
  ngSetUp((TestService testService) {
    testService.initialize();
  });

  ngTest('can grab injected values', (@Inject(MyToken) token, TestService testService) {
    expect(token, equals('my string'));
    expect(testService.status, equals('ready'));
  });
}
```

Examples
--------

A sample test is available in `test/angular2_testing_test.dart`.
