import React from 'react';
import ReactDOM from 'react-dom';
import ReactTestUtils from 'react-dom/test-utils';
import ReactTestRenderer from 'react-test-renderer';

window.jest = {}; // to enable warnings
function App() {
  let [state, setState] = React.useState(0);
  async function ticker() {
    await null;
    setState(x => x + 1);
  }
  React.useEffect(
    () => {
      ticker();
    },
    [Math.min(state, 4)]
  );
  return state;
}

async function testDOMAsynAct() {
  // from ReactTestUtilsAct-test.js

  const el = document.createElement('div');
  await ReactTestUtils.act(async () => {
    ReactDOM.render(React.createElement(App), el);
  });
  // all 5 ticks present and accounted for
  console.log(el.innerHTML);
}

async function testMixRenderers() {
  await ReactTestUtils.act(async () => {
    ReactTestRenderer.create(React.createElement(App));
  });
}

async function run() {
  await testDOMAsynAct();
  await testMixRenderers();
}

run();
