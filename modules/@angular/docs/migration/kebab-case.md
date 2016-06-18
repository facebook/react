Angular2 templates are now case-sensitive and use camelCase in many places where dash-case was previously used ([design doc] (https://docs.google.com/document/d/1UMxTIUBTIUZNfOqwMhkLg0ANFSBtLIK9JsIu77EZaBA/edit?ts=564f7dd4)).

## Overview

Where you used to write:

```
<my-cmp (some-event)="someAction()" [some-property]="expression" #some-var>
```

in order to:
  - bind to the `someEvent` event,
  - bind to the `someProperty` property,
  - create a `someVar` local variable

You should now write:

```
<my-cmp (someEvent)="someAction()" [someProperty]="expression" #someVar>
```

Notes:
  - while tag name are case sensitive, the best practice is to use dash case for component elements so that the browser
    interpret them as custom elements,
  - `(some-event)` would now bind to the `some-event` event (i.e. there is no implicit dash to camel case conversion),
  - `[some-property]` would now bind to the `some-property` property (i.e. there is no implicit dash to camel case conversion),
  - `#some-var` is not allowed any more ("-" can not be used in variable names).

## Migration

#### Templates

1. Directives selectors, property bindings, event bindings, template variables and template element attributes should be changed to camel case: 

  Examples:
  - `<p *ng-if="cond">` should be changed to `<p *ngIf="cond">`,
  - `<my-cmp [my-prop]="exp">` should be changed to `<my-cmp [myProp]="exp">`,
  - `<my-cmp (my-event)="action()">` should be changed to `<my-cmp (myEvent)="action()">`,
  - `<my-cmp [(my-prop)]="prop">` should be changed to `<my-cmp [(myProp)]="prop">`,
  - `<input #my-input>` should be changed to `<input #myInput>`,
  - `<template ng-for #my-item [ng-for-of]=items #my-index="index">` should be changed to `<template ngFor #myItem [ngForOf]=items #myIndex="index">`,

  Note: while the tag names are now case-sensitive the best practice is to keep them lower-dash-cased so that the browser
  treat them as custom elements. Using dashes in custom element names is required by the [Custom Element HTML Spec](http://www.w3.org/TR/custom-elements/#concepts).
  This explains why the `<router-outlet>` component is left unchanged.

  `on-`, `bindon-`, `bind-` and `var-` prefixes are still part of the canonical syntax and should remain unchanged (lower cased):
  - `on-some-event` should be changed to `on-someEvent`,
  - `bind-my-prop` should be changed to `bind-myProp`,
  - `bindon-my-prop` should be changed to `bindon-myProp`,
  - `var-my-var` should be changed to `var-myVar`.

2. Update variable binding

  - `<p #var1="a-b" var-var2="c-d">` should be changed to `<p #var1="aB" var-var2="cD">`

3. The `template` attribute values should also be updated in the same way

  `<p template="ng-for #my-item of items #my-index = index">` should be changed to `<p template="ngFor #myItem of items #myIndex = index">`.

  Note that both angular directives and your own directives must be updated in the same way.

#### Directives and Components

Take the following steps to upgrade your directives and components:

1. Update the selector:
  ```
  @Directive({selector: 'tag[attr][name=value]'})
  @Component({selector: 'tag[attr][name=value]'})
  ```

  Tag and attributes names are case sensitive:
  - For tag names, the best practice is to keep them lower dash cased, do not update them,
  - For attribute names, the best practice is to convert them from lower dash case to camel case.

  Examples:
  - `custom-tag` should stay `custom-tag` (do not update tag names),
  - `[attr-name]` should be updated to `[attrName]`,
  - `[attr-name=someValue]` should be updated to `[attrName=someValue]`,
  - `custom-tag[attr-name=someValue]` should be updated to `custom-tag[attrName=someValue]`

  Note: attribute values and classes are still matched case insensitive.

2. Update the inputs
  ```
  @Directive({inputs: ['myProp', 'myOtherProp: my-attr-name']})
  ```

  As attribute names are now case sensitive, they should be converted from dash to camel case where they are specified.
  The previous decorator becomes:

  ```
  @Directive({inputs: ['myProp', 'myOtherProp: myAttrName']})
  ```

  Notes:
    - only the long syntax (with ":") needs to be updated,
    - `properties` is the legacy name for `inputs` and should be updated in the same way - it is a good idea to replace
      `properties` with `inputs` at the same time as support for the former will be removed soon.

  The same applies for the `@Input` decorator:

  ```
  @Input() myProp;
  @Input('my-attr-name') myProp;
  ```

  That is they only need to be updated when the attribute name is specified:

  ```
  @Input() myProp;               // Nothing to update
  @Input('myAttrName') myProp;   // Convert the attribute name to camel case
  ```

3. Update the outputs

  Update the outputs in the same way the inputs are updated:

  ```
  @Directive({outputs: ['myEvent', 'myOtherEvent: my-event-name']})
  ```

  should be updated to:

  ```
  @Directive({outputs: ['myEvent', 'myOtherEvent: myEventName']})
  ```

  If you use `events` instead of `outputs` you should update in the same way and switch to `outputs` as `events` is deprecated.

  ```
  @Output() myEvent;
  @Output('my-event-name') myEvent;
  ```

  should be changed to:

  ```
  @Output() myEvent;
  @Output('myEventName') myEvent;
  ```

4. Update the host bindings

  ```
  @Directive({
    host: {
      '[some-prop]': 'exp',
      '[style.background-color]': 'exp',
      '[class.some-class]': 'exp',
      '[attr.some-attr]': 'exp',
      '(some-event)': 'action()',
      'some-attr': 'value'
    }
  })
  ```

  should be changed to:

  ```
  @Directive({
    host: {
      '[someProp]': 'exp',
      '[style.background-color]': 'exp',
      '[class.some-class]': 'exp',
      '[attr.some-attr]': 'exp',
      '(someEvent)': 'action()',
      'some-attr': 'value'
    }
  })
  ```

  The property bindings (`[...]`) and event bindings (`(...)`) must be updated in the same way as they are updated in a
  template - ie converted to camel case (reminder: `[attr.]`, `[class.]` and `[style.]` should not be converted to camel case).

5. Update export name

  ```
  @Directive({
    exportAs: 'some-name'
  })
  ```

  should be changed to:

  ```
  @Directive({
    exportAs: 'someName'
  })
  ```


# CSS

As the attribute names from your templates have been updated from dash to camel case, you should also reflect the changes
in your stylesheets.

The attributes that need to be updated are the ones used in the selector and the inputs of your directives.

Before:

```
// Directive
@Directive({
  selector: '[my-dir]',
  inputs: ['someProp: some-input'],
})

<!-- template -->
<div my-dir some-input="some value" not-an-input></div>

/* css */
[my-dir] { ... }
[some-input] { ... }
[not-an-input] { ... }
```

After:

```
// Directive
@Directive({
  selector: '[myDir]',
  inputs: ['someProp: someInput'],
})

<!-- template -->
<div myDir someInput="some value" not-an-input></div>

/* css */
[myDir] { ... }
[someInput] { ... }
[not-an-input] { ... }
```

Notes:
  - `not-an-input` is not used in a selector nor it is an input of a directive, it need not be camel cased,
  - CSS selectors are case insensitive you can use `[myDir]`, `[mydir]` or any other casing.
