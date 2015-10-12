/**
 * Copyright 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactClassNameGenerator
 */

 'use strict';

 var defaults = {
   elementSeperator: '__',
   modSeperator: '--',
   modValueSeperator: '-',
   classSeperator: ' ',
   bemEnabled: false,
 };

 function ReactClassNameGenerator(options) {
   if (!(this instanceof ReactClassNameGenerator)) {
     return getReactClassNameGeneratorInstance(options);
   }
   options = options || {};
   this.elementSeperator = options.elementSeperator || defaults.elementSeperator;
   this.modSeperator = options.modSeperator || defaults.modSeperator;
   this.modValueSeperator = options.modValueSeperator || defaults.modValueSeperator;
   this.classSeperator = options.classSeperator || defaults.classSeperator;
   this.bemEnabled = typeof options.bemEnabled === 'boolean' ? options.bemEnabled : defaults.bemEnabled;
   return this.generateBlockClassNames.bind(this);
 }

 ReactClassNameGenerator.prototype = {

   _createModifier: function(base, modifierKey, modifierValue) {
     if (modifierValue) {
       var bemPrefix = this.bemEnabled ? base + this.modSeperator : '';
       return this.classSeperator + bemPrefix + modifierKey;
     } else {
       return '';
     }
   },
   _generateModifiers: function(base, modifiersList) {
     modifiersList = modifiersList || {};
     var modifierClassString = '';
     Object.getOwnPropertyNames(modifiersList).forEach(function(modifier) {
       if (typeof modifiersList[modifier] === 'boolean') {
         modifierClassString += this._createModifier(base, modifier, modifiersList[modifier]);
       } else {
         const baseClassName = this.bemEnabled ? base + this.modSeperator : '';
         modifierClassString += this.classSeperator + baseClassName + modifier + this.modValueSeperator + modifiersList[modifier];
       }
     }.bind(this));
     return modifierClassString;
   },
   _generateElement: function(base, el, generatedElementsObject, elementObject) {
     var elementName = el.name;
     var bemPrefix = this.bemEnabled ? base + this.elementSeperator : '';
     el.name = bemPrefix + el.name;
     var generatedBlock = this.generateBlockClassNames(el);
     try {
       elementName = generatedElementsObject.hasOwnProperty(elementName) && el.alias ? el.alias : elementName;
       Object.defineProperty(generatedElementsObject, elementName, {
         value: generatedBlock,
       });
       Object.defineProperty(elementObject.prototype, elementName, { value: generatedBlock});
     } catch (ex) {
       if (ex.message.indexOf('Cannot redefine property') > -1) {
         var errorReason = el.alias ? 'alias: ' + el.alias : 'element name: "' + el.name + '" please use alias to support duplicate element names';
         throw new TypeError('Element classNames and aliases cannot have duplicate values. Trying to assign duplicate ' + errorReason + ' check configuration Object');
       }
     }


     return generatedElementsObject;
   },
   _generateElementList: function(b, elementObject) {
     var base = b.name;
     var elementList = b.elements;
     var generatedElementsObject = {};
     if (elementList) {
       elementList.forEach(function(el) {
         generatedElementsObject = this._generateElement(base, el, generatedElementsObject, elementObject);
       }.bind(this));
     }

     return generatedElementsObject;
   },
   _generateBlockName: function(b) {
     return b.name + this._generateModifiers(b.name, b.modifiers);
   },


   generateBlockClassNames: function(block) {
     var b = block;
     var self = this;
     var Element = function() {
       this.elements = self._generateElementList(b, Element);
       this.modifiers = block.modifiers;
     };

     Element.prototype.toString = function() {
       return this.name;
     };

     Object.defineProperty(Element.prototype, 'name', { get: function() {
       return self._generateBlockName(b);
     }});


     return new Element();
   },
 };

 function getReactClassNameGeneratorInstance(options) {
   var classNameGenerator = new ReactClassNameGenerator(options);
   return classNameGenerator;
 }

 var ClassNameGenerator = getReactClassNameGeneratorInstance();
 ClassNameGenerator.config = ReactClassNameGenerator;


 module.exports = ClassNameGenerator;
