var expand = require('./');

console.log(expand('http://any.org/archive{1996..1999}/vol{1..4}/part{a,b,c}.html'));
console.log(expand('http://www.numericals.com/file{1..100..10}.txt'));
console.log(expand('http://www.letters.com/file{a..z..2}.txt'));
console.log(expand('mkdir /usr/local/src/bash/{old,new,dist,bugs}'));
console.log(expand('chown root /usr/{ucb/{ex,edit},lib/{ex?.?*,how_ex}}'));

