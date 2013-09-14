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
 * @jsx React.DOM
 * @emails react-core
 */

/*jslint evil: true */

"use strict";

var getTestDocument = require('getTestDocument');

var mutateHTMLNodeWithMarkup = require('mutateHTMLNodeWithMarkup');

describe('mutateHTMLNodeWithMarkup', function() {
  it('should mutate the document html', function() {
    var html = '<html><head><title>test</title></head><body>test</body></html>';
    var testDocument = getTestDocument() || document;

    mutateHTMLNodeWithMarkup(testDocument.documentElement, html);
    expect(testDocument.body.innerHTML).toBe('test');
  });

  it('should change attributes', function() {
    var html = '<html><head><title>test</title></head><body>test</body></html>';
    var testDocument = getTestDocument() || document;

    mutateHTMLNodeWithMarkup(testDocument.documentElement, html);
    expect(!!testDocument.documentElement.getAttribute('lang')).toBe(false);

    var html2 = '<html lang="en"><head><title>test</title></head>' +
      '<body>test</body></html>';
    mutateHTMLNodeWithMarkup(testDocument.documentElement, html2);
    expect(testDocument.documentElement.getAttribute('lang')).toBe('en');

    mutateHTMLNodeWithMarkup(testDocument.documentElement, html);
    expect(!!testDocument.documentElement.getAttribute('lang')).toBe(false);
  });
});
