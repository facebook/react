"use strict";

function JSONStreamParser() {
  this._currentlyWithinQuotedString = false;
  this._depth = 0;
  this._buffer = '';
}

JSONStreamParser.prototype.parse=function(streamText) {
  var cursor = this._buffer.length;
  this._buffer += streamText;
  var currChar;
  var responses = [];
  while (cursor < this._buffer.length) {
    currChar = this._buffer.charAt(cursor);
    if (this._currentlyWithinQuotedString && currChar === '\\') {
      // If the current character is escaped, move forward
      cursor++;
    } else if (currChar === '"') {
      // Are we inside a quoted string?
      this._currentlyWithinQuotedString = !this._currentlyWithinQuotedString;
    } else if (!this._currentlyWithinQuotedString) {
      if (currChar === '{') {
        this._depth++;
      } else if (currChar === '}') {
        this._depth--;
        if (this._depth === 0) {
          responses.push(JSON.parse(this._buffer.substring(0, cursor + 1)));
          this._buffer = this._buffer.substring(cursor + 1);
          cursor = 0;
          continue;
        }
      }
    }
    cursor++;
  }
  return responses;
};

JSONStreamParser.prototype.getBuffer=function() {
  return this._buffer;
}

module.exports = JSONStreamParser;
