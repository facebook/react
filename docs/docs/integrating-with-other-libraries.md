---
id: integrating-with-other-libraries
title: Integrating with other libraries
permalink: docs/integrating-with-other-libraries.html
---

React can be used in any web application. It can be embedded in other applications and, with a little care, other applications can be embedded in React. This guide will examine some of the more common use cases, focusing on integration with jQuery and Backbone.

## Integrating with DOM Manipulation Plugins

React is unaware of changes made to the DOM outside of React. It determines updates based on its own internal representation, and if those updates are invalidated, React has no way to recover.

This does not mean it is impossible or even necessarily difficult to combine React with other ways of affecting the DOM, you just have to be mindful of what each are doing.

The easiest way to avoid conflicts is to prevent the React component from updating. This can be done explicitly by returning false from [`shouldComponentUpdate()`](/react/docs/react-component.html#shouldcomponentupdate), or by rendering elements that have no reason to change, like an empty `<div />`.

To demonstrate this, let's sketch out a wrapper for a generic jQuery plugin. We will be using an empty element to prevent conflicts, so just return an empty `<div />` in render. Use a [ref](/react/docs/refs-and-the-dom.html) to get a reference to the underlying DOM element to pass to the plugin. The `<div />` element has no properties or children, so React has no reason to update it, leaving the plugin free to manage that part of the DOM.

```js
class SomePlugin extends React.Component {
  componentDidMount() {
    this.$el = $(this.el);
    this.$el.somePlugin();
  }

  componentWillUnmount() {
    this.$el.somePlugin('destroy');
  }

  render() {
    return <div ref={el => this.el = el} />;
  }
}
```

The component still has to be unmounted, which provides one final opportunity for conflict. If the plugin does not provide a method for cleanup, you will probably have to provide your own, remembering to remove any event listeners the plugin registered to prevent memory leaks.

To demonstrate these concepts let's write a minimal wrapper for the plugin [Chosen](https://github.com/harvesthq/chosen), which augments `<select>` inputs.

Chosen does not render the initial select, so it is up to React to do so. Chosen hides the initial select and creates its own control, notifying the original of changes using jQuery. Because it is Chosen maintaining the state, it is easiest to implement the wrapper using an [uncontrolled component.](/react/docs/uncontrolled-components.html)

The component might be used as follows:
```js
const options = ["a", "b", "c"].map(value => {
  return <option>{value}</option>;
});
function onChange(event) {
  console.log(event.target.value);
}

<Chosen onChange={onChange}>
  {options}
</Chosen>
```

```js
class Chosen extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.$el = $(this.el);
    this.$el.chosen();
    this.$el.on('change', this.props.onChange);
  }

  componentDidUpdate() {
    this.$el.trigger('chosen:updated');
  }

  componentWillUnmount() {
    this.$el.off('change', this.props.onChange);
    this.$el.chosen('destroy');
  }

  render() {
    return (
      <select ref={el => this.el = el}>
        {this.props.children}
      </select>
    );
  }
}
```

1. Change listeners need to be setup inside `componentDidMount()` and torn down in `componentWillUnmount` as the events are emitted by the plugin use jQuery, which is outside the React event system.

2. Chosen needs to be notified of any changes to the original select or its children. This is done in `componentWillUpdate()` by triggering a `'chosen:updated'` event.

3. When the component is unmounted, use the cleanup method provided by Chosen. This removes the custom select control and restores the actual `<select>` as well as removing any event listeners the plugin registered.

[Try it on CodePen.](http://codepen.io/wacii/pen/ygzxjG?editors=0010)

## Integrating with Other View Libraries

React can be easily embedded into other applications thanks to the flexibility of `ReactDOM.render()`. While often used once at startup to load a single React application into the DOM, `ReactDOM.render()` can be called multiple times, both to create multiple React applications and to update existing ones. This allows applications to be rewritten in React piece by piece.

### Replacing String Based Rendering with React

A common pattern in older web applications is to describe chunks of the DOM as a string and insert it into the DOM like so: `$el.html(htmlString)`. These points in a codebase are perfect for introducing React. Just rewrite the string based rendering as a React component.

So the following jQuery implementation...
```js
const htmlString = '<button id="jquery-btn">jQuery</button>';
$el.html(htmlString);
$('jquery-btn').click(() => window.alert('jQuery button'));
```

...could be rewritten using a React Component.
```js
function Button() {
  return <button id='react-btn'>React</button>;
}
ReactDOM.render(
  <Button />,
  document.getElementById('react-container'),
  () => {
    $('#react-btn').click(() => window.alert('React button'));
  }
);
```

From here you could start moving more logic into the component and begin adopting more common React practices.

```js
function Button({ handleClick }) {
  return <button onClick={handleClick}>React</button>;
}
ReactDOM.render(
  <Button handleClick={() => window.alert('React button v2')} />,
  document.getElementById('react-container')
);
```

[Try it on CodePen.](http://codepen.io/wacii/pen/RpvYdj?editors=1010)

### Embedding React in a Backbone View

Backbone Views typically use HTML strings, or string producing template functions, to create the content for their associated DOM element. Like before, this process may be replaced with a React component.

Each view will have an associated component, and when the view renders, `ReactDOM.render()` is used to render the component into the view's `el`.

```js
function Component({ text }) {
  return <p>{text}</p>;
}

const ComponentView = Backbone.View.extend({
  render() {
    const text = this.model.get('text');
    ReactDOM.render(<Component text={text} />, this.el);
    return this;
  },
  remove() {
    ReactDOM.unmountComponentAtNode(this.el);
    Backbone.View.prototype.remove.call(this);
  }
});
```

State is maintained in the view as `this.model` and passed to the component as props.

In addition to normal cleanup, event listeners registered through React as well as component state should be removed by calling `ReactDOM.unmountComponentAtNode()`. This is something React normally calls for us, but because we are controlling the application with Backbone, we must do this manually to avoid leaking memory.

[Try it on CodePen.](http://codepen.io/wacii/pen/OWZJMQ?editors=0010)

## Integrating with Model Layers

React has little opinion on how data is stored or updated and so React components can easily incorporate the model layer from other frameworks. Models may be consumed as is or extracted using containers for better separation of concerns. Both approaches will be demonstrated using Backbone.

### Using Backbone Models in React components

The simplest way to consume Backbone models and collections from a React component is to listen to the various change events and manually force an update.

Components responsible for rendering models would listen to `'change'` events, while components responsible for rendering collections would listen for `'add'` and `'remove` events. In both cases, call `this.forceUpdate()` to rerender the component with the new data.

In the following code, `ListComponent` renders a collection with `ItemComponent` responsible for rendering the individual models.

```js
class ItemComponent extends React.Component {
  constructor(props) {
    super(props);
    this.rerender = () => this.forceUpdate();
  }

  componentDidMount() {
    this.props.model.on('change', this.rerender);
  }

  componentWillUnmount() {
    this.props.model.off('change', this.rerender);
  }

  render() {
    return <li>{this.props.model.get('text')}</li>;
  }
}

class ListComponent extends React.Component {
  constructor(props) {
    super(props);
    this.rerender = () => this.forceUpdate();
  }

  componentDidMount() {
    this.props.collection.on('add', 'remove', this.rerender);
  }

  componentWillUnmount() {
    this.props.collection.off('add', 'remove', this.rerender);
  }

  render() {
    return (
      <ul>
        {this.props.collection.map(model => (
          <ItemComponent key={model.cid} model={model} />
        ))}
      </ul>
    )
  }
}
```

[Try it on CodePen.](http://codepen.io/wacii/pen/oBdgoM?editors=0010)

### Extracting data from Backbone models

Alternatively, whenever a model changes, you can extract its attributes as plain data. The following is [a higher-order component (HOC)](/react/docs/higher-order-components.html) that extracts all attributes of a Backbone model into state, passing the data to the wrapped component.

This way, only the HOC needs to know about Backbone model internals, and the components concerned with presenting data can focus on that.

```js
function backboneModelAdapter(Component) {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = { ...props.model.attributes };
      this.handleChange = this.handleChange.bind(this);
    }

    handleChange(model) {
      this.setState(model.changedAttributes());
    }

    componentDidMount() {
      this.props.model.on('change', this.handleChange);
    }

    componentWillUnmount() {
      this.props.model.off('change', this.handleChange);
    }

    render() {
      const { model, ...otherProps } = this.props;
      return <Component {...otherProps} {...this.state} />;
    }
  }
}
```

A copy is made of the model's attributes to form the initial state. Every time there is a change event, just the changed attributes are updated.

To demonstrate its use, we will use a basic input wrapper. The component will render the `'text'` attribute of the provided model, calling an update function whenever the input is changed, presumably to update the model.

```js
function Input({ text, handleChange }) {
  return <input value={text} onChange={handleChange} />;
}

function BackboneModelAdapterDemo() {
  const model = new Backbone.Model({ text: 'Sam' });
  const handleChange = event => model.set('text', event.target.value);
  const WrappedInput = backboneModelAdapter(Input);
  return <WrappedInput model={model} handleChange={handleChange} />;
}
```

[Try it on CodePen.](http://codepen.io/wacii/pen/RKyWKZ?editors=0010)
