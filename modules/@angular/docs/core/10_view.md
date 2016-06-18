# View

## Overview

This document explains the concept of a View.
A View is a core primitive used by angular to render the DOM tree.
A ViewContainer is location in a View which can accept child Views.
Every ViewContainer has an associated ViewContainerRef than can contain any number of child Views.
Views form a tree structure which mimics the DOM tree.

* View is a core rendering construct. A running application is just a collection of Views which are
  nested in a tree like structure. The View tree is a simplified version of the DOM tree. A View can
  have a single DOM Element or large DOM structures. The key is that the DOM tree in the View can
  not undergo structural changes (only property changes).
* Views represent a running instance of a DOM View. This implies that while elements in a View
  can change properties, they can not change structurally. (Structural changes such as, adding or
  removing elements requires adding or removing child Views into ViewContainers).
* View can have zero or more ViewContainers. A ViewContainer is a marker in the DOM which allows
  the insertion of child Views.
* Views are created from a ProtoView. A ProtoView is a compiled DOM View which is efficient at
  creating Views.
* View contains a context object. The context represents the object instance against which all
  expressions are evaluated.
* View contains a ChangeDetector for looking for detecting changes to the model.
* View contains ElementInjector for creating Directives.

## Simple View

Let's examine a simple View and all of its parts in detail.

Assume the following Component:

```
class Greeter {
  greeting:string;

  constructor() {
    this.greeting = 'Hello';
  }
}
```

And assume following HTML View:

```
<div>
  Your name:
  <input var="name" type="Text">
  <br>
  {{greeting}} {{name.value}}!
</div>
```

The above template is compiled by the Compiler to create a ProtoView. The ProtoView is then used to
create an instance of the View. The instantiation process involves cloning the above template and
locating all of the elements which contain bindings and finally instantiating the Directives
associated with the template. (See compilation for more details.)

```
<div>                             | viewA(greeter)
  Your name:                      | viewA(greeter)
  <input var="name" type="Text">  | viewA(greeter): local variable 'name'
  <br>                            | viewA(greeter)
  {{greeting}} {{name.value}}!    | viewA(greeter): binding expression 'greeting' & 'name.value'
</div>                            | viewA(greeter)
```

The resulting View instance looks something like this (simplified pseudo code):
```
viewA = new View({
  template: ...,
  context: new Greeter(),
  localVars: ['name'],
  watchExp: ['greeting', 'name.value']
});
```

Note:
* View uses instance of `Greeter` as the evaluation context.
* View knows of local variables `name`.
* View knows which expressions need to be watched.
* View knows what needs to be updated if the watched expression changes.
* All DOM elements are owned by single instance of the view.
* The structure of the DOM can not change during runtime. To allow structural changes to the DOM we need
  to understand Composed View.


## Composed View

An important part of an application is to be able to change the DOM structure to render data for the
user. In Angular this is done by inserting child views into the ViewContainer.

Let's start with a View such as:

```
<ul>
  <li template="ngFor: let person of people">{{person}}</li>
</ul>
```

During the compilation process the Compiler breaks the HTML template into these two ProtoViews:

```
  <li>{{person}}</li>   | protoViewB(Locals)
```

and

```
<ul>                    | protoViewA(someContext)
  <template></template> | protoViewA(someContext): protoViewB
</ul>                   | protoViewA(someContext)
```


The next step is to compose these two ProtoViews into an actual view which is rendered to the user.

*Step 1:* Instantiate `viewA`

```
<ul>                    | viewA(someContext)
  <template></template> | viewA(someContext): new NgFor(new ViewContainer(protoViewB))
</ul>                   | viewA(someContext)
```

*Step2:* Instantiate `NgFor` directive which will receive the `ViewContainerRef`. (The ViewContainerRef
has a reference to `protoViewA`).


*Step3:* As the `NgFor` directive unrolls it asks the `ViewContainerRef` to instantiate `protoViewB` and insert
it after the `ViewContainer` anchor. This is repeated for each `person` in `people`. Notice that

