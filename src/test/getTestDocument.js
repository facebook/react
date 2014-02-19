/**
 * Copyright 2013-2014 Facebook, Inc.
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
 * @providesModule getTestDocument
 */

"use strict";

function getTestDocument(markup) {
  var iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  var testDocument = iframe.contentDocument || iframe.contentWindow.document;
  testDocument.open();
  testDocument.write(
    markup || '<!doctype html><html><meta charset=utf-8><title>test doc</title>'
  );
  testDocument.close();

  iframe.parentNode.removeChild(iframe);
  return testDocument;
}

module.exports = getTestDocument;
