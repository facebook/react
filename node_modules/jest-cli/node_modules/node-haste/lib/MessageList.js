/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var inhertis = require('util').inherits;
var cli = require('./cli');

/**
 * @class Base message class, simply renders the text
 * @param {String} file path to the broken file
 * @param {String} type project related type, like sprites or haste map
 * @param {String} text message itself
 */
function Message(file, type, text) {
  this.file = file;
  this.type = type;
  this.text = text;
}

/**
 * @return {String}
 */
Message.prototype.render = function() {
  return this.text.replace(/\n/g, ' ');
};


/**
 * @class Warning is bad but we can live with it
 * @extends {Message}
 */
function Warning(file, type, text) {
  Message.call(this, file, type, text);
}
inhertis(Warning, Message);

Warning.prototype.render = function() {
  return cli.bold('Warning') + ': [' + this.type + '] ' +
    Message.prototype.render.call(this);
};


/**
 * @class Somthing we should fix but the site might still load
 * @extends {Message}
 */
function Error(file, type, text) {
  Message.call(this, file, type, text);
}
inhertis(Error, Message);

Error.prototype.render = function() {
  return cli.awesome('Error') + ': [' + this.type + '] ' +
    Message.prototype.render.call(this);
};

/**
 * @class Everything is broken. Fix now. Nothing will work until you fix
 * @extends {Message}
 */
function ClowntownError(file, type, text) {
  Message.call(this, file, type, text);
}
inhertis(ClowntownError, Message);

var clowntown;
ClowntownError.prototype.render = function() {
  clowntown = clowntown || cli.bold(
    cli.color('yellow', 'C') +
    cli.color('magenta', 'L') +
    cli.color('cyan', 'O') +
    cli.color('yellow', 'W') +
    cli.color('magenta', 'N') +
    cli.color('cyan', 'T') +
    cli.color('yellow', 'O') +
    cli.color('magenta', 'W') +
    cli.color('cyan', 'N')
  );
  return clowntown + ' ' + cli.awesome('Error') + ': [' + this.type + '] ' +
    Message.prototype.render.call(this);
};


/**
 * @class  A list of messages obviously. Can be merged into the other list
 * Uses a pool of objects so that we can reuse existing message lists when
 * parsing stuff instead of creating tons of them over and over again.
 */
function MessageList() {
  this.messages = [];
  this.length = 0;
}

MessageList._cache = [];

MessageList.create = function() {
  if (this._cache.length) {
    return this._cache.pop();
  }
  return new MessageList();
};

MessageList.clearCache = function() {
  this._cache.length = 0;
};

/**
 * Merges other list object into this. You should consider recycling the merged
 * MessageList with .recycle() so it can be reused later on
 * @param  {MessageList} list
 * @return {MessageList} this
 */
MessageList.prototype.merge = function(list) {
  list.messages.forEach(this.add, this);
  return this;
};

MessageList.prototype.mergeAndRecycle = function(list) {
  this.merge(list);
  list.recycle();
  return this;
};

MessageList.prototype.render = function() {
  var fileMap = {};
  var groups = [];
  this.messages.forEach(function(message) {
    if (!fileMap[message.file]) {
      groups.push(fileMap[message.file] = []);
    }
    fileMap[message.file].push(message);
  });

  var result = '';
  groups.forEach(function(group) {
    result += '  ' + cli.bold('File:') + ' ' + group[0].file + '. ';
    if (group.length === 1) {
      result += group[0].render() + '\n';
    } else {
      result += cli.bold('Messages') + ':\n';
      group.forEach(function(message) {
        result += '        ' + message.render() + '\n';
      });
    }
  });

  return result;
};

MessageList.prototype.add = function(message) {
  this.messages.push(message);
  this.length = this.messages.length;
  return this;
};

MessageList.prototype.addMessage = function(file, type, text) {
  return this.add(new Message(file, type, text));
};

MessageList.prototype.addWarning = function(file, type, text) {
  return this.add(new Warning(file, type, text));
};

MessageList.prototype.addError = function(file, type, text) {
  return this.add(new Error(file, type, text));
};

MessageList.prototype.addClowntownError = function(file, type, text) {
  return this.add(new ClowntownError(file, type, text));
};

MessageList.prototype.recycle = function(first_argument) {
  this.messages.length = 0;
  this.length = 0;
  MessageList._cache.push(this);
  return this;
};

/**
 * Next 2 methods are ugly (voloko). But it's the minimal thing that works.
 * So let them live.
 */
MessageList.prototype.toObject = function() {
  return this.messages.map(function(m) {
    var type = m instanceof Warning ? 'Warning' :
               m instanceof Error ? 'Error' :
               m instanceof ClowntownError ? 'ClowntownError':
              'Message';
    return [type, [m.file, m.type, m.text]];
  });
};

MessageList.fromObject = function(object) {
  var list = MessageList.create();
  object.forEach(function(m) {
    var f = m[0] === 'Warning' ? list.addWarning :
            m[0] === 'Error' ? list.addError :
            m[0] === 'ClowntownError' ? list.addClowntownError :
            list.addMessage;
    f.apply(list, m[1]);
  });
  return list;
};

module.exports = MessageList;
