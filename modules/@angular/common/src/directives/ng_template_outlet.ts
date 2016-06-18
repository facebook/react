import {Directive, EmbeddedViewRef, Input, TemplateRef, ViewContainerRef} from '@angular/core';

import {isPresent} from '../facade/lang';



/**
 * Creates and inserts an embedded view based on a prepared `TemplateRef`.
 * You can attach a context object to the `EmbeddedViewRef` by setting `[ngOutletContext]`.
 * `[ngOutletContext]` should be an object, the object's keys will be the local template variables
 * available within the `TemplateRef`.
 *
 * Note: using the key `$implicit` in the context object will set it's value as default.
 *
 * ### Syntax
 * - `<template [ngTemplateOutlet]="templateRefExpression"
 * [ngOutletContext]="objectExpression"></template>`
 *
 * @experimental
 */
@Directive({selector: '[ngTemplateOutlet]'})
export class NgTemplateOutlet {
  private _viewRef: EmbeddedViewRef<any>;
  private _context: Object;
  private _templateRef: TemplateRef<any>;

  constructor(private _viewContainerRef: ViewContainerRef) {}

  @Input()
  set ngOutletContext(context: Object) {
    if (this._context !== context) {
      this._context = context;
      if (isPresent(this._viewRef)) {
        this.createView();
      }
    }
  }

  @Input()
  set ngTemplateOutlet(templateRef: TemplateRef<Object>) {
    if (this._templateRef !== templateRef) {
      this._templateRef = templateRef;
      this.createView();
    }
  }

  private createView() {
    if (isPresent(this._viewRef)) {
      this._viewContainerRef.remove(this._viewContainerRef.indexOf(this._viewRef));
    }

    if (isPresent(this._templateRef)) {
      this._viewRef = this._viewContainerRef.createEmbeddedView(this._templateRef, this._context);
    }
  }
}
