---
title: "Use React and JSX in Python Applications"
author: [kmeht]
---

Today we're happy to announce the initial release of [PyReact](https://github.com/facebook/react-python), which makes it easier to use React and JSX in your Python applications. It's designed to provide an API to transform your JSX files into JavaScript, as well as provide access to the latest React source files.

## Usage

Transform your JSX files via the provided `jsx` module:

```python
from react import jsx

# For multiple paths, use the JSXTransformer class.
transformer = jsx.JSXTransformer()
for jsx_path, js_path in my_paths:
    transformer.transform(jsx_path, js_path)

# For a single file, you can use a shortcut method.
jsx.transform('path/to/input/file.jsx', 'path/to/output/file.js')
```

For full paths to React files, use the `source` module:

```python
from react import source

# path_for raises IOError if the file doesn't exist.
react_js = source.path_for('react.min.js')
```

## Django

PyReact includes a JSX compiler for [django-pipeline](https://github.com/cyberdelia/django-pipeline). Add it to your project's pipeline settings like this:

```python
PIPELINE_COMPILERS = (
  'react.utils.pipeline.JSXCompiler',
)
```

## Installation

PyReact is hosted on PyPI, and can be installed with `pip`:

    $ pip install PyReact

Alternatively, add it into your `requirements` file:

    PyReact==0.1.1

**Dependencies**: PyReact uses [PyExecJS](https://github.com/doloopwhile/PyExecJS) to execute the bundled React code, which requires that a JS runtime environment is installed on your machine. We don't explicitly set a dependency on a runtime environment; Mac OS X comes bundled with one. If you're on a different platform, we recommend [PyV8](https://code.google.com/p/pyv8/).

For the initial release, we've only tested on Python 2.7. Look out for support for Python 3 in the future, and if you see anything that can be improved, we welcome your [contributions](https://github.com/facebook/react-python/blob/master/CONTRIBUTING.md)!
