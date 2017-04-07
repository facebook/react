# `react-test-renderer`

This package provides two React renderers that can be used for testing purposes:

#### Test renderer

Renders React components to pure JavaScript objects without depending on the DOM or a native mobile environment. This makes it easy to grab a snapshot of the "DOM tree" rendered by a React DOM or React Native component without using a browser or jsdom.

```jsx
const ReactTestRenderer = require('react-test-renderer');

const renderer = ReactTestRenderer.create(
  <Link page="https://www.facebook.com/">Facebook</Link>
);

console.log(renderer.toJSON());
// { type: 'a',
//   props: { href: 'https://www.facebook.com/' },
//   children: [ 'Facebook' ] }
```

You can also use Jest's snapshot testing feature to automatically save a copy of the JSON tree to a file and check in your tests that it hasn't changed: http://facebook.github.io/jest/blog/2016/07/27/jest-14.html.

#### Shallow renderer

Shallow rendering lets you render a component "one level deep" and assert facts about what its render method returns, without worrying about the behavior of child components, which are not instantiated or rendered. This does not require a DOM.

```jsx
const ReactShallowRenderer = require('react-test-renderer/shallow');

const renderer = new ReactShallowRenderer();
renderer.render(<MyComponent />);

const result = renderer.getRenderOutput();
expect(result.type).toBe('div');
expect(result.props.children).toEqual([
  <span className="heading">Title</span>,
  <Subcomponent foo="bar" />
]);
```

This renderer was previously located in `react-addons-test-utils`.