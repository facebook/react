import * as directive_normalizer from './src/directive_normalizer';
import * as lexer from './src/expression_parser/lexer';
import * as parser from './src/expression_parser/parser';
import * as html_parser from './src/html_parser';
import * as i18n_html_parser from './src/i18n/i18n_html_parser';
import * as i18n_message from './src/i18n/message';
import * as i18n_extractor from './src/i18n/message_extractor';
import * as xmb_serializer from './src/i18n/xmb_serializer';
import * as metadata_resolver from './src/metadata_resolver';
import * as path_util from './src/output/path_util';
import * as ts_emitter from './src/output/ts_emitter';
import * as parse_util from './src/parse_util';
import * as dom_element_schema_registry from './src/schema/dom_element_schema_registry';
import * as selector from './src/selector';
import * as style_compiler from './src/style_compiler';
import * as template_parser from './src/template_parser';
import * as view_compiler from './src/view_compiler/view_compiler';

export namespace __compiler_private__ {
export type SelectorMatcher = selector.SelectorMatcher;
export var SelectorMatcher = selector.SelectorMatcher;

export type CssSelector = selector.CssSelector;
export var CssSelector = selector.CssSelector;

export type AssetUrl = path_util.AssetUrl;
export var AssetUrl = path_util.AssetUrl;

export type ImportGenerator = path_util.ImportGenerator;
export var ImportGenerator = path_util.ImportGenerator;

export type CompileMetadataResolver = metadata_resolver.CompileMetadataResolver;
export var CompileMetadataResolver = metadata_resolver.CompileMetadataResolver;

export type HtmlParser = html_parser.HtmlParser;
export var HtmlParser = html_parser.HtmlParser;

export type I18nHtmlParser = i18n_html_parser.I18nHtmlParser;
export var I18nHtmlParser = i18n_html_parser.I18nHtmlParser;

export type ExtractionResult = i18n_extractor.ExtractionResult;
export var ExtractionResult = i18n_extractor.ExtractionResult;

export type Message = i18n_message.Message;
export var Message = i18n_message.Message;

export type MessageExtractor = i18n_extractor.MessageExtractor;
export var MessageExtractor = i18n_extractor.MessageExtractor;

export var removeDuplicates = i18n_extractor.removeDuplicates;

export var serializeXmb = xmb_serializer.serializeXmb;
export var deserializeXmb = xmb_serializer.deserializeXmb;

export type DirectiveNormalizer = directive_normalizer.DirectiveNormalizer;
export var DirectiveNormalizer = directive_normalizer.DirectiveNormalizer;

export type Lexer = lexer.Lexer;
export var Lexer = lexer.Lexer;

export type Parser = parser.Parser;
export var Parser = parser.Parser;

export type ParseLocation = parse_util.ParseLocation;
export var ParseLocation = parse_util.ParseLocation;

export type ParseError = parse_util.ParseError;
export var ParseError = parse_util.ParseError;

export type ParseErrorLevel = parse_util.ParseErrorLevel;
export var ParseErrorLevel = parse_util.ParseErrorLevel;

export type ParseSourceFile = parse_util.ParseSourceFile;
export var ParseSourceFile = parse_util.ParseSourceFile;

export type ParseSourceSpan = parse_util.ParseSourceSpan;
export var ParseSourceSpan = parse_util.ParseSourceSpan;

export type TemplateParser = template_parser.TemplateParser;
export var TemplateParser = template_parser.TemplateParser;

export type TemplateParseResult = template_parser.TemplateParseResult;

export type DomElementSchemaRegistry = dom_element_schema_registry.DomElementSchemaRegistry;
export var DomElementSchemaRegistry = dom_element_schema_registry.DomElementSchemaRegistry;

export type StyleCompiler = style_compiler.StyleCompiler;
export var StyleCompiler = style_compiler.StyleCompiler;

export type ViewCompiler = view_compiler.ViewCompiler;
export var ViewCompiler = view_compiler.ViewCompiler;

export type TypeScriptEmitter = ts_emitter.TypeScriptEmitter;
export var TypeScriptEmitter = ts_emitter.TypeScriptEmitter;
}
