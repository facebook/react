define(
  ["../utils","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var isArray = __dependency1__.isArray;

    try {
      var SourceMap = require('source-map'),
            SourceNode = SourceMap.SourceNode;
    } catch (err) {
      /* istanbul ignore next: tested but not covered in istanbul due to dist build  */
      SourceNode = function(line, column, srcFile, chunks) {
        this.src = '';
        if (chunks) {
          this.add(chunks);
        }
      };
      /* istanbul ignore next */
      SourceNode.prototype = {
        add: function(chunks) {
          if (isArray(chunks)) {
            chunks = chunks.join('');
          }
          this.src += chunks;
        },
        prepend: function(chunks) {
          if (isArray(chunks)) {
            chunks = chunks.join('');
          }
          this.src = chunks + this.src;
        },
        toStringWithSourceMap: function() {
          return {code: this.toString()};
        },
        toString: function() {
          return this.src;
        }
      };
    }


    function castChunk(chunk, codeGen, loc) {
      if (isArray(chunk)) {
        var ret = [];

        for (var i = 0, len = chunk.length; i < len; i++) {
          ret.push(codeGen.wrap(chunk[i], loc));
        }
        return ret;
      } else if (typeof chunk === 'boolean' || typeof chunk === 'number') {
        // Handle primitives that the SourceNode will throw up on
        return chunk+'';
      }
      return chunk;
    }


    function CodeGen(srcFile) {
      this.srcFile = srcFile;
      this.source = [];
    }

    CodeGen.prototype = {
      prepend: function(source, loc) {
        this.source.unshift(this.wrap(source, loc));
      },
      push: function(source, loc) {
        this.source.push(this.wrap(source, loc));
      },

      merge: function() {
        var source = this.empty();
        this.each(function(line) {
          source.add(['  ', line, '\n']);
        });
        return source;
      },

      each: function(iter) {
        for (var i = 0, len = this.source.length; i < len; i++) {
          iter(this.source[i]);
        }
      },

      empty: function(loc) {
        loc = loc || this.currentLocation || {start:{}};
        return new SourceNode(loc.start.line, loc.start.column, this.srcFile);
      },
      wrap: function(chunk, loc) {
        if (chunk instanceof SourceNode) {
          return chunk;
        }

        loc = loc || this.currentLocation || {start:{}};
        chunk = castChunk(chunk, this, loc);

        return new SourceNode(loc.start.line, loc.start.column, this.srcFile, chunk);
      },

      functionCall: function(fn, type, params) {
        params = this.generateList(params);
        return this.wrap([fn, type ? '.' + type + '(' : '(', params, ')']);
      },

      quotedString: function(str) {
        return '"' + (str + '')
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\u2028/g, '\\u2028')   // Per Ecma-262 7.3 + 7.8.4
          .replace(/\u2029/g, '\\u2029') + '"';
      },

      objectLiteral: function(obj) {
        var pairs = [];

        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            var value = castChunk(obj[key], this);
            if (value !== 'undefined') {
              pairs.push([this.quotedString(key), ':', value]);
            }
          }
        }

        var ret = this.generateList(pairs);
        ret.prepend('{');
        ret.add('}');
        return ret;
      },


      generateList: function(entries, loc) {
        var ret = this.empty(loc);

        for (var i = 0, len = entries.length; i < len; i++) {
          if (i) {
            ret.add(',');
          }

          ret.add(castChunk(entries[i], this, loc));
        }

        return ret;
      },

      generateArray: function(entries, loc) {
        var ret = this.generateList(entries, loc);
        ret.prepend('[');
        ret.add(']');

        return ret;
      }
    };

    __exports__["default"] = CodeGen;
  });