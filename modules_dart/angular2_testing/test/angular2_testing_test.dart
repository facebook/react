// Because Angular is using dart:html, we need these tests to run on an actual
// browser. This means that it should be run with `-p dartium` or `-p chrome`.
@TestOn('browser')
import 'package:angular2/angular2.dart'
    show Component, View, NgFor, provide, Inject, Injectable, Optional;

import 'package:test/test.dart';
import 'package:angular2_testing/angular2_testing.dart';

// This is the component we will be testing.
@Component(selector: 'test-cmp')
@View(directives: const [NgFor])
class TestComponent {
  List<num> items;
  TestComponent() {
    this.items = [1, 2];
  }
}

@Injectable()
class TestService {
  String status = 'not ready';

  init() {
    this.status = 'ready';
  }
}

@Component(selector: 'external-template-cmp')
@View(templateUrl: 'test_template.html')
class ExternalTemplateComponent {
  ExternalTemplateComponent() {
  }
}

class MyToken {}

const TEMPLATE =
    '<div><copy-me template=\'ngFor let item of items\'>{{item.toString()}};</copy-me></div>';

void main() {
  initAngularTests();

  setUpProviders(() => [provide(MyToken, useValue: 'my string'), TestService]);

  test('normal function', () {
    var string = 'foo,bar,baz';
    expect(string.split(','), equals(['foo', 'bar', 'baz']));
  });

  ngTest('can grab injected values',
      (@Inject(MyToken) token, TestService testService) {
    expect(token, equals('my string'));
    expect(testService.status, equals('not ready'));
  });

  group('nested ngSetUp', () {
    ngSetUp((TestService testService) {
      testService.init();
    });

    ngTest('ngSetUp modifies injected services', (TestService testService) {
      expect(testService.status, equals('ready'));
    });
  });

  ngTest('create a component using the TestComponentBuilder',
      (TestComponentBuilder tcb) async {
    var rootTC = await tcb
        .overrideTemplate(TestComponent, TEMPLATE)
        .createAsync(TestComponent);

    rootTC.detectChanges();
    expect(rootTC.debugElement.nativeElement.text, equals('1;2;'));
  });

  ngTest('should reflect added elements', (TestComponentBuilder tcb) async {
    var rootTC = await tcb
        .overrideTemplate(TestComponent, TEMPLATE)
        .createAsync(TestComponent);

    rootTC.detectChanges();
    (rootTC.debugElement.componentInstance.items as List<num>).add(3);
    rootTC.detectChanges();

    expect(rootTC.debugElement.nativeElement.text, equals('1;2;3;'));
  });

  ngTest('should allow a component using a templateUrl', (TestComponentBuilder tcb) async {
    var rootTC = await tcb
        .createAsync(ExternalTemplateComponent);

    rootTC.detectChanges();

    expect(rootTC.debugElement.nativeElement.text, equals('from external template\n'));
  });

  group('expected failures', () {
    ngTest('no type in param list', (notTyped) {
      expect(1, equals(2));
    });

    ngSetUp((TestService testService) {
      testService.init();
    });

    // This would fail, since setUpProviders is used after a call to ngSetUp has already
    // initialized the injector.
    group('nested', () {
      setUpProviders(() => [TestService]);

      test('foo', () {
        expect(1 + 1, equals(2));
      });
    });
  }, skip: 'expected failures');
}
