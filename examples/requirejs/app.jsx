/**
 * @jsx React.DOM
 */
define(['react', 'example/component'], function(React, Component) {
  return function (element) {
    React.renderComponent(<Component />, element);
  };
});
