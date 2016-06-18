@cheatsheetSection
Directive and component change detection and lifecycle hooks
@cheatsheetIndex 8
@description
{@target ts dart}(implemented as class methods){@endtarget}
{@target js}(implemented as component properties){@endtarget}

@cheatsheetItem
syntax(ts):
`constructor(myService: MyService, ...) { ... }`|`constructor(myService: MyService, ...)`
syntax(js):
`constructor: function(MyService, ...) { ... }`|`constructor: function(MyService, ...)`
syntax(dart):
`MyAppComponent(MyService myService, ...) { ... }`|`MyAppComponent(MyService myService, ...)`
description:
The class constructor is called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.


@cheatsheetItem
syntax(ts dart):
`ngOnChanges(changeRecord) { ... }`|`ngOnChanges(changeRecord)`
syntax(js):
`ngOnChanges: function(changeRecord) { ... }`|`ngOnChanges: function(changeRecord)`
description:
Called after every change to input properties and before processing content or child views.


@cheatsheetItem
syntax(ts dart):
`ngOnInit() { ... }`|`ngOnInit()`
syntax(js):
`ngOnInit: function() { ... }`|`ngOnInit: function()`
description:
Called after the constructor, initializing input properties, and the first call to ngOnChanges.


@cheatsheetItem
syntax(ts dart):
`ngDoCheck() { ... }`|`ngDoCheck()`
syntax(js):
`ngDoCheck: function() { ... }`|`ngDoCheck: function()`
description:
Called every time that the input properties of a component or a directive are checked. Use it to extend change detection by performing a custom check.


@cheatsheetItem
syntax(ts dart):
`ngAfterContentInit() { ... }`|`ngAfterContentInit()`
syntax(js):
`ngAfterContentInit: function() { ... }`|`ngAfterContentInit: function()`
description:
Called after ngOnInit when the component's or directive's content has been initialized.


@cheatsheetItem
syntax(ts dart):
`ngAfterContentChecked() { ... }`|`ngAfterContentChecked()`
syntax(js):
`ngAfterContentChecked: function() { ... }`|`ngAfterContentChecked: function()`
description:
Called after every check of the component's or directive's content.


@cheatsheetItem
syntax(ts dart):
`ngAfterViewInit() { ... }`|`ngAfterViewInit()`
syntax(js):
`ngAfterViewInit: function() { ... }`|`ngAfterViewInit: function()`
description:
Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.


@cheatsheetItem
syntax(ts dart):
`ngAfterViewChecked() { ... }`|`ngAfterViewChecked()`
syntax(js):
`ngAfterViewChecked: function() { ... }`|`ngAfterViewChecked: function()`
description:
Called after every check of the component's view. Applies to components only.


@cheatsheetItem
syntax(ts dart):
`ngOnDestroy() { ... }`|`ngOnDestroy()`
syntax(js):
`ngOnDestroy: function() { ... }`|`ngOnDestroy: function()`
description:
Called once, before the instance is destroyed.
