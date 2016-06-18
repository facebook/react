import {ChangeDetectorRef} from '../change_detection/change_detector_ref';
import {ChangeDetectionStrategy} from '../change_detection/constants';
import {unimplemented} from '../facade/exceptions';

import {AppView} from './view';


/**
 * @stable
 */
export abstract class ViewRef {
  get destroyed(): boolean { return <boolean>unimplemented(); }

  abstract onDestroy(callback: Function): any /** TODO #9100 */;
}

/**
 * Represents an Angular View.
 *
 * <!-- TODO: move the next two paragraphs to the dev guide -->
 * A View is a fundamental building block of the application UI. It is the smallest grouping of
 * Elements which are created and destroyed together.
 *
 * Properties of elements in a View can change, but the structure (number and order) of elements in
 * a View cannot. Changing the structure of Elements can only be done by inserting, moving or
 * removing nested Views via a {@link ViewContainerRef}. Each View can contain many View Containers.
 * <!-- /TODO -->
 *
 * ### Example
 *
 * Given this template...
 *
 * ```
 * Count: {{items.length}}
 * <ul>
 *   <li *ngFor="let  item of items">{{item}}</li>
 * </ul>
 * ```
 *
 * We have two {@link TemplateRef}s:
 *
 * Outer {@link TemplateRef}:
 * ```
 * Count: {{items.length}}
 * <ul>
 *   <template ngFor let-item [ngForOf]="items"></template>
 * </ul>
 * ```
 *
 * Inner {@link TemplateRef}:
 * ```
 *   <li>{{item}}</li>
 * ```
 *
 * Notice that the original template is broken down into two separate {@link TemplateRef}s.
 *
 * The outer/inner {@link TemplateRef}s are then assembled into views like so:
 *
 * ```
 * <!-- ViewRef: outer-0 -->
 * Count: 2
 * <ul>
 *   <template view-container-ref></template>
 *   <!-- ViewRef: inner-1 --><li>first</li><!-- /ViewRef: inner-1 -->
 *   <!-- ViewRef: inner-2 --><li>second</li><!-- /ViewRef: inner-2 -->
 * </ul>
 * <!-- /ViewRef: outer-0 -->
 * ```
 * @experimental
 */
export abstract class EmbeddedViewRef<C> extends ViewRef {
  get context(): C { return unimplemented(); }

  get rootNodes(): any[] { return <any[]>unimplemented(); };

  /**
   * Destroys the view and all of the data structures associated with it.
   */
  abstract destroy(): any /** TODO #9100 */;
}

export class ViewRef_<C> implements EmbeddedViewRef<C>, ChangeDetectorRef {
  /** @internal */
  _originalMode: ChangeDetectionStrategy;

  constructor(private _view: AppView<C>) {
    this._view = _view;
    this._originalMode = this._view.cdMode;
  }

  get internalView(): AppView<C> { return this._view; }

  get rootNodes(): any[] { return this._view.flatRootNodes; }

  get context() { return this._view.context; }

  get destroyed(): boolean { return this._view.destroyed; }

  markForCheck(): void { this._view.markPathToRootAsCheckOnce(); }
  detach(): void { this._view.cdMode = ChangeDetectionStrategy.Detached; }
  detectChanges(): void { this._view.detectChanges(false); }
  checkNoChanges(): void { this._view.detectChanges(true); }
  reattach(): void {
    this._view.cdMode = this._originalMode;
    this.markForCheck();
  }

  onDestroy(callback: Function) { this._view.disposables.push(callback); }

  destroy() { this._view.destroy(); }
}
