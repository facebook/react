import {SimpleChange} from '../change_detection/change_detection_util';

/**
 * @stable
 */
export enum LifecycleHooks {
  OnInit,
  OnDestroy,
  DoCheck,
  OnChanges,
  AfterContentInit,
  AfterContentChecked,
  AfterViewInit,
  AfterViewChecked
}

/**
 * A `changes` object whose keys are property names and
 * values are instances of {@link SimpleChange}. See {@link OnChanges}
 * @stable
 */
export interface SimpleChanges { [propName: string]: SimpleChange; }

export var LIFECYCLE_HOOKS_VALUES = [
  LifecycleHooks.OnInit, LifecycleHooks.OnDestroy, LifecycleHooks.DoCheck, LifecycleHooks.OnChanges,
  LifecycleHooks.AfterContentInit, LifecycleHooks.AfterContentChecked, LifecycleHooks.AfterViewInit,
  LifecycleHooks.AfterViewChecked
];

/**
 * Lifecycle hooks are guaranteed to be called in the following order:
 * - `OnChanges` (if any bindings have changed),
 * - `OnInit` (after the first check only),
 * - `DoCheck`,
 * - `AfterContentInit`,
 * - `AfterContentChecked`,
 * - `AfterViewInit`,
 * - `AfterViewChecked`,
 * - `OnDestroy` (at the very end before destruction)
 */

/**
 * Implement this interface to get notified when any data-bound property of your directive changes.
 *
 * `ngOnChanges` is called right after the data-bound properties have been checked and before view
 * and content children are checked if at least one of them has changed.
 *
 * The `changes` parameter contains an entry for each of the changed data-bound property. The key is
 * the property name and the value is an instance of {@link SimpleChange}.
 *
 * ### Example ([live example](http://plnkr.co/edit/AHrB6opLqHDBPkt4KpdT?p=preview)):
 *
 * ```typescript
 * @Component({
 *   selector: 'my-cmp',
 *   template: `<p>myProp = {{myProp}}</p>`
 * })
 * class MyComponent implements OnChanges {
 *   @Input() myProp: any;
 *
 *   ngOnChanges(changes: SimpleChanges) {
 *     console.log('ngOnChanges - myProp = ' + changes['myProp'].currentValue);
 *   }
 * }
 *
 * @Component({
 *   selector: 'app',
 *   template: `
 *     <button (click)="value = value + 1">Change MyComponent</button>
 *     <my-cmp [my-prop]="value"></my-cmp>`,
 *   directives: [MyComponent]
 * })
 * export class App {
 *   value = 0;
 * }
 *
 * bootstrap(App).catch(err => console.error(err));
 * ```
 * @stable
 */
export abstract class OnChanges {
  abstract ngOnChanges(changes: SimpleChanges): any /** TODO #9100 */;
}

/**
 * Implement this interface to execute custom initialization logic after your directive's
 * data-bound properties have been initialized.
 *
 * `ngOnInit` is called right after the directive's data-bound properties have been checked for the
 * first time, and before any of its children have been checked. It is invoked only once when the
 * directive is instantiated.
 *
 * ### Example ([live example](http://plnkr.co/edit/1MBypRryXd64v4pV03Yn?p=preview))
 *
 * ```typescript
 * @Component({
 *   selector: 'my-cmp',
 *   template: `<p>my-component</p>`
 * })
 * class MyComponent implements OnInit, OnDestroy {
 *   ngOnInit() {
 *     console.log('ngOnInit');
 *   }
 *
 *   ngOnDestroy() {
 *     console.log('ngOnDestroy');
 *   }
 * }
 *
 * @Component({
 *   selector: 'app',
 *   template: `
 *     <button (click)="hasChild = !hasChild">
 *       {{hasChild ? 'Destroy' : 'Create'}} MyComponent
 *     </button>
 *     <my-cmp *ngIf="hasChild"></my-cmp>`,
 *   directives: [MyComponent, NgIf]
 * })
 * export class App {
 *   hasChild = true;
 * }
 *
 * bootstrap(App).catch(err => console.error(err));
 *  ```
 * @stable
 */
