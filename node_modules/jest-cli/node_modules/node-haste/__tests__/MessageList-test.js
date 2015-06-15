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
 *
 * @emails javascript@lists.facebook.com voloko@fb.com
 */

describe("MessageList", function() {
  var MessageList = require('../lib/MessageList');
  var cli = require('../lib/cli');

  it('should add different types of messages', function() {
    var list = new MessageList();
    list.addMessage('foo.js', 'js', 'message');
    list.addWarning('foo.js', 'js', 'warning');
    list.addError('foo.js', 'js', 'error');
    list.addClowntownError('foo.js', 'js', 'clowntown');
    expect(list.length).toBe(4);
  });

  it('should render error with bold', function() {
    var list = new MessageList();
    list.addWarning('foo.js', 'js', 'warning text');
    expect(list.render()).toContain('warning text');
    expect(list.render()).toContain(cli.bold('Warning'));
  });

  it('should render error with awesome', function() {
    var list = new MessageList();
    list.addError('foo.js', 'js', 'error text');
    expect(list.render()).toContain('error text');
    expect(list.render()).toContain(cli.awesome('Error'));
  });

  it('should render error with awesome', function() {
    var list = new MessageList();
    list.addClowntownError('foo.js', 'js', 'clowntown');
    expect(list.render()).toContain('clowntown');
    expect(list.render()).toContain(cli.awesome('Error'));
  });

  it('should group messages by file', function() {
    var list = new MessageList();
    list.addError('foo.js', 'js', 'error');
    list.addClowntownError('foo.js', 'js', 'clowntown');
    expect(list.render()).toContain(cli.bold('Messages'));
  });

  it('expected to merge lists', function() {
    var list1 = new MessageList();
    list1.addWarning('a', 'b', '1');
    list1.addError('a', 'b', '2');

    var list2 = new MessageList();
    list2.addClowntownError('a', 'b', '3');

    list2.merge(list1);
    expect(list2.length).toBe(3);
  });

  it('should reuse objects created through the factory', function() {
    MessageList.clearCache();
    var list = MessageList.create();
    list.addWarning('a', 'b', '1');

    list.recycle();
    expect(list.length).toBe(0);
    expect(MessageList.create()).toBe(list);
  });

  it('should serialize a message list', function() {
    var list = new MessageList();
    list.addMessage('foo.js', 'js', 'message');
    list.addWarning('foo.js', 'js', 'warning');
    list.addError('foo.js', 'js', 'error text');
    list.addClowntownError('foo.js', 'js', 'clowntown');

    list = MessageList.fromObject(
      JSON.parse(JSON.stringify(list.toObject())));
    expect(list.length).toBe(4);
    expect(list.render()).toContain('error text');
    expect(list.render()).toContain(cli.awesome('Error'));
  });
});
