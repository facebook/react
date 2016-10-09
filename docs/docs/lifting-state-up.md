---
id: lifting-state-up
title: Lifting State Up
permalink: docs/lifting-state-up.html
prev: state-and-lifecycle.html
next: composition-vs-inheritance.html
---

Often, several components need to reflect the same changing data. We recommend to lift the shared state up to their closest common ancestor. Let's see how this works in action.

In this section, we will create a temperature calculator that calculates whether the water would boil at a given temperature.

We will start with a component called `BoilingVerdict`. It accepts the `celsius` temperature as a prop, and prints whether it is enough to boil the water:

```js{3,5}
function BoilingVerdict(props) {
  if (props.celsius >= 100) {
    return <p>The water would boil.</p>;
  } else {
    return <p>The water would not boil.</p>;
  }
}
```

Next, we will create a component called `Calculator`. It renders an `<input>` that lets you enter the temperature, and keeps its value in `this.state.celsius`.

Additionally it renders the `BoilingVerdict` for the current input value.

```js{5,10,15,19-22}
class Calculator extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = {celsius: 0};
  }

  handleChange(e) {
    this.setState({
      celsius: parseFloat(e.target.value, 10)
    });
  }

  render() {
    const celsius = this.state.celsius;
    return (
      <fieldset>
        <legend>Enter temperature in Celsius:</legend>
        <input type="number"
               value={celsius.toString()}
               onChange={this.handleChange} />
        <BoilingVerdict celsius={celsius} />
      </fieldset>
    );
  }
}
```

[Try it on Codepen.](http://codepen.io/gaearon/pen/Gjxgrj?editors=0010)

## Adding a Second Input

Our new requirement is that, in addition to a Celsius input, we provide a Fahrenheit input, and they are kept in sync.

We can start by extracting a `TemperatureInput` component from `Calculator`. We will add a new `scale` prop to it that can either be `"C"` or `"F"`. We will also rename the `celsium` state variable to `temperature` because it may now represent a value in either scale:

```js{1-4,10,15,20,21,22,25,27}
const scaleNames = {
  C: 'Celsius',
  F: 'Fahrenheit'
};

class TemperatureInput extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = {temperature: 0};
  }

  handleChange(e) {
    this.setState({
      temperature: parseFloat(e.target.value, 10)
    });
  }

  render() {
    const temperature = this.state.temperature;
    const scale = this.props.scale;
    const scaleName = scaleNames[scale];
    return (
      <fieldset>
        <legend>Enter temperature in {scaleName}:</legend>
        <input type="number"
               value={temperature.toString()}
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

First, we will write two functions to convert from Celsius to Fahrenheit and back:

```js
function toCelsius(fahrenheit) {
  return (fahrenheit - 32) * 5 / 9;
}

function toFahrenheit(celsius) {
  return (celsius * 9 / 5) + 32;
}
```

We're going to need them soon.

Next, we will remove the state from `TemperatureInput`.

Instead, it will receive both `temperature` and the `onChange` handler by props. Since it doesn't contain any state or lifecycle hooks now, we can also turn it into a function for brevity:

```js{2,4,7,8,14,15}
function TemperatureInput(props) {
  function handleChange(e) {
    const nextTemperature = parseFloat(e.target.value, 10);
    props.onChange(nextTemperature);
  }

  const temperature = props.temperature;
  const scale = props.scale;
  const scaleName = scaleNames[scale];
  return (
    <fieldset>
      <legend>Enter temperature in {scaleName}:</legend>
      <input type="number"
             value={temperature.toString()}
             onChange={handleChange} />
    </fieldset>
  );
}
```

If several components need access to the same state, it is a sign that the state should be lifted up to their closest common ancestor instead. In our case this is the `Calculator`.

It turns out that it is unnecessary to store the state for both inputs because the Fahrenheit value can always be computed from the Celsium value, and vice versa.

Storing just `this.state.celsius` in the `Calculator` lets us calculate the current value both for the Celsius and Fahrenheit inputs, as well as to render the `BoilingVerdict`.

This way they can't possibly get out of sync because they are based on the same value:

```js{6,10,14-15,19-20,25-26,29-30,31}
class Calculator extends React.Component {
  constructor(props) {
    super(props);
    this.handleCelsiusChange = this.handleCelsiusChange.bind(this);
    this.handleFahrenheitChange = this.handleFahrenheitChange.bind(this);
    this.state = {celsius: 0};
  }

  handleCelsiusChange(celsius) {
    this.setState({celsius});
  }

  handleFahrenheitChange(fahrenheit) {
    const celsius = toCelsius(fahrenheit);
    this.setState({celsius});
  }

  render() {
    const celsius = this.state.celsius;
    const fahrenheit = toFahrenheit(celsius);
    return (
      <div>
        <TemperatureInput
          scale="C"
          temperature={celsius}
          onChange={this.handleCelsiusChange} />
        <TemperatureInput
          scale="F"
          temperature={fahrenheit}
          onChange={this.handleFahrenheitChange} />
        <BoilingVerdict celsius={celsius} />
      </div>
    );
  }
}
```

[Try it on Codepen.](http://codepen.io/gaearon/pen/zKWqpA?editors=0010)

Now, no matter which input you edit, `this.state.celsius` in the `Calculator` gets updated, and everything below is recalculated based on it so it is guaranteed to be in sync.

## Lessons Learned

There should be a single "source of truth" for any data that changes in a React application. Usually, the state is first added to the component that needs it for rendering. Then, if other components also need it, you can lift it up to their closest common ancestor. Instead of trying to sync the state between different components, you should rely on the [top-down data flow](/react/docs/state-and-lifecycle.html#the-data-flows-down).

Lifting state involves writing more "boilerplate" code than two-way binding approaches, but as a benefit it takes less work to find and isolate bugs. Since any state "lives" in some component, and that component alone can change it, the surface area for bugs is greatly reduced. Additionally, you can implement any custom logic to reject or transform user input.

If something can be derived from either props or state, it probably shouldn't be in the state. For example, instead of storing both `celsium` and `fahrenheit` values, we store just one of them because the other can always be calculated from it in the `render()` method.

When you see something wrong in the UI, you can use [React Developer Tools](https://github.com/facebook/react-devtools) to inspect the props and move up the tree until you find the component responsible for updating the state. The state displayed on the right pane will give you insight into when and how components update:

<img src="/react/img/docs/react-devtools-state.gif" alt="Monitoring State in React DevTools" width="100%">
