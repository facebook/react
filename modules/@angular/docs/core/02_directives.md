# Directives

Directives are classes which get instantiated as a response to a particular DOM structure. By controlling the DOM structure, what directives are imported, and their selectors, the developer can use the [composition pattern](http://en.wikipedia.org/wiki/Object_composition) to get a desirable application behavior.

Directives are the cornerstone of an Angular application. We use Directives to break complex problems into smaller more reusable components. Directives allow the developer to turn HTML into a DSL and then control the application assembly process.

Angular applications do not have a main method. Instead they have a root Component. Dependency Injection then assembles the directives into a working Angular application.

Directives with an encapsulated view and an optional injector are called *Components*.


## CSS Selectors

Directives are instantiated whenever the CSS selector matches the DOM structure.

Angular supports these CSS selector constructs:
* Element name: `name`
* Attribute: `[attribute]`
* Attribute has value: `[attribute=value]`
* Attribute contains value: `[attribute*=value]`
* Class: `.class`
* AND operation: `name[attribute]`
* OR operation: `name,.class`
* NOT operation: `:not(.class)`

Angular does not support these (and any CSS selector which crosses element boundaries):
* Descendant: `body div`
* Direct descendant: `body > div`
* Adjacent: `div + table`
* Sibling: `div ~ table`
* Wildcard: `*`
* ID: `#id`
* Pseudo selectors: `:pseudo` other than `:not`



Given this DOM:

```<input type="text" required class="primary">```

These CSS selectors will match:
* `input`: Triggers whenever element name is `input`.
* `[required]`: Triggers whenever element contains a required attribute.
* `[type=text]`: Triggers whenever element contains attribute `type` whose value is `text`.
* `.primary`: Triggers whenever element class contains `primary`.

CSS Selectors can be combined:
* `input[type=text]`: Triggers on element name `input` which is of `type` `text`.
* `input[type=text], textarea`: triggers on element name `input` which is of `type` `text` or element name `textarea`.



## Directives

The simplest kind of directive is a decorator. Directives are useful for encapsulating behavior.

* Multiple decorators can be placed on a single element.
* Directives do not introduce new evaluation context.
* Directives are registered through the `@Directive` meta-data annotation.

Here is a trivial example of a tooltip decorator. The directive will log a tooltip into the console on every time mouse enters a region:

```
@Directive({
  selector: '[tooltip]',     | CSS Selector which triggers the decorator
  properties: [              | List which properties need to be bound
    'text: tooltip'          |  - DOM element tooltip property should be
  ],                         |    mapped to the directive text property.
  host: {                    | List which events need to be mapped.
    '(mouseover)': 'show()'  |  - Invoke the show() method every time
  }                          |    the mouseover event is fired.
})                           |
class Form {                 | Directive controller class, instantiated
                             | when CSS matches.
  text:string;               | text property on the Directive Controller.
                             |
  show() {                   | Show method which implements the show action.
    console.log(this.text);  |
  }
}
```

Example of usage:

```<span tooltip="Tooltip text goes here.">Some text here.</span>```

The developer of an application can now freely use the `tooltip` attribute wherever the behavior is needed. The code above has taught the browser a new reusable and declarative behavior.

Notice that data binding will work with this decorator with no further effort as shown below.

```<span tooltip="Greetings {{user}}!">Some text here.</span>```



## Components

Component is a directive which uses shadow DOM to create encapsulate visual behavior. Components are typically used to create UI widgets or to break up the application into smaller components.

* Only one component can be present per DOM element.
* Component's CSS selectors usually trigger on element names. (Best practice)
* Component has its own shadow view which is attached to the element as a Shadow DOM.
* Shadow view context is the component instance. (i.e. template expressions are evaluated against the component instance.)

>> TODO(misko): Configuring the injector

Example of a component:

```
@Component({                      | Component annotation
  selector: 'pane',               | CSS selector on <pane> element
  properties: [                   | List which property need to be bound
    'title',                      |  - title mapped to component title
    'open'                        |  - open attribute mapped to component's open property
  ],                              |
  templateUrl: 'pane.html'        | URL of template HTML
})                                |
class Pane {                      | Component controller class
  title:string;                   |  - title property
  open:boolean;

  constructor() {
    this.title = '';
    this.open = true;
  }

  // Public API
  toggle() => this.open = !this.open;
  open() => this.open = true;
  close() => this.open = false;
}
```

`pane.html`:
```
<div class="outer">
  <h1>{{title}}</h1>
  <div class="inner" [hidden]="!open">
    <ng-content></ng-content>
  </div>
</div>
```

`pane.css`:
```
.outer, .inner { border: 1px solid blue;}
.h1 {background-color: blue;}
```

Example of usage:
```
<pane #pane title="Example Title" open="true">
  Some text to wrap.
</pane>
<button (click)="pane.toggle()">toggle</button>

```



## Directives that use a ViewContainer

Directives that use a ViewContainer can control instantiation of child views which are then inserted into the DOM. (Examples are `ngIf` and `ngFor`.)

* Every `template` element creates a `ProtoView` which can be used to create Views via the ViewContainer.
* The child views show up as siblings of the directive in the DOM.

>> TODO(misko): Relationship with Injection
>> TODO(misko): Instantiator can not be injected into child Views


```
@Directive({
  selector: '[if]',
  properties: [
    'condition: if'
  ]
})
export class If {
  viewContainer: ViewContainerRef;
  protoViewRef: ProtoViewRef;
  view: View;

  constructor(viewContainer: ViewContainerRef, protoViewRef: ProtoViewRef) {
    this.viewContainer = viewContainer;
    this.protoViewRef = protoViewRef;
    this.view = null;
  }

  set condition(value) {
    if (value) {
      if (this.view === null) {
        this.view = this.viewContainer.create(protoViewRef);
      }
    } else {
      if (this.view !== null) {
        this.viewContainer.remove(this.view);
        this.view = null;
      }
    }
  }
}
```

## Dependency Injection

Dependency Injection (DI) is a key aspect of directives. DI allows directives to be assembled into different [compositional](http://en.wikipedia.org/wiki/Object_composition) hierarchies. Angular encourages [composition over inheritance](http://en.wikipedia.org/wiki/Composition_over_inheritance) in the application design (but inheritance based approaches are still supported).

When Angular directives are instantiated, the directive can ask for other related directives to be injected into it. By assembling the directives in different order and subtypes the application behavior can be controlled. A good mental model is that the DOM structure controls the directive instantiation graph.

Directive instantiation is triggered by the directive CSS selector matching the DOM structure. In a directive's constructor, it can ask for other directives or application services. When asking for directives, the dependency is attempted to be located by its DOM hierarchy first, then if not found, by using the application level injector.

To better understand the kinds of injections which are supported in Angular we have broken them down into use case examples.


### Injecting Services

Service injection is the most straight forward kind of injection which Angular supports. It involves a component configuring the `providers` or `viewProviders` and then letting the directive ask for the configured service.

This example illustrates how to inject `MyService` into `House` directive.


```
class MyService {}                   | Assume a service which needs to be injected
                                     | into a directive.
                                     |
@Component({                         | Assume a top level application component which
  selector: 'my-app',                | configures the services to be injected.
  viewProviders: [MyService],         |
  templateUrl: 'my_app.html',        | Assume we have a template that needs to be
  directives: [House]                | configured with directives to be injected.
})                                   |
class MyApp {}                       |
                                     |
@Directive({                         | This is the directive into which we would like
  selector: '[house]'                | to inject the MyService.
})                                   |
class House {                        |
  constructor(myService:MyService) { | Notice that in the constructor we can simply
  }                                  | ask for MyService.
}                                    |


```

Assume the following DOM structure for `my_app.html`:
```
<div house>     | The house attribute triggers the creation of the House directive.
</div>          | This is equivalent to:
                |   new House(injector.get(MyService));
```


### Injecting other Directives

Injecting other directives into directives follows a similar mechanism as injecting services into directives, but with added constraint of visibility governed by DOM structure.

There are five kinds of visibilities:

* (no annotation): Inject dependent directives only if they are on the current element.
* `@SkipSelf()`: Inject a directive if it is at any element above the current element.
* `@child`: Inject a list of direct children which match a given type. (Used with `Query`)
* `@descendant`: Inject a list of any children which match a given type. (Used with `Query`)

NOTE: if the injection constraint can not be satisfied by the current visibility constraint, then it is forwarded to the normal injector which either provides a default value for the directive or throws an error.

Here is an example of the kinds of injections which can be achieved:


```
@Component({                         |
  selector: 'my-app'                 |
  templateUrl: 'my_app.html',        |
  directives: [Form, FieldSet,       |
    Field, Primary]                  |
})                                   |
class MyApp {}                       |
                                     |
@Directive({ selector: 'form' })     |
class Form {                         |
  constructor(                       |
    @descendant sets:Query<FieldSet> |
  ) {                                |
  }                                  |
}                                    |
                                     |
@Directive({ selector: 'fieldset' }) |
class FieldSet {                     |
  constructor(                       |
    @child sets:Query<Field>         |
  ) { ... }                          |
}                                    |
                                     |
@Directive({ selector: 'field' })    |
class Field {                        |
  constructor(                       |
    @SkipSelf() field:Form,          |
    @SkipSelf() field:FieldSet,      |
  ) { ... }                          |
}                                    |
                                     |
@Directive({ selector: '[primary]'}) |
class Primary {                      |
  constructor(field:Field ) { ... }  |
}                                    |
```

Assume the following DOM structure for `my_app.html`:
```
<form>                         |
  <div>                        |
    <fieldset>                 |
       <field primary></field> |
       <field></field>         |
    </fieldset>                |
  </div>                       |
</form>                        |
```

#### Shadow DOM effects on Directive DI

Shadow DOM provides an encapsulation for components, so as a general rule it does not allow directive injections to cross the shadow DOM boundaries. To remedy this, declaratively specify the required component as an injectable.

```
@Component({
  selector: '[kid]'
  templateUrl: 'kid.html',
  directives: []
})
class Kid {
  constructor(
    @SkipSelf() dad:Dad,
    @Optional() grandpa:Grandpa
  ) {
    this.name = 'Billy';
    this.dad = dad.name;
    this.grandpa = grandpa.name;
  }
}

@Component({
  selector: '[dad]'
  templateUrl: 'dad.html',
  directives: [Kid]
})
class Dad {
  constructor(@SkipSelf() dad:Grandpa) {
    this.name = 'Joe Jr';
    this.dad = dad.name;
  }
}

@Component({
  selector: '[grandpa]',
  viewProviders: [],
  templateUrl: 'grandpa.html',
  directives: [Dad]
})
class Grandpa {
  constructor() {
    this.name = 'Joe';
  }
}
```

Assume the following DOM structure for `grandpa.html`: The Dad has access to the Grandpa.
```
Name: {{name}}: <br> Children: <div dad></div>
```

Assume the following DOM structure for `dad.html`: Here the rendered Kid will also have access to Grandpa.
```
Name: {{name}}: <br> Dad: {{dad}} <br> Children: <div kid></div>
```

## Further Reading

* [Composition](http://en.wikipedia.org/wiki/Object_composition)
* [Composition over Inheritance](http://en.wikipedia.org/wiki/Composition_over_inheritance)
