# React-Rails

React/JSX adapter for the Ruby on Rails asset pipeline.

## Installation

React-Rails has only been tested with versions of Rails using `Gemfile`s. Use otherwise at your own risk.

Add the following to your `Gemfile` and be sure to `bundle install` after. We suggest only adding the dependency to the `:assets` group so that if you precompile your assets, you aren't requiring extra gems unnecessarily.

```ruby
# Gemfile
group :assets do
  gem 'react-rails'
end
```


## Usage

### JSX

To transform your JSX into JS, simply create `.jsx.js` files, and ensure that the file has the `/** @jsx React.DOM */` docblock.


### React

Since we don't put `react.js` into `assets/javascript`, you must explicitly include it. There are 2 ways to do this.

You can `require` it in your manifest:

```js
// app/assets/application.js

//= require react
```

Or you can include it explicitly as a separate script tag:

```erb
// app/views/layouts/application.erb.html
<%= javascript_include_tag "react" %>
```




## Configuring

There are 2 variants available. `:development` gives you the unminified version of React. This provides extra debugging and error prevention. `:production` gives you the minified version of React which strips out comments and helpful warnings, and minifies.

```ruby
# config/environments/development.rb
MyApp::Application.configure do
  config.react.variant = :development
end

# config/environments/production.rb
MyApp::Application.configure do
  config.react.variant = :production
end
```


## TODO

* [ ] Write tests
* [ ] Ajax requests?
* [ ] `somefile.jsx.erb.js`?
* [ ] Consider removing the config entirely.
* [ ] Do what jquery-rails is doing to intercept loads, instead of tmp dir magic
* [ ] Build sample app
