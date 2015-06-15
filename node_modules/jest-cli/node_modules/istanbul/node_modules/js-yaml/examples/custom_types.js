'use strict';

/*eslint-disable no-console*/

var fs   = require('fs');
var path = require('path');
var util = require('util');
var yaml = require('../lib/js-yaml');


// Let's define a couple of classes.

function Point(x, y, z) {
  this.klass = 'Point';
  this.x     = x;
  this.y     = y;
  this.z     = z;
}


function Space(height, width, points) {
  if (points) {
    if (!points.every(function (point) { return point instanceof Point; })) {
      throw new Error('A non-Point inside a points array!');
    }
  }

  this.klass  = 'Space';
  this.height = height;
  this.width  = width;
  this.points = points;
}


// Then define YAML types to load and dump our Point/Space objects.

var PointYamlType = new yaml.Type('!point', {
  // Loader must parse sequence nodes only for this type (i.e. arrays in JS terminology).
  // Other available kinds are 'scalar' (string) and 'mapping' (object).
  // http://www.yaml.org/spec/1.2/spec.html#kind//
  kind: 'sequence',

  // Loader must check if the input object is suitable for this type.
  resolve: function (data) {
    // `data` may be either:
    // - Null in case of an "empty node" (http://www.yaml.org/spec/1.2/spec.html#id2786563)
    // - Array since we specified `kind` to 'sequence'
    return data !== null && data.length === 3;
  },

  // If a node is resolved, use it to create a Point instance.
  construct: function (data) {
    return new Point(data[0], data[1], data[2]);
  },

  // Dumper must process instances of Point by rules of this YAML type.
  instanceOf: Point,

  // Dumper must represent Point objects as three-element sequence in YAML.
  represent: function (point) {
    return [ point.x, point.y, point.z ];
  }
});


var SpaceYamlType = new yaml.Type('!space', {
  kind: 'mapping',
  construct: function (data) {
    data = data || {}; // in case of empty node
    return new Space(data.height || 0, data.width || 0, data.points || []);
  },
  instanceOf: Space
  // `represent` is omitted here. So, Space objects will be dumped as is.
  // That is regular mapping with three key-value pairs but with !space tag.
});


// After our types are defined, it's time to join them into a schema.

var SPACE_SCHEMA = yaml.Schema.create([ SpaceYamlType, PointYamlType ]);

// do not execute the following if file is required (http://stackoverflow.com/a/6398335)
if (require.main === module) {

  // And read a document using that schema.
  fs.readFile(path.join(__dirname, 'custom_types.yml'), 'utf8', function (error, data) {
    var loaded;

    if (!error) {
      loaded = yaml.load(data, { schema: SPACE_SCHEMA });
      console.log(util.inspect(loaded, false, 20, true));
    } else {
      console.error(error.stack || error.message || String(error));
    }
  });
}

// There are some exports to play with this example interactively.
module.exports.Point         = Point;
module.exports.Space         = Space;
module.exports.PointYamlType = PointYamlType;
module.exports.SpaceYamlType = SpaceYamlType;
module.exports.SPACE_SCHEMA  = SPACE_SCHEMA;
