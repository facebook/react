@cheatsheetSection
Class field decorators for directives and components
@cheatsheetIndex 7
@description
{@target ts}`import {Input, ...} from 'angular2/core';`{@endtarget}
{@target js}Available from the `ng.core` namespace{@endtarget}
{@target dart}`import 'package:angular2/core.dart';`{@endtarget}

@cheatsheetItem
syntax(ts dart):
`@Input() myProperty;`|`@Input()`
syntax(js):
`ng.core.Input(myProperty, myComponent);`|`ng.core.Input(`|`);`
description:
Declares an input property that we can update via property binding (e.g.
`<my-cmp [myProperty]="someExpression">`).


@cheatsheetItem
syntax(ts dart):
`@Output() myEvent = new EventEmitter();`|`@Output()`
syntax(js):
`myEvent = new ng.core.EventEmitter(); ng.core.Output(myEvent, myComponent);`|`ng.core.Output(`|`);`
description:
Declares an output property that fires events to which we can subscribe with an event binding (e.g. `<my-cmp (myEvent)="doSomething()">`).


@cheatsheetItem
syntax(ts dart):
`@HostBinding('[class.valid]') isValid;`|`@HostBinding('[class.valid]')`
syntax(js):
`ng.core.HostBinding('[class.valid]', 'isValid', myComponent);`|`ng.core.HostBinding('[class.valid]', 'isValid'`|`);`
description:
Binds a host element property (e.g. CSS class valid) to directive/component property (e.g. isValid).



@cheatsheetItem
syntax(ts dart):
`@HostListener('click', ['$event']) onClick(e) {...}`|`@HostListener('click', ['$event'])`
syntax(js):
`ng.core.HostListener('click', ['$event'], onClick(e) {...}, myComponent);`|`ng.core.HostListener('click', ['$event'], onClick(e)`|`);`
description:
Subscribes to a host element event (e.g. click) with a directive/component method (e.g. onClick), optionally passing an argument ($event).


@cheatsheetItem
syntax(ts dart):
`@ContentChild(myPredicate) myChildComponent;`|`@ContentChild(myPredicate)`
syntax(js):
`ng.core.ContentChild(myPredicate, 'myChildComponent', myComponent);`|`ng.core.ContentChild(myPredicate,`|`);`
description:
Binds the first result of the component content query (myPredicate) to the myChildComponent property of the class.


@cheatsheetItem
syntax(ts dart):
`@ContentChildren(myPredicate) myChildComponents;`|`@ContentChildren(myPredicate)`
syntax(js):
`ng.core.ContentChildren(myPredicate, 'myChildComponents', myComponent);`|`ng.core.ContentChildren(myPredicate,`|`);`
description:
Binds the results of the component content query (myPredicate) to the myChildComponents property of the class.


@cheatsheetItem
syntax(ts dart):
`@ViewChild(myPredicate) myChildComponent;`|`@ViewChild(myPredicate)`
syntax(js):
`ng.core.ViewChild(myPredicate, 'myChildComponent', myComponent);`|`ng.core.ViewChild(myPredicate,`|`);`
description:
Binds the first result of the component view query (myPredicate) to the myChildComponent property of the class. Not available for directives.


@cheatsheetItem
syntax(ts dart):
`@ViewChildren(myPredicate) myChildComponents;`|`@ViewChildren(myPredicate)`
syntax(js):
`ng.core.ViewChildren(myPredicate, 'myChildComponents', myComponent);`|`ng.core.ViewChildren(myPredicate,`|`);`
description:
Binds the results of the component view query (myPredicate) to the myChildComponents property of the class. Not available for directives.
