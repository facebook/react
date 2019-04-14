import React from 'react';
import ReactDOM from 'react-dom';
import ReactTestUtils from 'react-dom/test-utils';
import ReactTestRenderer from 'react-test-renderer';

import ReactART from 'react-art';
import ARTSVGMode from 'art/modes/svg';
import ARTCurrentMode from 'art/modes/current';

const {Shape, Surface} = ReactART;

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

async function testART() {
  ARTCurrentMode.setCurrent(ARTSVGMode);
  let setState
  function TestComponent(props) {
    // eslint-disable-next-line no-unused-vars
    const [state, _setState] = React.useState(0)
    setState = _setState
        
    return (
      <Surface width={150} height={200}>
        <Shape
        fill="#3C5A99"
        key="b"
        scale={0.5}
        x={50}
        y={50}
        title="This is an F"
        cursor="pointer">
        M64.564,38.583H54l0.008-5.834c0-3.035,0.293-4.666,4.657-4.666
        h5.833V16.429h-9.33c-11.213,0-15.159,5.654-15.159,15.16v6.994
        h-6.99v11.652h6.99v33.815H54V50.235h9.331L64.564,38.583z
      </Shape>
      </Surface>
    );
  }
  ReactDOM.render(<TestComponent />, window.root);
  ReactTestUtils.act(() => {
    setState(2)  
  })  
}

async function run() {
  await testDOMAsynAct();
  await testMixRenderers();
  await testART();
}

run();
