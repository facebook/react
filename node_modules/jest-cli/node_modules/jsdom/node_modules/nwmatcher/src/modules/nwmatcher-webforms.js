/*
 * Copyright (C) 2007-2015 Diego Perini
 * All rights reserved.
 *
 * this is just a small example to show
 * how an extension for NWMatcher could be
 * adapted to handle WebForms/HTML5 selectors
 *
 * Pseudo Selectors
 * :default, :indeterminate, :optional, :required,
 * :valid, :invalid, :in-range, :out-of-range,
 * :read-only, :read-write
 * :has, :matches (not yet in a defined specification)
 *
 */

// for UI pseudo-classes extensions (WebForms/HTML5)
NW.Dom.registerSelector(
  'html5:pseudos',
  /^\:(default|indeterminate|optional|required|valid|invalid|in-range|out-of-range|read-only|read-write)(.*)/,
  (function(global) {

    return function(match, source) {

      var status = true,

      HTML5PseudoClasses = global.Object({
        'default': 4, 'indeterminate': 4, 'invalid': 4, 'valid': 4,
        'optional': 4, 'required': 4, 'read-write': 4, 'read-only': 4
      });

      switch (match[1]) {

        // HTML5 UI element states (form controls)
        case 'default':
          // only radio buttons, check boxes and option elements
          source = 'if(((typeof e.form!=="undefined"&&(/radio|checkbox/i).test(e.type))||/option/i.test(e.nodeName))&&(e.defaultChecked||e.defaultSelected)){' + source + '}';
          break;

        case 'indeterminate':
          // only radio buttons, check boxes and option elements
          source = 'if(typeof e.form!=="undefined"&&(/radio|checkbox/i).test(e.type)&&s.select("[checked]",e.form).length===0){' + source + '}';
          break;

        case 'optional':
          // only fields for which "required" applies
          source = 'if(typeof e.form!=="undefined"&&typeof e.required!="undefined"&&!e.required){' + source + '}';
          break;

        case 'required':
          // only fields for which "required" applies
          source = 'if(typeof e.form!=="undefined"&&typeof e.required!="undefined"&&e.required){' + source + '}';
          break;

        case 'read-write':
          // only fields for which "readOnly" applies
          source = 'if(typeof e.form!=="undefined"&&typeof e.readOnly!="undefined"&&!e.readOnly){' + source + '}';
          break;

        case 'read-only':
          // only fields for which "readOnly" applies
          source = 'if(typeof e.form!=="undefined"&&typeof e.readOnly!="undefined"&&e.readOnly){' + source + '}';
          break;

        case 'invalid':
          // only fields for which validity applies
          source = 'if(typeof e.form!=="undefined"&&typeof e.validity=="object"&&!e.validity.valid){' + source + '}';
          break;

        case 'valid':
          // only fields for which validity applies
          source = 'if(typeof e.form!=="undefined"&&typeof e.validity=="object"&&e.validity.valid){' + source + '}';
          break;

        case 'in-range':
          // only fields for which validity applies
          source = 'if(typeof e.form!=="undefined"&&' +
            '(s.getAttribute(e,"min")||s.getAttribute(e,"max"))&&' +
            'typeof e.validity=="object"&&!e.validity.typeMismatch&&' +
            '!e.validity.rangeUnderflow&&!e.validity.rangeOverflow){' + source + '}';
          break;

        case 'out-of-range':
          // only fields for which validity applies
          source = 'if(typeof e.form!=="undefined"&&' +
            '(s.getAttribute(e,"min")||s.getAttribute(e,"max"))&&' +
            'typeof e.validity=="object"&&(e.validity.rangeUnderflow||e.validity.rangeOverflow)){' + source + '}';
          break;

        default:
          status = false;
          break;

      }

      // compiler will add this to "source"
      return global.Object({
        'source': source,
        'status': status
      });

    };

  })(this));