export abstract class OnInit { abstract ngOnInit(): any /** TODO #9100 */; }

/**
 * Implement this interface to supplement the default change detection algorithm in your directive.
 *
 * `ngDoCheck` gets called to check the changes in the directives in addition to the default
 * algorithm.
 *
 * The default change detection algorithm looks for differences by comparing bound-property values
 * by reference across change detection runs.
 *
 * Note that a directive typically should not use both `DoCheck` and {@link OnChanges} to respond to
 * changes on the same input. `ngOnChanges` will continue to be called when the default change
 * detector
 * detects changes, so it is usually unnecessary to respond to changes on the same input in both
 * hooks.
 * Reaction to the changes have to be handled from within the `ngDoCheck` callback.
 *
 * You can use {@link KeyValueDiffers} and {@link IterableDiffers} to help add your custom check
 * mechanisms.
 *
 * ### Example ([live demo](http://plnkr.co/edit/QpnIlF0CR2i5bcYbHEUJ?p=preview))
 *
 * In the following example `ngDoCheck` uses an {@link IterableDiffers} to detect the updates to the
 * array `list`:
 *
 * ```typescript
 * @Component({
 *   selector: 'custom-check',
 *   template: `
 *     <p>Changes:</p>
 *     <ul>
 *       <li *ngFor="let line of logs">{{line}}</li>
 *     </ul>`,
 *   directives: [NgFor]
 * })
 * class CustomCheckComponent implements DoCheck {
 *   @Input() list: any[];
 *   differ: any;
 *   logs = [];
 *
 *   constructor(differs: IterableDiffers) {
 *     this.differ = differs.find([]).create(null);
 *   }
 *
 *   ngDoCheck() {
 *     var changes = this.differ.diff(this.list);
 *
 *     if (changes) {
 *       changes.forEachAddedItem(r => this.logs.push('added ' + r.item));
 *       changes.forEachRemovedItem(r => this.logs.push('removed ' + r.item))
 *     }
 *   }
 * }
 *
 * @Component({
 *   selector: 'app',
 *   template: `
 *     <button (click)="list.push(list.length)">Push</button>
 *     <button (click)="list.pop()">Pop</button>
 *     <custom-check [list]="list"></custom-check>`,
 *   directives: [CustomCheckComponent]
 * })
 * export class App {
 *   list = [];
 * }
 * ```
 * @stable
 */
export abstract class DoCheck { abstract ngDoCheck(): any /** TODO #9100 */; }

/**
 * Implement this interface to get notified when your directive is destroyed.
 *
 * `ngOnDestroy` callback is typically used for any custom cleanup that needs to occur when the
 * instance is destroyed
 *
 * ### Example ([live example](http://plnkr.co/edit/1MBypRryXd64v4pV03Yn?p=preview))
 *
 * ```typesript
 * @Component({
 *   selector: 'my-cmp',
 *   template: `<p>my-component</p>`
 * })
 * class MyComponent implements OnInit, OnDestroy {
 *   ngOnInit() {
 *     console.log('ngOnInit');
 *   }
 *
 *   ngOnDestroy() {
 *     console.log('ngOnDestroy');
 *   }
 * }
 *
 * @Component({
 *   selector: 'app',
 *   template: `
 *     <button (click)="hasChild = !hasChild">
 *       {{hasChild ? 'Destroy' : 'Create'}} MyComponent
 *     </button>
 *     <my-cmp *ngIf="hasChild"></my-cmp>`,
 *   directives: [MyComponent, NgIf]
 * })
 * export class App {
 *   hasChild = true;
 * }
 *
 * bootstrap(App).catch(err => console.error(err));
 * ```
 *
 *
 * To create a stateful Pipe, you should implement this interface and set the `pure`
 * parameter to `false` in the {@link PipeMetadata}.
 *
 * A stateful pipe may produce different output, given the same input. It is
 * likely that a stateful pipe may contain state that should be cleaned up when
 * a binding is destroyed. For example, a subscription to a stream of data may need to
 * be disposed, or an interval may need to be cleared.
 *
 * ### Example ([live demo](http://plnkr.co/edit/i8pm5brO4sPaLxBx56MR?p=preview))
 *
 * In this example, a pipe is created to countdown its input value, updating it every
 * 50ms. Because it maintains an internal interval, it automatically clears
 * the interval when the binding is destroyed or the countdown completes.
 *
 * ```
 * import {OnDestroy, Pipe, PipeTransform} from '@angular/core'
 * @Pipe({name: 'countdown', pure: false})
 * class CountDown implements PipeTransform, OnDestroy {
 *   remainingTime:Number;
 *   interval:SetInterval;
 *   ngOnDestroy() {
 *     if (this.interval) {
 *       clearInterval(this.interval);
 *     }
 *   }
 *   transform(value: any, args: any[] = []) {
 *     if (!parseInt(value, 10)) return null;
 *     if (typeof this.remainingTime !== 'number') {
 *       this.remainingTime = parseInt(value, 10);
 *     }
 *     if (!this.interval) {
 *       this.interval = setInterval(() => {
 *         this.remainingTime-=50;
 *         if (this.remainingTime <= 0) {
 *           this.remainingTime = 0;
 *           clearInterval(this.interval);
 *           delete this.interval;
 *         }
 *       }, 50);
 *     }
 *     return this.remainingTime;
 *   }
 * }
 * ```
 *
 * Invoking `{{ 10000 | countdown }}` would cause the value to be decremented by 50,
 * every 50ms, until it reaches 0.
 *
 * @stable
 */
