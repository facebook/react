import {Injectable} from '@angular/core';

import {SecurityContext} from '../../core_private';
import {StringMapWrapper} from '../facade/collection';
import {isPresent} from '../facade/lang';

import {SECURITY_SCHEMA} from './dom_security_schema';
import {ElementSchemaRegistry} from './element_schema_registry';

const EVENT = 'event';
const BOOLEAN = 'boolean';
const NUMBER = 'number';
const STRING = 'string';
const OBJECT = 'object';

/**
 * This array represents the DOM schema. It encodes inheritance, properties, and events.
 *
 * ## Overview
 *
 * Each line represents one kind of element. The `element_inheritance` and properties are joined
 * using `element_inheritance|preperties` syntax.
 *
 * ## Element Inheritance
 *
 * The `element_inheritance` can be further subdivided as `element1,element2,...^parentElement`.
 * Here the individual elements are separated by `,` (commas). Every element in the list
 * has identical properties.
 *
 * An `element` may inherit additional properties from `parentElement` If no `^parentElement` is
 * specified then `""` (blank) element is assumed.
 *
 * NOTE: The blank element inherits from root `*` element, the super element of all elements.
 *
 * NOTE an element prefix such as `:svg:` has no special meaning to the schema.
 *
 * ## Properties
 *
 * Each element has a set of properties separated by `,` (commas). Each property can be prefixed
 * by a special character designating its type:
 *
 * - (no prefix): property is a string.
 * - `*`: property represents an event.
 * - `!`: property is a boolean.
 * - `#`: property is a number.
 * - `%`: property is an object.
 *
 * ## Query
 *
 * The class creates an internal squas representaino which allows to easily answer the query of
 * if a given property exist on a given element.
 *
 * NOTE: We don't yet support querying for types or events.
 * NOTE: This schema is auto extracted from `schema_extractor.ts` located in the test folder,
 *       see dom_element_schema_registry_spec.ts
 */

// =================================================================================================
// =================================================================================================
// =========== S T O P   -  S T O P   -  S T O P   -  S T O P   -  S T O P   -  S T O P  ===========
// =================================================================================================
// =================================================================================================
//
//                       DO NOT EDIT THIS DOM SCHEMA WITHOUT A SECURITY REVIEW!
//
// Newly added properties must be security reviewed and assigned an appropriate SecurityContext in
// dom_security_schema.ts. Reach out to mprobst & rjamet for details.
//
// =================================================================================================

