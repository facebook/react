import {OpaqueToken} from './di';

/**
   A token that can be provided when bootstrapping an application to make an array of directives
  * available in every component of the application.
  *
  * ### Example
  *
  * ```typescript
  * import {PLATFORM_DIRECTIVES} from '@angular/core';
  * import {OtherDirective} from './myDirectives';
  *
  * @Component({
  *   selector: 'my-component',
  *   template: `
  *     <!-- can use other directive even though the component does not list it in `directives` -->
  *     <other-directive></other-directive>
  *   `
  * })
  * export class MyComponent {
  *   ...
  * }
  *
  * bootstrap(MyComponent, [{provide: PLATFORM_DIRECTIVES, useValue: [OtherDirective],
  multi:true}]);
  * ```
  * @stable
  */

export const PLATFORM_DIRECTIVES: OpaqueToken =
    /*@ts2dart_const*/ new OpaqueToken('Platform Directives');

/**
  * A token that can be provided when bootstraping an application to make an array of pipes
  * available in every component of the application.
  *
  * ### Example
  *
  * ```typescript
  * import {PLATFORM_PIPES} from '@angular/core';
  * import {OtherPipe} from './myPipe';
  *
  * @Component({
  *   selector: 'my-component',
  *   template: `
  *     {{123 | other-pipe}}
  *   `
  * })
  * export class MyComponent {
  *   ...
  * }
  *
  * bootstrap(MyComponent, [{provide: PLATFORM_PIPES, useValue: [OtherPipe], multi:true}]);
  * ```
  * @stable
  */

export const PLATFORM_PIPES: OpaqueToken = /*@ts2dart_const*/ new OpaqueToken('Platform Pipes');