export abstract class OnDestroy { abstract ngOnDestroy(): any /** TODO #9100 */; }

/**
 * Implement this interface to get notified when your directive's content has been fully
 * initialized.
 *
 * ### Example ([live demo](http://plnkr.co/edit/plamXUpsLQbIXpViZhUO?p=preview))
 *
 * ```typescript
 * @Component({
 *   selector: 'child-cmp',
 *   template: `{{where}} child`
 * })
 * class ChildComponent {
 *   @Input() where: string;
 * }
 *
 * @Component({
 *   selector: 'parent-cmp',
 *   template: `<ng-content></ng-content>`
 * })
 * class ParentComponent implements AfterContentInit {
 *   @ContentChild(ChildComponent) contentChild: ChildComponent;
 *
 *   constructor() {
 *     // contentChild is not initialized yet
 *     console.log(this.getMessage(this.contentChild));
 *   }
 *
 *   ngAfterContentInit() {
 *     // contentChild is updated after the content has been checked
 *     console.log('AfterContentInit: ' + this.getMessage(this.contentChild));
 *   }
 *
 *   private getMessage(cmp: ChildComponent): string {
 *     return cmp ? cmp.where + ' child' : 'no child';
 *   }
 * }
 *
 * @Component({
 *   selector: 'app',
 *   template: `
 *     <parent-cmp>
 *       <child-cmp where="content"></child-cmp>
 *     </parent-cmp>`,
 *   directives: [ParentComponent, ChildComponent]
 * })
 * export class App {
 * }
 *
 * bootstrap(App).catch(err => console.error(err));
 * ```
 * @stable
 */
export abstract class AfterContentInit { abstract ngAfterContentInit(): any /** TODO #9100 */; }

/**
 * Implement this interface to get notified after every check of your directive's content.
 *
 * ### Example ([live demo](http://plnkr.co/edit/tGdrytNEKQnecIPkD7NU?p=preview))
 *
 * ```typescript
 * @Component({selector: 'child-cmp', template: `{{where}} child`})
 * class ChildComponent {
 *   @Input() where: string;
 * }
 *
 * @Component({selector: 'parent-cmp', template: `<ng-content></ng-content>`})
 * class ParentComponent implements AfterContentChecked {
 *   @ContentChild(ChildComponent) contentChild: ChildComponent;
 *
 *   constructor() {
 *     // contentChild is not initialized yet
 *     console.log(this.getMessage(this.contentChild));
 *   }
 *
 *   ngAfterContentChecked() {
 *     // contentChild is updated after the content has been checked
 *     console.log('AfterContentChecked: ' + this.getMessage(this.contentChild));
 *   }
 *
 *   private getMessage(cmp: ChildComponent): string {
 *     return cmp ? cmp.where + ' child' : 'no child';
 *   }
 * }
 *
 * @Component({
 *   selector: 'app',
 *   template: `
 *     <parent-cmp>
 *       <button (click)="hasContent = !hasContent">Toggle content child</button>
 *       <child-cmp *ngIf="hasContent" where="content"></child-cmp>
 *     </parent-cmp>`,
 *   directives: [NgIf, ParentComponent, ChildComponent]
 * })
 * export class App {
 *   hasContent = true;
 * }
 *
 * bootstrap(App).catch(err => console.error(err));
 * ```
 * @stable
 */
