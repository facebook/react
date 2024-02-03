# [React](https://react.dev/) &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/facebook/react/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/react) [![CircleCI Status](https://circleci.com/gh/facebook/react.svg?style=shield)](https://circleci.com/gh/facebook/react) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://legacy.reactjs.org/docs/how-to-contribute.html#your-first-pull-request)

React is a JavaScript library for building user interfaces.

* **Declarative:** React simplifies the process of creating interactive UIs. By designing straightforward views for each application state, React efficiently updates and renders the necessary components when data changes. Declarative views enhance code predictability, simplify comprehension, and facilitate debugging.
* **Component-Based:** It allows developers to construct encapsulated components responsible for managing their individual states. These components can then be composed to construct intricate UIs. Since component logic is expressed in JavaScript rather than templates, passing rich data through the app becomes effortless, keeping the state separate from the DOM.
* **Learn Once, Write Anywhere:** React does not impose restrictions on the rest of the technology stack, enabling developers to introduce new features without rewriting existing code. Additionally, React can be employed for server-side rendering using Node.js and for powering mobile apps through [React Native](https://reactnative.dev/).

Explore how to integrate React into your project by visiting [React's learning resources](https://react.dev/learn).

## Installation

React is designed for gradual adoption, allowing developers to incorporate as much or as little React as necessary:

* Refer to the [Quick Start](https://react.dev/learn) for a rapid introduction to React.
* Integrate React into an existing project by following the steps outlined in [Add React to an Existing Project](https://react.dev/learn/add-react-to-an-existing-project).
* Initiate a new React application using a robust JavaScript toolchain by utilizing [Create a New React App](https://react.dev/learn/start-a-new-react-project).

## Documentation

Access React's comprehensive documentation [on the official website](https://react.dev/).  

For a brief overview, visit the [Getting Started](https://react.dev/learn) page.

The documentation is structured into various sections:

* [Quick Start](https://react.dev/learn)
* [Tutorial](https://react.dev/learn/tutorial-tic-tac-toe)
* [Thinking in React](https://react.dev/learn/thinking-in-react)
* [Installation](https://react.dev/learn/installation)
* [Describing the UI](https://react.dev/learn/describing-the-ui)
* [Adding Interactivity](https://react.dev/learn/adding-interactivity)
* [Managing State](https://react.dev/learn/managing-state)
* [Advanced Guides](https://react.dev/learn/escape-hatches)
* [API Reference](https://react.dev/reference/react)
* [Where to Get Support](https://react.dev/community)
* [Contributing Guide](https://legacy.reactjs.org/docs/how-to-contribute.html)

Enhance the documentation by contributing pull requests to [the official repository](https://github.com/reactjs/reactjs.org).

## Examples

Numerous examples are available [on the website](https://react.dev/). Here's a simple one to kickstart your journey:

```jsx
import { createRoot } from 'react-dom/client';

function HelloMessage({ name }) {
  return <div>Hello {name}</div>;
}

const root = createRoot(document.getElementById('container'));
root.render(<HelloMessage name="Taylor" />);
```

This example will render "Hello Taylor" into a container on the page.

Notice the usage of JSX, an HTML-like syntax; [referred to as JSX](https://react.dev/learn#writing-markup-with-jsx). While JSX isn't mandatory for React, it enhances code readability, making it resemble HTML.

## Contributing

The primary objective of this repository is to continuously evolve React core, enhancing its speed and usability. React's development occurs transparently on GitHub, and contributions from the community in the form of bug fixes and enhancements are highly appreciated. Below are ways you can participate in enhancing React.

### [Code of Conduct](https://code.fb.com/codeofconduct)

Facebook has established a Code of Conduct that all project contributors are expected to adhere to. Familiarize yourself with [the full text](https://code.fb.com/codeofconduct) to understand acceptable and unacceptable behaviors.

### [Contributing Guide](https://legacy.reactjs.org/docs/how-to-contribute.html)

Consult our [contributing guide](https://legacy.reactjs.org/docs/how-to-contribute.html) to acquaint yourself with our development procedures. Learn how to propose bug fixes and enhancements, as well as how to build and test your React changes.

### Good First Issues

To ease your entry into contributing and familiarize you with our contribution process, we maintain a list of [good first issues](https://github.com/facebook/react/labels/good%20first%20issue) encompassing bugs with relatively limited scopes. This serves as an excellent starting point for new contributors.

### License

React is licensed under the [MIT License](./LICENSE).
