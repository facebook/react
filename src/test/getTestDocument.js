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
 * @providesModule getTestDocument
 */

/**
 * We need to work around the fact that we have two different
 * test implementations: once that breaks if we clobber document
 * (open-source) and one that doesn't support createHTMLDocument()
 * (jst).
 */
function getTestDocument() {
  if (document.implementation &&
      document.implementation.createHTMLDocument) {
    return document.implementation.createHTMLDocument('test doc');
  }
  return null;
}

module.exports = getTestDocument;
