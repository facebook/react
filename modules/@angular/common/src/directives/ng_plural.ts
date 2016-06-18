import {AfterContentInit, Attribute, ContentChildren, Directive, Input, QueryList, TemplateRef, ViewContainerRef} from '@angular/core';

import {Map} from '../facade/collection';
import {NumberWrapper, isPresent} from '../facade/lang';

import {SwitchView} from './ng_switch';

const _CATEGORY_DEFAULT = 'other';

/**
 * @experimental
 */
export abstract class NgLocalization { abstract getPluralCategory(value: any): string; }

/**
 * `ngPlural` is an i18n directive that displays DOM sub-trees that match the switch expression
 * value, or failing that, DOM sub-trees that match the switch expression's pluralization category.
 *
 * To use this directive, you must provide an extension of `NgLocalization` that maps values to
 * category names. You then define a container element that sets the `[ngPlural]` attribute to a
 * switch expression.
 *    - Inner elements defined with an `[ngPluralCase]` attribute will display based on their
 * expression.
 *    - If `[ngPluralCase]` is set to a value starting with `=`, it will only display if the value
 * matches the switch expression exactly.
 *    - Otherwise, the view will be treated as a "category match", and will only display if exact
 * value matches aren't found and the value maps to its category using the `getPluralCategory`
 * function provided.
 *
 * If no matching views are found for a switch expression, inner elements marked
 * `[ngPluralCase]="other"` will be displayed.
 *
 * ```typescript
 * class MyLocalization extends NgLocalization {
 *    getPluralCategory(value: any) {
 *       if(value < 5) {
 *          return 'few';
 *       }
 *    }
 * }
 *
 * @Component({
 *    selector: 'app',
 *    providers: [{provide: NgLocalization, useClass: MyLocalization}]
 * })
 * @View({
 *   template: `
 *     <p>Value = {{value}}</p>
 *     <button (click)="inc()">Increment</button>
 *
 *     <div [ngPlural]="value">
 *       <template ngPluralCase="=0">there is nothing</template>
 *       <template ngPluralCase="=1">there is one</template>
 *       <template ngPluralCase="few">there are a few</template>
 *       <template ngPluralCase="other">there is some number</template>
 *     </div>
 *   `,
 *   directives: [NgPlural, NgPluralCase]
 * })
 * export class App {
 *   value = 'init';
 *
 *   inc() {
 *     this.value = this.value === 'init' ? 0 : this.value + 1;
 *   }
 * }
 *
 * ```
 * @experimental
 */

@Directive({selector: '[ngPluralCase]'})
export class NgPluralCase {
  /** @internal */
  _view: SwitchView;
  constructor(
      @Attribute('ngPluralCase') public value: string, template: TemplateRef<Object>,
      viewContainer: ViewContainerRef) {
    this._view = new SwitchView(viewContainer, template);
  }
}


/**
 * @experimental
 */
@Directive({selector: '[ngPlural]'})
export class NgPlural implements AfterContentInit {
  private _switchValue: number;
  private _activeView: SwitchView;
  private _caseViews = new Map<any, SwitchView>();
  @ContentChildren(NgPluralCase) cases: QueryList<NgPluralCase> = null;

  constructor(private _localization: NgLocalization) {}

  @Input()
  set ngPlural(value: number) {
    this._switchValue = value;
    this._updateView();
  }

  ngAfterContentInit() {
    this.cases.forEach((pluralCase: NgPluralCase): void => {
      this._caseViews.set(this._formatValue(pluralCase), pluralCase._view);
    });
    this._updateView();
  }

  /** @internal */
  _updateView(): void {
    this._clearViews();

    var view: SwitchView = this._caseViews.get(this._switchValue);
    if (!isPresent(view)) view = this._getCategoryView(this._switchValue);

    this._activateView(view);
  }

  /** @internal */
  _clearViews() {
    if (isPresent(this._activeView)) this._activeView.destroy();
  }

  /** @internal */
  _activateView(view: SwitchView) {
    if (!isPresent(view)) return;
    this._activeView = view;
    this._activeView.create();
  }

  /** @internal */
  _getCategoryView(value: number): SwitchView {
    var category: string = this._localization.getPluralCategory(value);
    var categoryView: SwitchView = this._caseViews.get(category);
    return isPresent(categoryView) ? categoryView : this._caseViews.get(_CATEGORY_DEFAULT);
  }

  /** @internal */
  _isValueView(pluralCase: NgPluralCase): boolean { return pluralCase.value[0] === '='; }

  /** @internal */
  _formatValue(pluralCase: NgPluralCase): any {
    return this._isValueView(pluralCase) ? this._stripValue(pluralCase.value) : pluralCase.value;
  }

  /** @internal */
  _stripValue(value: string): number { return NumberWrapper.parseInt(value.substring(1), 10); }
}
