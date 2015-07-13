# JSX Orphaned Brackets Transformer

React 0.13 no longer parses orphaned > and } as text.

Take this example block:

```js
<div>
  > }
</div>
```

In 0.12 and below, this would be transformed to the following:

```js
React.DOM.div(null,
  "> }",
)
```

In 0.13, this will instead throw a parser error.


## Usage

The `jsx_orphaned_brackets_transformer` module ships an executable which transforms a file or directory of files. Files will be modified in place, so be sure you are prepared for that.

```sh
$ npm -g install jsx_orphaned_brackets_transformer
$ jsx_orphaned_brackets_transformer <path_to_file_or_files>
```