```
<ul>                    | viewA(someContext)
  <template></template> | viewA(someContext): new NgFor(new ViewContainer(protoViewB))
  <li>{{person}}</li>   | viewB0(locals0(someContext))
  <li>{{person}}</li>   | viewB1(locals0(someContext))
</ul>                   | viewA(someContext)
```

*Step4:* All of the bindings in the child Views are updated. Notice that in the case of `NgFor`
the evaluation context for the `viewB0` and `viewB1` are `locals0` and `locals1` respectively.
Locals allow the introduction of new local variables visible only within the scope of the View, and
delegate any unknown references to the parent context.

```
<ul>                    | viewA
  <template></template> | viewA: new NgFor(new ViewContainer(protoViewB))
  <li>Alice</li>        | viewB0
  <li>Bob</li>          | viewB1
</ul>                   | viewA
```

Each View can have zero or more ViewContainers. By inserting and removing child Views to and from the
ViewContainers, the application can mutate the DOM structure to any desirable state. A View may contain
individual nodes or a complex DOM structure. The insertion points for the child Views, known as
ViewContainers, contain a DOM element which acts as an anchor. The anchor is either a `template` or
a `script` element depending on your browser. It is used to identify where the child Views will be
inserted.

## Component Views

A View can also contain Components. Components contain Shadow DOM for encapsulating their internal
rendering state. Unlike ViewContainers which can contain zero or more Views, the Component always contains
exactly one Shadow View.

```
<div>                            | viewA
  <my-component>                 | viewA
    #SHADOW_ROOT                 | (encapsulation boundary)
      <div>                      |   viewB
         encapsulated rendering  |   viewB
      </div>                     |   viewB
  </my-component>                | viewA
</div>                           | viewA
```

## Evaluation Context

Each View acts as a context for evaluating its expressions. There are two kinds of contexts:

1. A component controller instance and
2. a `Locals` context for introducing local variables into the View.

Let's assume following component:

```
class Greeter {
  greeting:string;

  constructor() {
    this.greeting = 'Hello';
  }
}
```

And assume the following HTML View:

```
<div>                             | viewA(greeter)
  Your name:                      | viewA(greeter)
  <input var="name" type="Text">  | viewA(greeter)
  <br>                            | viewA(greeter)
  {{greeting}} {{name.value}}!    | viewA(greeter)
</div>                            | viewA(greeter)
```

The above UI is built using a single View, and hence a single context `greeter`. It can be expressed
in this pseudo-code.

```
var greeter = new Greeter();
```

The View contains two bindings:

1. `greeting`: This is bound to the `greeting` property on the `Greeter` instance.
2. `name.value`: This poses a problem. There is no `name` property on the `Greeter` instance. To solve
this we wrap the `Greeter` instance in the `Local` instance like so:
```
var greeter = new Locals(new Greeter(), {name: ref_to_input_element })
```


By wrapping the `Greeter` instance into the `Locals` we allow the view to introduce variables which
are in addition to the `Greeter` instance. During the resolution of the expressions we first check
the locals, and then the `Greeter` instance.



## View LifeCycle (Hydration and Dehydration)

Views transition through a particular set of states:

1. View is created from the ProtoView.
2. View can be attached to an existing ViewContainerRef.
3. Upon attaching View to the ViewContainerRef the View needs to be hydrated. The hydration process
   involves instantiating all of the Directives associated with the current View.
4. At this point the view is ready and renderable. Multiple changes can be delivered to the
   Directives from the ChangeDetection.
5. At some point the View can be removed. At this point all of the directives are destroyed during
   the dehydration process and the view becomes inactive.
6. The View has to wait until it is detached from the DOM. The delay in detaching could be caused
   because an animation is animating the view away.
7. After the View is detached from the DOM it is ready to be reused. The view reuse allows the
   application to be faster in subsequent renderings.
