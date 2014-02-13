# JSX Whitespace Transformer

React 0.9 changes the way whitespace is parsed from JSX.

Take this example block:

```js
<div>
  Monkeys:
  <input type="text" />
</div>
```

In 0.8 and below, this would be transformed to the following:

```js
React.DOM.div(null,
  " Monkeys: ",
  React.DOM.input( {type:"text"} )
)
```

In 0.9, this will instead be transformed the following:

```js
React.DOM.div(null,
  "Monkeys:",
  React.DOM.input( {type:"text"} )
)
```


## Usage

The `jsx_whitespace_transformer` module ships an executable which transforms a file or directory of files. It looks for the `@jsx React.DOM` trigger, the same as the `jsx` transformer works. Files will be modified in place, so be sure you are prepared for that.

```sh
$ npm -g install jsx_whitespace_transformer
$ jsx_whitespace_tranformer <path_to_file_or_files>
```
