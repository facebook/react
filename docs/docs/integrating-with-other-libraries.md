---
id: integrating-with-other-libraries
title: Integrating with other libraries
permalink: docs/integrating-with-other-libraries.html
---

## Using jQuery plugins from React

React is unaware of changes made to the DOM outside of React. It determines updates based on its own internal representation, and if those updates are invalidated, React has no way to recover.

This does not mean it is impossible or even necessarily difficult to combine React with other ways of affecting the DOM, you just have to be mindful of what each are doing.

The easiest way to avoid conflicts is to prevent the React component from updating. This can be done explicitly by returning false from [`shouldComponentUpdate()`](/react/docs/react-component.html#shouldcomponentupdate), or by rendering elements that have no reason to change.

```js
class SomePlugin extends React.Component {
  componentDidMount() {
    this.$el.somePlugin();
  }

  componentWillUnmount() {
    this.$el.somePlugin('destroy');
  }

  render() {
    return <div ref={el => this.$el = $(el)} />
  }
}
```
A [ref](/react/docs/refs-and-the-dom.html) is used to pass the underlying DOM element to the plugin. The `<div>` element has no properties or children, so React has no reason to update it.

The component still has to be unmounted, which provides one final opportunity for conflict. If the plugin does not provide a method for cleanup, you will probably have to provide your own, remembering to remove any event listeners the plugin registered to prevent memory leaks.

To demonstrate these concepts let's write a minimal wrapper for the plugin [Chosen](https://github.com/harvesthq/chosen), which augments `<select>` inputs.

Chosen does not render the initial select, so it is up to React to do so. Chosen hides the initial select and creates its own control, notifying the original of changes using jQuery. Because it is Chosen maintaining the state, it is easiest to implement the wrapper using an [uncontrolled component.](/react/docs/uncontrolled-components.html)

```js
class Chosen extends React.Component {
  constructor(props) {
    super(props);
    this.handleUpdate = this.handleUpdate.bind(this);
  }

  handleUpdate(event) {
    this.props.update(event.target.value);
  }

  componentDidMount() {
    this.$el.chosen();
    this.$el.on('change', this.handleUpdate);
  }

  componentDidUpdate() {
    this.$el.trigger('chosen:updated');
  }

  componentWillUnmount() {
    this.$el.off('change', this.handleUpdate);
    this.$el.chosen('destroy');
  }

  render() {
    return (
      <select ref={el => this.$el = $(el)}>
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

## Backbone

### Embedding React in a Backbone View

Creating a Backbone wrapper around a React component is easy thanks to the flexibility of `ReactDOM.render()`. While a typical application usually calls the `render` method just once, it may be called repeatedly to update props or to create multiple component trees.

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

### Using Backbone Models in React components

The simplest way to consume Backbone models and collections from a React component is to listen to the various change events and manually force an update.

Components responsible for rendering models would listen to `'change'` events, while components responsible for rendering collections would listen for `'add'` and `'remove` events. In both cases, call `this.forceUpdate()` to rerender the component with the new data.

In the following code, `ListComponent` renders a collection with `ItemComponent` responsible for rendering the individual models.

```js
class ItemComponent extends React.Component {
  constructor(props) {
    super(props);
    this.rerender = this.forceUpdate.bind(this);
  }

  componentDidMount() {
    this.props.model.on('change', rerender);
  }

  componentWillUnmount() {
    this.props.model.off('change', rerender);
  }

  render() {
    return <li>{this.props.model.get('text')}</li>;
  }
}

class ListComponent extends React.Component {
  constructor(props) {
    super(props);
    this.rerender = this.forceUpdate.bind(this);
  }

  componentDidMount() {
    this.props.collection.on('add', 'remove', rerender);
  }

  componentWillUnmount() {
    this.props.collection.off('add', 'remove', rerender);
  }

  render() {
    return (
      <ul>
        {this.props.collection.map(model => (
          <ItemComponent model={model} />
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
