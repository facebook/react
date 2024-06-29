# eslint-plugin-react-compiler

ESLint plugin surfacing problematic React code found by the React compiler.

## Installation

You'll first need to install [ESLint](https://eslint.org/):

```sh
npm i eslint --save-dev
```

Next, install `eslint-plugin-react-compiler`:

```sh
npm install eslint-plugin-react-compiler --save-dev
```

## Usage

Add `react-compiler` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "plugins": [
        "react-compiler"
    ]
}
```


Then configure the rules you want to use under the rules section.

```json
{
    "rules": {
        "react-compiler/react-compiler": "error"
    }
}
```

## Rules

<!-- begin auto-generated rules list -->
TODO: Run eslint-doc-generator to generate the rules list.
<!-- end auto-generated rules list -->
