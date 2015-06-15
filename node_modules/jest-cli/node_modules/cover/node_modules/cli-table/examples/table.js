
/**
 * Module requirements.
 */

// this line is only needed if you refuse to use npm
require.paths.unshift(__dirname + '/../support/colors');

var Table = require('../lib/cli-table');

/**
 * Example.
 */

var table = new Table({ 
    head: ['First', 'Last', 'Email', 'Twitter']
  , chars: {
        'top': '-'
      , 'top-mid': '-'
      , 'top-left': '-'
      , 'top-right': '-'
      , 'bottom': '-'
      , 'bottom-mid': '-'
      , 'bottom-left': '-' 
      , 'bottom-right': '-'
      , 'left': '|'
      , 'left-mid': '|'
      , 'mid': '-'
      , 'mid-mid': '-'
      , 'right': '|'
      , 'right-mid': '-'
    }
  , colWidths: [14, 10, 25, 17]
});

table.push(
  ['Guillermo', 'Rauch', 'rauchg@gmail.com', 'rauchg']
);

console.log(table.toString());
