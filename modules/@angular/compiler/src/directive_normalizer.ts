import {Injectable, ViewEncapsulation} from '@angular/core';

import {PromiseWrapper} from '../src/facade/async';
import {BaseException} from '../src/facade/exceptions';
import {isBlank, isPresent} from '../src/facade/lang';

import {CompileTypeMetadata, CompileDirectiveMetadata, CompileTemplateMetadata,} from './compile_metadata';
import {XHR} from './xhr';
import {UrlResolver} from './url_resolver';
import {extractStyleUrls, isStyleUrlResolvable} from './style_url_resolver';

import {HtmlAstVisitor, HtmlElementAst, HtmlTextAst, HtmlAttrAst, HtmlCommentAst, HtmlExpansionAst, HtmlExpansionCaseAst, htmlVisitAll} from './html_ast';
import {HtmlParser} from './html_parser';
import {CompilerConfig} from './config';

import {preparseElement, PreparsedElementType} from './template_preparser';


@Injectable()
export class DirectiveNormalizer {
  constructor(
      private _xhr: XHR, private _urlResolver: UrlResolver, private _htmlParser: HtmlParser,
      private _config: CompilerConfig) {}

  normalizeDirective(directive: CompileDirectiveMetadata): Promise<CompileDirectiveMetadata> {
    if (!directive.isComponent) {
      // For non components there is nothing to be normalized yet.
      return PromiseWrapper.resolve(directive);
    }
    return this.normalizeTemplate(directive.type, directive.template)
        .then((normalizedTemplate: CompileTemplateMetadata) => new CompileDirectiveMetadata({
                type: directive.type,
                isComponent: directive.isComponent,
                selector: directive.selector,
                exportAs: directive.exportAs,
                changeDetection: directive.changeDetection,
                inputs: directive.inputs,
                outputs: directive.outputs,
                hostListeners: directive.hostListeners,
                hostProperties: directive.hostProperties,
                hostAttributes: directive.hostAttributes,
                lifecycleHooks: directive.lifecycleHooks,
                providers: directive.providers,
                viewProviders: directive.viewProviders,
                queries: directive.queries,
                viewQueries: directive.viewQueries,
                template: normalizedTemplate
              }));
  }

  normalizeTemplate(directiveType: CompileTypeMetadata, template: CompileTemplateMetadata):
      Promise<CompileTemplateMetadata> {
    if (isPresent(template.template)) {
      return PromiseWrapper.resolve(this.normalizeLoadedTemplate(
          directiveType, template, template.template, directiveType.moduleUrl));
    } else if (isPresent(template.templateUrl)) {
      var sourceAbsUrl = this._urlResolver.resolve(directiveType.moduleUrl, template.templateUrl);
      return this._xhr.get(sourceAbsUrl)
          .then(
              templateContent => this.normalizeLoadedTemplate(
                  directiveType, template, templateContent, sourceAbsUrl));
    } else {
      throw new BaseException(`No template specified for component ${directiveType.name}`);
    }
  }

  normalizeLoadedTemplate(
      directiveType: CompileTypeMetadata, templateMeta: CompileTemplateMetadata, template: string,
      templateAbsUrl: string): CompileTemplateMetadata {
    var rootNodesAndErrors = this._htmlParser.parse(template, directiveType.name);
    if (rootNodesAndErrors.errors.length > 0) {
      var errorString = rootNodesAndErrors.errors.join('\n');
      throw new BaseException(`Template parse errors:\n${errorString}`);
    }

    var visitor = new TemplatePreparseVisitor();
    htmlVisitAll(visitor, rootNodesAndErrors.rootNodes);
    var allStyles = templateMeta.styles.concat(visitor.styles);

    var allStyleAbsUrls =
        visitor.styleUrls.filter(isStyleUrlResolvable)
            .map(url => this._urlResolver.resolve(templateAbsUrl, url))
            .concat(templateMeta.styleUrls.filter(isStyleUrlResolvable)
                        .map(url => this._urlResolver.resolve(directiveType.moduleUrl, url)));

    var allResolvedStyles = allStyles.map(style => {
      var styleWithImports = extractStyleUrls(this._urlResolver, templateAbsUrl, style);
      styleWithImports.styleUrls.forEach(styleUrl => allStyleAbsUrls.push(styleUrl));
      return styleWithImports.style;
    });

    var encapsulation = templateMeta.encapsulation;
    if (isBlank(encapsulation)) {
      encapsulation = this._config.defaultEncapsulation;
    }
    if (encapsulation === ViewEncapsulation.Emulated && allResolvedStyles.length === 0 &&
        allStyleAbsUrls.length === 0) {
      encapsulation = ViewEncapsulation.None;
    }
    return new CompileTemplateMetadata({
      encapsulation: encapsulation,
      template: template,
      templateUrl: templateAbsUrl,
      styles: allResolvedStyles,
      styleUrls: allStyleAbsUrls,
      ngContentSelectors: visitor.ngContentSelectors,
      animations: templateMeta.animations
    });
  }
}

class TemplatePreparseVisitor implements HtmlAstVisitor {
  ngContentSelectors: string[] = [];
  styles: string[] = [];
  styleUrls: string[] = [];
  ngNonBindableStackCount: number = 0;

  visitElement(ast: HtmlElementAst, context: any): any {
    var preparsedElement = preparseElement(ast);
    switch (preparsedElement.type) {
      case PreparsedElementType.NG_CONTENT:
        if (this.ngNonBindableStackCount === 0) {
          this.ngContentSelectors.push(preparsedElement.selectAttr);
        }
        break;
      case PreparsedElementType.STYLE:
        var textContent = '';
        ast.children.forEach(child => {
          if (child instanceof HtmlTextAst) {
            textContent += (<HtmlTextAst>child).value;
          }
        });
        this.styles.push(textContent);
        break;
      case PreparsedElementType.STYLESHEET:
        this.styleUrls.push(preparsedElement.hrefAttr);
        break;
      default:
        // DDC reports this as error. See:
        // https://github.com/dart-lang/dev_compiler/issues/428
        break;
    }
    if (preparsedElement.nonBindable) {
      this.ngNonBindableStackCount++;
    }
    htmlVisitAll(this, ast.children);
    if (preparsedElement.nonBindable) {
      this.ngNonBindableStackCount--;
    }
    return null;
  }
  visitComment(ast: HtmlCommentAst, context: any): any { return null; }
  visitAttr(ast: HtmlAttrAst, context: any): any { return null; }
  visitText(ast: HtmlTextAst, context: any): any { return null; }
  visitExpansion(ast: HtmlExpansionAst, context: any): any { return null; }

  visitExpansionCase(ast: HtmlExpansionCaseAst, context: any): any { return null; }
}
