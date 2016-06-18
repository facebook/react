import {CollectionChangeRecord, Directive, DoCheck, ElementRef, IterableDiffer, IterableDiffers, KeyValueChangeRecord, KeyValueDiffer, KeyValueDiffers, OnDestroy, Renderer} from '@angular/core';

import {StringMapWrapper, isListLikeIterable} from '../facade/collection';
import {isArray, isPresent, isString} from '../facade/lang';


/**
 * The `NgClass` directive conditionally adds and removes CSS classes on an HTML element based on
 * an expression's evaluation result.
 *
 * The result of an expression evaluation is interpreted differently depending on type of
 * the expression evaluation result:
 * - `string` - all the CSS classes listed in a string (space delimited) are added
 * - `Array` - all the CSS classes (Array elements) are added
 * - `Object` - each key corresponds to a CSS class name while values are interpreted as expressions
 * evaluating to `Boolean`. If a given expression evaluates to `true` a corresponding CSS class
 * is added - otherwise it is removed.
 *
 * While the `NgClass` directive can interpret expressions evaluating to `string`, `Array`
 * or `Object`, the `Object`-based version is the most often used and has an advantage of keeping
 * all the CSS class names in a template.
 *
 * ### Example ([live demo](http://plnkr.co/edit/a4YdtmWywhJ33uqfpPPn?p=preview)):
 *
 * ```
 * import {Component} from '@angular/core';
 * import {NgClass} from '@angular/common';
 *
 * @Component({
 *   selector: 'toggle-button',
 *   inputs: ['isDisabled'],
 *   template: `
 *      <div class="button" [ngClass]="{active: isOn, disabled: isDisabled}"
 *          (click)="toggle(!isOn)">
 *          Click me!
 *      </div>`,
 *   styles: [`
 *     .button {
 *       width: 120px;
 *       border: medium solid black;
 *     }
 *
 *     .active {
 *       background-color: red;
 *    }
 *
 *     .disabled {
 *       color: gray;
 *       border: medium solid gray;
 *     }
 *   `],
 *   directives: [NgClass]
 * })
 * class ToggleButton {
 *   isOn = false;
 *   isDisabled = false;
 *
 *   toggle(newState) {
 *     if (!this.isDisabled) {
 *       this.isOn = newState;
 *     }
 *   }
 * }
 * ```
 *
 * @stable
 */
@Directive({selector: '[ngClass]', inputs: ['rawClass: ngClass', 'initialClasses: class']})
export class NgClass implements DoCheck, OnDestroy {
  private _iterableDiffer: IterableDiffer;
  private _keyValueDiffer: KeyValueDiffer;
  private _initialClasses: string[] = [];
  private _rawClass: string[]|Set<string>;

  constructor(
      private _iterableDiffers: IterableDiffers, private _keyValueDiffers: KeyValueDiffers,
      private _ngEl: ElementRef, private _renderer: Renderer) {}

  set initialClasses(v: string) {
    this._applyInitialClasses(true);
    this._initialClasses = isPresent(v) && isString(v) ? v.split(' ') : [];
    this._applyInitialClasses(false);
    this._applyClasses(this._rawClass, false);
  }

  set rawClass(v: string|string[]|Set<string>|{[key: string]: any}) {
    this._cleanupClasses(this._rawClass);

    if (isString(v)) {
      v = (<string>v).split(' ');
    }

    this._rawClass = <string[]|Set<string>>v;
    this._iterableDiffer = null;
    this._keyValueDiffer = null;
    if (isPresent(v)) {
      if (isListLikeIterable(v)) {
        this._iterableDiffer = this._iterableDiffers.find(v).create(null);
      } else {
        this._keyValueDiffer = this._keyValueDiffers.find(v).create(null);
      }
    }
  }

  ngDoCheck(): void {
    if (isPresent(this._iterableDiffer)) {
      var changes = this._iterableDiffer.diff(this._rawClass);
      if (isPresent(changes)) {
        this._applyIterableChanges(changes);
      }
    }
    if (isPresent(this._keyValueDiffer)) {
      var changes = this._keyValueDiffer.diff(this._rawClass);
      if (isPresent(changes)) {
        this._applyKeyValueChanges(changes);
      }
    }
  }

  ngOnDestroy(): void { this._cleanupClasses(this._rawClass); }

  private _cleanupClasses(rawClassVal: string[]|Set<string>|{[key: string]: any}): void {
    this._applyClasses(rawClassVal, true);
    this._applyInitialClasses(false);
  }

  private _applyKeyValueChanges(changes: any): void {
    changes.forEachAddedItem(
        (record: KeyValueChangeRecord) => { this._toggleClass(record.key, record.currentValue); });
    changes.forEachChangedItem(
        (record: KeyValueChangeRecord) => { this._toggleClass(record.key, record.currentValue); });
    changes.forEachRemovedItem((record: KeyValueChangeRecord) => {
      if (record.previousValue) {
        this._toggleClass(record.key, false);
      }
    });
  }

  private _applyIterableChanges(changes: any): void {
    changes.forEachAddedItem(
        (record: CollectionChangeRecord) => { this._toggleClass(record.item, true); });
    changes.forEachRemovedItem(
        (record: CollectionChangeRecord) => { this._toggleClass(record.item, false); });
  }

  private _applyInitialClasses(isCleanup: boolean) {
    this._initialClasses.forEach(className => this._toggleClass(className, !isCleanup));
  }

  private _applyClasses(
      rawClassVal: string[]|Set<string>|{[key: string]: any}, isCleanup: boolean) {
    if (isPresent(rawClassVal)) {
      if (isArray(rawClassVal)) {
        (<string[]>rawClassVal).forEach(className => this._toggleClass(className, !isCleanup));
      } else if (rawClassVal instanceof Set) {
        (<Set<string>>rawClassVal).forEach(className => this._toggleClass(className, !isCleanup));
      } else {
        StringMapWrapper.forEach(
            <{[k: string]: any}>rawClassVal, (expVal: any, className: string) => {
              if (isPresent(expVal)) this._toggleClass(className, !isCleanup);
            });
      }
    }
  }

  private _toggleClass(className: string, enabled: boolean): void {
    className = className.trim();
    if (className.length > 0) {
      if (className.indexOf(' ') > -1) {
        var classes = className.split(/\s+/g);
        for (var i = 0, len = classes.length; i < len; i++) {
          this._renderer.setElementClass(this._ngEl.nativeElement, classes[i], enabled);
        }
      } else {
        this._renderer.setElementClass(this._ngEl.nativeElement, className, enabled);
      }
    }
  }
}
