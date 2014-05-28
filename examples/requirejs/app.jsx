/**
 * @jsx React.DOM
 */
/* global define */
define(['react', 'example/component'], function(React, Component) {
  "use strict";

  return function (element) {
    React.renderComponent(<Component />, element);
  };
});
