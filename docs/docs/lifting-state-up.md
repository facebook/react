---
id: lifting-state-up
title: Lifting State Up
permalink: docs/lifting-state-up.html
prev: state-and-lifecycle.html
next: composition-vs-inheritance.html
---

Often, several components need to reflect the same changing data. We recommend to lift the shared state up to their closest common ancestor. Let's see how this works in action.

In this section, we will create a temperature calculator that calculates whether the water would boil at a given temperature.

Our first component is called `Calculator`. It renders an `<input>` that lets you enter the temperature, and keeps its value in `this.state.text`:

```js{5,9,13,17,18}
class Calculator extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = {text: ''};
  }

  handleChange(e) {
    this.setState({text: e.target.value});
  }

  render() {
    const text = this.state.text;
    return (
      <fieldset>
        <legend>Enter temperature in Celsius:</legend>
        <input value={text}
               onChange={this.handleChange} />
      </fieldset>
    );
  }
}
```

We'll add another component called `BoilingVerdict`. It accepts the `celsius` number as a prop, and prints whether the water would boil with the given temperature:

```js{3,5}
function BoilingVerdict(props) {
  if (props.celsius >= 100) {
    return <p>The water would boil.</p>;
  } else {
    return <p>The water would not boil.</p>;
  }
}
```

We will change the `Calculator` to render `BoilingVerdict` if the input value is a number:

```js{3,4,10-12}
  render() {
    const text = this.state.text;
    const celsius = parseFloat(text, 10);
    const isValidNumber = !Number.isNaN(celsius);
    return (
      <fieldset>
        <legend>Enter temperature in Celsius:</legend>
        <input value={text}
               onChange={this.handleChange} />
        {isValidNumber &&
          <BoilingVerdict celsius={celsius} />
        }
      </fieldset>
    );
  }
}
```

