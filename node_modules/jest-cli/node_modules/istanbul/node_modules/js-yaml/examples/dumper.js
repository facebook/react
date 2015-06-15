'use strict';

/*eslint-disable no-console*/

var yaml = require('../lib/js-yaml');
var object = require('./dumper.json');


console.log(yaml.dump(object, {
  flowLevel: 3,
  styles: {
    '!!int'  : 'hexadecimal',
    '!!null' : 'camelcase'
  }
}));


// Output:
//==============================================================================
// name: Wizzard
// level: 0x11
// sanity: Null
// inventory:
//   - name: Hat
//     features: [magic, pointed]
//     traits: {}
//   - name: Staff
//     features: []
//     traits: {damage: 0xA}
//   - name: Cloak
//     features: [old]
//     traits: {defence: 0x0, comfort: 0x3}
