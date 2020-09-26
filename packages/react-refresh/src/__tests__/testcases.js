/** @type {ReturnType<typeof TestCase>[]} */
module.exports = [];

// Hello and Bar should be registered, handleClick shouldn't.
addTestCase(
  'registers top-level function declarations',
  `
function Hello() {
  function handleClick() {}
  return <h1 onClick={handleClick}>Hi</h1>;
}

function Bar() {
  return <Hello />;
}
`,
);

addTestCase(
  'registers top-level exported function declarations',
  `
export function Hello() {
  function handleClick() {}
  return <h1 onClick={handleClick}>Hi</h1>;
}

export default function Bar() {
  return <Hello />;
}

function Baz() {
  return <h1>OK</h1>;
}

const NotAComp = 'hi';
export { Baz, NotAComp };

export function sum() {}
export const Bad = 42;
`,
);

addTestCase(
  'registers top-level exported named arrow functions',
  `
export const Hello = () => {
  function handleClick() {}
  return <h1 onClick={handleClick}>Hi</h1>;
};

export let Bar = (props) => <Hello />;

export default () => {
  // This one should be ignored.
  // You should name your components.
  return <Hello />;
};
`,
);

// This should register the original version.
// TODO: in the future, we may *also* register the wrapped one.
addTestCase(
  'uses original function declaration if it get reassigned',
  `
function Hello() {
  return <h1>Hi</h1>;
}
Hello = connect(Hello);
`,
);

// Should not get registered.
addTestCase(
  'only registers pascal case functions',
  `
  function hello() {
    return 2 * 2;
  }
`,
);
// Hello and Bar should be registered; handleClick, sum, Baz, and Qux shouldn't.
addTestCase(
  'registers top-level variable declarations with function expressions',
  `
    let Hello = function() {
      function handleClick() {}
      return <h1 onClick={handleClick}>Hi</h1>;
    };
    const Bar = function Baz() {
      return <Hello />;
    };
    function sum() {}
    let Baz = 10;
    var Qux;
  `,
);

// Hello, Bar, and Baz should be registered; handleClick and sum shouldn't.
addTestCase(
  'registers top-level variable declarations with arrow functions',
  `
  let Hello = () => {
    const handleClick = () => {};
    return <h1 onClick={handleClick}>Hi</h1>;
  }
  const Bar = () => {
    return <Hello />;
  };
  var Baz = () => <div />;
  var sum = () => {};
`,
);

addTestCase(
  'ignores HOC definitions',
  // TODO: we might want to handle HOCs at usage site, however.
  // TODO: it would be nice if we could always avoid registering
  // a function that is known to return a function or other non-node.
  `
    let connect = () => {
      function Comp() {
        const handleClick = () => {};
        return <h1 onClick={handleClick}>Hi</h1>;
      }
      return Comp;
    };
    function withRouter() {
      return function Child() {
        const handleClick = () => {};
        return <h1 onClick={handleClick}>Hi</h1>;
      }
    };
  `,
);

addTestCase(
  'ignores complex definitions',
  `
    let A = foo ? () => {
      return <h1>Hi</h1>;
    } : null
    const B = (function Foo() {
      return <h1>Hi</h1>;
    })();
    let C = () => () => {
      return <h1>Hi</h1>;
    };
    let D = bar && (() => {
      return <h1>Hi</h1>;
    });
  `,
);

addTestCase(
  'ignores unnamed function declarations',
  `export default function() {}`,
);

addTestCase('registers likely HOCs with inline functions', [
  `
      const A = forwardRef(function() {
        return <h1>Foo</h1>;
      });
      const B = memo(React.forwardRef(() => {
        return <h1>Foo</h1>;
      }));
      export default React.memo(forwardRef((props, ref) => {
        return <h1>Foo</h1>;
      }));
    `,
  `
      export default React.memo(forwardRef(function (props, ref) {
        return <h1>Foo</h1>;
      }));
    `,
  `
      export default React.memo(forwardRef(function Named(props, ref) {
        return <h1>Foo</h1>;
      }));
    `,
]);

addTestCase(
  'ignores higher-order functions that are not HOCs',
  `
const throttledAlert = throttle(function() {
  alert('Hi');
});
const TooComplex = (function() { return hello })(() => {});
if (cond) {
  const Foo = thing(() => {});
}
`,
);

addTestCase(
  'registers identifiers used in JSX at definition site',
  // When in doubt, register variables that were used in JSX.
  // Foo, Header, and B get registered.
  // A doesn't get registered because it's not declared locally.
  // Alias doesn't get registered because its definition is just an identifier.
  `
import A from './A';
import Store from './Store';

Store.subscribe();

const Header = styled.div\`color: red\`
const StyledFactory1 = styled('div')\`color: hotpink\`
const StyledFactory2 = styled('div')({ color: 'hotpink' })
const StyledFactory3 = styled(A)({ color: 'hotpink' })
const FunnyFactory = funny.factory\`\`;

let Alias1 = A;
let Alias2 = A.Foo;
const Dict = {};

function Foo() {
  return (
    <div><A /><B /><StyledFactory1 /><StyledFactory2 /><StyledFactory3 /><Alias1 /><Alias2 /><Header /><Dict.X /></div>
  );
}

const B = hoc(A);
// This is currently registered as a false positive:
const NotAComponent = wow(A);
// We could avoid it but it also doesn't hurt.
`,
);

