import {ComponentResolver, Type} from '@angular/core';

export * from './template_ast';
export {TEMPLATE_TRANSFORMS} from './template_parser';
export {CompilerConfig, RenderTypes} from './config';
export * from './compile_metadata';
export * from './offline_compiler';
export {RuntimeCompiler} from './runtime_compiler';
export * from './url_resolver';
export * from './xhr';

export {ViewResolver} from './view_resolver';
export {DirectiveResolver} from './directive_resolver';
export {PipeResolver} from './pipe_resolver';

import {TemplateParser} from './template_parser';
import {HtmlParser} from './html_parser';
import {DirectiveNormalizer} from './directive_normalizer';
import {CompileMetadataResolver} from './metadata_resolver';
import {StyleCompiler} from './style_compiler';
import {ViewCompiler} from './view_compiler/view_compiler';
import {CompilerConfig} from './config';
import {RuntimeCompiler} from './runtime_compiler';
import {ElementSchemaRegistry} from './schema/element_schema_registry';
import {DomElementSchemaRegistry} from './schema/dom_element_schema_registry';
import {UrlResolver, DEFAULT_PACKAGE_URL_PROVIDER} from './url_resolver';
import {Parser} from './expression_parser/parser';
import {Lexer} from './expression_parser/lexer';
import {ViewResolver} from './view_resolver';
import {DirectiveResolver} from './directive_resolver';
import {PipeResolver} from './pipe_resolver';

/**
 * A set of providers that provide `RuntimeCompiler` and its dependencies to use for
 * template compilation.
 */
export const COMPILER_PROVIDERS: Array<any|Type|{[k: string]: any}|any[]> =
    /*@ts2dart_const*/[
      Lexer, Parser, HtmlParser, TemplateParser, DirectiveNormalizer, CompileMetadataResolver,
      DEFAULT_PACKAGE_URL_PROVIDER, StyleCompiler, ViewCompiler,
      /*@ts2dart_Provider*/ {provide: CompilerConfig, useValue: new CompilerConfig()},
      RuntimeCompiler,
      /*@ts2dart_Provider*/ {provide: ComponentResolver, useExisting: RuntimeCompiler},
      DomElementSchemaRegistry,
      /*@ts2dart_Provider*/ {provide: ElementSchemaRegistry, useExisting: DomElementSchemaRegistry},
      UrlResolver, ViewResolver, DirectiveResolver, PipeResolver
    ];
