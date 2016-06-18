import {Directive, Host, TemplateRef, ViewContainerRef} from '@angular/core';

import {ListWrapper, Map} from '../facade/collection';
import {isBlank, isPresent, normalizeBlank} from '../facade/lang';

const _CASE_DEFAULT = /*@ts2dart_const*/ new Object();

export class SwitchView {
  constructor(
      private _viewContainerRef: ViewContainerRef, private _templateRef: TemplateRef<Object>) {}

  create(): void { this._viewContainerRef.createEmbeddedView(this._templateRef); }

  destroy(): void { this._viewContainerRef.clear(); }
}

/**
 * Adds or removes DOM sub-trees when their match expressions match the switch expression.
 *
 * Elements within `NgSwitch` but without `ngSwitchCase` or `NgSwitchDefault` directives will be
 * preserved at the location as specified in the template.
 *
 * `NgSwitch` simply inserts nested elements based on which match expression matches the value
 * obtained from the evaluated switch expression. In other words, you define a container element
 * (where you place the directive with a switch expression on the
 * `[ngSwitch]="..."` attribute), define any inner elements inside of the directive and
 * place a `[ngSwitchCase]` attribute per element.
 *
 * The `ngSwitchCase` property is used to inform `NgSwitch` which element to display when the
 * expression is evaluated. If a matching expression is not found via a `ngSwitchCase` property
 * then an element with the `ngSwitchDefault` attribute is displayed.
 *
 * ### Example ([live demo](http://plnkr.co/edit/DQMTII95CbuqWrl3lYAs?p=preview))
 *
 * ```typescript
 * @Component({
 *   selector: 'app',
 *   template: `
 *     <p>Value = {{value}}</p>
 *     <button (click)="inc()">Increment</button>
 *
 *     <div [ngSwitch]="value">
 *       <p *ngSwitchCase="'init'">increment to start</p>
 *       <p *ngSwitchCase="0">0, increment again</p>
 *       <p *ngSwitchCase="1">1, increment again</p>
 *       <p *ngSwitchCase="2">2, stop incrementing</p>
 *       <p *ngSwitchDefault>&gt; 2, STOP!</p>
 *     </div>
 *
 *     <!-- alternate syntax -->
 *
 *     <p [ngSwitch]="value">
 *       <template ngSwitchCase="init">increment to start</template>
 *       <template [ngSwitchCase]="0">0, increment again</template>
 *       <template [ngSwitchCase]="1">1, increment again</template>
 *       <template [ngSwitchCase]="2">2, stop incrementing</template>
 *       <template ngSwitchDefault>&gt; 2, STOP!</template>
 *     </p>
 *   `,
 *   directives: [NgSwitch, ngSwitchCase, NgSwitchDefault]
 * })
 * export class App {
 *   value = 'init';
 *
 *   inc() {
 *     this.value = this.value === 'init' ? 0 : this.value + 1;
 *   }
 * }
 *
 * bootstrap(App).catch(err => console.error(err));
 * ```
 *
 * @experimental
 */
@Directive({selector: '[ngSwitch]', inputs: ['ngSwitch']})
export class NgSwitch {
  private _switchValue: any;
  private _useDefault: boolean = false;
  private _valueViews = new Map<any, SwitchView[]>();
  private _activeViews: SwitchView[] = [];

  set ngSwitch(value: any) {
    // Empty the currently active ViewContainers
    this._emptyAllActiveViews();

    // Add the ViewContainers matching the value (with a fallback to default)
    this._useDefault = false;
    var views = this._valueViews.get(value);
    if (isBlank(views)) {
      this._useDefault = true;
      views = normalizeBlank(this._valueViews.get(_CASE_DEFAULT));
    }
    this._activateViews(views);

    this._switchValue = value;
  }

  /** @internal */
  _onCaseValueChanged(oldCase: any, newCase: any, view: SwitchView): void {
    this._deregisterView(oldCase, view);
    this._registerView(newCase, view);

    if (oldCase === this._switchValue) {
      view.destroy();
      ListWrapper.remove(this._activeViews, view);
    } else if (newCase === this._switchValue) {
      if (this._useDefault) {
        this._useDefault = false;
        this._emptyAllActiveViews();
      }
      view.create();
      this._activeViews.push(view);
    }

    // Switch to default when there is no more active ViewContainers
    if (this._activeViews.length === 0 && !this._useDefault) {
      this._useDefault = true;
      this._activateViews(this._valueViews.get(_CASE_DEFAULT));
    }
  }

  /** @internal */
  _emptyAllActiveViews(): void {
    var activeContainers = this._activeViews;
    for (var i = 0; i < activeContainers.length; i++) {
      activeContainers[i].destroy();
    }
    this._activeViews = [];
  }

  /** @internal */
  _activateViews(views: SwitchView[]): void {
    // TODO(vicb): assert(this._activeViews.length === 0);
    if (isPresent(views)) {
      for (var i = 0; i < views.length; i++) {
        views[i].create();
      }
      this._activeViews = views;
    }
  }

  /** @internal */
  _registerView(value: any, view: SwitchView): void {
    var views = this._valueViews.get(value);
    if (isBlank(views)) {
      views = [];
      this._valueViews.set(value, views);
    }
    views.push(view);
  }

  /** @internal */
  _deregisterView(value: any, view: SwitchView): void {
    // `_CASE_DEFAULT` is used a marker for non-registered cases
    if (value === _CASE_DEFAULT) return;
    var views = this._valueViews.get(value);
    if (views.length == 1) {
      this._valueViews.delete(value);
    } else {
      ListWrapper.remove(views, view);
    }
  }
}

/**
 * Insert the sub-tree when the `ngSwitchCase` expression evaluates to the same value as the
 * enclosing switch expression.
 *
 * If multiple match expression match the switch expression value, all of them are displayed.
 *
 * See {@link NgSwitch} for more details and example.
 *
 * @experimental
 */
@Directive({selector: '[ngSwitchCase],[ngSwitchWhen]', inputs: ['ngSwitchCase', 'ngSwitchWhen']})
export class NgSwitchCase {
  // `_CASE_DEFAULT` is used as a marker for a not yet initialized value
  /** @internal */
  _value: any = _CASE_DEFAULT;
  /** @internal */
  _view: SwitchView;
  // TODO: remove when fully deprecated
  /** @internal */
  _warned: boolean;
  private _switch: NgSwitch;

  constructor(
      viewContainer: ViewContainerRef, templateRef: TemplateRef<Object>,
      @Host() ngSwitch: NgSwitch) {
    this._switch = ngSwitch;
    this._view = new SwitchView(viewContainer, templateRef);
  }

  set ngSwitchCase(value: any) {
    this._switch._onCaseValueChanged(this._value, value, this._view);
    this._value = value;
  }

  set ngSwitchWhen(value: any) {
    if (!this._warned) {
      this._warned = true;
      console.warn('*ngSwitchWhen is deprecated and will be removed. Use *ngSwitchCase instead');
    }
    this._switch._onCaseValueChanged(this._value, value, this._view);
    this._value = value;
  }
}

/**
 * Default case statements are displayed when no match expression matches the switch expression
 * value.
 *
 * See {@link NgSwitch} for more details and example.
 *
 * @experimental
 */
@Directive({selector: '[ngSwitchDefault]'})
export class NgSwitchDefault {
  constructor(
      viewContainer: ViewContainerRef, templateRef: TemplateRef<Object>,
      @Host() sswitch: NgSwitch) {
    sswitch._registerView(_CASE_DEFAULT, new SwitchView(viewContainer, templateRef));
  }
}
