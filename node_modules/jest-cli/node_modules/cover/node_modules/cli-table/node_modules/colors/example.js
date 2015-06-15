var sys = require('sys');
var colors = require('./colors');

sys.puts('Rainbows are fun!'.rainbow);
sys.puts('So '.italic + 'are'.underline + ' styles! '.bold + 'inverse'.inverse); // styles not widely supported
sys.puts('Chains are also cool.'.bold.italic.underline.red); // styles not widely supported