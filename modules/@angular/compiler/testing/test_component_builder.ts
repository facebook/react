import {AnimationEntryMetadata, ChangeDetectorRef, ComponentFactory, ComponentRef, ComponentResolver, DebugElement, ElementRef, Injectable, Injector, NgZone, NgZoneError, OpaqueToken, ViewMetadata, getDebugNode} from '@angular/core';
import {tick} from '@angular/core/testing';

import {DirectiveResolver, ViewResolver} from '../index';
import {ObservableWrapper, PromiseCompleter, PromiseWrapper} from '../src/facade/async';
import {ListWrapper, MapWrapper} from '../src/facade/collection';
import {BaseException} from '../src/facade/exceptions';
import {IS_DART, Type, isBlank, isPresent, scheduleMicroTask} from '../src/facade/lang';

/**
 * An abstract class for inserting the root test component element in a platform independent way.
 */
export class TestComponentRenderer {
  insertRootElement(rootElementId: string) {}
}

export var ComponentFixtureAutoDetect = new OpaqueToken('ComponentFixtureAutoDetect');
export var ComponentFixtureNoNgZone = new OpaqueToken('ComponentFixtureNoNgZone');

/**
 * Fixture for debugging and testing a component.
 */
export class ComponentFixture<T> {
  /**
   * The DebugElement associated with the root element of this component.
   */
  debugElement: DebugElement;

  /**
   * The instance of the root component class.
   */
  componentInstance: any;

  /**
   * The native element at the root of the component.
   */
  nativeElement: any;

  /**
   * The ElementRef for the element at the root of the component.
   */
  elementRef: ElementRef;

  /**
   * The ComponentRef for the component
   */
  componentRef: ComponentRef<T>;

  /**
   * The ChangeDetectorRef for the component
   */
  changeDetectorRef: ChangeDetectorRef;

  /**
   * The NgZone in which this component was instantiated.
   */
  ngZone: NgZone;

  private _autoDetect: boolean;

  private _isStable: boolean = true;
  private _completer: PromiseCompleter<any> = null;
  private _onUnstableSubscription: any /** TODO #9100 */ = null;
  private _onStableSubscription: any /** TODO #9100 */ = null;
  private _onMicrotaskEmptySubscription: any /** TODO #9100 */ = null;
  private _onErrorSubscription: any /** TODO #9100 */ = null;

  constructor(componentRef: ComponentRef<T>, ngZone: NgZone, autoDetect: boolean) {
    this.changeDetectorRef = componentRef.changeDetectorRef;
    this.elementRef = componentRef.location;
    this.debugElement = <DebugElement>getDebugNode(this.elementRef.nativeElement);
    this.componentInstance = componentRef.instance;
    this.nativeElement = this.elementRef.nativeElement;
    this.componentRef = componentRef;
    this.ngZone = ngZone;
    this._autoDetect = autoDetect;

    if (ngZone != null) {
      this._onUnstableSubscription =
          ObservableWrapper.subscribe(ngZone.onUnstable, (_) => { this._isStable = false; });
      this._onMicrotaskEmptySubscription =
          ObservableWrapper.subscribe(ngZone.onMicrotaskEmpty, (_) => {
            if (this._autoDetect) {
              // Do a change detection run with checkNoChanges set to true to check
              // there are no changes on the second run.
              this.detectChanges(true);
            }
          });
      this._onStableSubscription = ObservableWrapper.subscribe(ngZone.onStable, (_) => {
        this._isStable = true;
        // Check whether there are no pending macrotasks in a microtask so that ngZone gets a chance
        // to update the state of pending macrotasks.
        scheduleMicroTask(() => {
          if (!this.ngZone.hasPendingMacrotasks) {
            if (this._completer != null) {
              this._completer.resolve(true);
              this._completer = null;
            }
          }
        });
      });

      this._onErrorSubscription = ObservableWrapper.subscribe(
          ngZone.onError, (error: NgZoneError) => { throw error.error; });
    }
  }

  private _tick(checkNoChanges: boolean) {
    this.changeDetectorRef.detectChanges();
    if (checkNoChanges) {
      this.checkNoChanges();
    }
  }

  /**
   * Trigger a change detection cycle for the component.
   */
  detectChanges(checkNoChanges: boolean = true): void {
    if (this.ngZone != null) {
      // Run the change detection inside the NgZone so that any async tasks as part of the change
      // detection are captured by the zone and can be waited for in isStable.
      this.ngZone.run(() => { this._tick(checkNoChanges); });
    } else {
      // Running without zone. Just do the change detection.
      this._tick(checkNoChanges);
    }
  }

