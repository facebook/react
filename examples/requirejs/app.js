/**
 * @jsx React.DOM
 */
require(['build/example-component'], function(ExampleComponent){
  "use strict";

  React.renderComponent(<ExampleComponent />, document.getElementById('container'));
});