addTestCase(
  'registers identifiers used in React.createElement at definition site',

  // When in doubt, register variables that were used in JSX.
  // Foo, Header, and B get registered.
  // A doesn't get registered because it's not declared locally.
  // Alias doesn't get registered because its definition is just an identifier.
  `
import A from './A';
import Store from './Store';

Store.subscribe();

const Header = styled.div\`color: red\`
const StyledFactory1 = styled('div')\`color: hotpink\`
const StyledFactory2 = styled('div')({ color: 'hotpink' })
const StyledFactory3 = styled(A)({ color: 'hotpink' })
const FunnyFactory = funny.factory\`\`;

let Alias1 = A;
let Alias2 = A.Foo;
const Dict = {};

function Foo() {
  return [
    React.createElement(A),
    React.createElement(B),
    React.createElement(StyledFactory1),
    React.createElement(StyledFactory2),
    React.createElement(StyledFactory3),
    React.createElement(Alias1),
    React.createElement(Alias2),
    jsx(Header),
    React.createElement(Dict.X),
  ];
}

React.createContext(Store);

const B = hoc(A);
// This is currently registered as a false positive:
const NotAComponent = wow(A);
// We could avoid it but it also doesn't hurt.
`,
);

addTestCase(
  'registers capitalized identifiers in HOC calls',
  `
function Foo() {
  return <h1>Hi</h1>;
}

export default hoc(Foo);
export const A = hoc(Foo);
const B = hoc(Foo);
`,
);

addTestCase(
  'generates signatures for function declarations calling hooks',
  `
export default function App() {
  const [foo, setFoo] = useState(0);
  React.useEffect(() => {});
  return <h1>{foo}</h1>;
}
`,
);

addTestCase(
  'generates signatures for function expressions calling hooks',

  // Unlike __register__, we want to sign all functions -- not just top level.
  // This lets us support editing HOCs better.
  // For function declarations, __signature__ is called on next line.
  // For function expressions, it wraps the expression.
  // In order for this to work, __signature__ returns its first argument.
  `
export const A = React.memo(React.forwardRef((props, ref) => {
  const [foo, setFoo] = useState(0);
  React.useEffect(() => {});
  return <h1 ref={ref}>{foo}</h1>;
}));

export const B = React.memo(React.forwardRef(function(props, ref) {
  const [foo, setFoo] = useState(0);
  React.useEffect(() => {});
  return <h1 ref={ref}>{foo}</h1>;
}));

function hoc() {
  return function Inner() {
    const [foo, setFoo] = useState(0);
    React.useEffect(() => {});
    return <h1 ref={ref}>{foo}</h1>;
  };
}

export let C = hoc();
`,
);

addTestCase(
  'includes custom hooks into the signatures',
  `
function useFancyState() {
  const [foo, setFoo] = React.useState(0);
  useFancyEffect();
  return foo;
}

const useFancyEffect = () => {
  React.useEffect(() => {});
};

export default function App() {
  const bar = useFancyState();
  return <h1>{bar}</h1>;
}
`,
);

addTestCase(
  'includes custom hooks into the signatures when commonjs target is used',
  `
import {useFancyState} from './hooks';

export default function App() {
  const bar = useFancyState();
  return <h1>{bar}</h1>;
}
`,
  {
    babel: {
      plugins: ['@babel/transform-modules-commonjs'],
    },
    typescript: {},
  },
);

addTestCase(
  'generates valid signature for exotic ways to call Hooks',
  `
import FancyHook from 'fancy';

export default function App() {
  function useFancyState() {
    const [foo, setFoo] = React.useState(0);
    useFancyEffect();
    return foo;
  }
  const bar = useFancyState();
  const baz = FancyHook.useThing();
  React.useState();
  useThePlatform();
  return <h1>{bar}{baz}</h1>;
}
`,
);

// None of these were declared in this file.
// It's bad to register them because that would trigger
// modules to execute in an environment with inline requires.
// So we expect the transform to skip all of them even though
// they are used in JSX.
addTestCase(
  'does not consider require-like methods to be HOCs',
  `
const A = require('A');
const B = foo ? require('X') : require('Y');
const C = requireCond(gk, 'C');
const D = import('D');

export default function App() {
  return (
    <div>
      <A />
      <B />
      <C />
      <D />
    </div>
  );
}
`,
);

addTestCase(
  'can handle implicit arrow returns',
  `
export default () => useContext(X);
export const Foo = () => useContext(X);
module.exports = () => useContext(X);
const Bar = () => useContext(X);
const Baz = memo(() => useContext(X));
const Qux = () => (0, useContext(X));
`,
);

addTestCase(
  'uses custom identifiers for $RefreshReg$ and $RefreshSig$',
  `export default function Bar () {
  useContext(X)
  return <Foo />
};`,
  {
    babel: {
      freshOptions: {
        refreshReg: 'import.meta.refreshReg',
        refreshSig: 'import.meta.refreshSig',
      },
    },
    typescript: {
      refreshReg: 'import.meta.refreshReg',
      refreshSig: 'import.meta.refreshSig',
    },
  },
);

/**
 *
 * @param {string} name Test case name
 * @param {string | string[]} cases String or a set of string
 * @param {{babel: any, typescript: any}} [options] Option passed to the transformer
 */
function TestCase(name, cases, options) {
  return {name, cases, options};
}
function addTestCase(/** @type {Parameters<typeof TestCase>} */ ...args) {
  module.exports.push(TestCase(...args));
}
it('should have no test file', () => {});
