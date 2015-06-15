"use strict";
var util = require('util');
var cssstyle = require('../lib/CSSStyleDeclaration');

var camelToDashed = require('../lib/parsers').camelToDashed;

/**
 *  These are the required properties
 *  see http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSS2Properties
 **/
var properties = [ 'azimuth', 'background', 'backgroundAttachment', 'backgroundColor', 'backgroundImage', 'backgroundPosition', 'backgroundRepeat', 'border', 'borderCollapse', 'borderColor', 'borderSpacing', 'borderStyle', 'borderTop', 'borderRight', 'borderBottom', 'borderLeft', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderWidth', 'bottom', 'captionSide', 'clear', 'clip', 'color', 'content', 'counterIncrement', 'counterReset', 'cue', 'cueAfter', 'cueBefore', 'cursor', 'direction', 'display', 'elevation', 'emptyCells', 'cssFloat', 'font', 'fontFamily', 'fontSize', 'fontSizeAdjust', 'fontStretch', 'fontStyle', 'fontVariant', 'fontWeight', 'height', 'left', 'letterSpacing', 'lineHeight', 'listStyle', 'listStyleImage', 'listStylePosition', 'listStyleType', 'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'markerOffset', 'marks', 'maxHeight', 'maxWidth', 'minHeight', 'minWidth', 'orphans', 'outline', 'outlineColor', 'outlineStyle', 'outlineWidth', 'overflow', 'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'page', 'pageBreakAfter', 'pageBreakBefore', 'pageBreakInside', 'pause', 'pauseAfter', 'pauseBefore', 'pitch', 'pitchRange', 'playDuring', 'position', 'quotes', 'richness', 'right', 'size', 'speak', 'speakHeader', 'speakNumeral', 'speakPunctuation', 'speechRate', 'stress', 'tableLayout', 'textAlign', 'textDecoration', 'textIndent', 'textShadow', 'textTransform', 'top', 'unicodeBidi', 'verticalAlign', 'visibility', 'voiceFamily', 'volume', 'whiteSpace', 'widows', 'width', 'wordSpacing', 'zIndex'];
var dashed_properties = properties.map(function (property) {
    return camelToDashed(property);
});

module.exports = {
    'Verify Has Properties': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(properties.length * 2);
        properties.forEach(function (property) {
            test.ok(style.__lookupGetter__(property), 'missing ' + property + ' property');
            test.ok(style.__lookupSetter__(property), 'missing ' + property + ' property');
        });
        test.done();
    },
    'Verify Has Dashed Properties': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(dashed_properties.length * 2);
        dashed_properties.forEach(function (property) {
            test.ok(style.__lookupGetter__(property), 'missing ' + property + ' property');
            test.ok(style.__lookupSetter__(property), 'missing ' + property + ' property');
        });
        test.done();
    },
    'Verify Has Functions': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(6);
        test.ok(typeof style.getPropertyValue === 'function', 'missing getPropertyValue()');
        test.ok(typeof style.getPropertyCSSValue === 'function', 'missing getPropertyCSSValue()');
        test.ok(typeof style.removeProperty === 'function', 'missing removeProperty()');
        test.ok(typeof style.getPropertyPriority === 'function', 'missing getPropertyPriority()');
        test.ok(typeof style.setProperty === 'function', 'missing setProperty()');
        test.ok(typeof style.item === 'function', 'missing item()');
        test.done();
    },
    'Verify Has Special Properties': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(5);
        test.ok(style.__lookupGetter__('cssText'), 'missing cssText getter');
        test.ok(style.__lookupSetter__('cssText'), 'missing cssText setter');
        test.ok(style.__lookupGetter__('length'), 'missing length getter');
        test.ok(style.__lookupSetter__('length'), 'missing length setter');
        test.ok(style.__lookupGetter__('parentRule'), 'missing parentRule getter');
        test.done();
    },
    'Test From Style String': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(8);
        style.cssText = 'color: blue; background-color: red; width: 78%';
        test.ok(3 === style.length, 'length is not 3');
        test.ok('color: blue; background-color: red; width: 78%;' === style.cssText, 'cssText is wrong');
        test.ok('blue' === style.getPropertyValue('color'), "getPropertyValue('color') failed");
        test.ok('color' === style.item(0), 'item(0) failed');
        test.ok('background-color' === style[1], 'style[1] failed');
        test.ok('red' === style.backgroundColor, 'style.backgroundColor failed with "' + style.backgroundColor + '"');
        style.cssText = '';
        test.ok('' === style.cssText, 'cssText is not empty');
        test.ok(0 === style.length, 'length is not 0');
        test.done();
    },
    'Test From Properties': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(11);
        style.color = 'blue';
        test.ok(1 === style.length, 'length is not 1');
        test.ok('color' === style[0], 'style[0] is not color');
        test.ok('color: blue;' === style.cssText, 'cssText is wrong');
        test.ok('color' === style.item(0), 'item(0) is not color');
        test.ok('blue' === style.color, 'color is not blue');
        style.backgroundColor = 'red';
        test.ok(2 === style.length, 'length is not 2');
        test.ok('color' === style[0], 'style[0] is not color');
        test.ok('background-color' === style[1], 'style[1] is not background-color');
        test.ok('color: blue; background-color: red;' === style.cssText, 'cssText is wrong');
        test.ok('red' === style.backgroundColor, 'backgroundColor is not red');
        style.removeProperty('color');
        test.ok('background-color' === style[0], 'style[0] is not background-color');
        test.done();
    },
    'Test Shorthand Properties': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(11);
        style.background = 'blue url(http://www.example.com/some_img.jpg)';
        test.ok('blue' === style.backgroundColor, 'backgroundColor is not blue');
        test.ok('url(http://www.example.com/some_img.jpg)' === style.backgroundImage, 'backgroundImage is wrong');
        test.ok('blue url(http://www.example.com/some_img.jpg)' === style.background, 'background is different');
        style.border = '0 solid black';
        test.ok('0px' === style.borderWidth, 'borderWidth is not 0px');
        test.ok('solid' === style.borderStyle, 'borderStyle is not solid');
        test.ok('black' === style.borderColor, 'borderColor is not black');
        test.ok('0px' === style.borderTopWidth, 'borderTopWidth is not 0px');
        test.ok('solid' === style.borderLeftStyle, 'borderLeftStyle is not solid');
        test.ok('black' === style.borderBottomColor, 'borderBottomColor is not black');
        style.font = '12em monospace';
        test.ok('12em' === style.fontSize, 'fontSize is not 12em');
        test.ok('monospace' === style.fontFamily, 'fontFamily is not monospace');
        test.done();
    },
    'Test width and height Properties and null and empty strings': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(7);
        style.height = 6;
        test.ok('' === style.height, 'height does not remain unset');
        style.width = 0;
        test.ok('0px' === style.width, 'width is not 0px');
        style.height = '34%';
        test.ok('34%' === style.height, 'height is not 34%');
        style.height = '';
        test.ok(style.length === 1, 'length is not 1');
        test.ok('width: 0px;' === style.cssText, 'cssText is not "width: 0px;"');
        style.width = null;
        test.ok(style.length === 0, 'length is not 0');
        test.ok('' === style.cssText, 'cssText is not empty string');
        test.done();
    },
    'Test Implicit Properties': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(7);
        style.borderWidth = 0;
        test.ok(1 === style.length, 'length is not 1');
        test.ok('0px' === style.borderWidth, 'borderWidth is not 0px');
        test.ok('0px' === style.borderTopWidth, 'borderTopWidth is not 0px');
        test.ok('0px' === style.borderBottomWidth, 'borderBottomWidth is not 0px');
        test.ok('0px' === style.borderLeftWidth, 'borderLeftWidth is not 0px');
        test.ok('0px' === style.borderRightWidth, 'borderRightWidth is not 0px');
        test.ok('border-width: 0px;' === style.cssText, 'cssText is not "border-width: 0px", "' + style.cssText + '"');
        test.done();
    },
    'Test Top, Left, Right, Bottom Properties': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(6);
        style.top = 0;
        style.left = '0%';
        style.right = '5em';
        style.bottom = '12pt';
        test.ok('0px' === style.top, 'top is not 0px');
        test.ok('0%' === style.left, 'left is not 0%');
        test.ok('5em' === style.right, 'right is not 5em');
        test.ok('12pt' === style.bottom, 'bottom is not 12pt');
        test.ok(4 === style.length, 'length is not 4');
        test.ok('top: 0px; left: 0%; right: 5em; bottom: 12pt;' === style.cssText, 'text is not "top: 0px; left: 0%; right: 5em; bottom: 12pt;"');
        test.done();
    },
    'Test Clear and Clip Properties': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(10);
        style.clear = 'none';
        test.ok('none' === style.clear, 'clear is not none');
        style.clear = 'lfet';   // intentionally wrong
        test.ok('none' === style.clear, 'clear is not still none');
        style.clear = 'left';
        test.ok('left' === style.clear, 'clear is not left');
        style.clear = 'right';
        test.ok('right' === style.clear, 'clear is not right');
        style.clear = 'both';
        test.ok('both' === style.clear, 'clear is not both');
        style.clip = 'elipse(5px, 10px)';
        test.ok('' === style.clip, 'clip should not be set');
        test.ok(1 === style.length, 'length is not 1');
        style.clip = 'rect(0, 3Em, 2pt, 50%)';
        test.ok('rect(0px, 3em, 2pt, 50%)' === style.clip, 'clip is not "rect(0px, 3em, 2pt, 50%)", "' + style.clip + '"');
        test.ok(2 === style.length, 'length is not 2');
        test.ok('clear: both; clip: rect(0px, 3em, 2pt, 50%);' === style.cssText, 'cssText is not "clear: both; clip: rect(0px, 3em, 2pt, 50%);"');
        test.done();
    },
    'Test colors': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(4);
        style.color = 'rgba(0,0,0,0)';
        test.ok('rgba(0, 0, 0, 0)' === style.color, 'color is not rgba(0, 0, 0, 0)');
        style.color = 'rgba(5%, 10%, 20%, 0.4)';
        test.ok('rgba(12, 25, 51, 0.4)' === style.color, 'color is not rgba(12, 25, 51, 0.4)');
        style.color = 'rgb(33%, 34%, 33%)';
        test.ok('rgb(84, 86, 84)' === style.color, 'color is not rgb(84, 86, 84)');
        style.color = 'rgba(300, 200, 100, 1.5)';
        test.ok('rgb(255, 200, 100)' === style.color, 'color is not rgb(255, 200, 100) ' + style.color);
        test.done();
    },
    'Test short hand properties with embedded spaces': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(3);
        style.background = 'rgb(0, 0, 0) url(/something/somewhere.jpg)';
        test.ok('rgb(0, 0, 0)' === style.backgroundColor, 'backgroundColor is not rgb(0, 0, 0): ' + style.backgroundColor);
        test.ok('url(/something/somewhere.jpg)' === style.backgroundImage, 'backgroundImage is not url(/something/somewhere.jpg): ' + style.backgroundImage);
        test.ok('background: rgb(0, 0, 0) url(/something/somewhere.jpg);' === style.cssText, 'cssText is not correct: ' + style.cssText);
        test.done();
    },
    'Setting shorthand properties to an empty string should clear all dependent properties': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(2);
        style.borderWidth = '1px';
        test.ok('border-width: 1px;' === style.cssText, 'cssText is not "border-width: 1px;": ' + style.cssText);
        style.border = '';
        test.ok('' === style.cssText, 'cssText is not "": ' + style.cssText);
        test.done();
    },
    'Setting implicit properties to an empty string should clear all dependent properties': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(2);
        style.borderTopWidth = '1px';
        test.ok('border-top-width: 1px;' === style.cssText, 'cssText is not "border-top-width: 1px;": ' + style.cssText);
        style.borderWidth = '';
        test.ok('' === style.cssText, 'cssText is not "": ' + style.cssText);
        test.done();
    },
    'Setting a shorthand property, whose shorthands are implicit properties, to an empty string should clear all dependent properties': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(4);
        style.borderTopWidth = '1px';
        test.ok('border-top-width: 1px;' === style.cssText, 'cssText is not "border-top-width: 1px;": ' + style.cssText);
        style.border = '';
        test.ok('' === style.cssText, 'cssText is not "": ' + style.cssText);
        style.borderTop = '1px solid black';
        test.ok('border-top: 1px solid black;' === style.cssText, 'cssText is not "border-top: 1px solid black;": ' + style.cssText);
        style.border = '';
        test.ok('' === style.cssText, 'cssText is not "": ' + style.cssText);
        test.done();
    },
    'Setting border values to "none" should clear dependent values': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(8);
        style.borderTopWidth = '1px';
        test.ok('border-top-width: 1px;' === style.cssText, 'cssText is not "border-top-width: 1px;": ' + style.cssText);
        style.border = 'none';
        test.ok('' === style.cssText, 'cssText is not "": ' + style.cssText);
        style.borderTopWidth = '1px';
        test.ok('border-top-width: 1px;' === style.cssText, 'cssText is not "border-top-width: 1px;": ' + style.cssText);
        style.borderTopStyle = 'none';
        test.ok('' === style.cssText, 'cssText is not "": ' + style.cssText);
        style.borderTopWidth = '1px';
        test.ok('border-top-width: 1px;' === style.cssText, 'cssText is not "border-top-width: 1px;": ' + style.cssText);
        style.borderTop = 'none';
        test.ok('' === style.cssText, 'cssText is not "": ' + style.cssText);
        style.borderTopWidth = '1px';
        style.borderLeftWidth = '1px';
        test.ok('border-top-width: 1px; border-left-width: 1px;' === style.cssText, 'cssText is not "border-top-width: 1px; border-left-width: 1px;": ' + style.cssText);
        style.borderTop = 'none';
        test.ok('border-left-width: 1px;' === style.cssText, 'cssText is not "border-left-width: 1px;": ' + style.cssText);
        test.done();
    },
    'Setting border to 0 should be okay': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(1);
        style.border = 0;
        test.ok('border: 0px;' === style.cssText, 'cssText is not "border: 0px;": ' + style.cssText);
        test.done();
    },
    'Setting values implicit and shorthand properties via cssText and setProperty should propagate to dependent properties': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(4);
        style.cssText = 'border: 1px solid black;';
        test.ok('border: 1px solid black;' === style.cssText, 'cssText is not "border: 1px solid black;": ' + style.cssText);
        test.ok('1px solid black' === style.borderTop, 'borderTop is not "1px solid black": ' + style.borderTop);
        style.border = '';
        test.ok('' === style.cssText, 'cssText is not "": ' + style.cssText);
        style.setProperty('border', '1px solid black');
        test.ok('border: 1px solid black;' === style.cssText, 'cssText is not "border: 1px solid black;": ' + style.cssText);
        test.done();
    },
    'Setting opacity should work': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(3);
        style.setProperty('opacity', 0.75);
        test.ok('opacity: 0.75;' === style.cssText, 'cssText is not "opacity: 0.75;": ' + style.cssText);
        style.opacity = '0.50';
        test.ok('opacity: 0.5;' === style.cssText, 'cssText is not "opacity: 0.5;": ' + style.cssText);
        style.opacity = 1.0;
        test.ok('opacity: 1;' === style.cssText, 'cssText is not "opacity: 1;": ' + style.cssText);
        test.done();
    },
    'Setting a value to 0 should return the string value': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(1);
        style.setProperty('fill-opacity', 0);
        test.ok('0' === style.fillOpacity, 'fillOpacity is not "0": ' + style.fillOpacity);
        test.done();
    },
    'onChange callback should be called when the cssText changes': function (test) {
        var style = new cssstyle.CSSStyleDeclaration(function (cssText) {
            test.ok('opacity: 0;' === cssText, 'cssText is not "opacity: 0;": ' + cssText);
            test.done();
        });
        test.expect(1);
        style.setProperty('opacity', 0);
    },
    'Setting float should work the same as cssFloat': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(1);
        style.float = 'left';
        test.ok('left' === style.cssFloat, 'cssFloat is not "left": ' + style.cssFloat);
        test.done();
    },
    'Setting improper css to cssText should not throw': function (test) {
        var style = new cssstyle.CSSStyleDeclaration();
        test.expect(2);
        style.cssText = 'color: ';
        test.ok('' === style.cssText, 'cssText wasn\'t cleared: ' + style.cssText);
        style.color = 'black';
        style.cssText = 'float: ';
        test.ok('' === style.cssText, 'cssText wasn\'t cleared: ' + style.cssText);
        test.done();
    }
};
