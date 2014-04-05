var React = require('react');
var express = require('express');
var path = require('path');

// Transparently support JSX
require('node-jsx').install();

var app = express();

// All the render server does is take a CommonJS module ID and some JSON props
// in the querystring and return a static HTML representation of the component.
// Note that this is a backend service hit by your actual web app. Even so,
// you would probably put Varnish in front of this in production.
app.get('/', function(req, res){
  var component = require(path.resolve(req.query['module']));
  var props = JSON.parse(req.query['props'] || '{}');

  res.send(React.renderComponentToString(component(props)));
});

app.listen(3000);
