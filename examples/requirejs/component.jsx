"use strict";

/**
 * @jsx React.DOM
 */
define(['react', 'example/subcomponent'], function(React, Subcomponent) {
  return function (element) {
    React.renderComponent(<Subcomponent />, element);
  };
});
