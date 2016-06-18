import {Injectable, ViewEncapsulation} from '@angular/core';

import {isPresent} from '../src/facade/lang';

import {CompileDirectiveMetadata, CompileIdentifierMetadata} from './compile_metadata';
import * as o from './output/output_ast';
import {ShadowCss} from './shadow_css';
import {extractStyleUrls} from './style_url_resolver';
import {UrlResolver} from './url_resolver';

const COMPONENT_VARIABLE = '%COMP%';
const HOST_ATTR = /*@ts2dart_const*/ `_nghost-${COMPONENT_VARIABLE}`;
const CONTENT_ATTR = /*@ts2dart_const*/ `_ngcontent-${COMPONENT_VARIABLE}`;

export class StylesCompileDependency {
  constructor(
      public moduleUrl: string, public isShimmed: boolean,
      public valuePlaceholder: CompileIdentifierMetadata) {}
}

export class StylesCompileResult {
  constructor(
      public statements: o.Statement[], public stylesVar: string,
      public dependencies: StylesCompileDependency[]) {}
}

@Injectable()
export class StyleCompiler {
  private _shadowCss: ShadowCss = new ShadowCss();

  constructor(private _urlResolver: UrlResolver) {}

  compileComponent(comp: CompileDirectiveMetadata): StylesCompileResult {
    var shim = comp.template.encapsulation === ViewEncapsulation.Emulated;
    return this._compileStyles(
        getStylesVarName(comp), comp.template.styles, comp.template.styleUrls, shim);
  }

  compileStylesheet(stylesheetUrl: string, cssText: string, isShimmed: boolean):
      StylesCompileResult {
    var styleWithImports = extractStyleUrls(this._urlResolver, stylesheetUrl, cssText);
    return this._compileStyles(
        getStylesVarName(null), [styleWithImports.style], styleWithImports.styleUrls, isShimmed);
  }

  private _compileStyles(
      stylesVar: string, plainStyles: string[], absUrls: string[],
      shim: boolean): StylesCompileResult {
    var styleExpressions =
        plainStyles.map(plainStyle => o.literal(this._shimIfNeeded(plainStyle, shim)));
    var dependencies: StylesCompileDependency[] = [];
    for (var i = 0; i < absUrls.length; i++) {
      var identifier = new CompileIdentifierMetadata({name: getStylesVarName(null)});
      dependencies.push(new StylesCompileDependency(absUrls[i], shim, identifier));
      styleExpressions.push(new o.ExternalExpr(identifier));
    }
    // styles variable contains plain strings and arrays of other styles arrays (recursive),
    // so we set its type to dynamic.
    var stmt = o.variable(stylesVar)
                   .set(o.literalArr(
                       styleExpressions, new o.ArrayType(o.DYNAMIC_TYPE, [o.TypeModifier.Const])))
                   .toDeclStmt(null, [o.StmtModifier.Final]);
    return new StylesCompileResult([stmt], stylesVar, dependencies);
  }

  private _shimIfNeeded(style: string, shim: boolean): string {
    return shim ? this._shadowCss.shimCssText(style, CONTENT_ATTR, HOST_ATTR) : style;
  }
}

function getStylesVarName(component: CompileDirectiveMetadata): string {
  var result = `styles`;
  if (isPresent(component)) {
    result += `_${component.type.name}`;
  }
  return result;
}
