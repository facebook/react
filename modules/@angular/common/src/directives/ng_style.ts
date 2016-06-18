import {Directive, DoCheck, ElementRef, KeyValueChangeRecord, KeyValueDiffer, KeyValueDiffers, Renderer} from '@angular/core';

import {isBlank, isPresent} from '../facade/lang';


/**
 * The `NgStyle` directive changes styles based on a result of expression evaluation.
 *
 * An expression assigned to the `ngStyle` property must evaluate to an object and the
 * corresponding element styles are updated based on changes to this object. Style names to update
 * are taken from the object's keys, and values - from the corresponding object's values.
 *
 * ### Syntax
 *
 * - `<div [ngStyle]="{'font-style': style}"></div>`
 * - `<div [ngStyle]="styleExp"></div>` - here the `styleExp` must evaluate to an object
 *
 * ### Example ([live demo](http://plnkr.co/edit/YamGS6GkUh9GqWNQhCyM?p=preview)):
 *
 * ```
 * import {Component} from '@angular/core';
 * import {NgStyle} from '@angular/common';
 *
 * @Component({
 *  selector: 'ngStyle-example',
 *  template: `
 *    <h1 [ngStyle]="{'font-style': style, 'font-size': size, 'font-weight': weight}">
 *      Change style of this text!
 *    </h1>
 *
 *    <hr>
 *
 *    <label>Italic: <input type="checkbox" (change)="changeStyle($event)"></label>
 *    <label>Bold: <input type="checkbox" (change)="changeWeight($event)"></label>
 *    <label>Size: <input type="text" [value]="size" (change)="size = $event.target.value"></label>
 *  `,
 *  directives: [NgStyle]
 * })
 * export class NgStyleExample {
 *    style = 'normal';
 *    weight = 'normal';
 *    size = '20px';
 *
 *    changeStyle($event: any) {
 *      this.style = $event.target.checked ? 'italic' : 'normal';
 *    }
 *
 *    changeWeight($event: any) {
 *      this.weight = $event.target.checked ? 'bold' : 'normal';
 *    }
 * }
 * ```
 *
 * In this example the `font-style`, `font-size` and `font-weight` styles will be updated
 * based on the `style` property's value changes.
 *
 * @stable
 */
@Directive({selector: '[ngStyle]', inputs: ['rawStyle: ngStyle']})
export class NgStyle implements DoCheck {
  /** @internal */
  _rawStyle: {[key: string]: string};
  /** @internal */
  _differ: KeyValueDiffer;

  constructor(
      private _differs: KeyValueDiffers, private _ngEl: ElementRef, private _renderer: Renderer) {}

  set rawStyle(v: {[key: string]: string}) {
    this._rawStyle = v;
    if (isBlank(this._differ) && isPresent(v)) {
      this._differ = this._differs.find(this._rawStyle).create(null);
    }
  }

  ngDoCheck() {
    if (isPresent(this._differ)) {
      var changes = this._differ.diff(this._rawStyle);
      if (isPresent(changes)) {
        this._applyChanges(changes);
      }
    }
  }

  private _applyChanges(changes: any): void {
    changes.forEachAddedItem(
        (record: KeyValueChangeRecord) => { this._setStyle(record.key, record.currentValue); });
    changes.forEachChangedItem(
        (record: KeyValueChangeRecord) => { this._setStyle(record.key, record.currentValue); });
    changes.forEachRemovedItem(
        (record: KeyValueChangeRecord) => { this._setStyle(record.key, null); });
  }

  private _setStyle(name: string, val: string): void {
    this._renderer.setElementStyle(this._ngEl.nativeElement, name, val);
  }
}
