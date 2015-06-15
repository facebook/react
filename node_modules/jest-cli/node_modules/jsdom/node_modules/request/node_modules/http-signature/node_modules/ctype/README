Node-CType is a way to read and write binary data in structured and easy to use
format. Its name comes from the C header file.

To get started, simply clone the repository or use npm to install it. Once it is
there, simply require it.

git clone git://github.com/rmustacc/node-ctype
npm install ctype
var mod_ctype = require('ctype')


There are two APIs that you can use, depending on what abstraction you'd like.
The low level API let's you read and write individual integers and floats from
buffers. The higher level API let's you read and write structures of these. To
illustrate this, let's looks look at how we would read and write a binary
encoded x,y point.

In C we would define this structure as follows:

typedef struct point {
	uint16_t	p_x;
	uint16_t	p_y;
} point_t;

To read a binary encoded point from a Buffer, we first need to create a CType
parser (where we specify the endian and other options) and add the typedef.

var parser = new mod_ctype.Parser({ endian: 'big' });
parser.typedef('point_t', [
	{ x: { type: 'uint16_t' } },
	{ y: { type: 'uint16_t' } }
]);

From here, given a buffer buf and an offset into it, we can read a point.

var out = parser.readData([ { point: { type: 'point_t' } } ], buffer, 0);
console.log(out);
{ point: { x: 23, y: 42 } }

Another way to get the same information would be to use the low level methods.
Note that these require you to manually deal with the offset. Here's how we'd
get the same values of x and y from the buffer.

var x = mod_ctype.ruint16(buf, 'big', 0);
var y = mod_ctype.ruint16(buf, 'big', 2);
console.log(x + ', ' + y);
23, 42

The true power of this API comes from the ability to define and nest typedefs,
just as you would in C. By default, the following types are defined by default.
Note that they return a Number, unless indicated otherwise.

    * int8_t
    * int16_t
    * int32_t
    * int64_t (returns an array where val[0] << 32 + val[1] would be the value)
    * uint8_t
    * uint16_t
    * uint32_t
    * uint64_t (returns an array where val[0] << 32 + val[1] would be the value)
    * float
    * double
    * char (either returns a buffer with that character or a uint8_t)
    * char[] (returns an object with the buffer and the number of characters read which is either the total amount requested or until the first 0)


ctf2json integration:

Node-CType supports consuming the output of ctf2json. Once you read in a JSON file,
all you have to do to add all the definitions it contains is:

var data, parser;
data = JSON.parse(parsedJSONData);
parser = mod_ctype.parseCTF(data, { endian: 'big' });

For more documentation, see the file README.old. Full documentation is in the
process of being rewritten as a series of manual pages which will be available
in the repository and online for viewing.

To read the ctio manual page simple run, from the root of the workspace:

man -Mman -s 3ctype ctio