  /**
   * Do a change detection run to make sure there were no changes.
   */
  checkNoChanges(): void { this.changeDetectorRef.checkNoChanges(); }

  /**
   * Set whether the fixture should autodetect changes.
   *
   * Also runs detectChanges once so that any existing change is detected.
   */
  autoDetectChanges(autoDetect: boolean = true) {
    if (this.ngZone == null) {
      throw new BaseException('Cannot call autoDetectChanges when ComponentFixtureNoNgZone is set');
    }
    this._autoDetect = autoDetect;
    this.detectChanges();
  }

  /**
   * Return whether the fixture is currently stable or has async tasks that have not been completed
   * yet.
   */
  isStable(): boolean { return this._isStable && !this.ngZone.hasPendingMacrotasks; }

  /**
   * Get a promise that resolves when the fixture is stable.
   *
   * This can be used to resume testing after events have triggered asynchronous activity or
   * asynchronous change detection.
   */
  whenStable(): Promise<any> {
    if (this.isStable()) {
      return PromiseWrapper.resolve(false);
    } else if (this._completer !== null) {
      return this._completer.promise;
    } else {
      this._completer = new PromiseCompleter<any>();
      return this._completer.promise;
    }
  }

  /**
   * Trigger component destruction.
   */
  destroy(): void {
    this.componentRef.destroy();
    if (this._onUnstableSubscription != null) {
      ObservableWrapper.dispose(this._onUnstableSubscription);
      this._onUnstableSubscription = null;
    }
    if (this._onStableSubscription != null) {
      ObservableWrapper.dispose(this._onStableSubscription);
      this._onStableSubscription = null;
    }
    if (this._onMicrotaskEmptySubscription != null) {
      ObservableWrapper.dispose(this._onMicrotaskEmptySubscription);
      this._onMicrotaskEmptySubscription = null;
    }
    if (this._onErrorSubscription != null) {
      ObservableWrapper.dispose(this._onErrorSubscription);
      this._onErrorSubscription = null;
    }
  }
}

var _nextRootElementId = 0;

/**
 * Builds a ComponentFixture for use in component level tests.
 */
@Injectable()
export class TestComponentBuilder {
  /** @internal */
  _bindingsOverrides = new Map<Type, any[]>();
  /** @internal */
  _directiveOverrides = new Map<Type, Map<Type, Type>>();
  /** @internal */
  _templateOverrides = new Map<Type, string>();
  /** @internal */
  _animationOverrides = new Map<Type, AnimationEntryMetadata[]>();
  /** @internal */
  _viewBindingsOverrides = new Map<Type, any[]>();
  /** @internal */
  _viewOverrides = new Map<Type, ViewMetadata>();


  constructor(private _injector: Injector) {}

  /** @internal */
  _clone(): TestComponentBuilder {
    let clone = new TestComponentBuilder(this._injector);
    clone._viewOverrides = MapWrapper.clone(this._viewOverrides);
    clone._directiveOverrides = MapWrapper.clone(this._directiveOverrides);
    clone._templateOverrides = MapWrapper.clone(this._templateOverrides);
    clone._bindingsOverrides = MapWrapper.clone(this._bindingsOverrides);
    clone._viewBindingsOverrides = MapWrapper.clone(this._viewBindingsOverrides);
    return clone;
  }

  /**
   * Overrides only the html of a {@link ComponentMetadata}.
   * All the other properties of the component's {@link ViewMetadata} are preserved.
   */
  overrideTemplate(componentType: Type, template: string): TestComponentBuilder {
    let clone = this._clone();
    clone._templateOverrides.set(componentType, template);
    return clone;
  }

  overrideAnimations(componentType: Type, animations: AnimationEntryMetadata[]):
      TestComponentBuilder {
    var clone = this._clone();
    clone._animationOverrides.set(componentType, animations);
    return clone;
  }

  /**
   * Overrides a component's {@link ViewMetadata}.
   */
  overrideView(componentType: Type, view: ViewMetadata): TestComponentBuilder {
    let clone = this._clone();
    clone._viewOverrides.set(componentType, view);
    return clone;
  }

  /**
   * Overrides the directives from the component {@link ViewMetadata}.
   */
  overrideDirective(componentType: Type, from: Type, to: Type): TestComponentBuilder {
    let clone = this._clone();
    let overridesForComponent = clone._directiveOverrides.get(componentType);
    if (!isPresent(overridesForComponent)) {
      clone._directiveOverrides.set(componentType, new Map<Type, Type>());
      overridesForComponent = clone._directiveOverrides.get(componentType);
    }
    overridesForComponent.set(from, to);
    return clone;
  }

