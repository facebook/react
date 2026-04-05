use serde::{Deserialize, Serialize};

use crate::common::BaseNode;

use crate::expressions::{Expression, Identifier};
use crate::patterns::PatternLike;

fn is_false(v: &bool) -> bool {
    !v
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Statement {
    // Statements
    BlockStatement(BlockStatement),
    ReturnStatement(ReturnStatement),
    IfStatement(IfStatement),
    ForStatement(ForStatement),
    WhileStatement(WhileStatement),
    DoWhileStatement(DoWhileStatement),
    ForInStatement(ForInStatement),
    ForOfStatement(ForOfStatement),
    SwitchStatement(SwitchStatement),
    ThrowStatement(ThrowStatement),
    TryStatement(TryStatement),
    BreakStatement(BreakStatement),
    ContinueStatement(ContinueStatement),
    LabeledStatement(LabeledStatement),
    ExpressionStatement(ExpressionStatement),
    EmptyStatement(EmptyStatement),
    DebuggerStatement(DebuggerStatement),
    WithStatement(WithStatement),
    // Declarations are also statements
    VariableDeclaration(VariableDeclaration),
    FunctionDeclaration(FunctionDeclaration),
    ClassDeclaration(ClassDeclaration),
    // Import/export declarations
    ImportDeclaration(crate::declarations::ImportDeclaration),
    ExportNamedDeclaration(crate::declarations::ExportNamedDeclaration),
    ExportDefaultDeclaration(crate::declarations::ExportDefaultDeclaration),
    ExportAllDeclaration(crate::declarations::ExportAllDeclaration),
    // TypeScript declarations
    TSTypeAliasDeclaration(crate::declarations::TSTypeAliasDeclaration),
    TSInterfaceDeclaration(crate::declarations::TSInterfaceDeclaration),
    TSEnumDeclaration(crate::declarations::TSEnumDeclaration),
    TSModuleDeclaration(crate::declarations::TSModuleDeclaration),
    TSDeclareFunction(crate::declarations::TSDeclareFunction),
    // Flow declarations
    TypeAlias(crate::declarations::TypeAlias),
    OpaqueType(crate::declarations::OpaqueType),
    InterfaceDeclaration(crate::declarations::InterfaceDeclaration),
    DeclareVariable(crate::declarations::DeclareVariable),
    DeclareFunction(crate::declarations::DeclareFunction),
    DeclareClass(crate::declarations::DeclareClass),
    DeclareModule(crate::declarations::DeclareModule),
    DeclareModuleExports(crate::declarations::DeclareModuleExports),
    DeclareExportDeclaration(crate::declarations::DeclareExportDeclaration),
    DeclareExportAllDeclaration(crate::declarations::DeclareExportAllDeclaration),
    DeclareInterface(crate::declarations::DeclareInterface),
    DeclareTypeAlias(crate::declarations::DeclareTypeAlias),
    DeclareOpaqueType(crate::declarations::DeclareOpaqueType),
    EnumDeclaration(crate::declarations::EnumDeclaration),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockStatement {
    #[serde(flatten)]
    pub base: BaseNode,
    pub body: Vec<Statement>,
    #[serde(default)]
    pub directives: Vec<Directive>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Directive {
    #[serde(flatten)]
    pub base: BaseNode,
    pub value: DirectiveLiteral,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirectiveLiteral {
    #[serde(flatten)]
    pub base: BaseNode,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReturnStatement {
    #[serde(flatten)]
    pub base: BaseNode,
    pub argument: Option<Box<Expression>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExpressionStatement {
    #[serde(flatten)]
    pub base: BaseNode,
    pub expression: Box<Expression>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IfStatement {
    #[serde(flatten)]
    pub base: BaseNode,
    pub test: Box<Expression>,
    pub consequent: Box<Statement>,
    pub alternate: Option<Box<Statement>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForStatement {
    #[serde(flatten)]
    pub base: BaseNode,
    pub init: Option<Box<ForInit>>,
    pub test: Option<Box<Expression>>,
    pub update: Option<Box<Expression>>,
    pub body: Box<Statement>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ForInit {
    VariableDeclaration(VariableDeclaration),
    #[serde(untagged)]
    Expression(Box<Expression>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhileStatement {
    #[serde(flatten)]
    pub base: BaseNode,
    pub test: Box<Expression>,
    pub body: Box<Statement>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DoWhileStatement {
    #[serde(flatten)]
    pub base: BaseNode,
    pub test: Box<Expression>,
    pub body: Box<Statement>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForInStatement {
    #[serde(flatten)]
    pub base: BaseNode,
    pub left: Box<ForInOfLeft>,
    pub right: Box<Expression>,
    pub body: Box<Statement>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForOfStatement {
    #[serde(flatten)]
    pub base: BaseNode,
    pub left: Box<ForInOfLeft>,
    pub right: Box<Expression>,
    pub body: Box<Statement>,
    #[serde(default, rename = "await")]
    pub is_await: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ForInOfLeft {
    VariableDeclaration(VariableDeclaration),
    #[serde(untagged)]
    Pattern(Box<PatternLike>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwitchStatement {
    #[serde(flatten)]
    pub base: BaseNode,
    pub discriminant: Box<Expression>,
    pub cases: Vec<SwitchCase>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwitchCase {
    #[serde(flatten)]
    pub base: BaseNode,
    pub test: Option<Box<Expression>>,
    pub consequent: Vec<Statement>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThrowStatement {
    #[serde(flatten)]
    pub base: BaseNode,
    pub argument: Box<Expression>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TryStatement {
    #[serde(flatten)]
    pub base: BaseNode,
    pub block: BlockStatement,
    pub handler: Option<CatchClause>,
    pub finalizer: Option<BlockStatement>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CatchClause {
    #[serde(flatten)]
    pub base: BaseNode,
    pub param: Option<PatternLike>,
    pub body: BlockStatement,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BreakStatement {
    #[serde(flatten)]
    pub base: BaseNode,
    pub label: Option<Identifier>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContinueStatement {
    #[serde(flatten)]
    pub base: BaseNode,
    pub label: Option<Identifier>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LabeledStatement {
    #[serde(flatten)]
    pub base: BaseNode,
    pub label: Identifier,
    pub body: Box<Statement>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmptyStatement {
    #[serde(flatten)]
    pub base: BaseNode,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DebuggerStatement {
    #[serde(flatten)]
    pub base: BaseNode,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WithStatement {
    #[serde(flatten)]
    pub base: BaseNode,
    pub object: Box<Expression>,
    pub body: Box<Statement>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VariableDeclaration {
    #[serde(flatten)]
    pub base: BaseNode,
    pub declarations: Vec<VariableDeclarator>,
    pub kind: VariableDeclarationKind,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub declare: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum VariableDeclarationKind {
    Var,
    Let,
    Const,
    Using,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VariableDeclarator {
    #[serde(flatten)]
    pub base: BaseNode,
    pub id: PatternLike,
    pub init: Option<Box<Expression>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub definite: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionDeclaration {
    #[serde(flatten)]
    pub base: BaseNode,
    pub id: Option<Identifier>,
    pub params: Vec<PatternLike>,
    pub body: BlockStatement,
    #[serde(default)]
    pub generator: bool,
    #[serde(default, rename = "async")]
    pub is_async: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub declare: Option<bool>,
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        rename = "returnType"
    )]
    pub return_type: Option<Box<serde_json::Value>>,
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        rename = "typeParameters"
    )]
    pub type_parameters: Option<Box<serde_json::Value>>,
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        rename = "predicate"
    )]
    pub predicate: Option<Box<serde_json::Value>>,
    /// Set by the Hermes parser for Flow `component Foo(...) { ... }` syntax
    #[serde(
        default,
        skip_serializing_if = "is_false",
        rename = "__componentDeclaration"
    )]
    pub component_declaration: bool,
    /// Set by the Hermes parser for Flow `hook useFoo(...) { ... }` syntax
    #[serde(
        default,
        skip_serializing_if = "is_false",
        rename = "__hookDeclaration"
    )]
    pub hook_declaration: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClassDeclaration {
    #[serde(flatten)]
    pub base: BaseNode,
    pub id: Option<Identifier>,
    #[serde(rename = "superClass")]
    pub super_class: Option<Box<Expression>>,
    pub body: crate::expressions::ClassBody,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub decorators: Option<Vec<serde_json::Value>>,
    #[serde(default, skip_serializing_if = "Option::is_none", rename = "abstract")]
    pub is_abstract: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub declare: Option<bool>,
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        rename = "implements"
    )]
    pub implements: Option<Vec<serde_json::Value>>,
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        rename = "superTypeParameters"
    )]
    pub super_type_parameters: Option<Box<serde_json::Value>>,
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        rename = "typeParameters"
    )]
    pub type_parameters: Option<Box<serde_json::Value>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub mixins: Option<Vec<serde_json::Value>>,
}
