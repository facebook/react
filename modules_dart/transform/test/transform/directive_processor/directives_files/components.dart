library angular2.test.transform.directive_processor.directive_files.components;

import 'package:angular2/angular2.dart'
    show Component, Directive, View, NgElement, Output, Input, Provider, ContentChild, ContentChildren, ViewChild, ViewChildren;
import 'dep1.dart';
import 'dep2.dart' as dep2;

@Component(selector: 'component-first')
@View(
    template: '<dep1></dep1><dep2></dep2>',
    directives: [Dep, dep2.Dep],
    pipes: [PipeDep, dep2.PipeDep])
class ComponentFirst {}

@View(
    template: '<dep1></dep1><dep2></dep2>',
    directives: [dep2.Dep, Dep],
    pipes: [dep2.PipeDep, PipeDep])
@Component(selector: 'view-first')
class ViewFirst {}

@Component(
    selector: 'component-only',
    template: '<dep1></dep1><dep2></dep2>',
    directives: [Dep, dep2.Dep],
    pipes: [PipeDep, dep2.PipeDep])
class ComponentOnly {}

@Component(
    selector: 'component-with-outputs',
    template: '<dep1></dep1><dep2></dep2>',
    outputs: ['a'])
class ComponentWithOutputs {
  @Output() Object b;
  @Output('renamed') Object c;

  Object _d;
  @Output() Object get d => _d;

  Object _e;
  @Output('get-renamed') Object get e => _e;
}

@Component(
    selector: 'component-with-inputs',
    template: '<dep1></dep1><dep2></dep2>',
    inputs: ['a'])
class ComponentWithInputs {
  @Input() Object b;
  @Input('renamed') Object c;

  Object _d;
  @Input() void set d(Object value) {
    _d = value;
  }

  Object _e;
  @Input('set-renamed') void set e(Object value) {
    _e = value;
  }
}

@Component(
    selector: 'component-with-inputs',
    template: '<dep1></dep1><dep2></dep2>',
    host: {'[a]': 'a'})
class ComponentWithHostBindings {
  @HostBinding() Object b;
  @HostBinding('renamed') Object c;

  Object _d;
  @HostBinding() Object get d => _d;

  Object _e;
  @HostBinding('get-renamed') Object get e => _e;
}

@Component(
    selector: 'component-with-inputs',
    template: '<dep1></dep1><dep2></dep2>',
    host: {'(a)': 'onA()'})
class ComponentWithHostListeners {
  @HostListener('b') void onB() {}
  @HostListener('c', ['\$event.target', '\$event.target.value']) void onC(
      t, v) {}
}

@Component(
    selector: 'component-with-providers-types',
    template: '',
    providers: [ServiceDep, dep2.ServiceDep])
class ComponentWithProvidersTypes {}

@Component(
    selector: 'component-with-view-providers-types',
    template: '',
    viewProviders: [ServiceDep])
class ComponentWithViewProvidersTypes {}

@Component(
    selector: 'component-with-bindings-types',
    template: '',
    bindings: [ServiceDep])
class ComponentWithBindingsTypes {}

@Component(
    selector: 'component-with-view-bindings-types',
    template: '',
    viewBindings: [ServiceDep])
class ComponentWithViewBindingsTypes {}

@Component(
    selector: 'component-with-providers-string-token',
    template: '',
    providers: [const Provider("StringDep", useClass: ServiceDep)])
class ComponentWithProvidersStringToken {}

@Component(
    selector: 'ComponentWithProvidersConstToken',
    template: '',
    providers: [const Provider(const ServiceDep(), useClass: ServiceDep)])
class ComponentWithProvidersConstToken {
  ComponentWithProvidersConstToken();
}

@Component(
    selector: 'component-with-providers-use-class',
    template: '',
    providers: [const Provider(ServiceDep, useClass: ServiceDep)])
class ComponentWithProvidersUseClass {}

@Component(selector: 'component-with-di-deps', template: '')
class ComponentWithDiDeps {
  ServiceDep arg11;
  ServiceDep arg13;

