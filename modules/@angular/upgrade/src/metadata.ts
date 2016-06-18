import {DirectiveResolver} from '@angular/compiler';
import {DirectiveMetadata, Type} from '@angular/core';

var COMPONENT_SELECTOR = /^[\w|-]*$/;
var SKEWER_CASE = /-(\w)/g;
var directiveResolver = new DirectiveResolver();

export interface AttrProp {
  prop: string;
  attr: string;
  bracketAttr: string;
  bracketParenAttr: string;
  parenAttr: string;
  onAttr: string;
  bindAttr: string;
  bindonAttr: string;
}

export interface ComponentInfo {
  type: Type;
  selector: string;
  inputs: AttrProp[];
  outputs: AttrProp[];
}

export function getComponentInfo(type: Type): ComponentInfo {
  var resolvedMetadata: DirectiveMetadata = directiveResolver.resolve(type);
  var selector = resolvedMetadata.selector;
  if (!selector.match(COMPONENT_SELECTOR)) {
    throw new Error('Only selectors matching element names are supported, got: ' + selector);
  }
  var selector = selector.replace(
      SKEWER_CASE, (all: any /** TODO #9100 */, letter: string) => letter.toUpperCase());
  return {
    type: type,
    selector: selector,
    inputs: parseFields(resolvedMetadata.inputs),
    outputs: parseFields(resolvedMetadata.outputs)
  };
}

export function parseFields(names: string[]): AttrProp[] {
  var attrProps: AttrProp[] = [];
  if (names) {
    for (var i = 0; i < names.length; i++) {
      var parts = names[i].split(':');
      var prop = parts[0].trim();
      var attr = (parts[1] || parts[0]).trim();
      var capitalAttr = attr.charAt(0).toUpperCase() + attr.substr(1);
      attrProps.push(<AttrProp>{
        prop: prop,
        attr: attr,
        bracketAttr: `[${attr}]`,
        parenAttr: `(${attr})`,
        bracketParenAttr: `[(${attr})]`,
        onAttr: `on${capitalAttr}`,
        bindAttr: `bind${capitalAttr}`,
        bindonAttr: `bindon${capitalAttr}`
      });
    }
  }
  return attrProps;
}
