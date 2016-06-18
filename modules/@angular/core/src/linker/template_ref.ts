import {isBlank} from '../facade/lang';

import {AppElement} from './element';
import {ElementRef} from './element_ref';
import {AppView} from './view';
import {EmbeddedViewRef} from './view_ref';

const EMPTY_CONTEXT = /*@ts2dart_const*/ new Object();

/**
 * Represents an Embedded Template that can be used to instantiate Embedded Views.
 *
 * You can access a `TemplateRef`, in two ways. Via a directive placed on a `<template>` element (or
 * directive prefixed with `*`) and have the `TemplateRef` for this Embedded View injected into the
 * constructor of the directive using the `TemplateRef` Token. Alternatively you can query for the
 * `TemplateRef` from a Component or a Directive via {@link Query}.
 *
 * To instantiate Embedded Views based on a Template, use
 * {@link ViewContainerRef#createEmbeddedView}, which will create the View and attach it to the
 * View Container.
 * @stable
 */
export abstract class TemplateRef<C> {
  /**
   * The location in the View where the Embedded View logically belongs to.
   *
   * The data-binding and injection contexts of Embedded Views created from this `TemplateRef`
   * inherit from the contexts of this location.
   *
   * Typically new Embedded Views are attached to the View Container of this location, but in
   * advanced use-cases, the View can be attached to a different container while keeping the
   * data-binding and injection context from the original location.
   *
   */
  // TODO(i): rename to anchor or location
  get elementRef(): ElementRef { return null; }

  abstract createEmbeddedView(context: C): EmbeddedViewRef<C>;
}

export class TemplateRef_<C> extends TemplateRef<C> {
  constructor(private _appElement: AppElement, private _viewFactory: Function) { super(); }

  createEmbeddedView(context: C): EmbeddedViewRef<C> {
    var view: AppView<C> = this._viewFactory(
        this._appElement.parentView.viewUtils, this._appElement.parentInjector, this._appElement);
    if (isBlank(context)) {
      context = <any>EMPTY_CONTEXT;
    }
    view.create(context, null, null);
    return view.ref;
  }

  get elementRef(): ElementRef { return this._appElement.elementRef; }
}
