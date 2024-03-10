# React

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/facebook/react/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/react) [![CircleCI Status](https://circleci.com/gh/facebook/react.svg?style=shield&circle-token=:circle-token)](https://circleci.com/gh/facebook/react) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://legacy.reactjs.org/docs/how-to-contribute.html#your-first-pull-request)

[React](https://react.dev/) is a JavaScript library for building user interfaces, known for its declarative, component-based, and learn-once-write-anywhere philosophy.

[Learn how to use React in your project.](https://react.dev/learn)

## Key Features

- **Declarative**: React simplifies the creation of interactive UIs. Design simple views for each state in your application, and React efficiently updates and renders the right components when your data changes.
- **Component-Based**: Build encapsulated components that manage their own state, then compose them to create complex UIs.
- **Learn Once, Write Anywhere**: Develop new features in React without rewriting existing code. React can render on the server using Node and power mobile apps using [React Native](https://reactnative.dev/).

## Installation

React is designed for gradual adoption, allowing you to use as little or as much as you need:

- [Quick Start](https://react.dev/learn): Get a taste of React.
- [Add React to an Existing Project](https://react.dev/learn/add-react-to-an-existing-project): Use React incrementally.
- [Create a New React App](https://react.dev/learn/start-a-new-react-project): Start with a powerful JavaScript toolchain.

## Documentation

Find the React documentation on the [official website](https://react.dev/), covering various topics:

- [Quick Start](https://react.dev/learn)
- [Tutorial](https://react.dev/learn/tutorial-tic-tac-toe)
- [Thinking in React](https://react.dev/learn/thinking-in-react)
- [API Reference](https://react.dev/reference/react), and more.

Explore the documentation to understand the fundamentals and advanced concepts of React.

## Examples

Check out several practical examples [on the website](https://react.dev/), starting with this basic one:

```jsx
import { createRoot } from 'react-dom/client';

function HelloMessage({ name }) {
  return <div>Hello {name}</div>;
}

const root = createRoot(document.getElementById('container'));
root.render(<HelloMessage name="Taylor" />);

This code renders "Hello Taylor" into a page container, demonstrating React's JSX syntax.

## Contributing

Join the development of React by contributing to the project. Learn how you can contribute by reading the:

- [Contributing Guide](https://legacy.reactjs.org/docs/how-to-contribute.html)
- [Code of Conduct](https://code.fb.com/codeofconduct)

Your contributions can help evolve React, making it better for everyone.

### Engaging with the Community

Get involved with the React community:

- Find [good first issues](https://github.com/facebook/react/labels/good%20first%20issue) to start contributing.
- Understand the [project's philosophy](https://react.dev/learn) and guidelines.

### License

React is open-source software [licensed as MIT](./LICENSE).
