/**
 * @jsx React.DOM
 */

var ExampleApplication = require("example");
var start = new Date().getTime();

setInterval(function() {
  React.renderComponent(
    <ExampleApplication elapsed={new Date().getTime() - start} />,
    document.getElementById('container')
  );
}, 50);
