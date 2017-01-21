---
id: publishing-component
title: Publishing a react component
permalink: docs/publishing-component.html
layout: docs
category: Reference
---

There are times you would want to create your own component and would want to make them public for everyone to use. This section would assist you in walking through the necessary steps for publishing your own components.

## Pre-requisites
For this section, you will need to have installed [git](https://git-scm.com/downloads) and [node](https://nodejs.org/en/download/)

For this guide we will create a `PageTitle` react component and would lay out the necessary steps for publishing it to [npm](https://www.npmjs.com/)

## Getting Started
* Create a project directory.
* Open terminal in the project directory. 
* React components are published as npm packages, so we need a `package.json` file. To create one, we will initialize our project directory with a `package.json`
```bash
npm init
```
This would walk us through creating our `package.json` file.

## Install React
We will install [react](https://facebook.github.io/react/). We would save it as a dependency to our package.
```bash
npm i -S react
```
## Configuring Babel
We need some development tools to assist us in development and for publishing a release. We will use [Babel](https://babeljs.io/) for transpiling our ES6 code to ES5. Also, for coverage we would use [Jest](https://facebook.github.io/jest/) and [Enzyme](http://airbnb.io/enzyme/).
```bash
npm i -D babel-cli babel-preset-es2015 babel-preset-react babel-jest enzyme jest react-addons-test-utils
```

We will configure babel presets for the transforms that we want to include for our transpilation. There are multiple ways to achieve this. We will create a new file at root level named as `.babelrc`
```
{
  "presets": ["es2015", "react"]
}
```

*For alternative ways to configure babel preset options*[babelrc](https://babeljs.io/docs/usage/babelrc/)

## Setting up the entry point
In our package json, we have an option as `main`  that basically is set against a file in our source. So when someone installs our package into their own application and imports our package for usage, for example:

``` javascript
import PageTitle from 'react-page-title';
```
The path for file that we have specified would be the file it would import contents from. Currently in our package, it points to `src/index.js`.

We will now update our `npm scripts` in our `package.json` file

``` javascript
"scripts": {
   "build": "babel --out-dir dist --ignore *.test.js src",
   "test": "jest"
}
```
## Creating a build
Now, if we run `npm run build` as we have instructed babel, it would create a `dist` directory for us and would transpile every file inside our `src` directory. Also, as we do not want our test files to be traspiled we have added an `--ignore` option to our build script for ignoring all files that ends with `.test.js`.
Moreover, we have added a script for running our tests. 
 
Since we do not want others to import our ES6 version of component when they import our package in their applications, we would need to update our `main` option in our `package.json` to point to the transpiled version of our component. Our scripts and name become
 ``` javascript
  "main": "dist/index.js", // Now points to the transpiled version
  "scripts": {
    "build": "babel --out-dir dist --ignore *.test.js src",
    "test": "jest"
 }
 ```

We will create our component in `src/index.js` and would export it as default. 

``` javascript
import React, { PropTypes } from 'react';

const PageTitle = (props) => {
  const defaultStyles = {
    fontFamily: 'Roboto',
    fontSize: '36px',
    fontWeight: '100',
    marginTop: '0',
    textTransform: 'uppercase'
  };

  const styles = Object.assign({}, defaultStyles, props.style);

  return <h2 style={styles}>{props.children}</h2>;
};

PageTitle.propTypes = {
  children: PropTypes.string.isRequired,
  style: PropTypes.object
};

export default PageTitle;

```

There is nothing fancy going on in our component. Our component is a stateless functional component, that would render out whatever title is passed as a child. Also, for people to override styles on our component we are allowing the styles override on our default styles.
*For more information on* `Stateless Functional Components` [Components and Props](https://facebook.github.io/react/docs/components-and-props.html)

To make sure, your component is being transpiled to a `dist` directory, run `npm run build` and we will see an `index.js` inside `dist/` with our component transpiled version.

## Adding Coverage
Lets add some coverage to our component to be sure our component behavior works as expected. We will add a file as `index.test.js` in our `src` directory.

``` javascript
import React from 'react';
import { shallow } from 'enzyme';
import PageTitle from './index';

describe('PageTitle', () => {
  describe('when rendered', () => {
    it('should not explode', () => {
      expect(shallow(<PageTitle>title</PageTitle>).length).toBe(1);
    });

    it('should have a title as child', () => {
      expect(shallow(<PageTitle>title</PageTitle>).children().text()).toBe('title');
    });

    it('should have props style', () => {
      expect(shallow(<PageTitle>title</PageTitle>).props().style).toEqual({
        fontFamily: 'Roboto',
        fontSize: '36px',
        fontWeight: '100',
        marginTop: '0',
        textTransform: 'uppercase'
      });
    });

    it('should override styles', () => {
      const overrideProps = {
        style: {
          fontSize: '16px' // default is 36px
        }
      };

      expect(shallow(<PageTitle {...overrideProps}>title</PageTitle>).props().style).toEqual({
        fontFamily: 'Roboto',
        fontSize: '16px',
        fontWeight: '100',
        marginTop: '0',
        textTransform: 'uppercase'
      });
    });
  });
});

```

*If we run* `npm run build` *now, we would not see the the transpiled version of our test file because we have added an* `ignore` *option for that in our scripts*.

We are close but we definitely want our source code to be shared publicly for others to see, suggest changes, and maybe file issues. We will need to set up a [github](http://www.github.com) account, if we do not have already. We will create a repository for our component and would [add our project to our remote github repo](https://help.github.com/articles/adding-an-existing-project-to-github-using-the-command-line/) 

## Publishing
Finally, we will publish our component. We will need to setup some local npm configurations. 

``` 
npm set init-author-name 'Your Name'
npm set init-author-email 'Your Email'
npm set init-author-url 'Your url'
npm set init-license 'LICENSE'
```
*You can find more configuration options at* [npm docs](https://docs.npmjs.com/misc/config)

Now, we will need to sign up on [npmjs](https://npmjs.com/signup) if we haven't already. After we have set up our account on npm registry we can add our user locally as well for publishing our component.
```bash
npm add user
```
It would prompt you for your `username`, `password` and your `email address`. This would be used to create your auth token in your `npmrc`. You can see the contents of your configuration in your `npmrc` file by typing `~/.npmrc` in your terminal.

We can now just simply do
```bash
npm publish
```
This would publish our component to the npm registry, but we would need a slight modification in our scripts before we do that.
``` javascript
"scripts": {
   "build": "babel --out-dir dist --ignore *.test.js src",
   "prepublish": "npm run build",
   "test": "jest"
}
```
`prepublish` would get executed every time before we run `npm run publish` and this would make sure we have our latest build we publish our component. 

Now, if we run `npm run publish`, it would publish our react component under the name we specified in our `package.json` which in case for our component would be `react-page-title`. 

We can simply install our package and consume it in any other react project by importing it.

``` javascript
import PageTitle from 'react-page-title';
```
