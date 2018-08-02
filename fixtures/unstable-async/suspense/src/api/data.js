export const coreContributorListJSON = [
  {
    id: 'acdlite',
    name: 'Andrew Clark',
  },
  {
    id: 'bvaughn',
    name: 'Brian Vaughn',
  },
  {
    id: 'gaearon',
    name: 'Dan Abramov',
  },
  {
    id: 'trueadm',
    name: 'Dominic Gannaway',
  },
  {
    id: 'flarnie',
    name: 'Flarnie Marchan',
  },
  {
    id: 'sebmarkbage',
    name: 'Sebastian Markbåge',
  },
  {
    id: 'sophiebits',
    name: 'Sophie Alpert',
  },
];

export const userProfileJSON = {
  acdlite: {
    id: 'acdlite',
    name: 'Andrew Clark',
    image: '/img/acdlite.jpeg',
    location: 'Redwood City, CA',
    email: 'acdlite@me.com',
    tagline: 'React core at Facebook. Hi!',
  },
  bvaughn: {
    id: 'bvaughn',
    name: 'Brian Vaughn',
    image: '/img/bvaughn.jpeg',
    location: 'Mountain View, CA',
    email: 'brian.david.vaughn@gmail.com',
    tagline:
      'React JS core team at @facebook; formerly at @treasure-data and @google.',
  },
  gaearon: {
    id: 'gaearon',
    name: 'Dan Abramov',
    image: '/img/gaearon.jpeg',
    location: 'London, UK',
    email: 'dan.abramov@me.com',
    tagline:
      'Working on @reactjs. Co-author of Redux and Create React App. Building tools for humans.',
  },
  flarnie: {
    id: 'flarnie',
    name: 'Flarnie Marchan',
    image: '/img/flarnie.jpeg',
    location: 'Oakland, CA',
    email: null,
    tagline:
      'Software Engineer at Facebook React Core Team & Co-maintainer of Draft.js',
  },
  sebmarkbage: {
    id: 'sebmarkbage',
    name: 'Sebastian Markbåge',
    image: '/img/sebmarkbage.jpeg',
    location: 'San Francisco',
    email: 'sebastian@calyptus.eu',
    tagline: null,
  },
  sophiebits: {
    id: 'sophiebits',
    name: 'Sophie Alpert',
    image: '/img/sophiebits.jpeg',
    location: 'California',
    email: 'hi@sophiebits.com',
    tagline:
      'I like fixing things. eng manager of @reactjs at Facebook. ex-@khanacademy. 💎🌸 she/her. kindness, intersectional feminism, music.',
  },
  trueadm: {
    id: 'trueadm',
    name: 'Dominic Gannaway',
    image: '/img/trueadm.jpeg',
    location: 'London, United Kingdom',
    email: null,
    tagline:
      'Currently an engineer on the React core team at @facebook. Author of @infernojs and t7. Enjoys coding + being a Dad.',
  },
};
export const userRepositoriesListJSON = {
  acdlite: [
    {
      name: 'recompose',
      url: 'https://github.com/acdlite/recompose',
      description:
        'A React utility belt for function components and higher-order components.',
    },
    {
      name: 'react-fiber-architecture',
      url: 'https://github.com/acdlite/react-fiber-architecture',
      description: "A description of React's new core algorithm, React Fiber",
    },
    {
      name: 'redux-router',
      url: 'https://github.com/acdlite/redux-router',
      description:
        'Redux bindings for React Router – keep your router state inside your Redux store',
    },
    {
      name: 'flummox',
      url: 'https://github.com/acdlite/flummox',
      description: 'Minimal, isomorphic Flux.',
    },
    {
      name: 'redux-rx',
      url: 'https://github.com/acdlite/redux-rx',
      description: 'RxJS utilities for Redux.',
    },
    {
      name: 'react-remarkable',
      url: 'https://github.com/acdlite/react-remarkable',
      description: 'A React component for rendering Markdown with remarkable',
    },
  ],
  bvaughn: [
    {
      name: 'react-virtualized',
      url: 'https://github.com/bvaughn/react-virtualized',
      description:
        'React components for efficiently rendering large lists and tabular data',
    },
    {
      name: 'redux-search',
      url: 'https://github.com/bvaughn/redux-search',
      description: 'Redux bindings for client-side search',
    },
    {
      name: 'react-window',
      url: 'https://github.com/bvaughn/react-window',
      description:
        'React components for efficiently rendering large lists and tabular data',
    },
    {
      name: 'react-virtualized-select',
      url: 'https://github.com/bvaughn/react-virtualized-select',
      description:
        'HOC that uses react-virtualized and react-select to display large lists of options in a drop-down',
    },
    {
      name: 'js-search',
      url: 'https://github.com/bvaughn/js-search',
      description:
        'JS Search is an efficient, client-side search library for JavaScript and JSON objects',
    },
    {
      name: 'react-highlight-words',
      url: 'https://github.com/bvaughn/react-highlight-words',
      description:
        'React component to highlight words within a larger body of text',
    },
  ],
  gaearon: [
    {
      name: 'facebook/react',
      url: 'https://github.com/facebook/react',
      description:
        'A declarative, efficient, and flexible JavaScript library for building user interfaces.',
    },
    {
      name: 'reduxjs/redux',
      url: 'https://github.com/reduxjs/redux',
      description: 'Predictable state container for JavaScript apps',
    },
    {
      name: 'facebook/create-react-app',
      url: 'https://github.com/facebook/create-react-app',
      description: 'Create React apps with no build configuration.',
    },
    {
      name: 'reduxjs/redux-devtools',
      url: 'https://github.com/reduxjs/redux-devtools',
      description:
        'DevTools for Redux with hot reloading, action replay, and customizable UI',
    },
    {
      name: 'react-dnd/react-dnd',
      url: 'https://github.com/react-dnd/react-dnd',
      description: 'Drag and Drop for React',
    },
    {
      name: 'paularmstrong/normalizr',
      url: 'https://github.com/paularmstrong/normalizr',
      description: 'Normalizes nested JSON according to a schema',
    },
  ],
  flarnie: [
    {
      name: 'diffux/diffux',
      url: 'https://github.com/diffux/diffux',
      description: 'Perceptual diffs of responsive screenshots made simple.',
    },
    {
      name: 'facebook/draft-js',
      url: 'https://github.com/facebook/draft-js',
      description: 'A React framework for building text editors.',
    },
    {
      name: 'facebook/react',
      url: 'https://github.com/facebook/react',
      description:
        'A declarative, efficient, and flexible JavaScript library for building user interfaces.',
    },
    {
      name: 'facebook/jest',
      url: 'https://github.com/facebook/jest',
      description: '🃏 Delightful JavaScript Testing.',
    },
    {
      name: 'Galooshi/import-js',
      url: 'https://github.com/Galooshi/import-js',
      description: 'A tool to simplify importing JS modules',
    },
    {
      name: 'webpack_rails_demo',
      url: 'https://github.com/flarnie/webpack_rails_demo',
      description: 'Setting up webpack with Ruby on Rails: a basic demo',
    },
  ],
  sebmarkbage: [
    {
      name: 'art',
      url: 'https://github.com/sebmarkbage/art',
      description:
        "Retained mode vector drawing API designed for multiple output modes. There's also a built-in SVG parser.",
    },
    {
      name: 'ecmascript-immutable-data-structures',
      url:
        'https://github.com/sebmarkbage/ecmascript-immutable-data-structures',
      description: null,
    },
    {
      name: 'ocamlrun-wasm',
      url: 'https://github.com/sebmarkbage/ocamlrun-wasm',
      description: 'OCamlrun WebAssembly - OCaml Bytecode Interpreter in WASM',
    },
    {
      name: 'ecmascript-generator-expression',
      url: 'https://github.com/sebmarkbage/ecmascript-generator-expression',
      description:
        'Proposal for do Generator Expressions in ECMAScript. Work in progress. Edit Add topics',
    },
    {
      name: 'ecmascript-undefined-propagation',
      url: 'https://github.com/sebmarkbage/ecmascript-undefined-propagation',
      description:
        'ECMAScript proposal to relax the rules to return `undefined` for property access on `null` or `undefined` instead of throwing.',
    },
    {
      name: 'ecmascript-shallow-equal',
      url: 'https://github.com/sebmarkbage/ecmascript-shallow-equal',
      description: 'A proposal for ECMAScript for Object.shallowEqual',
    },
  ],
  sophiebits: [
    {
      name: 'facebook/react',
      url: 'https://github.com/facebook/react',
      description:
        'A declarative, efficient, and flexible JavaScript library for building user interfaces.',
    },
    {
      name: 'Khan/KaTeX',
      url: 'https://github.com/Khan/KaTeX',
      description: 'Fast math typesetting for the web.',
    },
    {
      name: 'facebook/react-devtools',
      url: 'https://github.com/facebook/react-devtools',
      description:
        'An extension that allows inspection of React component hierarchy in the Chrome and Firefox Developer Tools.',
    },
    {
      name: 'vim-awesome/vim-awesome',
      url: 'https://github.com/vim-awesome/vim-awesome',
      description: 'Awesome Vim plugins from across the universe',
    },
    {
      name: 'facebook/draft-js',
      url: 'https://github.com/facebook/draft-js',
      description: 'A React framework for building text editors.',
    },
    {
      name: 'es3ify',
      url: 'https://github.com/sophiebits/es3ify',
      description:
        'Browserify transform to convert ES5 syntax to be ES3-compatible.',
    },
  ],
  trueadm: [
    {
      name: 'facebook/react',
      url: 'https://github.com/facebook/react',
      description:
        'A declarative, efficient, and flexible JavaScript library for building user interfaces.',
    },
    {
      name: 'infernojs/inferno',
      url: 'https://github.com/infernojs/inferno',
      description:
        'An extremely fast, React-like JavaScript library for building modern user interfaces',
    },
    {
      name: 'facebook/prepack',
      url: 'https://github.com/facebook/prepack',
      description: 'A JavaScript bundle optimizer.',
    },
    {
      name: 't7',
      url: 'https://github.com/trueadm/t7',
      description: 'Lightweight virtual DOM templating library',
    },
    {
      name: 'infernojs/babel-plugin-inferno',
      url: 'https://github.com/infernojs/babel-plugin-inferno',
      description: null,
    },
  ],
};
