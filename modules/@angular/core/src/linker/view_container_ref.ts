import {Injector} from '../di/injector';
import {ListWrapper} from '../facade/collection';
import {unimplemented} from '../facade/exceptions';
import {isPresent} from '../facade/lang';
import {WtfScopeFn, wtfCreateScope, wtfLeave} from '../profile/profile';

import {ComponentFactory, ComponentRef} from './component_factory';
import {AppElement} from './element';
import {ElementRef} from './element_ref';
import {TemplateRef} from './template_ref';
import {EmbeddedViewRef, ViewRef, ViewRef_} from './view_ref';


/**
 * Represents a container where one or more Views can be attached.
 *
 * The container can contain two kinds of Views. Host Views, created by instantiating a
 * {@link Component} via {@link #createComponent}, and Embedded Views, created by instantiating an
 * {@link TemplateRef Embedded Template} via {@link #createEmbeddedView}.
 *
 * The location of the View Container within the containing View is specified by the Anchor
 * `element`. Each View Container can have only one Anchor Element and each Anchor Element can only
 * have a single View Container.
 *
 * Root elements of Views attached to this container become siblings of the Anchor Element in
 * the Rendered View.
 *
 * To access a `ViewContainerRef` of an Element, you can either place a {@link Directive} injected
 * with `ViewContainerRef` on the Element, or you obtain it via a {@link ViewChild} query.
 * @stable
 */
export abstract class ViewContainerRef {
  /**
   * Anchor element that specifies the location of this container in the containing View.
   * <!-- TODO: rename to anchorElement -->
   */
  get element(): ElementRef { return <ElementRef>unimplemented(); }

  get injector(): Injector { return <Injector>unimplemented(); }

  get parentInjector(): Injector { return <Injector>unimplemented(); }

  /**
   * Destroys all Views in this container.
   */
  abstract clear(): void;

  /**
   * Returns the {@link ViewRef} for the View located in this container at the specified index.
   */
  abstract get(index: number): ViewRef;

  /**
   * Returns the number of Views currently attached to this container.
   */
  get length(): number { return <number>unimplemented(); };

  /**
   * Instantiates an Embedded View based on the {@link TemplateRef `templateRef`} and inserts it
   * into this container at the specified `index`.
   *
   * If `index` is not specified, the new View will be inserted as the last View in the container.
   *
   * Returns the {@link ViewRef} for the newly created View.
   */
  abstract createEmbeddedView<C>(templateRef: TemplateRef<C>, context?: C, index?: number):
      EmbeddedViewRef<C>;

  /**
   * Instantiates a single {@link Component} and inserts its Host View into this container at the
   * specified `index`.
   *
   * The component is instantiated using its {@link ComponentFactory} which can be
   * obtained via {@link ComponentResolver#resolveComponent}.
   *
   * If `index` is not specified, the new View will be inserted as the last View in the container.
   *
   * You can optionally specify the {@link Injector} that will be used as parent for the Component.
   *
   * Returns the {@link ComponentRef} of the Host View created for the newly instantiated Component.
   */
  abstract createComponent<C>(
      componentFactory: ComponentFactory<C>, index?: number, injector?: Injector,
      projectableNodes?: any[][]): ComponentRef<C>;

  /**
   * Inserts a View identified by a {@link ViewRef} into the container at the specified `index`.
   *
   * If `index` is not specified, the new View will be inserted as the last View in the container.
   *
   * Returns the inserted {@link ViewRef}.
   */
  abstract insert(viewRef: ViewRef, index?: number): ViewRef;

  /**
   * Returns the index of the View, specified via {@link ViewRef}, within the current container or
   * `-1` if this container doesn't contain the View.
   */
  abstract indexOf(viewRef: ViewRef): number;

  /**
   * Destroys a View attached to this container at the specified `index`.
   *
   * If `index` is not specified, the last View in the container will be removed.
   */
  abstract remove(index?: number): void;

  /**
   * Use along with {@link #insert} to move a View within the current container.
   *
   * If the `index` param is omitted, the last {@link ViewRef} is detached.
   */
  abstract detach(index?: number): ViewRef;
}

export class ViewContainerRef_ implements ViewContainerRef {
  constructor(private _element: AppElement) {}

  get(index: number): ViewRef { return this._element.nestedViews[index].ref; }
  get length(): number {
    var views = this._element.nestedViews;
    return isPresent(views) ? views.length : 0;
  }

  get element(): ElementRef { return this._element.elementRef; }

  get injector(): Injector { return this._element.injector; }

  get parentInjector(): Injector { return this._element.parentInjector; }

  // TODO(rado): profile and decide whether bounds checks should be added
  // to the methods below.
  createEmbeddedView<C>(templateRef: TemplateRef<C>, context: C = null, index: number = -1):
      EmbeddedViewRef<C> {
    var viewRef: EmbeddedViewRef<any> = templateRef.createEmbeddedView(context);
    this.insert(viewRef, index);
    return viewRef;
  }

  /** @internal */
  _createComponentInContainerScope: WtfScopeFn =
      wtfCreateScope('ViewContainerRef#createComponent()');

  createComponent<C>(
      componentFactory: ComponentFactory<C>, index: number = -1, injector: Injector = null,
      projectableNodes: any[][] = null): ComponentRef<C> {
    var s = this._createComponentInContainerScope();
    var contextInjector = isPresent(injector) ? injector : this._element.parentInjector;
    var componentRef = componentFactory.create(contextInjector, projectableNodes);
    this.insert(componentRef.hostView, index);
    return wtfLeave(s, componentRef);
  }

  /** @internal */
  _insertScope = wtfCreateScope('ViewContainerRef#insert()');

  // TODO(i): refactor insert+remove into move
  insert(viewRef: ViewRef, index: number = -1): ViewRef {
    var s = this._insertScope();
    if (index == -1) index = this.length;
    var viewRef_ = <ViewRef_<any>>viewRef;
    this._element.attachView(viewRef_.internalView, index);
    return wtfLeave(s, viewRef_);
  }

  indexOf(viewRef: ViewRef): number {
    return ListWrapper.indexOf(this._element.nestedViews, (<ViewRef_<any>>viewRef).internalView);
  }

  /** @internal */
  _removeScope = wtfCreateScope('ViewContainerRef#remove()');

  // TODO(i): rename to destroy
  remove(index: number = -1): void {
    var s = this._removeScope();
    if (index == -1) index = this.length - 1;
    var view = this._element.detachView(index);
    view.destroy();
    // view is intentionally not returned to the client.
    wtfLeave(s);
  }

  /** @internal */
  _detachScope = wtfCreateScope('ViewContainerRef#detach()');

  // TODO(i): refactor insert+remove into move
  detach(index: number = -1): ViewRef {
    var s = this._detachScope();
    if (index == -1) index = this.length - 1;
    var view = this._element.detachView(index);
    return wtfLeave(s, view.ref);
  }

  clear() {
    for (var i = this.length - 1; i >= 0; i--) {
      this.remove(i);
    }
  }
}
