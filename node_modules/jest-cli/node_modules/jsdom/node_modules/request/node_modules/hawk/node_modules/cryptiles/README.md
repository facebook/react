cryptiles
=========

General purpose crypto utilities

[![Build Status](https://secure.travis-ci.org/hapijs/cryptiles.png)](http://travis-ci.org/hapijs/cryptiles)

## Methods

### `randomString(<Number> size)`
Returns a cryptographically strong pseudo-random data string. Takes a size argument for the length of the string.

### `fixedTimeComparison(<String> a, <String> b)`
Compare two strings using fixed time algorithm (to prevent time-based analysis of MAC digest match). Returns `true` if the strings match, `false` if they differ.