const SCHEMA: string[] =
    /*@ts2dart_const*/ ([
      '*|textContent,%classList,className,id,innerHTML,*beforecopy,*beforecut,*beforepaste,*copy,*cut,*paste,*search,*selectstart,*webkitfullscreenchange,*webkitfullscreenerror,*wheel,outerHTML,#scrollLeft,#scrollTop',
      '^*|accessKey,contentEditable,dir,!draggable,!hidden,innerText,lang,*abort,*autocomplete,*autocompleteerror,*beforecopy,*beforecut,*beforepaste,*blur,*cancel,*canplay,*canplaythrough,*change,*click,*close,*contextmenu,*copy,*cuechange,*cut,*dblclick,*drag,*dragend,*dragenter,*dragleave,*dragover,*dragstart,*drop,*durationchange,*emptied,*ended,*error,*focus,*input,*invalid,*keydown,*keypress,*keyup,*load,*loadeddata,*loadedmetadata,*loadstart,*message,*mousedown,*mouseenter,*mouseleave,*mousemove,*mouseout,*mouseover,*mouseup,*mousewheel,*mozfullscreenchange,*mozfullscreenerror,*mozpointerlockchange,*mozpointerlockerror,*paste,*pause,*play,*playing,*progress,*ratechange,*reset,*resize,*scroll,*search,*seeked,*seeking,*select,*selectstart,*show,*stalled,*submit,*suspend,*timeupdate,*toggle,*volumechange,*waiting,*webglcontextcreationerror,*webglcontextlost,*webglcontextrestored,*webkitfullscreenchange,*webkitfullscreenerror,*wheel,outerText,!spellcheck,%style,#tabIndex,title,!translate',
      'media|!autoplay,!controls,%crossOrigin,#currentTime,!defaultMuted,#defaultPlaybackRate,!disableRemotePlayback,!loop,!muted,*encrypted,#playbackRate,preload,src,#volume',
      ':svg:^*|*abort,*autocomplete,*autocompleteerror,*blur,*cancel,*canplay,*canplaythrough,*change,*click,*close,*contextmenu,*cuechange,*dblclick,*drag,*dragend,*dragenter,*dragleave,*dragover,*dragstart,*drop,*durationchange,*emptied,*ended,*error,*focus,*input,*invalid,*keydown,*keypress,*keyup,*load,*loadeddata,*loadedmetadata,*loadstart,*mousedown,*mouseenter,*mouseleave,*mousemove,*mouseout,*mouseover,*mouseup,*mousewheel,*pause,*play,*playing,*progress,*ratechange,*reset,*resize,*scroll,*seeked,*seeking,*select,*show,*stalled,*submit,*suspend,*timeupdate,*toggle,*volumechange,*waiting,%style,#tabIndex',
      ':svg:graphics^:svg:|',
      ':svg:animation^:svg:|*begin,*end,*repeat',
      ':svg:geometry^:svg:|',
      ':svg:componentTransferFunction^:svg:|',
      ':svg:gradient^:svg:|',
      ':svg:textContent^:svg:graphics|',
      ':svg:textPositioning^:svg:textContent|',
      'a|charset,coords,download,hash,host,hostname,href,hreflang,name,password,pathname,ping,port,protocol,referrerpolicy,rel,rev,search,shape,target,text,type,username',
      'area|alt,coords,hash,host,hostname,href,!noHref,password,pathname,ping,port,protocol,referrerpolicy,search,shape,target,username',
      'audio^media|',
      'br|clear',
      'base|href,target',
      'body|aLink,background,bgColor,link,*beforeunload,*blur,*error,*focus,*hashchange,*languagechange,*load,*message,*offline,*online,*pagehide,*pageshow,*popstate,*rejectionhandled,*resize,*scroll,*storage,*unhandledrejection,*unload,text,vLink',
      'button|!autofocus,!disabled,formAction,formEnctype,formMethod,!formNoValidate,formTarget,name,type,value',
      'canvas|#height,#width',
      'content|select',
      'dl|!compact',
      'datalist|',
      'details|!open',
      'dialog|!open,returnValue',
      'dir|!compact',
      'div|align',
      'embed|align,height,name,src,type,width',
      'fieldset|!disabled,name',
      'font|color,face,size',
      'form|acceptCharset,action,autocomplete,encoding,enctype,method,name,!noValidate,target',
      'frame|frameBorder,longDesc,marginHeight,marginWidth,name,!noResize,scrolling,src',
      'frameset|cols,*beforeunload,*blur,*error,*focus,*hashchange,*languagechange,*load,*message,*offline,*online,*pagehide,*pageshow,*popstate,*rejectionhandled,*resize,*scroll,*storage,*unhandledrejection,*unload,rows',
      'hr|align,color,!noShade,size,width',
      'head|',
      'h1,h2,h3,h4,h5,h6|align',
      'html|version',
      'iframe|align,!allowFullscreen,frameBorder,height,longDesc,marginHeight,marginWidth,name,referrerpolicy,%sandbox,scrolling,src,srcdoc,width',
      'img|align,alt,border,%crossOrigin,#height,#hspace,!isMap,longDesc,lowsrc,name,referrerpolicy,sizes,src,srcset,useMap,#vspace,#width',
      'input|accept,align,alt,autocapitalize,autocomplete,!autofocus,!checked,!defaultChecked,defaultValue,dirName,!disabled,%files,formAction,formEnctype,formMethod,!formNoValidate,formTarget,#height,!incremental,!indeterminate,max,#maxLength,min,#minLength,!multiple,name,pattern,placeholder,!readOnly,!required,selectionDirection,#selectionEnd,#selectionStart,#size,src,step,type,useMap,value,%valueAsDate,#valueAsNumber,#width',
      'keygen|!autofocus,challenge,!disabled,keytype,name',
      'li|type,#value',
      'label|htmlFor',
      'legend|align',
      'link|as,charset,%crossOrigin,!disabled,href,hreflang,integrity,media,rel,%relList,rev,%sizes,target,type',
      'map|name',
      'marquee|behavior,bgColor,direction,height,#hspace,#loop,#scrollAmount,#scrollDelay,!trueSpeed,#vspace,width',
      'menu|!compact',
      'meta|content,httpEquiv,name,scheme',
      'meter|#high,#low,#max,#min,#optimum,#value',
      'ins,del|cite,dateTime',
      'ol|!compact,!reversed,#start,type',
      'object|align,archive,border,code,codeBase,codeType,data,!declare,height,#hspace,name,standby,type,useMap,#vspace,width',
      'optgroup|!disabled,label',
      'option|!defaultSelected,!disabled,label,!selected,text,value',
      'output|defaultValue,%htmlFor,name,value',
      'p|align',
      'param|name,type,value,valueType',
      'picture|',
      'pre|#width',
      'progress|#max,#value',
      'q,blockquote,cite|',
      'script|!async,charset,%crossOrigin,!defer,event,htmlFor,integrity,src,text,type',
      'select|!autofocus,!disabled,#length,!multiple,name,!required,#selectedIndex,#size,value',
      'shadow|',
      'source|media,sizes,src,srcset,type',
      'span|',
      'style|!disabled,media,type',
      'caption|align',
      'th,td|abbr,align,axis,bgColor,ch,chOff,#colSpan,headers,height,!noWrap,#rowSpan,scope,vAlign,width',
      'col,colgroup|align,ch,chOff,#span,vAlign,width',
      'table|align,bgColor,border,%caption,cellPadding,cellSpacing,frame,rules,summary,%tFoot,%tHead,width',
      'tr|align,bgColor,ch,chOff,vAlign',
      'tfoot,thead,tbody|align,ch,chOff,vAlign',
      'template|',
      'textarea|autocapitalize,!autofocus,#cols,defaultValue,dirName,!disabled,#maxLength,#minLength,name,placeholder,!readOnly,!required,#rows,selectionDirection,#selectionEnd,#selectionStart,value,wrap',
      'title|text',
      'track|!default,kind,label,src,srclang',
      'ul|!compact,type',
      'unknown|',
      'video^media|#height,poster,#width',
      ':svg:a^:svg:graphics|',
      ':svg:animate^:svg:animation|',
      ':svg:animateMotion^:svg:animation|',
      ':svg:animateTransform^:svg:animation|',
      ':svg:circle^:svg:geometry|',
      ':svg:clipPath^:svg:graphics|',
      ':svg:cursor^:svg:|',
      ':svg:defs^:svg:graphics|',
      ':svg:desc^:svg:|',
      ':svg:discard^:svg:|',
      ':svg:ellipse^:svg:geometry|',
      ':svg:feBlend^:svg:|',
      ':svg:feColorMatrix^:svg:|',
      ':svg:feComponentTransfer^:svg:|',
      ':svg:feComposite^:svg:|',
      ':svg:feConvolveMatrix^:svg:|',
      ':svg:feDiffuseLighting^:svg:|',
      ':svg:feDisplacementMap^:svg:|',
      ':svg:feDistantLight^:svg:|',
      ':svg:feDropShadow^:svg:|',
      ':svg:feFlood^:svg:|',
      ':svg:feFuncA^:svg:componentTransferFunction|',
      ':svg:feFuncB^:svg:componentTransferFunction|',
      ':svg:feFuncG^:svg:componentTransferFunction|',
      ':svg:feFuncR^:svg:componentTransferFunction|',
      ':svg:feGaussianBlur^:svg:|',
      ':svg:feImage^:svg:|',
      ':svg:feMerge^:svg:|',
      ':svg:feMergeNode^:svg:|',
      ':svg:feMorphology^:svg:|',
      ':svg:feOffset^:svg:|',
      ':svg:fePointLight^:svg:|',
      ':svg:feSpecularLighting^:svg:|',
      ':svg:feSpotLight^:svg:|',
      ':svg:feTile^:svg:|',
      ':svg:feTurbulence^:svg:|',
      ':svg:filter^:svg:|',
      ':svg:foreignObject^:svg:graphics|',
      ':svg:g^:svg:graphics|',
      ':svg:image^:svg:graphics|',
      ':svg:line^:svg:geometry|',
      ':svg:linearGradient^:svg:gradient|',
      ':svg:mpath^:svg:|',
      ':svg:marker^:svg:|',
      ':svg:mask^:svg:|',
      ':svg:metadata^:svg:|',
      ':svg:path^:svg:geometry|',
      ':svg:pattern^:svg:|',
      ':svg:polygon^:svg:geometry|',
      ':svg:polyline^:svg:geometry|',
      ':svg:radialGradient^:svg:gradient|',
      ':svg:rect^:svg:geometry|',
      ':svg:svg^:svg:graphics|#currentScale,#zoomAndPan',
      ':svg:script^:svg:|type',
      ':svg:set^:svg:animation|',
      ':svg:stop^:svg:|',
      ':svg:style^:svg:|!disabled,media,title,type',
      ':svg:switch^:svg:graphics|',
      ':svg:symbol^:svg:|',
      ':svg:tspan^:svg:textPositioning|',
      ':svg:text^:svg:textPositioning|',
      ':svg:textPath^:svg:textContent|',
      ':svg:title^:svg:|',
      ':svg:use^:svg:graphics|',
      ':svg:view^:svg:|#zoomAndPan',
    ]);

