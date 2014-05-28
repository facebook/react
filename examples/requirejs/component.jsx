/**
 * @jsx React.DOM
 */
/* global define */
define(['react', 'example/subcomponent'], function(React, Subcomponent) {
  "use strict";

  return function (element) {
    React.renderComponent(<Subcomponent />, element);
  };
});