export abstract class AfterContentChecked {
  abstract ngAfterContentChecked(): any /** TODO #9100 */;
}

/**
 * Implement this interface to get notified when your component's view has been fully initialized.
 *
 * ### Example ([live demo](http://plnkr.co/edit/LhTKVMEM0fkJgyp4CI1W?p=preview))
 *
 * ```typescript
 * @Component({selector: 'child-cmp', template: `{{where}} child`})
 * class ChildComponent {
 *   @Input() where: string;
 * }
 *
 * @Component({
 *   selector: 'parent-cmp',
 *   template: `<child-cmp where="view"></child-cmp>`,
 *   directives: [ChildComponent]
 * })
 * class ParentComponent implements AfterViewInit {
 *   @ViewChild(ChildComponent) viewChild: ChildComponent;
 *
 *   constructor() {
 *     // viewChild is not initialized yet
 *     console.log(this.getMessage(this.viewChild));
 *   }
 *
 *   ngAfterViewInit() {
 *     // viewChild is updated after the view has been initialized
 *     console.log('ngAfterViewInit: ' + this.getMessage(this.viewChild));
 *   }
 *
 *   private getMessage(cmp: ChildComponent): string {
 *     return cmp ? cmp.where + ' child' : 'no child';
 *   }
 * }
 *
 * @Component({
 *   selector: 'app',
 *   template: `<parent-cmp></parent-cmp>`,
 *   directives: [ParentComponent]
 * })
 * export class App {
 * }
 *
 * bootstrap(App).catch(err => console.error(err));
 * ```
 * @stable
 */
export abstract class AfterViewInit { abstract ngAfterViewInit(): any /** TODO #9100 */; }

/**
 * Implement this interface to get notified after every check of your component's view.
 *
 * ### Example ([live demo](http://plnkr.co/edit/0qDGHcPQkc25CXhTNzKU?p=preview))
 *
 * ```typescript
 * @Component({selector: 'child-cmp', template: `{{where}} child`})
 * class ChildComponent {
 *   @Input() where: string;
 * }
 *
 * @Component({
 *   selector: 'parent-cmp',
 *   template: `
 *     <button (click)="showView = !showView">Toggle view child</button>
 *     <child-cmp *ngIf="showView" where="view"></child-cmp>`,
 *   directives: [NgIf, ChildComponent]
 * })
 * class ParentComponent implements AfterViewChecked {
 *   @ViewChild(ChildComponent) viewChild: ChildComponent;
 *   showView = true;
 *
 *   constructor() {
 *     // viewChild is not initialized yet
 *     console.log(this.getMessage(this.viewChild));
 *   }
 *
 *   ngAfterViewChecked() {
 *     // viewChild is updated after the view has been checked
 *     console.log('AfterViewChecked: ' + this.getMessage(this.viewChild));
 *   }
 *
 *   private getMessage(cmp: ChildComponent): string {
 *     return cmp ? cmp.where + ' child' : 'no child';
 *   }
 * }
 *
 * @Component({
 *   selector: 'app',
 *   template: `<parent-cmp></parent-cmp>`,
 *   directives: [ParentComponent]
 * })
 * export class App {
 * }
 *
 * bootstrap(App).catch(err => console.error(err));
 * ```
 * @stable
 */
export abstract class AfterViewChecked { abstract ngAfterViewChecked(): any /** TODO #9100 */; }
