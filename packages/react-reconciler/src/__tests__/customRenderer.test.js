import React from 'react';
import { render, preloadModules } from '../ReactFiberReconciler';

const Box = () => <div>Box Component</div>;
const Sphere = () => <div>Sphere Component</div>;

// Mock components
jest.mock('my-module-path/box', () => Box, { virtual: true });
jest.mock('my-module-path/sphere', () => Sphere, { virtual: true });

const App = () => (
  <>
    <box />
    <sphere />
  </>
);

const container = {
  appendChild(child) {
    console.log('Appended child:', child);
  },
};

preloadModules(App).then(() => {
  render(<App />, container);
});