  ComponentWithDiDeps(
      ServiceDep arg1,
      @Inject(ServiceDep) arg2,
      @Attribute('one') arg3,
      @Self() ServiceDep arg4,
      @SkipSelf() ServiceDep arg5,
      @Optional() ServiceDep arg6,
      @Query(ServiceDep, descendants: true, read: ServiceDep) arg7,
      @ContentChildren(ServiceDep) arg8,
      @ViewQuery("one,two", read: "three") arg9,
      @ViewChildren("one,two") arg10,
      this.arg11,
      [@Optional() ServiceDep arg12,
      @Optional() this.arg13]
  );
}

@Component(
    selector: 'component-with-providers-use-class',
    template: '',
    providers: [const Provider(ServiceDep, useClass: ServiceDep)])
class ComponentWithProvidersUseClass {}

@Component(
    selector: 'component-with-providers-to-class',
    template: '',
    providers: [const Binding(ServiceDep, toClass: ServiceDep)])
class ComponentWithProvidersToClass {}

@Component(
    selector: 'component-with-providers-use-existing',
    template: '',
    providers: [const Provider(ServiceDep, useExisting: ServiceDep)])
class ComponentWithProvidersUseExisting {}

@Component(
    selector: 'component-with-providers-to-alias',
    template: '',
    providers: [const Binding(ServiceDep, toAlias: ServiceDep)])
class ComponentWithProvidersToAlias {}

@Component(
    selector: 'component-with-providers-use-existing-string',
    template: '',
    providers: [const Provider(ServiceDep, useExisting: 'StrToken')])
class ComponentWithProvidersUseExistingStr {}

@Component(
    selector: 'component-with-providers-use-value',
    template: '',
    providers: [const Provider(ServiceDep, useValue: ServiceDep)])
class ComponentWithProvidersUseValue {}

@Component(
    selector: 'component-with-providers-to-value',
    template: '',
    providers: [const Binding(ServiceDep, toValue: ServiceDep)])
class ComponentWithProvidersToValue {}

@Component(
    selector: 'component-with-providers-use-value-string',
    template: '',
    providers: [const Provider(ServiceDep, useValue: 'StrToken')])
class ComponentWithProvidersUseValueStr {}

@Component(
    selector: 'component-with-providers-use-value-num',
    template: '',
    providers: [const Provider(ServiceDep, useValue: 42)])
class ComponentWithProvidersUseValueNum {}

@Component(
    selector: 'component-with-providers-use-value-bool',
    template: '',
    providers: [const Provider(ServiceDep, useValue: true)])
class ComponentWithProvidersUseValueBool {}

@Component(
    selector: 'component-with-providers-use-value-null',
    template: '',
    providers: [const Provider(ServiceDep, useValue: null)])
class ComponentWithProvidersUseValueNull {}

@Component(
    selector: 'component-with-providers-use-factory',
    template: '',
    providers: [
      const Provider(ServiceDep, useFactory: funcDep, deps: const [
        ServiceDep,
        "Str",
        [const Inject(ServiceDep)],
        [ServiceDep, const Self()],
        [ServiceDep, const SkipSelf()],
        [ServiceDep, const Optional()]
      ])
    ])
class ComponentWithProvidersUseFactory {}

@Component(
    selector: 'component-with-providers-to-factory',
    template: '',
    providers: [const Binding(ServiceDep, toFactory: funcDep)])
class ComponentWithProvidersToFactory {}

@Component(selector: 'component-with-di-deps-string-token', template: '')
class ComponentWithDiDepsStrToken {
  ComponentWithDiDepsStrToken(@Inject("StringDep") arg1);
}

@Component(
    selector: 'component-with-queries',
    template: '')
class ComponentWithQueries {
  @ContentChild('child') var contentChild;
  @ContentChildren('child', descendants: true) var contentChildren;

  @ViewChild('child') var viewChild;
  @ViewChildren('child') var viewChildren;

  @ContentChild('child') set contentChildSetter(s){}
  @ContentChildren('child', descendants: true) set contentChildrenSetter(s){}

  @ViewChild('child') set viewChildSetter(s){}
  @ViewChildren('child') set viewChildrenSetter(s){}
}

funcDep() {}

@Injectable()
factoryWithDeps(ServiceDep a,
        @Inject("Str") b,
        @Inject(ServiceDep) c,
        @Self ServiceDep d,
        @SkipSelf ServiceDep e,
        @Optional ServiceDep f) {}