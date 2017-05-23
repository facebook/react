---
id: open-source-components
title: Open Source Components
permalink: docs/open-source-components.html
---

Open source is an important part of the react ecosystem. Most of the time you'll use components written by
others, but you may wish to create components other people can use. For this guide, you'll need to have
node.js and git installed.

## Setup

First you'll need to create a project directory, and open a terminal in that directory. React components
are published as npm packages, so we need a package.json file. To create one, run `npm init` and follow
the prompts.

Next we'll need some tools to help us develop and prepare for publishing a release. We'll use babel to
compile our es6+jsx code to es5. This is important because the normal tooling for react applications
expects es5 code in third party packages. We'll also be using jest for our unit tests since it has
features that work especially well for react code.

```sh
npm install --save-dev react babel-core babel-cli babel-preset-es2015 babel-preset-react jest babel-jest react-test-renderer
```

To configure babel, we need a file named .babelrc with these contents. Don't forget the leading period in the file name!

```json
{
  "presets": ["es2015", "react"]
}
```

The last step of setting up our development and build environment is to create two scripts in package.json.
One for running our tests, and the other for doing builds.

```json
  "scripts": {
    "test": "jest",
    "build": "babel src --out-dir lib"
  }
```

## Writing a component

Now that we've gotten the builds set up, we can write our component! Create a directory named 'src' in the
root of our project, and create a .js file with the same name as your component. We'll call it HelloWord.js.

```js
import React from 'react';
const HelloWorld = ({name}) => <div>Hello, {name}!</div>;
module.exports = HelloWorld;
```

To see if it compiles we can use `npm run build`. To run it in watch mode use `npm run build -- --watch`. Now
there is a lib directory with a HelloWorld.js with this content.

```js
'use strict';

var React = require('react');
module.exports = function (_ref) {
  var name = _ref.name;
  return React.createElement(
    'div',
    null,
    'Hello, ',
    name,
    '!'
  );
};
```

The last step is to tell node.js which file to load when the consumer application `require()`s or `import`s our package.
In package.json add a "main" field with a relative path to our module.

```
  "main": "./lib/HelloWorld"
```

To make sure we've done this correctly, run `node -p "require('./')"` and the output should be `[Function]`.

We have one more step before we can publish our package to npm.

## Unit testing

So far, we know our package doesn't have any syntax errors, thanks to babel, but we don't know anything
about its behavior. To verify this, we need to write a unit test.

Create a file `src/__tests__/HelloWorld-test.js` with this content.

```js
import React from 'react'
import HelloWorld from '../HelloWorld'
import renderer from 'react-test-renderer'

test('Displays greeting', () => {
  const component = renderer.create(
    <HelloWorld name="George" />
  )
  let tree = component.toJSON()
  expect(tree).toMatchSnapshot()
})
```

We're using [snapshot tests], but you usually supplement it with traditional assertion tests.

[snapshot tests]: https://facebook.github.io/jest/blog/2016/07/27/jest-14.html

## Git

Publishing our source code to github allows others to easily read our code, suggest changes, and file issues. 
You'll need a github account, and to have [set up git]. Then run `git init` to make
the current directory into a git repo. Next we need to tell get to track some files.

[set up git]: https://help.github.com/articles/set-up-git/

```
git add src package.json .babelrc
```

We don't want git to track our lib directory, so create a file named ".gitignore" with only one line: `lib`.
To prevent npm from ignoring this directory, create an empty file named ".npmignore". Then add these files to git.

```
git add .gitignore .npmignore
```

Finally, commit the files to git and push it to our repository.

```
git commit -m "initial commit"
git push -u origin master
```

Now any time we run `npm version <level>` it'll create a new git tag, which can be pushed with `git push --tags`.
Any time we make changes to the code, run `git commit -am "I did cool stuff" && git push`.

## Publishing

We're done with the code for our package, and now we need to publish it so others can install it.

First, [get prepared to publish][publish]. Then run a single build with `npm run build` and 
run the tests with `npm test`. For our first version, change package.json's version to be 0.0.0,
and run `npm version major`. This will create a git tag, and update package.json to contain the correct version.

[publish]: https://docs.npmjs.com/getting-started/publishing-npm-packages

Finally, the moment we've all been waiting for... run `npm publish` and now anyone can download and use
your package!

