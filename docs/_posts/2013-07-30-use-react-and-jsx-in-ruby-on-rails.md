---
title: "Use React and JSX in Ruby on Rails"
author: Paul O'Shannessy
---

Today we're releasing a gem to make it easier to use React and JSX in Ruby on Rails applications: [react-rails](https://github.com/facebook/react-rails).


This gem has 2 primary purposes:

1. To package `react.js` in a way that's easy to use and easy to update.
2. To allow you to write JSX without an external build step to transform that into JS.


## Packaging react.js

To make `react.js` available for use client-side, simply add `react` to your manifest, and declare the variant you'd like to use in your environment. When you use `:production`, the minified and optimized `react.min.js` will be used instead of the development version. For example:

```ruby
# config/environments/development.rb

MyApp::Application.configure do
  config.react.variant = :development
  # use :production in production.rb
end
```

```js
// app/assets/javascript/application.js

//= require react
```


## Writing JSX

When you name your file with `myfile.js.jsx`, `react-rails` will automatically try to transform that file. For the time being, we still require that you include the docblock at the beginning of the file. For example, this file will get transformed on request.

```js
/** @jsx React.DOM */
React.renderComponent(<MyComponent/>, document.body)
```


## Asset Pipeline

`react-rails` takes advantage of the [asset pipeline](http://guides.rubyonrails.org/asset_pipeline.html) that was introduced in Rails 3.1. A very important part of that pipeline is the `assets:precompile` Rake task. `react-rails` will ensure that your JSX files will be transformed into regular JS before all of your assets are minified and packaged.


## Installation

Installation follows the same process you're familiar with. You can install it globally with `gem install react-rails`, though we suggest you add the dependency to your `Gemfile` directly.