[Try it on Codepen.](http://codepen.io/gaearon/pen/Gjxgrj?editors=0010)

## Adding a Second Input

Our new requirement is that, in addition to a Celsius input, we provide a Fahrenheit input, and they are kept in sync.

We can start by extracting a `TemperatureInput` component from `Calculator` and adding a new `scale` prop to it that can either be `"C"` or `"F"`:

```js{1-4,18,19,23}
const scaleNames = {
  C: 'Celsius',
  F: 'Fahrenheit'
};

class TemperatureInput extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = {text: ''};
  }

  handleChange(e) {
    this.setState({text: e.target.value});
  }

  render() {
    const scale = this.props.scale;
    const scaleName = scaleNames[scale];
    const text = this.state.text;
    return (
      <fieldset>
        <legend>Enter temperature in {scaleName}:</legend>
        <input value={text}
               onChange={this.handleChange} />
      </fieldset>
    );
  }
}
```

We can now change the `Calculator` to render two separate temperature inputs:

```js{5,6}
class Calculator extends React.Component {
  render() {
    return (
      <div>
        <TemperatureInput scale="C" />
        <TemperatureInput scale="F" />
      </div>
    );
  }
}
```

[Try it on Codepen.](http://codepen.io/gaearon/pen/xEWGKG?editors=0010)

We have two inputs now, but when you enter the temperature in one of them, the other doesn't update. This contradicts our requirement: we want to keep them in sync.

We also can't display the `BoilingVerdict` from `Calculator`. The `Calculator` doesn't know the current temperature because it is hidden inside the `TemperatureInput`.

## Lifting State Up

If several components need access to the same state, it is a sign that the state should be lifted up to their closest common ancestor instead. In our case this is the `Calculator`.

We will start by removing the state from `TemperatureInput`.

Instead, it will receive both `text` and the `onChange` handler by props. Since it doesn't contain any state or lifecycle hooks now, we can also turn it into a function for brevity:

```js{6,7}
function TemperatureInput(props) {
  const scaleName = scaleNames[props.scale];
  return (
    <fieldset>
      <legend>Enter temperature in {scaleName}:</legend>
      <input value={props.text}
             onChange={e => props.onChange(e.target.value)} />
    </fieldset>
  );
}
```

We still need to keep track of the state for both inputs somewhere. We will lift it up into the `Calculator` so that it has full control over them:

```js{7,8,13,17,25,26,29,30}
class Calculator extends React.Component {
  constructor(props) {
    super(props);
    this.handleCelsiusChange = this.handleCelsiusChange.bind(this);
    this.handleFahrenheitChange = this.handleFahrenheitChange.bind(this);
    this.state = {
      celsiusText: '',
      fahrenheitText: ''
    };
  }

  handleCelsiusChange(celsiusText) {
    this.setState({celsiusText});
  }

  handleFahrenheitChange(fahrenheitText) {
    this.setState({fahrenheitText});
  }

  render() {
    return (
      <div>
        <TemperatureInput
          scale="C"
          text={this.state.celsiusText}
          onChange={this.handleCelsiusChange} />
        <TemperatureInput
          scale="F"
          text={this.state.fahrenheitText}
          onChange={this.handleFahrenheitChange} />
      </div>
    );
  }
}
```

[Try it on Codepen.](http://codepen.io/gaearon/pen/zKWGwv?editors=0010)

The inputs are still independent, but the `Calculator` now has enough knowledge to keep them in sync and to display the `BoilingVerdict`, which we will implement below.

## Keeping Inputs in Sync

First, we'll write two functions to convert from Celsius to Fahrenheit and back:

```js
function toCelsius(fahrenheit) {
  return (fahrenheit - 32) * 5 / 9;
}

function toFahrenheit(celsius) {
  return (celsius * 9 / 5) + 32;
}
```

We can now use them in the `Calculator` event handlers.

When the user changes the temperature in Celsius and the input is a valid number, we want to update the Fahrenheit input as well:

```js{4,6,7}
  handleCelsiusChange(celsiusText) {
    const celsius = parseFloat(celsiusText, 10);
    const fahrenheit = toFahrenheit(celsius);
    const fahrenheitText = Number.isNaN(celsius) ? '' : fahrenheit.toString();
    this.setState({
      celsiusText,
      fahrenheitText
    });
  }
```

Conversely, if the user changes the Fahrenheit value, we want to update the Celsius input:

```js{4,6,7}
  handleFahrenheitChange(fahrenheitText) {
    const fahrenheit = parseFloat(fahrenheitText, 10);
    const celsius = toCelsius(fahrenheit);
    const celsiusText = Number.isNaN(fahrenheit) ? '' : celsius.toString();
    this.setState({
      celsiusText,
      fahrenheitText
    });
  }
```

Finally, `Calculator` now has enough information to display the `BoilingVerdict`:

```js{2,3,14-16}
  render() {
    const celsius = parseFloat(this.state.celsiusText, 10);
    const isValidNumber = !Number.isNaN(celsius);
    return (
      <div>
        <TemperatureInput
          scale="C"
          text={this.state.celsiusText}
          onChange={this.handleCelsiusChange} />
        <TemperatureInput
          scale="F"
          text={this.state.fahrenheitText}
          onChange={this.handleFahrenheitChange} />
        {isValidNumber &&
          <BoilingVerdict celsius={celsius} />
        }
      </div>
    );
  }
```

[Try it on Codepen.](http://codepen.io/gaearon/pen/BLANRP?editors=0010)

## Lessons Learned

There should be a single "source of truth" for any data that changes in a React application. Usually, the state is first added to the component that needs it for rendering. Then, if other components also need it, you can lift it up to their closest common ancestor. Instead of trying to sync the state between different components, you should rely on the [top-down data flow](/react/docs/state-and-lifecycle.html#the-data-flows-down).

Lifting state involves writing more "boilerplate" code than two-way binding approaches, but as a benefit it takes less work to find and isolate bugs. Since any state "lives" in some component, and that component alone can change it, the surface area for bugs is greatly reduced. Additionally, you can implement any custom logic to reject or transform user input.

When you see something wrong in the UI, you can use [React Developer Tools](https://github.com/facebook/react-devtools) to inspect the props and move up the tree until you find the component responsible for updating the state. Its state will be displayed on the right pane which should give you enough insight into when and how it updates:

<img src="/react/img/docs/react-devtools-state.gif" alt="Monitoring State in React DevTools" width="100%">
