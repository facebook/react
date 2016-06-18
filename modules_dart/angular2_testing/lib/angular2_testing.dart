library angular2_testing.angular2_testing;

import 'package:test/test.dart';

import 'package:angular2/angular2.dart';
import 'package:angular2/src/core/di/metadata.dart' show InjectMetadata;
import 'package:angular2/src/core/di/reflective_exceptions.dart' show NoAnnotationError;
import 'package:angular2/src/core/reflection/reflection.dart';
import 'package:angular2/src/core/reflection/reflection_capabilities.dart';
import 'package:angular2/src/testing/test_injector.dart';
export 'package:angular2/src/testing/test_component_builder.dart';
export 'package:angular2/src/testing/test_injector.dart' show inject;
import 'package:angular2/platform/testing/browser.dart';

/// One time initialization that must be done for Angular2 component
/// tests. Call before any test methods.
///
/// Example:
///
/// ```
/// main() {
///   initAngularTests();
///   group(...);
/// }
/// ```
void initAngularTests() {
  reflector.reflectionCapabilities = new ReflectionCapabilities();
  setBaseTestProviders(TEST_BROWSER_PLATFORM_PROVIDERS, TEST_BROWSER_APPLICATION_PROVIDERS);
}

void _addTestInjectorTearDown() {
  // Multiple resets are harmless.
  tearDown(() {
    _testInjector.reset();
  });
}

/// Allows overriding default bindings defined in test_injector.dart.
///
/// The given function must return a list of DI providers.
///
/// Example:
///
/// ```
/// setUpProviders(() => [
///   provide(Compiler, useClass: MockCompiler),
///   provide(SomeToken, useValue: myValue),
/// ]);
/// ```
void setUpProviders(Iterable<Provider> providerFactory()) {
  setUp(() {
    try {
      _testInjector.addProviders(providerFactory());
    } catch (e) {
      throw 'setUpProviders was called after the injector had '
          'been used in a setUp or test block. This invalidates the '
          'test injector';
    }
  });

  _addTestInjectorTearDown();
}

dynamic _runInjectableFunction(Function fn) {
  var params = reflector.parameters(fn);
  List<dynamic> tokens = <dynamic>[];
  for (var param in params) {
    var token = null;
    for (var paramMetadata in param) {
      if (paramMetadata is Type) {
        token = paramMetadata;
      } else if (paramMetadata is InjectMetadata) {
        token = paramMetadata.token;
      }
    }
    if (token == null) {
      throw new NoAnnotationError(fn, params);
    }
    tokens.add(token);
  }

  return _testInjector.execute(tokens, fn);
}

/// Use the test injector to get bindings and run a function.
///
/// Example:
///
/// ```
/// ngSetUp((SomeToken token) {
///   token.init();
/// });
/// ```
void ngSetUp(Function fn) {
  setUp(() async {
    await _runInjectableFunction(fn);
  });

  _addTestInjectorTearDown();
}

/// Add a test which can use the test injector.
///
/// Example:
///
/// ```
/// ngTest('description', (SomeToken token) {
///   expect(token, equals('expected'));
/// });
/// ```
void ngTest(String description, Function fn,
    {String testOn, Timeout timeout, skip, Map<String, dynamic> onPlatform}) {
  test(description, () async {
    await _runInjectableFunction(fn);
  }, testOn: testOn, timeout: timeout, skip: skip, onPlatform: onPlatform);

  _addTestInjectorTearDown();
}

final TestInjector _testInjector = getTestInjector();
