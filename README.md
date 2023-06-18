# [React](https://react.dev/)  [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/facebook/react/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/react) [![CircleCI Status](https://circleci.com/gh/facebook/react.svg?style=shield)](https://circleci.com/gh/facebook/react) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://reactjs.org/docs/how-to-contribute.html#your-first-pull-request)

React is a JavaScript library for building user interfaces.

* **Declarative:** React makes it painless to create interactive UIs. Design simple views for each state in your application, and React will efficiently update and render just the right components when your data changes. Declarative views make your code more predictable, simpler to understand, and easier to debug.

* **Component-Based:** Build encapsulated components that manage their own state, then compose them to make complex UIs. Since component logic is written in JavaScript instead of templates, you can easily pass rich data through your app and keep the state out of the DOM.

* **Learn Once, Write Anywhere:** We don't make assumptions about the rest of your technology stack, so you can develop new features in React without rewriting existing code. React can also render on the server using Node and power mobile apps using [React Native](https://reactnative.dev/).

## Quick Start
---

* Want to get started with React quickly? Check out the [Quick Start Guide](https://react.dev/learn).
* Want to get a taste of React? Try editing the code in [this sandbox](https://react.dev/learn/installation#try-react).

## Installation
---

React has been designed for gradual adoption from the start, and **you can use as little or as much React as you need**:

* [Add React to an Existing Project](https://react.dev/learn/add-react-to-an-existing-project)
* [Start a New React Project](https://react.dev/learn/start-a-new-react-project)


## Documentation
---

Check out [React Documentation](https://react.dev/learn) to get started with React.

***Note**: The above documentation is on the new domain (https://react.dev) and includes docs on modern React with live examples. You can checkout the old website here at https://legacy.reactjs.org*

Check out the [Quick Start Guide](https://react.dev/learn) page for a quick overview on React.

The documentation is divided into six sections:

* [Quick Start](https://react.dev/learn)
* [Installation](https://react.dev/learn/installation)
* [Describing the UI](https://react.dev/learn/describing-the-ui)
* [Adding Interactivity](https://react.dev/learn/adding-interactivity)
* [Managing State (Intermediate)](https://react.dev/learn/managing-state)
* [Escape Hatches (Advanced)](https://react.dev/learn/escape-hatches)

You can check out the [API Reference](https://react.dev/reference/react) for more about React.

You can improve the documentation by sending pull requests to [this repository](https://github.com/reactjs/react.dev).

For more updates from the React Team, check out the [React Blog](https://react.dev/blog)

## Examples
---

We have several examples on the [Official React website](https://react.dev). Here is the first one to get you started:

```jsx
import { createRoot } from 'react-dom/client';

function HelloMessage({ name }) {
  return <div>Hello {name}</div>;
}

const root = createRoot(document.getElementById('container'));
root.render(<HelloMessage name="Taylor" />);
```

This example will render "Hello Taylor" into a container on the page.

You'll notice that we used an HTML-like syntax; we call it [JSX (JavaScript Syntax Extension)](https://react.dev/learn/writing-markup-with-jsx). JSX is not required to use React, but it makes code more readable, and writing it feels like writing HTML.

## Contributing
---

The main purpose of this repository is to continue evolving React core, making it faster and easier to use. Development of React happens in the open on GitHub, and we are grateful to the community for contributing bugfixes and improvements. Read below to learn how you can take part in improving React.

### [Code of Conduct](https://code.fb.com/codeofconduct)
---

Facebook has adopted a Code of Conduct that we expect project participants to adhere to. Please read [the full text](https://code.fb.com/codeofconduct) so that you can understand what actions will and will not be tolerated.

### [Contributing Guide](https://reactjs.org/docs/how-to-contribute.html)
---

Read our [contributing guide](https://reactjs.org/docs/how-to-contribute.html) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to React.

### Good First Issues
---

To help you get your feet wet and get you familiar with our contribution process, we have a list of [good first issues](https://github.com/facebook/react/labels/good%20first%20issue) that contain bugs that have a relatively limited scope. This is a great place to get started.

### [License](./LICENSE)
---

React is [MIT licensed](./LICENSE).
