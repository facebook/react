@cheatsheetSection
Bootstrapping
@cheatsheetIndex 0
@description
{@target ts}`import {bootstrap} from 'angular2/platform/browser';`{@endtarget}
{@target js}Available from the `ng.platform.browser` namespace{@endtarget}
{@target dart}`import 'package:angular2/platform/browser.dart';`{@endtarget}

@cheatsheetItem
syntax(ts dart):
`bootstrap​(MyAppComponent, [MyService, { provide: ... }]);`|`provide`
syntax(js):
`document.addEventListener('DOMContentLoaded', function () {
  ng.platform.browser.bootstrap(MyAppComponent,
    [MyService, { provide: ... }]);
});`|`provide`
description:
Bootstraps an application with MyAppComponent as the root component and configures the DI providers. {@target js}Must be wrapped in the event listener to fire when the page loads.{@endtarget}