  /**
   * Overrides one or more injectables configured via `providers` metadata property of a directive
   * or
   * component.
   * Very useful when certain providers need to be mocked out.
   *
   * The providers specified via this method are appended to the existing `providers` causing the
   * duplicated providers to
   * be overridden.
   */
  overrideProviders(type: Type, providers: any[]): TestComponentBuilder {
    let clone = this._clone();
    clone._bindingsOverrides.set(type, providers);
    return clone;
  }

  /**
   * @deprecated
   */
  overrideBindings(type: Type, providers: any[]): TestComponentBuilder {
    return this.overrideProviders(type, providers);
  }

  /**
   * Overrides one or more injectables configured via `providers` metadata property of a directive
   * or
   * component.
   * Very useful when certain providers need to be mocked out.
   *
   * The providers specified via this method are appended to the existing `providers` causing the
   * duplicated providers to
   * be overridden.
   */
  overrideViewProviders(type: Type, providers: any[]): TestComponentBuilder {
    let clone = this._clone();
    clone._viewBindingsOverrides.set(type, providers);
    return clone;
  }

  /**
   * @deprecated
   */
  overrideViewBindings(type: Type, providers: any[]): TestComponentBuilder {
    return this.overrideViewProviders(type, providers);
  }

  private _create<C>(ngZone: NgZone, componentFactory: ComponentFactory<C>): ComponentFixture<C> {
    let rootElId = `root${_nextRootElementId++}`;
    var testComponentRenderer: TestComponentRenderer = this._injector.get(TestComponentRenderer);
    testComponentRenderer.insertRootElement(rootElId);

    var componentRef = componentFactory.create(this._injector, [], `#${rootElId}`);
    let autoDetect: boolean = this._injector.get(ComponentFixtureAutoDetect, false);
    return new ComponentFixture<any /*C*/>(componentRef, ngZone, autoDetect);
  }

  /**
   * Builds and returns a ComponentFixture.
   */
  createAsync(rootComponentType: Type): Promise<ComponentFixture<any>> {
    let noNgZone = IS_DART || this._injector.get(ComponentFixtureNoNgZone, false);
    let ngZone: NgZone = noNgZone ? null : this._injector.get(NgZone, null);

    let initComponent = () => {
      let mockDirectiveResolver = this._injector.get(DirectiveResolver);
      let mockViewResolver = this._injector.get(ViewResolver);
      this._viewOverrides.forEach((view, type) => mockViewResolver.setView(type, view));
      this._templateOverrides.forEach(
          (template, type) => mockViewResolver.setInlineTemplate(type, template));
      this._animationOverrides.forEach(
          (animationsEntry, type) => mockViewResolver.setAnimations(type, animationsEntry));
      this._directiveOverrides.forEach((overrides, component) => {
        overrides.forEach(
            (to, from) => { mockViewResolver.overrideViewDirective(component, from, to); });
      });
      this._bindingsOverrides.forEach(
          (bindings, type) => mockDirectiveResolver.setProvidersOverride(type, bindings));
      this._viewBindingsOverrides.forEach(
          (bindings, type) => mockDirectiveResolver.setViewProvidersOverride(type, bindings));

      let promise: Promise<ComponentFactory<any>> =
          this._injector.get(ComponentResolver).resolveComponent(rootComponentType);
      return promise.then(componentFactory => this._create(ngZone, componentFactory));
    };

    return ngZone == null ? initComponent() : ngZone.run(initComponent);
  }

  createFakeAsync(rootComponentType: Type): ComponentFixture<any> {
    let result: any /** TODO #9100 */;
    let error: any /** TODO #9100 */;
    PromiseWrapper.then(
        this.createAsync(rootComponentType), (_result) => { result = _result; },
        (_error) => { error = _error; });
    tick();
    if (isPresent(error)) {
      throw error;
    }
    return result;
  }

  createSync<C>(componentFactory: ComponentFactory<C>): ComponentFixture<C> {
    let noNgZone = IS_DART || this._injector.get(ComponentFixtureNoNgZone, false);
    let ngZone: NgZone = noNgZone ? null : this._injector.get(NgZone, null);

    let initComponent = () => this._create(ngZone, componentFactory);
    return ngZone == null ? initComponent() : ngZone.run(initComponent);
  }
}
