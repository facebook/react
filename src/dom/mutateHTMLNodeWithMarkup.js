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
 * @providesModule mutateHTMLNodeWithMarkup
 * @typechecks static-only
 */

/*jslint evil: true */

'use strict';

var createNodesFromMarkup = require('createNodesFromMarkup');
var filterAttributes = require('filterAttributes');
var invariant = require('invariant');

/**
 * You can't set the innerHTML of a document. Unless you have
 * this function.
 *
 * @param {DOMElement} node with tagName == 'html'
 * @param {string} markup markup string including <html>.
 */
function mutateHTMLNodeWithMarkup(node, markup) {
  invariant(
    node.tagName.toLowerCase() === 'html',
    'mutateHTMLNodeWithMarkup(): node must have tagName of "html", got %s',
    node.tagName
  );

  markup = markup.trim();
  invariant(
    markup.toLowerCase().indexOf('<html') === 0,
    'mutateHTMLNodeWithMarkup(): markup must start with <html'
  );

  // First let's extract the various pieces of markup.
  var htmlOpenTagEnd = markup.indexOf('>') + 1;
  var htmlCloseTagStart = markup.lastIndexOf('<');
  var htmlOpenTag = markup.substring(0, htmlOpenTagEnd);
  var innerHTML = markup.substring(htmlOpenTagEnd, htmlCloseTagStart);

  // Now for the fun stuff. Pass through both sets of attributes and
  // bring them up-to-date. We get the new set by creating a markup
  // fragment.
  var shouldExtractAttributes = htmlOpenTag.indexOf(' ') > -1;
  var attributeHolder = null;

  if (shouldExtractAttributes) {
    // We extract the attributes by creating a <span> and evaluating
    // the node.
    attributeHolder = createNodesFromMarkup(
      htmlOpenTag.replace('html ', 'span ') + '</span>'
    )[0];

    // Add all attributes present in attributeHolder
    var attributesToSet = filterAttributes(
      attributeHolder,
      function(attr) {
        return node.getAttributeNS(attr.namespaceURI, attr.name) !== attr.value;
      }
    );
    attributesToSet.forEach(function(attr) {
      node.setAttributeNS(attr.namespaceURI, attr.name, attr.value);
    });
  }

  // Remove all attributes not present in attributeHolder
  var attributesToRemove = filterAttributes(
    node,
    function(attr) {
      // Remove all attributes if attributeHolder is null or if it does not have
      // the desired attribute.
      return !(
        attributeHolder &&
          attributeHolder.hasAttributeNS(attr.namespaceURI, attr.name)
      );
    }
  );
  attributesToRemove.forEach(function(attr) {
    node.removeAttributeNS(attr.namespaceURI, attr.name);
  });

  // Finally, set the inner HTML. No tricks needed. Do this last to
  // minimize likelihood of triggering reflows.
  node.innerHTML = innerHTML;
}

module.exports = mutateHTMLNodeWithMarkup;
