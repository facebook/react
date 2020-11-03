import * as React from 'react';

// TODO: A transform should read this from webpack plugin output.
const CounterClient = {
  $$typeof: Symbol.for('react.module.reference'),
  name: './src/Counter.client.js',
};

export default function App() {
  return (
    <div>
      <h1>Hello, world</h1>
      <CounterClient />
    </div>
  );
}