var attrToPropMap: {[name: string]: string} = <any>{
  'class': 'className',
  'formaction': 'formAction',
  'innerHtml': 'innerHTML',
  'readonly': 'readOnly',
  'tabindex': 'tabIndex'
};

@Injectable()
export class DomElementSchemaRegistry extends ElementSchemaRegistry {
  schema = <{[element: string]: {[property: string]: string}}>{};

  constructor() {
    super();
    SCHEMA.forEach(encodedType => {
      var parts = encodedType.split('|');
      var properties = parts[1].split(',');
      var typeParts = (parts[0] + '^').split('^');
      var typeName = typeParts[0];
      var type = <{[property: string]: string}>{};
      typeName.split(',').forEach(tag => this.schema[tag] = type);
      var superType = this.schema[typeParts[1]];
      if (isPresent(superType)) {
        StringMapWrapper.forEach(
            superType, (v: any /** TODO #9100 */, k: any /** TODO #9100 */) => type[k] = v);
      }
      properties.forEach((property: string) => {
        if (property == '') {
        } else if (property.startsWith('*')) {
          // We don't yet support events.
          // If ever allowing to bind to events, GO THROUGH A SECURITY REVIEW, allowing events will
          // almost certainly introduce bad XSS vulnerabilities.
          // type[property.substring(1)] = EVENT;
        } else if (property.startsWith('!')) {
          type[property.substring(1)] = BOOLEAN;
        } else if (property.startsWith('#')) {
          type[property.substring(1)] = NUMBER;
        } else if (property.startsWith('%')) {
          type[property.substring(1)] = OBJECT;
        } else {
          type[property] = STRING;
        }
      });
    });
  }

