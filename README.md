# <p align="center"> <a href="https://react.dev/" target="_blank"><img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="React Logo" height="128"></a> <br> React </p>

<p align="center">A JavaScript library for building user interfaces.</p>

<p align="center">
  <a href="https://github.com/facebook/react/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="GitHub license">
  </a>
  <a href="https://www.npmjs.com/package/react">
    <img src="https://img.shields.io/npm/v/react.svg?style=flat" alt="npm version">
  </a>
  <a href="https://github.com/facebook/react/actions/workflows/runtime_build_and_test.yml">
    <img src="https://github.com/facebook/react/actions/workflows/runtime_build_and_test.yml/badge.svg" alt="(Runtime) Build and Test">
  </a>
  <a href="https://github.com/facebook/react/actions/workflows/compiler_typescript.yml?branch=main">
    <img src="https://github.com/facebook/react/actions/workflows/compiler_typescript.yml/badge.svg?branch=main" alt="(Compiler) TypeScript">
  </a>
  <a href="https://legacy.reactjs.org/docs/how-to-contribute.html#your-first-pull-request">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
  </a>
</p>

---

React helps you build modern, interactive user interfaces with ease. Whether you're a seasoned developer or just starting, React makes web development predictable, component-driven, and scalable.

*   **Declarative:** Design simple views for each state in your application. React will efficiently update and render just the right components when your data changes, making your code more predictable and easier to debug.
*   **Component-Based:** Build encapsulated components that manage their own state, then compose them to make complex UIs. Since component logic is written in JavaScript instead of templates, you can easily pass rich data through your app.
*   **Learn Once, Write Anywhere:** Develop new features in React without rewriting existing code. React can render on the server using Node.js and power mobile apps using [React Native](https://reactnative.dev/).

## Getting Started

React is designed for gradual adoption, allowing you to use as little or as much as you need.

1.  **Try React Online:** The easiest way to get a taste of React is by using an online playground like [CodeSandbox](https://codesandbox.io/s/new) or the official [Quick Start guide](https://react.dev/learn).
2.  **Add to an Existing Project:** You can [add React to an existing website](https://react.dev/learn/add-react-to-an-existing-project) in a few minutes with just one script tag.
3.  **Create a New App:** For a powerful, production-ready workflow, you can [create a new React project](https://react.dev/learn/start-a-new-react-project) with a modern toolchain like Next.js or Vite.

## Quick Look

Here is a small example of a React component. It renders "Hello, Taylor!" into a `<div>` on the page.

```jsx
import { createRoot } from 'react-dom/client';

function HelloMessage({ name }) {
  return <div>Hello, {name}</div>;
}

const container = document.getElementById('container');
const root = createRoot(container);
root.render(<HelloMessage name="Taylor" />);
```

We use a syntax called **JSX**, which feels like HTML but has the full power of JavaScript. While not required, most developers prefer it for its readability.

## Documentation

You can find the complete React documentation on the [official website](https://react.dev/).

Here are some recommended starting points:

*   **Tutorial:** [Tic-Tac-Toe Game](https://react.dev/learn/tutorial-tic-tac-toe)
*   **Core Concepts:**
    *   [Describing the UI](https://react.dev/learn/describing-the-ui)
    *   [Adding Interactivity](https://react.dev/learn/adding-interactivity)
    *   [Managing State](https://react.dev/learn/managing-state)
*   **Reference:** [Full API Reference](https://react.dev/reference/react)

## Contributing

We welcome contributions from the community! Development of React happens in the open on GitHub, and we are grateful for your bug fixes, improvements, and ideas.

*   **Code of Conduct:** We expect all project participants to adhere to our [Code of Conduct](https://code.fb.com/codeofconduct). Please read it to understand what actions will and will not be tolerated.
*   **Contributing Guide:** Read our [contributing guide](https://legacy.reactjs.org/docs/how-to-contribute.html) to learn about our development process, how to propose changes, and how to build and test your work.
*   **Good First Issues:** Looking for a place to start? We have a list of [good first issues](https://github.com/facebook/react/labels/good%20first%20issue) that are well-suited for new contributors. Your first pull request is just a click away!

## License

React is [MIT licensed](https://github.com/facebook/react/blob/main/LICENSE).
