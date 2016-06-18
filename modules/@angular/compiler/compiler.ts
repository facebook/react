/**
 * @module
 * @description
 * Starting point to import all compiler APIs.
 */
export {COMPILER_PROVIDERS, CompileDiDependencyMetadata, CompileDirectiveMetadata, CompileFactoryMetadata, CompileIdentifierMetadata, CompileMetadataWithIdentifier, CompileMetadataWithType, CompilePipeMetadata, CompileProviderMetadata, CompileQueryMetadata, CompileTemplateMetadata, CompileTokenMetadata, CompileTypeMetadata, CompilerConfig, DEFAULT_PACKAGE_URL_PROVIDER, DirectiveResolver, NormalizedComponentWithViewDirectives, OfflineCompiler, PipeResolver, RenderTypes, RuntimeCompiler, SourceModule, TEMPLATE_TRANSFORMS, UrlResolver, ViewResolver, XHR, createOfflineCompileUrlResolver} from './src/compiler';
export {ElementSchemaRegistry} from './src/schema/element_schema_registry';

export * from './src/template_ast';
export * from './private_export';
