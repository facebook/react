# qs

A querystring parsing and stringifying library with some added security.

[![Build Status](https://secure.travis-ci.org/hapijs/qs.svg)](http://travis-ci.org/hapijs/qs)

Lead Maintainer: [Nathan LaFreniere](https://github.com/nlf)

The **qs** module was originally created and maintained by [TJ Holowaychuk](https://github.com/visionmedia/node-querystring).

## Usage

```javascript
var Qs = require('qs');

var obj = Qs.parse('a=c');    // { a: 'c' }
var str = Qs.stringify(obj);  // 'a=c'
```

### Parsing Objects

```javascript
Qs.parse(string, [options]);
```

**qs** allows you to create nested objects within your query strings, by surrounding the name of sub-keys with square brackets `[]`, or prefixing the sub-key with a dot `.`.
For example, the string `'foo[bar]=baz'` converts to:

```javascript
{
  foo: {
    bar: 'baz'
  }
}
```

The parsed value is returned as a plain object, created via `Object.create(null)` and as such you should be aware that prototype methods do not exist on it and a user may set those names to whatever value they like:

```javascript
Qs.parse('a.hasOwnProperty=b');
// { a: { hasOwnProperty: 'b' } }
```

URI encoded strings work too:

```javascript
Qs.parse('a%5Bb%5D=c');
// { a: { b: 'c' } }
```

You can also nest your objects, like `'foo[bar][baz]=foobarbaz'`:

```javascript
{
  foo: {
    bar: {
      baz: 'foobarbaz'
    }
  }
}
```

By default, when nesting objects **qs** will only parse up to 5 children deep. This means if you attempt to parse a string like
`'a[b][c][d][e][f][g][h][i]=j'` your resulting object will be:

```javascript
{
  a: {
    b: {
      c: {
        d: {
          e: {
            f: {
              '[g][h][i]': 'j'
            }
          }
        }
      }
    }
  }
}
```

This depth can be overridden by passing a `depth` option to `Qs.parse(string, [options])`:

```javascript
Qs.parse('a[b][c][d][e][f][g][h][i]=j', { depth: 1 });
// { a: { b: { '[c][d][e][f][g][h][i]': 'j' } } }
```

The depth limit helps mitigate abuse when **qs** is used to parse user input, and it is recommended to keep it a reasonably small number.

For similar reasons, by default **qs** will only parse up to 1000 parameters. This can be overridden by passing a `parameterLimit` option:

```javascript
Qs.parse('a=b&c=d', { parameterLimit: 1 });
// { a: 'b' }
```

An optional delimiter can also be passed:

```javascript
Qs.parse('a=b;c=d', { delimiter: ';' });
// { a: 'b', c: 'd' }
```

Delimiters can be a regular expression too:

```javascript
Qs.parse('a=b;c=d,e=f', { delimiter: /[;,]/ });
// { a: 'b', c: 'd', e: 'f' }
```

### Parsing Arrays

**qs** can also parse arrays using a similar `[]` notation:

```javascript
Qs.parse('a[]=b&a[]=c');
// { a: ['b', 'c'] }
```

You may specify an index as well:

```javascript
Qs.parse('a[1]=c&a[0]=b');
// { a: ['b', 'c'] }
```

Note that the only difference between an index in an array and a key in an object is that the value between the brackets must be a number
to create an array. When creating arrays with specific indices, **qs** will compact a sparse array to only the existing values preserving
their order:

```javascript
Qs.parse('a[1]=b&a[15]=c');
// { a: ['b', 'c'] }
```

Note that an empty string is also a value, and will be preserved:

```javascript
Qs.parse('a[]=&a[]=b');
// { a: ['', 'b'] }
Qs.parse('a[0]=b&a[1]=&a[2]=c');
// { a: ['b', '', 'c'] }
```

**qs** will also limit specifying indices in an array to a maximum index of `20`. Any array members with an index of greater than `20` will
instead be converted to an object with the index as the key:

```javascript
Qs.parse('a[100]=b');
// { a: { '100': 'b' } }
```

This limit can be overridden by passing an `arrayLimit` option:

```javascript
Qs.parse('a[1]=b', { arrayLimit: 0 });
// { a: { '1': 'b' } }
```

To disable array parsing entirely, set `parseArrays` to `false`.

```javascript
Qs.parse('a[]=b', { parseArrays: false });
// { a: { '0': 'b' } }
```

If you mix notations, **qs** will merge the two items into an object:

```javascript
Qs.parse('a[0]=b&a[b]=c');
// { a: { '0': 'b', b: 'c' } }
```

You can also create arrays of objects:

```javascript
Qs.parse('a[][b]=c');
// { a: [{ b: 'c' }] }
```

### Stringifying

```javascript
Qs.stringify(object, [options]);
```

When stringifying, **qs** always URI encodes output. Objects are stringified as you would expect:

```javascript
Qs.stringify({ a: 'b' });
// 'a=b'
Qs.stringify({ a: { b: 'c' } });
// 'a%5Bb%5D=c'
```

Examples beyond this point will be shown as though the output is not URI encoded for clarity. Please note that the return values in these cases *will* be URI encoded during real usage.

When arrays are stringified, by default they are given explicit indices:

```javascript
Qs.stringify({ a: ['b', 'c', 'd'] });
// 'a[0]=b&a[1]=c&a[2]=d'
```

You may override this by setting the `indices` option to `false`:

```javascript
Qs.stringify({ a: ['b', 'c', 'd'] }, { indices: false });
// 'a=b&a=c&a=d'
```

You may use the `arrayFormat` option to specify the format of the output array

```javascript
Qs.stringify({ a: ['b', 'c'] }, { arrayFormat: 'indices' })
// 'a[0]=b&a[1]=c'
Qs.stringify({ a: ['b', 'c'] }, { arrayFormat: 'brackets' })
// 'a[]=b&a[]=c'
Qs.stringify({ a: ['b', 'c'] }, { arrayFormat: 'repeat' })
// 'a=b&a=c'
```

Empty strings and null values will omit the value, but the equals sign (=) remains in place:

```javascript
Qs.stringify({ a: '' });
// 'a='
```

Properties that are set to `undefined` will be omitted entirely:

```javascript
Qs.stringify({ a: null, b: undefined });
// 'a='
```

The delimiter may be overridden with stringify as well:

```javascript
Qs.stringify({ a: 'b', c: 'd' }, { delimiter: ';' });
// 'a=b;c=d'
```

Finally, you can use the `filter` option to restrict which keys will be included in the stringified output.
If you pass a function, it will be called for each key to obtain the replacement value. Otherwise, if you
pass an array, it will be used to select properties and array indices for stringification:

```javascript
function filterFunc(prefix, value) {
  if (prefix == 'b') {
    // Return an `undefined` value to omit a property.
    return;
  }
  if (prefix == 'e[f]') {
    return value.getTime();
  }
  if (prefix == 'e[g][0]') {
    return value * 2;
  }
  return value;
}
Qs.stringify({ a: 'b', c: 'd', e: { f: new Date(123), g: [2] } }, { filter: filterFunc })
// 'a=b&c=d&e[f]=123&e[g][0]=4'
Qs.stringify({ a: 'b', c: 'd', e: 'f' }, { filter: ['a', 'e'] })
// 'a=b&e=f'
Qs.stringify({ a: ['b', 'c', 'd'], e: 'f' }, { filter: ['a', 0, 2] })
// 'a[0]=b&a[2]=d'
```

### Handling of `null` values

By default, `null` values are treated like empty strings:

```javascript
Qs.stringify({ a: null, b: '' });
// 'a=&b='
```

Parsing does not distinguish between parameters with and without equal signs. Both are converted to empty strings.

```javascript
Qs.parse('a&b=')
// { a: '', b: '' }
```

To distinguish between `null` values and empty strings use the `strictNullHandling` flag. In the result string the `null`
values have no `=` sign:

```javascript
Qs.stringify({ a: null, b: '' }, { strictNullHandling: true });
// 'a&b='
```

To parse values without `=` back to `null` use the `strictNullHandling` flag:

```javascript
Qs.parse('a&b=', { strictNullHandling: true });
// { a: null, b: '' }

```