  hasProperty(tagName: string, propName: string): boolean {
    if (tagName.indexOf('-') !== -1) {
      if (tagName === 'ng-container' || tagName === 'ng-content') {
        return false;
      }

      // Can't tell now as we don't know which properties a custom element will get
      // once it is instantiated
      return true;
    } else {
      var elementProperties = this.schema[tagName.toLowerCase()];
      if (!isPresent(elementProperties)) {
        elementProperties = this.schema['unknown'];
      }
      return isPresent(elementProperties[propName]);
    }
  }

  /**
   * securityContext returns the security context for the given property on the given DOM tag.
   *
   * Tag and property name are statically known and cannot change at runtime, i.e. it is not
   * possible to bind a value into a changing attribute or tag name.
   *
   * The filtering is white list based. All attributes in the schema above are assumed to have the
   * 'NONE' security context, i.e. that they are safe inert string values. Only specific well known
   * attack vectors are assigned their appropriate context.
   */
  securityContext(tagName: string, propName: string): SecurityContext {
    // Make sure comparisons are case insensitive, so that case differences between attribute and
    // property names do not have a security impact.
    tagName = tagName.toLowerCase();
    propName = propName.toLowerCase();
    let ctx = SECURITY_SCHEMA[tagName + '|' + propName];
    if (ctx !== undefined) return ctx;
    ctx = SECURITY_SCHEMA['*|' + propName];
    return ctx !== undefined ? ctx : SecurityContext.NONE;
  }

  getMappedPropName(propName: string): string {
    var mappedPropName = StringMapWrapper.get(attrToPropMap, propName);
    return isPresent(mappedPropName) ? mappedPropName : propName;
  }
}
