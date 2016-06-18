@cheatsheetSection
Template syntax
@cheatsheetIndex 1
@description

@cheatsheetItem
syntax:
`<input [value]="firstName">`|`[value]`
description:
Binds property `value` to the result of expression `firstName`.

@cheatsheetItem
syntax:
`<div [attr.role]="myAriaRole">`|`[attr.role]`
description:
Binds attribute `role` to the result of expression `myAriaRole`.

@cheatsheetItem
syntax:
`<div [class.extra-sparkle]="isDelightful">`|`[class.extra-sparkle]`
description:
Binds the presence of the CSS class `extra-sparkle` on the element to the truthiness of the expression `isDelightful`.

@cheatsheetItem
syntax:
`<div [style.width.px]="mySize">`|`[style.width.px]`
description:
Binds style property `width` to the result of expression `mySize` in pixels. Units are optional.

@cheatsheetItem
syntax:
`<button (click)="readRainbow($event)">`|`(click)`
description:
Calls method `readRainbow` when a click event is triggered on this button element (or its children) and passes in the event object.

@cheatsheetItem
syntax:
`<div title="Hello {{ponyName}}">`|`{{ponyName}}`
description:
Binds a property to an interpolated string, e.g. "Hello Seabiscuit". Equivalent to:
`<div [title]="'Hello ' + ponyName">`

@cheatsheetItem
syntax:
`<p>Hello {{ponyName}}</p>`|`{{ponyName}}`
description:
Binds text content to an interpolated string, e.g. "Hello Seabiscuit".

@cheatsheetItem
syntax:
`<my-cmp [(title)]="name">`|`[(title)]`
description:
Sets up two-way data binding. Equivalent to: `<my-cmp [title]="name" (titleChange)="name=$event">`

@cheatsheetItem
syntax:
`<video #movieplayer ...>
  <button (click)="movieplayer.play()">
</video>`|`#movieplayer`|`(click)`
description:
Creates a local variable `movieplayer` that provides access to the `video` element instance in data-binding and event-binding expressions in the current template.

@cheatsheetItem
syntax:
`<p *myUnless="myExpression">...</p>`|`*myUnless`
description:
The `*` symbol means that the current element will be turned into an embedded template. Equivalent to:
`<template [myUnless]="myExpression"><p>...</p></template>`

@cheatsheetItem
syntax:
`<p>Card No.: {{cardNumber | myCreditCardNumberFormatter}}</p>`|`{{cardNumber | myCreditCardNumberFormatter}}`
description:
Transforms the current value of expression `cardNumber` via the pipe called `myCreditCardNumberFormatter`.

@cheatsheetItem
syntax:
`<p>Employer: {{employer?.companyName}}</p>`|`{{employer?.companyName}}`
description:
The safe navigation operator (`?`) means that the `employer` field is optional and if `undefined`, the rest of the expression should be ignored.

@cheatsheetItem
syntax:
`<svg:rect x="0" y="0" width="100" height="100"/>`|`svg:`
description:
SVG snippet templates need an `svg:` prefix on their root element to disambiguate the SVG element from an HTML component.

@cheatsheetItem
syntax:
`<svg>
  <rect x="0" y="0" width="100" height="100"/>
</svg>`|`svg`
description:
`<svg>` root elements are detected as SVG element automatically without the prefix
