// @generated
#![cfg_attr(rustfmt, rustfmt_skip)]
use std::num::NonZeroU32;
use serde::ser::{Serializer, SerializeMap};
use serde::{Serialize, Deserialize};
use crate::{JsValue, Binding, SourceRange, Number};
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(deny_unknown_fields)]
pub struct SourceLocation {
    pub source: Option<String>,
    pub start: Position,
    pub end: Position,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(deny_unknown_fields)]
pub struct Position {
    pub line: NonZeroU32,
    pub column: u32,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(deny_unknown_fields)]
pub struct Class {
    pub id: Option<Identifier>,
    #[serde(rename = "superClass")]
    pub super_class: Option<Expression>,
    pub body: ClassBody,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(deny_unknown_fields)]
pub struct Function {
    pub id: Option<Identifier>,
    pub params: Vec<Pattern>,
    pub body: Option<FunctionBody>,
    #[serde(rename = "generator")]
    #[serde(default)]
    pub is_generator: bool,
    #[serde(rename = "async")]
    #[serde(default)]
    pub is_async: bool,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(deny_unknown_fields)]
pub struct RegExpValue {
    pub pattern: String,
    pub flags: String,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(deny_unknown_fields)]
pub struct TemplateElementValue {
    pub cooked: Option<String>,
    pub raw: String,
}
#[derive(Deserialize, Clone, Debug)]
pub struct Identifier {
    pub name: String,
    #[serde(skip)]
    #[serde(default)]
    pub binding: Option<Binding>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for Identifier {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "Identifier")?;
        state.serialize_entry("name", &self.name)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct Literal {
    pub value: JsValue,
    #[serde(default)]
    pub raw: Option<String>,
    #[serde(default)]
    pub regex: Option<RegExpValue>,
    #[serde(default)]
    pub bigint: Option<String>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for Literal {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "Literal")?;
        state.serialize_entry("value", &self.value)?;
        state.serialize_entry("raw", &self.raw)?;
        state.serialize_entry("regex", &self.regex)?;
        state.serialize_entry("bigint", &self.bigint)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct NumericLiteral {
    pub value: Number,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for NumericLiteral {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "NumericLiteral")?;
        state.serialize_entry("value", &self.value)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct BooleanLiteral {
    pub value: bool,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for BooleanLiteral {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "BooleanLiteral")?;
        state.serialize_entry("value", &self.value)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct NullLiteral {
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for NullLiteral {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "NullLiteral")?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct StringLiteral {
    pub value: String,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for StringLiteral {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "StringLiteral")?;
        state.serialize_entry("value", &self.value)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct Program {
    pub body: Vec<ModuleItem>,
    #[serde(rename = "sourceType")]
    #[serde(default)]
    pub source_type: SourceType,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for Program {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "Program")?;
        state.serialize_entry("body", &self.body)?;
        state.serialize_entry("sourceType", &self.source_type)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ExpressionStatement {
    pub expression: Expression,
    #[serde(default)]
    pub directive: Option<String>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ExpressionStatement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ExpressionStatement")?;
        state.serialize_entry("expression", &self.expression)?;
        state.serialize_entry("directive", &self.directive)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct BlockStatement {
    pub body: Vec<Statement>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for BlockStatement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "BlockStatement")?;
        state.serialize_entry("body", &self.body)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct EmptyStatement {
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for EmptyStatement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "EmptyStatement")?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct DebuggerStatement {
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for DebuggerStatement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "DebuggerStatement")?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct WithStatement {
    pub object: Expression,
    pub body: Statement,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for WithStatement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "WithStatement")?;
        state.serialize_entry("object", &self.object)?;
        state.serialize_entry("body", &self.body)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ReturnStatement {
    pub argument: Option<Expression>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ReturnStatement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ReturnStatement")?;
        state.serialize_entry("argument", &self.argument)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct LabeledStatement {
    pub label: Identifier,
    pub body: Statement,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for LabeledStatement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "LabeledStatement")?;
        state.serialize_entry("label", &self.label)?;
        state.serialize_entry("body", &self.body)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct BreakStatement {
    pub label: Option<Identifier>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for BreakStatement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "BreakStatement")?;
        state.serialize_entry("label", &self.label)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ContinueStatement {
    pub label: Option<Identifier>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ContinueStatement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ContinueStatement")?;
        state.serialize_entry("label", &self.label)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct IfStatement {
    pub test: Expression,
    pub consequent: Statement,
    pub alternate: Option<Statement>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for IfStatement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "IfStatement")?;
        state.serialize_entry("test", &self.test)?;
        state.serialize_entry("consequent", &self.consequent)?;
        state.serialize_entry("alternate", &self.alternate)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct SwitchStatement {
    pub discriminant: Expression,
    pub cases: Vec<SwitchCase>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for SwitchStatement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "SwitchStatement")?;
        state.serialize_entry("discriminant", &self.discriminant)?;
        state.serialize_entry("cases", &self.cases)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct SwitchCase {
    pub test: Option<Expression>,
    pub consequent: Vec<Statement>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for SwitchCase {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "SwitchCase")?;
        state.serialize_entry("test", &self.test)?;
        state.serialize_entry("consequent", &self.consequent)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ThrowStatement {
    pub argument: Expression,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ThrowStatement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ThrowStatement")?;
        state.serialize_entry("argument", &self.argument)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct TryStatement {
    pub block: BlockStatement,
    pub handler: Option<CatchClause>,
    pub finalizer: Option<BlockStatement>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for TryStatement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "TryStatement")?;
        state.serialize_entry("block", &self.block)?;
        state.serialize_entry("handler", &self.handler)?;
        state.serialize_entry("finalizer", &self.finalizer)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct CatchClause {
    pub param: Option<Pattern>,
    pub body: BlockStatement,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for CatchClause {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "CatchClause")?;
        state.serialize_entry("param", &self.param)?;
        state.serialize_entry("body", &self.body)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct WhileStatement {
    pub test: Expression,
    pub body: Statement,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for WhileStatement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "WhileStatement")?;
        state.serialize_entry("test", &self.test)?;
        state.serialize_entry("body", &self.body)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct DoWhileStatement {
    pub body: Statement,
    pub test: Expression,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for DoWhileStatement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "DoWhileStatement")?;
        state.serialize_entry("body", &self.body)?;
        state.serialize_entry("test", &self.test)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ForStatement {
    pub init: Option<ForInit>,
    pub test: Option<Expression>,
    pub update: Option<Expression>,
    pub body: Statement,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ForStatement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ForStatement")?;
        state.serialize_entry("init", &self.init)?;
        state.serialize_entry("test", &self.test)?;
        state.serialize_entry("update", &self.update)?;
        state.serialize_entry("body", &self.body)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ForInStatement {
    pub left: ForInInit,
    pub right: Expression,
    pub body: Statement,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ForInStatement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ForInStatement")?;
        state.serialize_entry("left", &self.left)?;
        state.serialize_entry("right", &self.right)?;
        state.serialize_entry("body", &self.body)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ForOfStatement {
    #[serde(rename = "await")]
    #[serde(default)]
    pub is_await: bool,
    pub left: ForInInit,
    pub right: Expression,
    pub body: Statement,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ForOfStatement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ForOfStatement")?;
        state.serialize_entry("await", &self.is_await)?;
        state.serialize_entry("left", &self.left)?;
        state.serialize_entry("right", &self.right)?;
        state.serialize_entry("body", &self.body)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct FunctionDeclaration {
    #[serde(flatten)]
    pub function: Function,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for FunctionDeclaration {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "FunctionDeclaration")?;
        Serialize::serialize(
            &self.function,
            serde::__private::ser::FlatMapSerializer(&mut state),
        )?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ClassDeclaration {
    #[serde(flatten)]
    pub class: Class,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ClassDeclaration {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ClassDeclaration")?;
        Serialize::serialize(
            &self.class,
            serde::__private::ser::FlatMapSerializer(&mut state),
        )?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ClassExpression {
    #[serde(flatten)]
    pub class: Class,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ClassExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ClassExpression")?;
        Serialize::serialize(
            &self.class,
            serde::__private::ser::FlatMapSerializer(&mut state),
        )?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ClassBody {
    pub body: Vec<MethodDefinition>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ClassBody {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ClassBody")?;
        state.serialize_entry("body", &self.body)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct MethodDefinition {
    pub key: Expression,
    pub value: FunctionExpression,
    pub kind: MethodKind,
    #[serde(rename = "computed")]
    pub is_computed: bool,
    #[serde(rename = "static")]
    pub is_static: bool,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for MethodDefinition {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "MethodDefinition")?;
        state.serialize_entry("key", &self.key)?;
        state.serialize_entry("value", &self.value)?;
        state.serialize_entry("kind", &self.kind)?;
        state.serialize_entry("computed", &self.is_computed)?;
        state.serialize_entry("static", &self.is_static)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct VariableDeclaration {
    pub kind: VariableDeclarationKind,
    pub declarations: Vec<VariableDeclarator>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for VariableDeclaration {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "VariableDeclaration")?;
        state.serialize_entry("kind", &self.kind)?;
        state.serialize_entry("declarations", &self.declarations)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct VariableDeclarator {
    pub id: Pattern,
    pub init: Option<Expression>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for VariableDeclarator {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "VariableDeclarator")?;
        state.serialize_entry("id", &self.id)?;
        state.serialize_entry("init", &self.init)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ThisExpression {
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ThisExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ThisExpression")?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ArrayExpression {
    pub elements: Vec<Option<ExpressionOrSpread>>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ArrayExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ArrayExpression")?;
        state.serialize_entry("elements", &self.elements)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ObjectExpression {
    pub properties: Vec<PropertyOrSpreadElement>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ObjectExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ObjectExpression")?;
        state.serialize_entry("properties", &self.properties)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct Property {
    pub key: Expression,
    pub value: Expression,
    pub kind: PropertyKind,
    #[serde(rename = "method")]
    pub is_method: bool,
    #[serde(rename = "shorthand")]
    pub is_shorthand: bool,
    #[serde(rename = "computed")]
    pub is_computed: bool,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for Property {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "Property")?;
        state.serialize_entry("key", &self.key)?;
        state.serialize_entry("value", &self.value)?;
        state.serialize_entry("kind", &self.kind)?;
        state.serialize_entry("method", &self.is_method)?;
        state.serialize_entry("shorthand", &self.is_shorthand)?;
        state.serialize_entry("computed", &self.is_computed)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct FunctionExpression {
    #[serde(flatten)]
    pub function: Function,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for FunctionExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "FunctionExpression")?;
        Serialize::serialize(
            &self.function,
            serde::__private::ser::FlatMapSerializer(&mut state),
        )?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ArrowFunctionExpression {
    #[serde(flatten)]
    pub function: Function,
    #[serde(rename = "expression")]
    pub is_expression: bool,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ArrowFunctionExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ArrowFunctionExpression")?;
        Serialize::serialize(
            &self.function,
            serde::__private::ser::FlatMapSerializer(&mut state),
        )?;
        state.serialize_entry("expression", &self.is_expression)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct UnaryExpression {
    pub operator: UnaryOperator,
    pub prefix: bool,
    pub argument: Expression,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for UnaryExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "UnaryExpression")?;
        state.serialize_entry("operator", &self.operator)?;
        state.serialize_entry("prefix", &self.prefix)?;
        state.serialize_entry("argument", &self.argument)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct UpdateExpression {
    pub operator: UpdateOperator,
    pub argument: Expression,
    pub prefix: bool,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for UpdateExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "UpdateExpression")?;
        state.serialize_entry("operator", &self.operator)?;
        state.serialize_entry("argument", &self.argument)?;
        state.serialize_entry("prefix", &self.prefix)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct BinaryExpression {
    pub left: Expression,
    pub operator: BinaryOperator,
    pub right: Expression,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for BinaryExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "BinaryExpression")?;
        state.serialize_entry("left", &self.left)?;
        state.serialize_entry("operator", &self.operator)?;
        state.serialize_entry("right", &self.right)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct AssignmentExpression {
    pub operator: AssignmentOperator,
    pub left: AssignmentTarget,
    pub right: Expression,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for AssignmentExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "AssignmentExpression")?;
        state.serialize_entry("operator", &self.operator)?;
        state.serialize_entry("left", &self.left)?;
        state.serialize_entry("right", &self.right)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct LogicalExpression {
    pub operator: LogicalOperator,
    pub left: Expression,
    pub right: Expression,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for LogicalExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "LogicalExpression")?;
        state.serialize_entry("operator", &self.operator)?;
        state.serialize_entry("left", &self.left)?;
        state.serialize_entry("right", &self.right)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct MemberExpression {
    pub object: ExpressionOrSuper,
    pub property: Expression,
    #[serde(rename = "computed")]
    pub is_computed: bool,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for MemberExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "MemberExpression")?;
        state.serialize_entry("object", &self.object)?;
        state.serialize_entry("property", &self.property)?;
        state.serialize_entry("computed", &self.is_computed)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ConditionalExpression {
    pub test: Expression,
    pub alternate: Expression,
    pub consequent: Expression,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ConditionalExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ConditionalExpression")?;
        state.serialize_entry("test", &self.test)?;
        state.serialize_entry("alternate", &self.alternate)?;
        state.serialize_entry("consequent", &self.consequent)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct CallExpression {
    pub callee: ExpressionOrSuper,
    pub arguments: Vec<ExpressionOrSpread>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for CallExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "CallExpression")?;
        state.serialize_entry("callee", &self.callee)?;
        state.serialize_entry("arguments", &self.arguments)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct NewExpression {
    pub callee: Expression,
    pub arguments: Vec<ExpressionOrSpread>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for NewExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "NewExpression")?;
        state.serialize_entry("callee", &self.callee)?;
        state.serialize_entry("arguments", &self.arguments)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct SequenceExpression {
    pub expressions: Vec<Expression>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for SequenceExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "SequenceExpression")?;
        state.serialize_entry("expressions", &self.expressions)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct Super {
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for Super {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "Super")?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct SpreadElement {
    pub argument: Expression,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for SpreadElement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "SpreadElement")?;
        state.serialize_entry("argument", &self.argument)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct YieldExpression {
    #[serde(default)]
    pub argument: Option<Expression>,
    #[serde(rename = "delegate")]
    pub is_delegate: bool,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for YieldExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "YieldExpression")?;
        state.serialize_entry("argument", &self.argument)?;
        state.serialize_entry("delegate", &self.is_delegate)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ImportDeclaration {
    pub specifiers: Vec<ImportDeclarationSpecifier>,
    pub source: _Literal,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ImportDeclaration {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ImportDeclaration")?;
        state.serialize_entry("specifiers", &self.specifiers)?;
        state.serialize_entry("source", &self.source)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ImportSpecifier {
    pub imported: Identifier,
    pub local: Identifier,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ImportSpecifier {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ImportSpecifier")?;
        state.serialize_entry("imported", &self.imported)?;
        state.serialize_entry("local", &self.local)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ImportDefaultSpecifier {
    pub local: Identifier,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ImportDefaultSpecifier {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ImportDefaultSpecifier")?;
        state.serialize_entry("local", &self.local)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ImportNamespaceSpecifier {
    pub local: Identifier,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ImportNamespaceSpecifier {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ImportNamespaceSpecifier")?;
        state.serialize_entry("local", &self.local)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ExportNamedDeclaration {
    pub declaration: Option<Declaration>,
    pub specifiers: Vec<ExportSpecifier>,
    pub source: Option<_Literal>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ExportNamedDeclaration {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ExportNamedDeclaration")?;
        state.serialize_entry("declaration", &self.declaration)?;
        state.serialize_entry("specifiers", &self.specifiers)?;
        state.serialize_entry("source", &self.source)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ExportSpecifier {
    pub exported: Identifier,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ExportSpecifier {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ExportSpecifier")?;
        state.serialize_entry("exported", &self.exported)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ExportDefaultDeclaration {
    pub declaration: Declaration,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ExportDefaultDeclaration {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ExportDefaultDeclaration")?;
        state.serialize_entry("declaration", &self.declaration)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ExportAllDeclaration {
    pub source: _Literal,
    #[serde(default)]
    pub exported: Option<Identifier>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ExportAllDeclaration {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ExportAllDeclaration")?;
        state.serialize_entry("source", &self.source)?;
        state.serialize_entry("exported", &self.exported)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct JSXIdentifier {
    pub name: String,
    #[serde(skip)]
    #[serde(default)]
    pub binding: Option<Binding>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for JSXIdentifier {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "JSXIdentifier")?;
        state.serialize_entry("name", &self.name)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct JSXNamespacedName {
    pub namespace: JSXIdentifier,
    pub name: JSXIdentifier,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for JSXNamespacedName {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "JSXNamespacedName")?;
        state.serialize_entry("namespace", &self.namespace)?;
        state.serialize_entry("name", &self.name)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct JSXMemberExpression {
    pub object: JSXMemberExpressionOrIdentifier,
    pub property: JSXIdentifier,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for JSXMemberExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "JSXMemberExpression")?;
        state.serialize_entry("object", &self.object)?;
        state.serialize_entry("property", &self.property)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct JSXEmptyExpression {
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for JSXEmptyExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "JSXEmptyExpression")?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct JSXExpressionContainer {
    pub expression: JSXExpressionOrEmpty,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for JSXExpressionContainer {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "JSXExpressionContainer")?;
        state.serialize_entry("expression", &self.expression)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct JSXSpreadChild {
    pub expression: Expression,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for JSXSpreadChild {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "JSXSpreadChild")?;
        state.serialize_entry("expression", &self.expression)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct JSXOpeningElement {
    pub name: JSXElementName,
    pub attributes: Vec<JSXAttributeOrSpread>,
    #[serde(rename = "selfClosing")]
    pub self_closing: bool,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for JSXOpeningElement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "JSXOpeningElement")?;
        state.serialize_entry("name", &self.name)?;
        state.serialize_entry("attributes", &self.attributes)?;
        state.serialize_entry("selfClosing", &self.self_closing)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct JSXClosingElement {
    pub name: JSXElementName,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for JSXClosingElement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "JSXClosingElement")?;
        state.serialize_entry("name", &self.name)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct JSXAttribute {
    pub name: JSXIdentifierOrNamespacedName,
    pub value: Option<JSXAttributeValue>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for JSXAttribute {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "JSXAttribute")?;
        state.serialize_entry("name", &self.name)?;
        state.serialize_entry("value", &self.value)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct JSXSpreadAttribute {
    pub argument: Expression,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for JSXSpreadAttribute {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "JSXSpreadAttribute")?;
        state.serialize_entry("argument", &self.argument)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct JSXText {
    pub value: String,
    pub raw: String,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for JSXText {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "JSXText")?;
        state.serialize_entry("value", &self.value)?;
        state.serialize_entry("raw", &self.raw)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct JSXElement {
    #[serde(rename = "openingElement")]
    pub opening_element: JSXOpeningElement,
    pub children: Vec<JSXChildItem>,
    #[serde(rename = "closingElement")]
    pub closing_element: Option<JSXClosingElement>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for JSXElement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "JSXElement")?;
        state.serialize_entry("openingElement", &self.opening_element)?;
        state.serialize_entry("children", &self.children)?;
        state.serialize_entry("closingElement", &self.closing_element)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct JSXFragment {
    #[serde(rename = "openingFragment")]
    pub opening_fragment: JSXOpeningFragment,
    pub children: Vec<JSXChildItem>,
    #[serde(rename = "closingFragment")]
    pub closing_fragment: JSXClosingFragment,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for JSXFragment {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "JSXFragment")?;
        state.serialize_entry("openingFragment", &self.opening_fragment)?;
        state.serialize_entry("children", &self.children)?;
        state.serialize_entry("closingFragment", &self.closing_fragment)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct JSXOpeningFragment {
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for JSXOpeningFragment {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "JSXOpeningFragment")?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct JSXClosingFragment {
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for JSXClosingFragment {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "JSXClosingFragment")?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ArrayPattern {
    pub elements: Vec<Option<Pattern>>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ArrayPattern {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ArrayPattern")?;
        state.serialize_entry("elements", &self.elements)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ObjectPattern {
    pub properties: Vec<AssignmentPropertyOrRestElement>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ObjectPattern {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ObjectPattern")?;
        state.serialize_entry("properties", &self.properties)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct AssignmentProperty {
    pub key: PropertyKey,
    pub value: Pattern,
    pub kind: PropertyKind,
    pub method: bool,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for AssignmentProperty {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "Property")?;
        state.serialize_entry("key", &self.key)?;
        state.serialize_entry("value", &self.value)?;
        state.serialize_entry("kind", &self.kind)?;
        state.serialize_entry("method", &self.method)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct RestElement {
    pub argument: Pattern,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for RestElement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "RestElement")?;
        state.serialize_entry("argument", &self.argument)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct AssignmentPattern {
    pub left: Pattern,
    pub right: Expression,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for AssignmentPattern {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "AssignmentPattern")?;
        state.serialize_entry("left", &self.left)?;
        state.serialize_entry("right", &self.right)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct TemplateLiteral {
    pub quasis: Vec<TemplateElement>,
    pub expressions: Vec<Expression>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for TemplateLiteral {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "TemplateLiteral")?;
        state.serialize_entry("quasis", &self.quasis)?;
        state.serialize_entry("expressions", &self.expressions)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct TemplateElement {
    pub tail: bool,
    pub value: TemplateElementValue,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for TemplateElement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "TemplateElement")?;
        state.serialize_entry("tail", &self.tail)?;
        state.serialize_entry("value", &self.value)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct TaggedTemplateExpression {
    pub tag: Expression,
    pub quasi: TemplateLiteral,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for TaggedTemplateExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "TaggedTemplateExpression")?;
        state.serialize_entry("tag", &self.tag)?;
        state.serialize_entry("quasi", &self.quasi)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct MetaProperty {
    pub meta: Identifier,
    pub property: Identifier,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for MetaProperty {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "MetaProperty")?;
        state.serialize_entry("meta", &self.meta)?;
        state.serialize_entry("property", &self.property)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct AwaitExpression {
    pub argument: Expression,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for AwaitExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "AwaitExpression")?;
        state.serialize_entry("argument", &self.argument)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ChainExpression {
    pub expression: ChainElement,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ChainExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ChainExpression")?;
        state.serialize_entry("expression", &self.expression)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct OptionalMemberExpression {
    pub object: Expression,
    pub property: Expression,
    #[serde(rename = "computed")]
    pub is_computed: bool,
    #[serde(rename = "optional")]
    #[serde(default)]
    pub is_optional: bool,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for OptionalMemberExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "OptionalMemberExpression")?;
        state.serialize_entry("object", &self.object)?;
        state.serialize_entry("property", &self.property)?;
        state.serialize_entry("computed", &self.is_computed)?;
        state.serialize_entry("optional", &self.is_optional)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct OptionalCallExpression {
    pub callee: ExpressionOrSuper,
    pub arguments: Vec<ExpressionOrSpread>,
    #[serde(rename = "optional")]
    #[serde(default)]
    pub is_optional: bool,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for OptionalCallExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "OptionalCallExpression")?;
        state.serialize_entry("callee", &self.callee)?;
        state.serialize_entry("arguments", &self.arguments)?;
        state.serialize_entry("optional", &self.is_optional)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Deserialize, Clone, Debug)]
pub struct ImportExpression {
    pub source: Expression,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
impl Serialize for ImportExpression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_map(None)?;
        state.serialize_entry("type", "ImportExpression")?;
        state.serialize_entry("source", &self.source)?;
        state.serialize_entry("loc", &self.loc)?;
        state.serialize_entry("range", &self.range)?;
        state.end()
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum Statement {
    BlockStatement(Box<BlockStatement>),
    BreakStatement(Box<BreakStatement>),
    ClassDeclaration(Box<ClassDeclaration>),
    ContinueStatement(Box<ContinueStatement>),
    DebuggerStatement(Box<DebuggerStatement>),
    DoWhileStatement(Box<DoWhileStatement>),
    EmptyStatement(Box<EmptyStatement>),
    ExpressionStatement(Box<ExpressionStatement>),
    ForInStatement(Box<ForInStatement>),
    ForOfStatement(Box<ForOfStatement>),
    ForStatement(Box<ForStatement>),
    FunctionDeclaration(Box<FunctionDeclaration>),
    IfStatement(Box<IfStatement>),
    LabeledStatement(Box<LabeledStatement>),
    ReturnStatement(Box<ReturnStatement>),
    SwitchStatement(Box<SwitchStatement>),
    ThrowStatement(Box<ThrowStatement>),
    TryStatement(Box<TryStatement>),
    VariableDeclaration(Box<VariableDeclaration>),
    WhileStatement(Box<WhileStatement>),
    WithStatement(Box<WithStatement>),
}
#[derive(Deserialize, Debug)]
enum __StatementTag {
    BlockStatement,
    BreakStatement,
    ClassDeclaration,
    ContinueStatement,
    DebuggerStatement,
    DoWhileStatement,
    EmptyStatement,
    ExpressionStatement,
    ForInStatement,
    ForOfStatement,
    ForStatement,
    FunctionDeclaration,
    IfStatement,
    LabeledStatement,
    ReturnStatement,
    SwitchStatement,
    ThrowStatement,
    TryStatement,
    VariableDeclaration,
    WhileStatement,
    WithStatement,
}
impl<'de> serde::Deserialize<'de> for Statement {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __StatementTag,
            >::new("type", "Statement"),
        )?;
        match tagged.0 {
            __StatementTag::BlockStatement => {
                let node: Box<BlockStatement> = <Box<
                    BlockStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Statement::BlockStatement(node))
            }
            __StatementTag::BreakStatement => {
                let node: Box<BreakStatement> = <Box<
                    BreakStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Statement::BreakStatement(node))
            }
            __StatementTag::ClassDeclaration => {
                let node: Box<ClassDeclaration> = <Box<
                    ClassDeclaration,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Statement::ClassDeclaration(node))
            }
            __StatementTag::ContinueStatement => {
                let node: Box<ContinueStatement> = <Box<
                    ContinueStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Statement::ContinueStatement(node))
            }
            __StatementTag::DebuggerStatement => {
                let node: Box<DebuggerStatement> = <Box<
                    DebuggerStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Statement::DebuggerStatement(node))
            }
            __StatementTag::DoWhileStatement => {
                let node: Box<DoWhileStatement> = <Box<
                    DoWhileStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Statement::DoWhileStatement(node))
            }
            __StatementTag::EmptyStatement => {
                let node: Box<EmptyStatement> = <Box<
                    EmptyStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Statement::EmptyStatement(node))
            }
            __StatementTag::ExpressionStatement => {
                let node: Box<ExpressionStatement> = <Box<
                    ExpressionStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Statement::ExpressionStatement(node))
            }
            __StatementTag::ForInStatement => {
                let node: Box<ForInStatement> = <Box<
                    ForInStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Statement::ForInStatement(node))
            }
            __StatementTag::ForOfStatement => {
                let node: Box<ForOfStatement> = <Box<
                    ForOfStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Statement::ForOfStatement(node))
            }
            __StatementTag::ForStatement => {
                let node: Box<ForStatement> = <Box<
                    ForStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Statement::ForStatement(node))
            }
            __StatementTag::FunctionDeclaration => {
                let node: Box<FunctionDeclaration> = <Box<
                    FunctionDeclaration,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Statement::FunctionDeclaration(node))
            }
            __StatementTag::IfStatement => {
                let node: Box<IfStatement> = <Box<
                    IfStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Statement::IfStatement(node))
            }
            __StatementTag::LabeledStatement => {
                let node: Box<LabeledStatement> = <Box<
                    LabeledStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Statement::LabeledStatement(node))
            }
            __StatementTag::ReturnStatement => {
                let node: Box<ReturnStatement> = <Box<
                    ReturnStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Statement::ReturnStatement(node))
            }
            __StatementTag::SwitchStatement => {
                let node: Box<SwitchStatement> = <Box<
                    SwitchStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Statement::SwitchStatement(node))
            }
            __StatementTag::ThrowStatement => {
                let node: Box<ThrowStatement> = <Box<
                    ThrowStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Statement::ThrowStatement(node))
            }
            __StatementTag::TryStatement => {
                let node: Box<TryStatement> = <Box<
                    TryStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Statement::TryStatement(node))
            }
            __StatementTag::VariableDeclaration => {
                let node: Box<VariableDeclaration> = <Box<
                    VariableDeclaration,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Statement::VariableDeclaration(node))
            }
            __StatementTag::WhileStatement => {
                let node: Box<WhileStatement> = <Box<
                    WhileStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Statement::WhileStatement(node))
            }
            __StatementTag::WithStatement => {
                let node: Box<WithStatement> = <Box<
                    WithStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Statement::WithStatement(node))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum Expression {
    ArrayExpression(Box<ArrayExpression>),
    ArrowFunctionExpression(Box<ArrowFunctionExpression>),
    AssignmentExpression(Box<AssignmentExpression>),
    AwaitExpression(Box<AwaitExpression>),
    BinaryExpression(Box<BinaryExpression>),
    BooleanLiteral(Box<BooleanLiteral>),
    CallExpression(Box<CallExpression>),
    ChainExpression(Box<ChainExpression>),
    ClassExpression(Box<ClassExpression>),
    ConditionalExpression(Box<ConditionalExpression>),
    FunctionExpression(Box<FunctionExpression>),
    Identifier(Box<Identifier>),
    ImportExpression(Box<ImportExpression>),
    JSXElement(Box<JSXElement>),
    Literal(Box<Literal>),
    LogicalExpression(Box<LogicalExpression>),
    MemberExpression(Box<MemberExpression>),
    MetaProperty(Box<MetaProperty>),
    NewExpression(Box<NewExpression>),
    NullLiteral(Box<NullLiteral>),
    NumericLiteral(Box<NumericLiteral>),
    ObjectExpression(Box<ObjectExpression>),
    OptionalCallExpression(Box<OptionalCallExpression>),
    OptionalMemberExpression(Box<OptionalMemberExpression>),
    SequenceExpression(Box<SequenceExpression>),
    StringLiteral(Box<StringLiteral>),
    TaggedTemplateExpression(Box<TaggedTemplateExpression>),
    TemplateLiteral(Box<TemplateLiteral>),
    ThisExpression(Box<ThisExpression>),
    UnaryExpression(Box<UnaryExpression>),
    UpdateExpression(Box<UpdateExpression>),
    YieldExpression(Box<YieldExpression>),
}
#[derive(Deserialize, Debug)]
enum __ExpressionTag {
    ArrayExpression,
    ArrowFunctionExpression,
    AssignmentExpression,
    AwaitExpression,
    BinaryExpression,
    BooleanLiteral,
    CallExpression,
    ChainExpression,
    ClassExpression,
    ConditionalExpression,
    FunctionExpression,
    Identifier,
    ImportExpression,
    JSXElement,
    Literal,
    LogicalExpression,
    MemberExpression,
    MetaProperty,
    NewExpression,
    NullLiteral,
    NumericLiteral,
    ObjectExpression,
    OptionalCallExpression,
    OptionalMemberExpression,
    SequenceExpression,
    StringLiteral,
    TaggedTemplateExpression,
    TemplateLiteral,
    ThisExpression,
    UnaryExpression,
    UpdateExpression,
    YieldExpression,
}
impl<'de> serde::Deserialize<'de> for Expression {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __ExpressionTag,
            >::new("type", "Expression"),
        )?;
        match tagged.0 {
            __ExpressionTag::ArrayExpression => {
                let node: Box<ArrayExpression> = <Box<
                    ArrayExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::ArrayExpression(node))
            }
            __ExpressionTag::ArrowFunctionExpression => {
                let node: Box<ArrowFunctionExpression> = <Box<
                    ArrowFunctionExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::ArrowFunctionExpression(node))
            }
            __ExpressionTag::AssignmentExpression => {
                let node: Box<AssignmentExpression> = <Box<
                    AssignmentExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::AssignmentExpression(node))
            }
            __ExpressionTag::AwaitExpression => {
                let node: Box<AwaitExpression> = <Box<
                    AwaitExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::AwaitExpression(node))
            }
            __ExpressionTag::BinaryExpression => {
                let node: Box<BinaryExpression> = <Box<
                    BinaryExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::BinaryExpression(node))
            }
            __ExpressionTag::BooleanLiteral => {
                let node: Box<BooleanLiteral> = <Box<
                    BooleanLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::BooleanLiteral(node))
            }
            __ExpressionTag::CallExpression => {
                let node: Box<CallExpression> = <Box<
                    CallExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::CallExpression(node))
            }
            __ExpressionTag::ChainExpression => {
                let node: Box<ChainExpression> = <Box<
                    ChainExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::ChainExpression(node))
            }
            __ExpressionTag::ClassExpression => {
                let node: Box<ClassExpression> = <Box<
                    ClassExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::ClassExpression(node))
            }
            __ExpressionTag::ConditionalExpression => {
                let node: Box<ConditionalExpression> = <Box<
                    ConditionalExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::ConditionalExpression(node))
            }
            __ExpressionTag::FunctionExpression => {
                let node: Box<FunctionExpression> = <Box<
                    FunctionExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::FunctionExpression(node))
            }
            __ExpressionTag::Identifier => {
                let node: Box<Identifier> = <Box<
                    Identifier,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::Identifier(node))
            }
            __ExpressionTag::ImportExpression => {
                let node: Box<ImportExpression> = <Box<
                    ImportExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::ImportExpression(node))
            }
            __ExpressionTag::JSXElement => {
                let node: Box<JSXElement> = <Box<
                    JSXElement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::JSXElement(node))
            }
            __ExpressionTag::Literal => {
                let node: Box<Literal> = <Box<
                    Literal,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::Literal(node))
            }
            __ExpressionTag::LogicalExpression => {
                let node: Box<LogicalExpression> = <Box<
                    LogicalExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::LogicalExpression(node))
            }
            __ExpressionTag::MemberExpression => {
                let node: Box<MemberExpression> = <Box<
                    MemberExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::MemberExpression(node))
            }
            __ExpressionTag::MetaProperty => {
                let node: Box<MetaProperty> = <Box<
                    MetaProperty,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::MetaProperty(node))
            }
            __ExpressionTag::NewExpression => {
                let node: Box<NewExpression> = <Box<
                    NewExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::NewExpression(node))
            }
            __ExpressionTag::NullLiteral => {
                let node: Box<NullLiteral> = <Box<
                    NullLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::NullLiteral(node))
            }
            __ExpressionTag::NumericLiteral => {
                let node: Box<NumericLiteral> = <Box<
                    NumericLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::NumericLiteral(node))
            }
            __ExpressionTag::ObjectExpression => {
                let node: Box<ObjectExpression> = <Box<
                    ObjectExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::ObjectExpression(node))
            }
            __ExpressionTag::OptionalCallExpression => {
                let node: Box<OptionalCallExpression> = <Box<
                    OptionalCallExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::OptionalCallExpression(node))
            }
            __ExpressionTag::OptionalMemberExpression => {
                let node: Box<OptionalMemberExpression> = <Box<
                    OptionalMemberExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::OptionalMemberExpression(node))
            }
            __ExpressionTag::SequenceExpression => {
                let node: Box<SequenceExpression> = <Box<
                    SequenceExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::SequenceExpression(node))
            }
            __ExpressionTag::StringLiteral => {
                let node: Box<StringLiteral> = <Box<
                    StringLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::StringLiteral(node))
            }
            __ExpressionTag::TaggedTemplateExpression => {
                let node: Box<TaggedTemplateExpression> = <Box<
                    TaggedTemplateExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::TaggedTemplateExpression(node))
            }
            __ExpressionTag::TemplateLiteral => {
                let node: Box<TemplateLiteral> = <Box<
                    TemplateLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::TemplateLiteral(node))
            }
            __ExpressionTag::ThisExpression => {
                let node: Box<ThisExpression> = <Box<
                    ThisExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::ThisExpression(node))
            }
            __ExpressionTag::UnaryExpression => {
                let node: Box<UnaryExpression> = <Box<
                    UnaryExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::UnaryExpression(node))
            }
            __ExpressionTag::UpdateExpression => {
                let node: Box<UpdateExpression> = <Box<
                    UpdateExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::UpdateExpression(node))
            }
            __ExpressionTag::YieldExpression => {
                let node: Box<YieldExpression> = <Box<
                    YieldExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::YieldExpression(node))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum _Literal {
    BooleanLiteral(Box<BooleanLiteral>),
    Literal(Box<Literal>),
    NullLiteral(Box<NullLiteral>),
    NumericLiteral(Box<NumericLiteral>),
    StringLiteral(Box<StringLiteral>),
}
#[derive(Deserialize, Debug)]
enum ___LiteralTag {
    Literal,
    BooleanLiteral,
    NullLiteral,
    StringLiteral,
    NumericLiteral,
}
impl<'de> serde::Deserialize<'de> for _Literal {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                ___LiteralTag,
            >::new("type", "_Literal"),
        )?;
        match tagged.0 {
            ___LiteralTag::Literal => {
                let node: Box<Literal> = <Box<
                    Literal,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(_Literal::Literal(node))
            }
            ___LiteralTag::BooleanLiteral => {
                let node: Box<BooleanLiteral> = <Box<
                    BooleanLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(_Literal::BooleanLiteral(node))
            }
            ___LiteralTag::NullLiteral => {
                let node: Box<NullLiteral> = <Box<
                    NullLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(_Literal::NullLiteral(node))
            }
            ___LiteralTag::StringLiteral => {
                let node: Box<StringLiteral> = <Box<
                    StringLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(_Literal::StringLiteral(node))
            }
            ___LiteralTag::NumericLiteral => {
                let node: Box<NumericLiteral> = <Box<
                    NumericLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(_Literal::NumericLiteral(node))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum Declaration {
    ClassDeclaration(Box<ClassDeclaration>),
    FunctionDeclaration(Box<FunctionDeclaration>),
    VariableDeclaration(Box<VariableDeclaration>),
}
#[derive(Deserialize, Debug)]
enum __DeclarationTag {
    ClassDeclaration,
    FunctionDeclaration,
    VariableDeclaration,
}
impl<'de> serde::Deserialize<'de> for Declaration {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __DeclarationTag,
            >::new("type", "Declaration"),
        )?;
        match tagged.0 {
            __DeclarationTag::ClassDeclaration => {
                let node: Box<ClassDeclaration> = <Box<
                    ClassDeclaration,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Declaration::ClassDeclaration(node))
            }
            __DeclarationTag::FunctionDeclaration => {
                let node: Box<FunctionDeclaration> = <Box<
                    FunctionDeclaration,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Declaration::FunctionDeclaration(node))
            }
            __DeclarationTag::VariableDeclaration => {
                let node: Box<VariableDeclaration> = <Box<
                    VariableDeclaration,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Declaration::VariableDeclaration(node))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum ImportDeclarationSpecifier {
    ImportDefaultSpecifier(Box<ImportDefaultSpecifier>),
    ImportNamespaceSpecifier(Box<ImportNamespaceSpecifier>),
    ImportSpecifier(Box<ImportSpecifier>),
}
#[derive(Deserialize, Debug)]
enum __ImportDeclarationSpecifierTag {
    ImportSpecifier,
    ImportDefaultSpecifier,
    ImportNamespaceSpecifier,
}
impl<'de> serde::Deserialize<'de> for ImportDeclarationSpecifier {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __ImportDeclarationSpecifierTag,
            >::new("type", "ImportDeclarationSpecifier"),
        )?;
        match tagged.0 {
            __ImportDeclarationSpecifierTag::ImportSpecifier => {
                let node: Box<ImportSpecifier> = <Box<
                    ImportSpecifier,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ImportDeclarationSpecifier::ImportSpecifier(node))
            }
            __ImportDeclarationSpecifierTag::ImportDefaultSpecifier => {
                let node: Box<ImportDefaultSpecifier> = <Box<
                    ImportDefaultSpecifier,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ImportDeclarationSpecifier::ImportDefaultSpecifier(node))
            }
            __ImportDeclarationSpecifierTag::ImportNamespaceSpecifier => {
                let node: Box<ImportNamespaceSpecifier> = <Box<
                    ImportNamespaceSpecifier,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ImportDeclarationSpecifier::ImportNamespaceSpecifier(node))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum ModuleItem {
    ImportOrExportDeclaration(ImportOrExportDeclaration),
    Statement(Statement),
}
#[derive(Deserialize, Debug)]
enum __ModuleItemTag {
    ImportDeclaration,
    ExportNamedDeclaration,
    ExportDefaultDeclaration,
    ExportAllDeclaration,
    BlockStatement,
    BreakStatement,
    ClassDeclaration,
    ContinueStatement,
    DebuggerStatement,
    DoWhileStatement,
    EmptyStatement,
    ExpressionStatement,
    ForInStatement,
    ForOfStatement,
    ForStatement,
    FunctionDeclaration,
    IfStatement,
    LabeledStatement,
    ReturnStatement,
    SwitchStatement,
    ThrowStatement,
    TryStatement,
    VariableDeclaration,
    WhileStatement,
    WithStatement,
}
impl<'de> serde::Deserialize<'de> for ModuleItem {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __ModuleItemTag,
            >::new("type", "ModuleItem"),
        )?;
        match tagged.0 {
            __ModuleItemTag::ImportDeclaration => {
                let node: Box<ImportDeclaration> = <Box<
                    ImportDeclaration,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    ModuleItem::ImportOrExportDeclaration(
                        ImportOrExportDeclaration::ImportDeclaration(node),
                    ),
                )
            }
            __ModuleItemTag::ExportNamedDeclaration => {
                let node: Box<ExportNamedDeclaration> = <Box<
                    ExportNamedDeclaration,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    ModuleItem::ImportOrExportDeclaration(
                        ImportOrExportDeclaration::ExportNamedDeclaration(node),
                    ),
                )
            }
            __ModuleItemTag::ExportDefaultDeclaration => {
                let node: Box<ExportDefaultDeclaration> = <Box<
                    ExportDefaultDeclaration,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    ModuleItem::ImportOrExportDeclaration(
                        ImportOrExportDeclaration::ExportDefaultDeclaration(node),
                    ),
                )
            }
            __ModuleItemTag::ExportAllDeclaration => {
                let node: Box<ExportAllDeclaration> = <Box<
                    ExportAllDeclaration,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    ModuleItem::ImportOrExportDeclaration(
                        ImportOrExportDeclaration::ExportAllDeclaration(node),
                    ),
                )
            }
            __ModuleItemTag::BlockStatement => {
                let node: Box<BlockStatement> = <Box<
                    BlockStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ModuleItem::Statement(Statement::BlockStatement(node)))
            }
            __ModuleItemTag::BreakStatement => {
                let node: Box<BreakStatement> = <Box<
                    BreakStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ModuleItem::Statement(Statement::BreakStatement(node)))
            }
            __ModuleItemTag::ClassDeclaration => {
                let node: Box<ClassDeclaration> = <Box<
                    ClassDeclaration,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ModuleItem::Statement(Statement::ClassDeclaration(node)))
            }
            __ModuleItemTag::ContinueStatement => {
                let node: Box<ContinueStatement> = <Box<
                    ContinueStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ModuleItem::Statement(Statement::ContinueStatement(node)))
            }
            __ModuleItemTag::DebuggerStatement => {
                let node: Box<DebuggerStatement> = <Box<
                    DebuggerStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ModuleItem::Statement(Statement::DebuggerStatement(node)))
            }
            __ModuleItemTag::DoWhileStatement => {
                let node: Box<DoWhileStatement> = <Box<
                    DoWhileStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ModuleItem::Statement(Statement::DoWhileStatement(node)))
            }
            __ModuleItemTag::EmptyStatement => {
                let node: Box<EmptyStatement> = <Box<
                    EmptyStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ModuleItem::Statement(Statement::EmptyStatement(node)))
            }
            __ModuleItemTag::ExpressionStatement => {
                let node: Box<ExpressionStatement> = <Box<
                    ExpressionStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ModuleItem::Statement(Statement::ExpressionStatement(node)))
            }
            __ModuleItemTag::ForInStatement => {
                let node: Box<ForInStatement> = <Box<
                    ForInStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ModuleItem::Statement(Statement::ForInStatement(node)))
            }
            __ModuleItemTag::ForOfStatement => {
                let node: Box<ForOfStatement> = <Box<
                    ForOfStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ModuleItem::Statement(Statement::ForOfStatement(node)))
            }
            __ModuleItemTag::ForStatement => {
                let node: Box<ForStatement> = <Box<
                    ForStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ModuleItem::Statement(Statement::ForStatement(node)))
            }
            __ModuleItemTag::FunctionDeclaration => {
                let node: Box<FunctionDeclaration> = <Box<
                    FunctionDeclaration,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ModuleItem::Statement(Statement::FunctionDeclaration(node)))
            }
            __ModuleItemTag::IfStatement => {
                let node: Box<IfStatement> = <Box<
                    IfStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ModuleItem::Statement(Statement::IfStatement(node)))
            }
            __ModuleItemTag::LabeledStatement => {
                let node: Box<LabeledStatement> = <Box<
                    LabeledStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ModuleItem::Statement(Statement::LabeledStatement(node)))
            }
            __ModuleItemTag::ReturnStatement => {
                let node: Box<ReturnStatement> = <Box<
                    ReturnStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ModuleItem::Statement(Statement::ReturnStatement(node)))
            }
            __ModuleItemTag::SwitchStatement => {
                let node: Box<SwitchStatement> = <Box<
                    SwitchStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ModuleItem::Statement(Statement::SwitchStatement(node)))
            }
            __ModuleItemTag::ThrowStatement => {
                let node: Box<ThrowStatement> = <Box<
                    ThrowStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ModuleItem::Statement(Statement::ThrowStatement(node)))
            }
            __ModuleItemTag::TryStatement => {
                let node: Box<TryStatement> = <Box<
                    TryStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ModuleItem::Statement(Statement::TryStatement(node)))
            }
            __ModuleItemTag::VariableDeclaration => {
                let node: Box<VariableDeclaration> = <Box<
                    VariableDeclaration,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ModuleItem::Statement(Statement::VariableDeclaration(node)))
            }
            __ModuleItemTag::WhileStatement => {
                let node: Box<WhileStatement> = <Box<
                    WhileStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ModuleItem::Statement(Statement::WhileStatement(node)))
            }
            __ModuleItemTag::WithStatement => {
                let node: Box<WithStatement> = <Box<
                    WithStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ModuleItem::Statement(Statement::WithStatement(node)))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum ImportOrExportDeclaration {
    ExportAllDeclaration(Box<ExportAllDeclaration>),
    ExportDefaultDeclaration(Box<ExportDefaultDeclaration>),
    ExportNamedDeclaration(Box<ExportNamedDeclaration>),
    ImportDeclaration(Box<ImportDeclaration>),
}
#[derive(Deserialize, Debug)]
enum __ImportOrExportDeclarationTag {
    ImportDeclaration,
    ExportNamedDeclaration,
    ExportDefaultDeclaration,
    ExportAllDeclaration,
}
impl<'de> serde::Deserialize<'de> for ImportOrExportDeclaration {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __ImportOrExportDeclarationTag,
            >::new("type", "ImportOrExportDeclaration"),
        )?;
        match tagged.0 {
            __ImportOrExportDeclarationTag::ImportDeclaration => {
                let node: Box<ImportDeclaration> = <Box<
                    ImportDeclaration,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ImportOrExportDeclaration::ImportDeclaration(node))
            }
            __ImportOrExportDeclarationTag::ExportNamedDeclaration => {
                let node: Box<ExportNamedDeclaration> = <Box<
                    ExportNamedDeclaration,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ImportOrExportDeclaration::ExportNamedDeclaration(node))
            }
            __ImportOrExportDeclarationTag::ExportDefaultDeclaration => {
                let node: Box<ExportDefaultDeclaration> = <Box<
                    ExportDefaultDeclaration,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ImportOrExportDeclaration::ExportDefaultDeclaration(node))
            }
            __ImportOrExportDeclarationTag::ExportAllDeclaration => {
                let node: Box<ExportAllDeclaration> = <Box<
                    ExportAllDeclaration,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ImportOrExportDeclaration::ExportAllDeclaration(node))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum ExpressionOrSuper {
    Expression(Expression),
    Super(Box<Super>),
}
#[derive(Deserialize, Debug)]
enum __ExpressionOrSuperTag {
    ArrayExpression,
    ArrowFunctionExpression,
    AssignmentExpression,
    AwaitExpression,
    BinaryExpression,
    BooleanLiteral,
    CallExpression,
    ChainExpression,
    ClassExpression,
    ConditionalExpression,
    FunctionExpression,
    Identifier,
    ImportExpression,
    JSXElement,
    Literal,
    LogicalExpression,
    MemberExpression,
    MetaProperty,
    NewExpression,
    NullLiteral,
    NumericLiteral,
    ObjectExpression,
    OptionalCallExpression,
    OptionalMemberExpression,
    SequenceExpression,
    StringLiteral,
    TaggedTemplateExpression,
    TemplateLiteral,
    ThisExpression,
    UnaryExpression,
    UpdateExpression,
    YieldExpression,
    Super,
}
impl<'de> serde::Deserialize<'de> for ExpressionOrSuper {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __ExpressionOrSuperTag,
            >::new("type", "ExpressionOrSuper"),
        )?;
        match tagged.0 {
            __ExpressionOrSuperTag::ArrayExpression => {
                let node: Box<ArrayExpression> = <Box<
                    ArrayExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::ArrayExpression(node)))
            }
            __ExpressionOrSuperTag::ArrowFunctionExpression => {
                let node: Box<ArrowFunctionExpression> = <Box<
                    ArrowFunctionExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    ExpressionOrSuper::Expression(
                        Expression::ArrowFunctionExpression(node),
                    ),
                )
            }
            __ExpressionOrSuperTag::AssignmentExpression => {
                let node: Box<AssignmentExpression> = <Box<
                    AssignmentExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::AssignmentExpression(node)))
            }
            __ExpressionOrSuperTag::AwaitExpression => {
                let node: Box<AwaitExpression> = <Box<
                    AwaitExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::AwaitExpression(node)))
            }
            __ExpressionOrSuperTag::BinaryExpression => {
                let node: Box<BinaryExpression> = <Box<
                    BinaryExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::BinaryExpression(node)))
            }
            __ExpressionOrSuperTag::BooleanLiteral => {
                let node: Box<BooleanLiteral> = <Box<
                    BooleanLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::BooleanLiteral(node)))
            }
            __ExpressionOrSuperTag::CallExpression => {
                let node: Box<CallExpression> = <Box<
                    CallExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::CallExpression(node)))
            }
            __ExpressionOrSuperTag::ChainExpression => {
                let node: Box<ChainExpression> = <Box<
                    ChainExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::ChainExpression(node)))
            }
            __ExpressionOrSuperTag::ClassExpression => {
                let node: Box<ClassExpression> = <Box<
                    ClassExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::ClassExpression(node)))
            }
            __ExpressionOrSuperTag::ConditionalExpression => {
                let node: Box<ConditionalExpression> = <Box<
                    ConditionalExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    ExpressionOrSuper::Expression(
                        Expression::ConditionalExpression(node),
                    ),
                )
            }
            __ExpressionOrSuperTag::FunctionExpression => {
                let node: Box<FunctionExpression> = <Box<
                    FunctionExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::FunctionExpression(node)))
            }
            __ExpressionOrSuperTag::Identifier => {
                let node: Box<Identifier> = <Box<
                    Identifier,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::Identifier(node)))
            }
            __ExpressionOrSuperTag::ImportExpression => {
                let node: Box<ImportExpression> = <Box<
                    ImportExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::ImportExpression(node)))
            }
            __ExpressionOrSuperTag::JSXElement => {
                let node: Box<JSXElement> = <Box<
                    JSXElement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::JSXElement(node)))
            }
            __ExpressionOrSuperTag::Literal => {
                let node: Box<Literal> = <Box<
                    Literal,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::Literal(node)))
            }
            __ExpressionOrSuperTag::LogicalExpression => {
                let node: Box<LogicalExpression> = <Box<
                    LogicalExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::LogicalExpression(node)))
            }
            __ExpressionOrSuperTag::MemberExpression => {
                let node: Box<MemberExpression> = <Box<
                    MemberExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::MemberExpression(node)))
            }
            __ExpressionOrSuperTag::MetaProperty => {
                let node: Box<MetaProperty> = <Box<
                    MetaProperty,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::MetaProperty(node)))
            }
            __ExpressionOrSuperTag::NewExpression => {
                let node: Box<NewExpression> = <Box<
                    NewExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::NewExpression(node)))
            }
            __ExpressionOrSuperTag::NullLiteral => {
                let node: Box<NullLiteral> = <Box<
                    NullLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::NullLiteral(node)))
            }
            __ExpressionOrSuperTag::NumericLiteral => {
                let node: Box<NumericLiteral> = <Box<
                    NumericLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::NumericLiteral(node)))
            }
            __ExpressionOrSuperTag::ObjectExpression => {
                let node: Box<ObjectExpression> = <Box<
                    ObjectExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::ObjectExpression(node)))
            }
            __ExpressionOrSuperTag::OptionalCallExpression => {
                let node: Box<OptionalCallExpression> = <Box<
                    OptionalCallExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    ExpressionOrSuper::Expression(
                        Expression::OptionalCallExpression(node),
                    ),
                )
            }
            __ExpressionOrSuperTag::OptionalMemberExpression => {
                let node: Box<OptionalMemberExpression> = <Box<
                    OptionalMemberExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    ExpressionOrSuper::Expression(
                        Expression::OptionalMemberExpression(node),
                    ),
                )
            }
            __ExpressionOrSuperTag::SequenceExpression => {
                let node: Box<SequenceExpression> = <Box<
                    SequenceExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::SequenceExpression(node)))
            }
            __ExpressionOrSuperTag::StringLiteral => {
                let node: Box<StringLiteral> = <Box<
                    StringLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::StringLiteral(node)))
            }
            __ExpressionOrSuperTag::TaggedTemplateExpression => {
                let node: Box<TaggedTemplateExpression> = <Box<
                    TaggedTemplateExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    ExpressionOrSuper::Expression(
                        Expression::TaggedTemplateExpression(node),
                    ),
                )
            }
            __ExpressionOrSuperTag::TemplateLiteral => {
                let node: Box<TemplateLiteral> = <Box<
                    TemplateLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::TemplateLiteral(node)))
            }
            __ExpressionOrSuperTag::ThisExpression => {
                let node: Box<ThisExpression> = <Box<
                    ThisExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::ThisExpression(node)))
            }
            __ExpressionOrSuperTag::UnaryExpression => {
                let node: Box<UnaryExpression> = <Box<
                    UnaryExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::UnaryExpression(node)))
            }
            __ExpressionOrSuperTag::UpdateExpression => {
                let node: Box<UpdateExpression> = <Box<
                    UpdateExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::UpdateExpression(node)))
            }
            __ExpressionOrSuperTag::YieldExpression => {
                let node: Box<YieldExpression> = <Box<
                    YieldExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::YieldExpression(node)))
            }
            __ExpressionOrSuperTag::Super => {
                let node: Box<Super> = <Box<
                    Super,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Super(node))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum ExpressionOrSpread {
    Expression(Expression),
    SpreadElement(Box<SpreadElement>),
}
#[derive(Deserialize, Debug)]
enum __ExpressionOrSpreadTag {
    ArrayExpression,
    ArrowFunctionExpression,
    AssignmentExpression,
    AwaitExpression,
    BinaryExpression,
    BooleanLiteral,
    CallExpression,
    ChainExpression,
    ClassExpression,
    ConditionalExpression,
    FunctionExpression,
    Identifier,
    ImportExpression,
    JSXElement,
    Literal,
    LogicalExpression,
    MemberExpression,
    MetaProperty,
    NewExpression,
    NullLiteral,
    NumericLiteral,
    ObjectExpression,
    OptionalCallExpression,
    OptionalMemberExpression,
    SequenceExpression,
    StringLiteral,
    TaggedTemplateExpression,
    TemplateLiteral,
    ThisExpression,
    UnaryExpression,
    UpdateExpression,
    YieldExpression,
    SpreadElement,
}
impl<'de> serde::Deserialize<'de> for ExpressionOrSpread {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __ExpressionOrSpreadTag,
            >::new("type", "ExpressionOrSpread"),
        )?;
        match tagged.0 {
            __ExpressionOrSpreadTag::ArrayExpression => {
                let node: Box<ArrayExpression> = <Box<
                    ArrayExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::ArrayExpression(node)))
            }
            __ExpressionOrSpreadTag::ArrowFunctionExpression => {
                let node: Box<ArrowFunctionExpression> = <Box<
                    ArrowFunctionExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    ExpressionOrSpread::Expression(
                        Expression::ArrowFunctionExpression(node),
                    ),
                )
            }
            __ExpressionOrSpreadTag::AssignmentExpression => {
                let node: Box<AssignmentExpression> = <Box<
                    AssignmentExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    ExpressionOrSpread::Expression(
                        Expression::AssignmentExpression(node),
                    ),
                )
            }
            __ExpressionOrSpreadTag::AwaitExpression => {
                let node: Box<AwaitExpression> = <Box<
                    AwaitExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::AwaitExpression(node)))
            }
            __ExpressionOrSpreadTag::BinaryExpression => {
                let node: Box<BinaryExpression> = <Box<
                    BinaryExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::BinaryExpression(node)))
            }
            __ExpressionOrSpreadTag::BooleanLiteral => {
                let node: Box<BooleanLiteral> = <Box<
                    BooleanLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::BooleanLiteral(node)))
            }
            __ExpressionOrSpreadTag::CallExpression => {
                let node: Box<CallExpression> = <Box<
                    CallExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::CallExpression(node)))
            }
            __ExpressionOrSpreadTag::ChainExpression => {
                let node: Box<ChainExpression> = <Box<
                    ChainExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::ChainExpression(node)))
            }
            __ExpressionOrSpreadTag::ClassExpression => {
                let node: Box<ClassExpression> = <Box<
                    ClassExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::ClassExpression(node)))
            }
            __ExpressionOrSpreadTag::ConditionalExpression => {
                let node: Box<ConditionalExpression> = <Box<
                    ConditionalExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    ExpressionOrSpread::Expression(
                        Expression::ConditionalExpression(node),
                    ),
                )
            }
            __ExpressionOrSpreadTag::FunctionExpression => {
                let node: Box<FunctionExpression> = <Box<
                    FunctionExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::FunctionExpression(node)))
            }
            __ExpressionOrSpreadTag::Identifier => {
                let node: Box<Identifier> = <Box<
                    Identifier,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::Identifier(node)))
            }
            __ExpressionOrSpreadTag::ImportExpression => {
                let node: Box<ImportExpression> = <Box<
                    ImportExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::ImportExpression(node)))
            }
            __ExpressionOrSpreadTag::JSXElement => {
                let node: Box<JSXElement> = <Box<
                    JSXElement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::JSXElement(node)))
            }
            __ExpressionOrSpreadTag::Literal => {
                let node: Box<Literal> = <Box<
                    Literal,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::Literal(node)))
            }
            __ExpressionOrSpreadTag::LogicalExpression => {
                let node: Box<LogicalExpression> = <Box<
                    LogicalExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::LogicalExpression(node)))
            }
            __ExpressionOrSpreadTag::MemberExpression => {
                let node: Box<MemberExpression> = <Box<
                    MemberExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::MemberExpression(node)))
            }
            __ExpressionOrSpreadTag::MetaProperty => {
                let node: Box<MetaProperty> = <Box<
                    MetaProperty,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::MetaProperty(node)))
            }
            __ExpressionOrSpreadTag::NewExpression => {
                let node: Box<NewExpression> = <Box<
                    NewExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::NewExpression(node)))
            }
            __ExpressionOrSpreadTag::NullLiteral => {
                let node: Box<NullLiteral> = <Box<
                    NullLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::NullLiteral(node)))
            }
            __ExpressionOrSpreadTag::NumericLiteral => {
                let node: Box<NumericLiteral> = <Box<
                    NumericLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::NumericLiteral(node)))
            }
            __ExpressionOrSpreadTag::ObjectExpression => {
                let node: Box<ObjectExpression> = <Box<
                    ObjectExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::ObjectExpression(node)))
            }
            __ExpressionOrSpreadTag::OptionalCallExpression => {
                let node: Box<OptionalCallExpression> = <Box<
                    OptionalCallExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    ExpressionOrSpread::Expression(
                        Expression::OptionalCallExpression(node),
                    ),
                )
            }
            __ExpressionOrSpreadTag::OptionalMemberExpression => {
                let node: Box<OptionalMemberExpression> = <Box<
                    OptionalMemberExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    ExpressionOrSpread::Expression(
                        Expression::OptionalMemberExpression(node),
                    ),
                )
            }
            __ExpressionOrSpreadTag::SequenceExpression => {
                let node: Box<SequenceExpression> = <Box<
                    SequenceExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::SequenceExpression(node)))
            }
            __ExpressionOrSpreadTag::StringLiteral => {
                let node: Box<StringLiteral> = <Box<
                    StringLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::StringLiteral(node)))
            }
            __ExpressionOrSpreadTag::TaggedTemplateExpression => {
                let node: Box<TaggedTemplateExpression> = <Box<
                    TaggedTemplateExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    ExpressionOrSpread::Expression(
                        Expression::TaggedTemplateExpression(node),
                    ),
                )
            }
            __ExpressionOrSpreadTag::TemplateLiteral => {
                let node: Box<TemplateLiteral> = <Box<
                    TemplateLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::TemplateLiteral(node)))
            }
            __ExpressionOrSpreadTag::ThisExpression => {
                let node: Box<ThisExpression> = <Box<
                    ThisExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::ThisExpression(node)))
            }
            __ExpressionOrSpreadTag::UnaryExpression => {
                let node: Box<UnaryExpression> = <Box<
                    UnaryExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::UnaryExpression(node)))
            }
            __ExpressionOrSpreadTag::UpdateExpression => {
                let node: Box<UpdateExpression> = <Box<
                    UpdateExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::UpdateExpression(node)))
            }
            __ExpressionOrSpreadTag::YieldExpression => {
                let node: Box<YieldExpression> = <Box<
                    YieldExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::YieldExpression(node)))
            }
            __ExpressionOrSpreadTag::SpreadElement => {
                let node: Box<SpreadElement> = <Box<
                    SpreadElement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::SpreadElement(node))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum FunctionBody {
    BlockStatement(Box<BlockStatement>),
    Expression(Expression),
}
#[derive(Deserialize, Debug)]
enum __FunctionBodyTag {
    BlockStatement,
    ArrayExpression,
    ArrowFunctionExpression,
    AssignmentExpression,
    AwaitExpression,
    BinaryExpression,
    BooleanLiteral,
    CallExpression,
    ChainExpression,
    ClassExpression,
    ConditionalExpression,
    FunctionExpression,
    Identifier,
    ImportExpression,
    JSXElement,
    Literal,
    LogicalExpression,
    MemberExpression,
    MetaProperty,
    NewExpression,
    NullLiteral,
    NumericLiteral,
    ObjectExpression,
    OptionalCallExpression,
    OptionalMemberExpression,
    SequenceExpression,
    StringLiteral,
    TaggedTemplateExpression,
    TemplateLiteral,
    ThisExpression,
    UnaryExpression,
    UpdateExpression,
    YieldExpression,
}
impl<'de> serde::Deserialize<'de> for FunctionBody {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __FunctionBodyTag,
            >::new("type", "FunctionBody"),
        )?;
        match tagged.0 {
            __FunctionBodyTag::BlockStatement => {
                let node: Box<BlockStatement> = <Box<
                    BlockStatement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::BlockStatement(node))
            }
            __FunctionBodyTag::ArrayExpression => {
                let node: Box<ArrayExpression> = <Box<
                    ArrayExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::ArrayExpression(node)))
            }
            __FunctionBodyTag::ArrowFunctionExpression => {
                let node: Box<ArrowFunctionExpression> = <Box<
                    ArrowFunctionExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::ArrowFunctionExpression(node)))
            }
            __FunctionBodyTag::AssignmentExpression => {
                let node: Box<AssignmentExpression> = <Box<
                    AssignmentExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::AssignmentExpression(node)))
            }
            __FunctionBodyTag::AwaitExpression => {
                let node: Box<AwaitExpression> = <Box<
                    AwaitExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::AwaitExpression(node)))
            }
            __FunctionBodyTag::BinaryExpression => {
                let node: Box<BinaryExpression> = <Box<
                    BinaryExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::BinaryExpression(node)))
            }
            __FunctionBodyTag::BooleanLiteral => {
                let node: Box<BooleanLiteral> = <Box<
                    BooleanLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::BooleanLiteral(node)))
            }
            __FunctionBodyTag::CallExpression => {
                let node: Box<CallExpression> = <Box<
                    CallExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::CallExpression(node)))
            }
            __FunctionBodyTag::ChainExpression => {
                let node: Box<ChainExpression> = <Box<
                    ChainExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::ChainExpression(node)))
            }
            __FunctionBodyTag::ClassExpression => {
                let node: Box<ClassExpression> = <Box<
                    ClassExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::ClassExpression(node)))
            }
            __FunctionBodyTag::ConditionalExpression => {
                let node: Box<ConditionalExpression> = <Box<
                    ConditionalExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::ConditionalExpression(node)))
            }
            __FunctionBodyTag::FunctionExpression => {
                let node: Box<FunctionExpression> = <Box<
                    FunctionExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::FunctionExpression(node)))
            }
            __FunctionBodyTag::Identifier => {
                let node: Box<Identifier> = <Box<
                    Identifier,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::Identifier(node)))
            }
            __FunctionBodyTag::ImportExpression => {
                let node: Box<ImportExpression> = <Box<
                    ImportExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::ImportExpression(node)))
            }
            __FunctionBodyTag::JSXElement => {
                let node: Box<JSXElement> = <Box<
                    JSXElement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::JSXElement(node)))
            }
            __FunctionBodyTag::Literal => {
                let node: Box<Literal> = <Box<
                    Literal,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::Literal(node)))
            }
            __FunctionBodyTag::LogicalExpression => {
                let node: Box<LogicalExpression> = <Box<
                    LogicalExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::LogicalExpression(node)))
            }
            __FunctionBodyTag::MemberExpression => {
                let node: Box<MemberExpression> = <Box<
                    MemberExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::MemberExpression(node)))
            }
            __FunctionBodyTag::MetaProperty => {
                let node: Box<MetaProperty> = <Box<
                    MetaProperty,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::MetaProperty(node)))
            }
            __FunctionBodyTag::NewExpression => {
                let node: Box<NewExpression> = <Box<
                    NewExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::NewExpression(node)))
            }
            __FunctionBodyTag::NullLiteral => {
                let node: Box<NullLiteral> = <Box<
                    NullLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::NullLiteral(node)))
            }
            __FunctionBodyTag::NumericLiteral => {
                let node: Box<NumericLiteral> = <Box<
                    NumericLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::NumericLiteral(node)))
            }
            __FunctionBodyTag::ObjectExpression => {
                let node: Box<ObjectExpression> = <Box<
                    ObjectExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::ObjectExpression(node)))
            }
            __FunctionBodyTag::OptionalCallExpression => {
                let node: Box<OptionalCallExpression> = <Box<
                    OptionalCallExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::OptionalCallExpression(node)))
            }
            __FunctionBodyTag::OptionalMemberExpression => {
                let node: Box<OptionalMemberExpression> = <Box<
                    OptionalMemberExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::OptionalMemberExpression(node)))
            }
            __FunctionBodyTag::SequenceExpression => {
                let node: Box<SequenceExpression> = <Box<
                    SequenceExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::SequenceExpression(node)))
            }
            __FunctionBodyTag::StringLiteral => {
                let node: Box<StringLiteral> = <Box<
                    StringLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::StringLiteral(node)))
            }
            __FunctionBodyTag::TaggedTemplateExpression => {
                let node: Box<TaggedTemplateExpression> = <Box<
                    TaggedTemplateExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::TaggedTemplateExpression(node)))
            }
            __FunctionBodyTag::TemplateLiteral => {
                let node: Box<TemplateLiteral> = <Box<
                    TemplateLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::TemplateLiteral(node)))
            }
            __FunctionBodyTag::ThisExpression => {
                let node: Box<ThisExpression> = <Box<
                    ThisExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::ThisExpression(node)))
            }
            __FunctionBodyTag::UnaryExpression => {
                let node: Box<UnaryExpression> = <Box<
                    UnaryExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::UnaryExpression(node)))
            }
            __FunctionBodyTag::UpdateExpression => {
                let node: Box<UpdateExpression> = <Box<
                    UpdateExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::UpdateExpression(node)))
            }
            __FunctionBodyTag::YieldExpression => {
                let node: Box<YieldExpression> = <Box<
                    YieldExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::YieldExpression(node)))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum Pattern {
    ArrayPattern(Box<ArrayPattern>),
    AssignmentPattern(Box<AssignmentPattern>),
    Identifier(Box<Identifier>),
    ObjectPattern(Box<ObjectPattern>),
    RestElement(Box<RestElement>),
}
#[derive(Deserialize, Debug)]
enum __PatternTag {
    Identifier,
    ArrayPattern,
    ObjectPattern,
    RestElement,
    AssignmentPattern,
}
impl<'de> serde::Deserialize<'de> for Pattern {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __PatternTag,
            >::new("type", "Pattern"),
        )?;
        match tagged.0 {
            __PatternTag::Identifier => {
                let node: Box<Identifier> = <Box<
                    Identifier,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Pattern::Identifier(node))
            }
            __PatternTag::ArrayPattern => {
                let node: Box<ArrayPattern> = <Box<
                    ArrayPattern,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Pattern::ArrayPattern(node))
            }
            __PatternTag::ObjectPattern => {
                let node: Box<ObjectPattern> = <Box<
                    ObjectPattern,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Pattern::ObjectPattern(node))
            }
            __PatternTag::RestElement => {
                let node: Box<RestElement> = <Box<
                    RestElement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Pattern::RestElement(node))
            }
            __PatternTag::AssignmentPattern => {
                let node: Box<AssignmentPattern> = <Box<
                    AssignmentPattern,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Pattern::AssignmentPattern(node))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum ForInit {
    Expression(Expression),
    VariableDeclaration(Box<VariableDeclaration>),
}
#[derive(Deserialize, Debug)]
enum __ForInitTag {
    ArrayExpression,
    ArrowFunctionExpression,
    AssignmentExpression,
    AwaitExpression,
    BinaryExpression,
    BooleanLiteral,
    CallExpression,
    ChainExpression,
    ClassExpression,
    ConditionalExpression,
    FunctionExpression,
    Identifier,
    ImportExpression,
    JSXElement,
    Literal,
    LogicalExpression,
    MemberExpression,
    MetaProperty,
    NewExpression,
    NullLiteral,
    NumericLiteral,
    ObjectExpression,
    OptionalCallExpression,
    OptionalMemberExpression,
    SequenceExpression,
    StringLiteral,
    TaggedTemplateExpression,
    TemplateLiteral,
    ThisExpression,
    UnaryExpression,
    UpdateExpression,
    YieldExpression,
    VariableDeclaration,
}
impl<'de> serde::Deserialize<'de> for ForInit {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __ForInitTag,
            >::new("type", "ForInit"),
        )?;
        match tagged.0 {
            __ForInitTag::ArrayExpression => {
                let node: Box<ArrayExpression> = <Box<
                    ArrayExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::ArrayExpression(node)))
            }
            __ForInitTag::ArrowFunctionExpression => {
                let node: Box<ArrowFunctionExpression> = <Box<
                    ArrowFunctionExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::ArrowFunctionExpression(node)))
            }
            __ForInitTag::AssignmentExpression => {
                let node: Box<AssignmentExpression> = <Box<
                    AssignmentExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::AssignmentExpression(node)))
            }
            __ForInitTag::AwaitExpression => {
                let node: Box<AwaitExpression> = <Box<
                    AwaitExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::AwaitExpression(node)))
            }
            __ForInitTag::BinaryExpression => {
                let node: Box<BinaryExpression> = <Box<
                    BinaryExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::BinaryExpression(node)))
            }
            __ForInitTag::BooleanLiteral => {
                let node: Box<BooleanLiteral> = <Box<
                    BooleanLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::BooleanLiteral(node)))
            }
            __ForInitTag::CallExpression => {
                let node: Box<CallExpression> = <Box<
                    CallExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::CallExpression(node)))
            }
            __ForInitTag::ChainExpression => {
                let node: Box<ChainExpression> = <Box<
                    ChainExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::ChainExpression(node)))
            }
            __ForInitTag::ClassExpression => {
                let node: Box<ClassExpression> = <Box<
                    ClassExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::ClassExpression(node)))
            }
            __ForInitTag::ConditionalExpression => {
                let node: Box<ConditionalExpression> = <Box<
                    ConditionalExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::ConditionalExpression(node)))
            }
            __ForInitTag::FunctionExpression => {
                let node: Box<FunctionExpression> = <Box<
                    FunctionExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::FunctionExpression(node)))
            }
            __ForInitTag::Identifier => {
                let node: Box<Identifier> = <Box<
                    Identifier,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::Identifier(node)))
            }
            __ForInitTag::ImportExpression => {
                let node: Box<ImportExpression> = <Box<
                    ImportExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::ImportExpression(node)))
            }
            __ForInitTag::JSXElement => {
                let node: Box<JSXElement> = <Box<
                    JSXElement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::JSXElement(node)))
            }
            __ForInitTag::Literal => {
                let node: Box<Literal> = <Box<
                    Literal,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::Literal(node)))
            }
            __ForInitTag::LogicalExpression => {
                let node: Box<LogicalExpression> = <Box<
                    LogicalExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::LogicalExpression(node)))
            }
            __ForInitTag::MemberExpression => {
                let node: Box<MemberExpression> = <Box<
                    MemberExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::MemberExpression(node)))
            }
            __ForInitTag::MetaProperty => {
                let node: Box<MetaProperty> = <Box<
                    MetaProperty,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::MetaProperty(node)))
            }
            __ForInitTag::NewExpression => {
                let node: Box<NewExpression> = <Box<
                    NewExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::NewExpression(node)))
            }
            __ForInitTag::NullLiteral => {
                let node: Box<NullLiteral> = <Box<
                    NullLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::NullLiteral(node)))
            }
            __ForInitTag::NumericLiteral => {
                let node: Box<NumericLiteral> = <Box<
                    NumericLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::NumericLiteral(node)))
            }
            __ForInitTag::ObjectExpression => {
                let node: Box<ObjectExpression> = <Box<
                    ObjectExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::ObjectExpression(node)))
            }
            __ForInitTag::OptionalCallExpression => {
                let node: Box<OptionalCallExpression> = <Box<
                    OptionalCallExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::OptionalCallExpression(node)))
            }
            __ForInitTag::OptionalMemberExpression => {
                let node: Box<OptionalMemberExpression> = <Box<
                    OptionalMemberExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::OptionalMemberExpression(node)))
            }
            __ForInitTag::SequenceExpression => {
                let node: Box<SequenceExpression> = <Box<
                    SequenceExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::SequenceExpression(node)))
            }
            __ForInitTag::StringLiteral => {
                let node: Box<StringLiteral> = <Box<
                    StringLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::StringLiteral(node)))
            }
            __ForInitTag::TaggedTemplateExpression => {
                let node: Box<TaggedTemplateExpression> = <Box<
                    TaggedTemplateExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::TaggedTemplateExpression(node)))
            }
            __ForInitTag::TemplateLiteral => {
                let node: Box<TemplateLiteral> = <Box<
                    TemplateLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::TemplateLiteral(node)))
            }
            __ForInitTag::ThisExpression => {
                let node: Box<ThisExpression> = <Box<
                    ThisExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::ThisExpression(node)))
            }
            __ForInitTag::UnaryExpression => {
                let node: Box<UnaryExpression> = <Box<
                    UnaryExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::UnaryExpression(node)))
            }
            __ForInitTag::UpdateExpression => {
                let node: Box<UpdateExpression> = <Box<
                    UpdateExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::UpdateExpression(node)))
            }
            __ForInitTag::YieldExpression => {
                let node: Box<YieldExpression> = <Box<
                    YieldExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::YieldExpression(node)))
            }
            __ForInitTag::VariableDeclaration => {
                let node: Box<VariableDeclaration> = <Box<
                    VariableDeclaration,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::VariableDeclaration(node))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum ForInInit {
    Pattern(Pattern),
    VariableDeclaration(Box<VariableDeclaration>),
}
#[derive(Deserialize, Debug)]
enum __ForInInitTag {
    Identifier,
    ArrayPattern,
    ObjectPattern,
    RestElement,
    AssignmentPattern,
    VariableDeclaration,
}
impl<'de> serde::Deserialize<'de> for ForInInit {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __ForInInitTag,
            >::new("type", "ForInInit"),
        )?;
        match tagged.0 {
            __ForInInitTag::Identifier => {
                let node: Box<Identifier> = <Box<
                    Identifier,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInInit::Pattern(Pattern::Identifier(node)))
            }
            __ForInInitTag::ArrayPattern => {
                let node: Box<ArrayPattern> = <Box<
                    ArrayPattern,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInInit::Pattern(Pattern::ArrayPattern(node)))
            }
            __ForInInitTag::ObjectPattern => {
                let node: Box<ObjectPattern> = <Box<
                    ObjectPattern,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInInit::Pattern(Pattern::ObjectPattern(node)))
            }
            __ForInInitTag::RestElement => {
                let node: Box<RestElement> = <Box<
                    RestElement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInInit::Pattern(Pattern::RestElement(node)))
            }
            __ForInInitTag::AssignmentPattern => {
                let node: Box<AssignmentPattern> = <Box<
                    AssignmentPattern,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInInit::Pattern(Pattern::AssignmentPattern(node)))
            }
            __ForInInitTag::VariableDeclaration => {
                let node: Box<VariableDeclaration> = <Box<
                    VariableDeclaration,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInInit::VariableDeclaration(node))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum PropertyOrSpreadElement {
    Property(Box<Property>),
    SpreadElement(Box<SpreadElement>),
}
#[derive(Deserialize, Debug)]
enum __PropertyOrSpreadElementTag {
    Property,
    SpreadElement,
}
impl<'de> serde::Deserialize<'de> for PropertyOrSpreadElement {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __PropertyOrSpreadElementTag,
            >::new("type", "PropertyOrSpreadElement"),
        )?;
        match tagged.0 {
            __PropertyOrSpreadElementTag::Property => {
                let node: Box<Property> = <Box<
                    Property,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(PropertyOrSpreadElement::Property(node))
            }
            __PropertyOrSpreadElementTag::SpreadElement => {
                let node: Box<SpreadElement> = <Box<
                    SpreadElement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(PropertyOrSpreadElement::SpreadElement(node))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum AssignmentPropertyOrRestElement {
    AssignmentProperty(Box<AssignmentProperty>),
    RestElement(Box<RestElement>),
}
#[derive(Deserialize, Debug)]
enum __AssignmentPropertyOrRestElementTag {
    AssignmentProperty,
    RestElement,
}
impl<'de> serde::Deserialize<'de> for AssignmentPropertyOrRestElement {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __AssignmentPropertyOrRestElementTag,
            >::new("type", "AssignmentPropertyOrRestElement"),
        )?;
        match tagged.0 {
            __AssignmentPropertyOrRestElementTag::AssignmentProperty => {
                let node: Box<AssignmentProperty> = <Box<
                    AssignmentProperty,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentPropertyOrRestElement::AssignmentProperty(node))
            }
            __AssignmentPropertyOrRestElementTag::RestElement => {
                let node: Box<RestElement> = <Box<
                    RestElement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentPropertyOrRestElement::RestElement(node))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum PropertyKey {
    Identifier(Box<Identifier>),
    Literal(Box<Literal>),
}
#[derive(Deserialize, Debug)]
enum __PropertyKeyTag {
    Identifier,
    Literal,
}
impl<'de> serde::Deserialize<'de> for PropertyKey {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __PropertyKeyTag,
            >::new("type", "PropertyKey"),
        )?;
        match tagged.0 {
            __PropertyKeyTag::Identifier => {
                let node: Box<Identifier> = <Box<
                    Identifier,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(PropertyKey::Identifier(node))
            }
            __PropertyKeyTag::Literal => {
                let node: Box<Literal> = <Box<
                    Literal,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(PropertyKey::Literal(node))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum AssignmentTarget {
    Expression(Expression),
    Pattern(Pattern),
}
#[derive(Deserialize, Debug)]
enum __AssignmentTargetTag {
    ArrayExpression,
    ArrowFunctionExpression,
    AssignmentExpression,
    AwaitExpression,
    BinaryExpression,
    BooleanLiteral,
    CallExpression,
    ChainExpression,
    ClassExpression,
    ConditionalExpression,
    FunctionExpression,
    Identifier,
    ImportExpression,
    JSXElement,
    Literal,
    LogicalExpression,
    MemberExpression,
    MetaProperty,
    NewExpression,
    NullLiteral,
    NumericLiteral,
    ObjectExpression,
    OptionalCallExpression,
    OptionalMemberExpression,
    SequenceExpression,
    StringLiteral,
    TaggedTemplateExpression,
    TemplateLiteral,
    ThisExpression,
    UnaryExpression,
    UpdateExpression,
    YieldExpression,
    ArrayPattern,
    ObjectPattern,
    RestElement,
    AssignmentPattern,
}
impl<'de> serde::Deserialize<'de> for AssignmentTarget {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __AssignmentTargetTag,
            >::new("type", "AssignmentTarget"),
        )?;
        match tagged.0 {
            __AssignmentTargetTag::ArrayExpression => {
                let node: Box<ArrayExpression> = <Box<
                    ArrayExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::ArrayExpression(node)))
            }
            __AssignmentTargetTag::ArrowFunctionExpression => {
                let node: Box<ArrowFunctionExpression> = <Box<
                    ArrowFunctionExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    AssignmentTarget::Expression(
                        Expression::ArrowFunctionExpression(node),
                    ),
                )
            }
            __AssignmentTargetTag::AssignmentExpression => {
                let node: Box<AssignmentExpression> = <Box<
                    AssignmentExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::AssignmentExpression(node)))
            }
            __AssignmentTargetTag::AwaitExpression => {
                let node: Box<AwaitExpression> = <Box<
                    AwaitExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::AwaitExpression(node)))
            }
            __AssignmentTargetTag::BinaryExpression => {
                let node: Box<BinaryExpression> = <Box<
                    BinaryExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::BinaryExpression(node)))
            }
            __AssignmentTargetTag::BooleanLiteral => {
                let node: Box<BooleanLiteral> = <Box<
                    BooleanLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::BooleanLiteral(node)))
            }
            __AssignmentTargetTag::CallExpression => {
                let node: Box<CallExpression> = <Box<
                    CallExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::CallExpression(node)))
            }
            __AssignmentTargetTag::ChainExpression => {
                let node: Box<ChainExpression> = <Box<
                    ChainExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::ChainExpression(node)))
            }
            __AssignmentTargetTag::ClassExpression => {
                let node: Box<ClassExpression> = <Box<
                    ClassExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::ClassExpression(node)))
            }
            __AssignmentTargetTag::ConditionalExpression => {
                let node: Box<ConditionalExpression> = <Box<
                    ConditionalExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::ConditionalExpression(node)))
            }
            __AssignmentTargetTag::FunctionExpression => {
                let node: Box<FunctionExpression> = <Box<
                    FunctionExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::FunctionExpression(node)))
            }
            __AssignmentTargetTag::Identifier => {
                let node: Box<Identifier> = <Box<
                    Identifier,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::Identifier(node)))
            }
            __AssignmentTargetTag::ImportExpression => {
                let node: Box<ImportExpression> = <Box<
                    ImportExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::ImportExpression(node)))
            }
            __AssignmentTargetTag::JSXElement => {
                let node: Box<JSXElement> = <Box<
                    JSXElement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::JSXElement(node)))
            }
            __AssignmentTargetTag::Literal => {
                let node: Box<Literal> = <Box<
                    Literal,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::Literal(node)))
            }
            __AssignmentTargetTag::LogicalExpression => {
                let node: Box<LogicalExpression> = <Box<
                    LogicalExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::LogicalExpression(node)))
            }
            __AssignmentTargetTag::MemberExpression => {
                let node: Box<MemberExpression> = <Box<
                    MemberExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::MemberExpression(node)))
            }
            __AssignmentTargetTag::MetaProperty => {
                let node: Box<MetaProperty> = <Box<
                    MetaProperty,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::MetaProperty(node)))
            }
            __AssignmentTargetTag::NewExpression => {
                let node: Box<NewExpression> = <Box<
                    NewExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::NewExpression(node)))
            }
            __AssignmentTargetTag::NullLiteral => {
                let node: Box<NullLiteral> = <Box<
                    NullLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::NullLiteral(node)))
            }
            __AssignmentTargetTag::NumericLiteral => {
                let node: Box<NumericLiteral> = <Box<
                    NumericLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::NumericLiteral(node)))
            }
            __AssignmentTargetTag::ObjectExpression => {
                let node: Box<ObjectExpression> = <Box<
                    ObjectExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::ObjectExpression(node)))
            }
            __AssignmentTargetTag::OptionalCallExpression => {
                let node: Box<OptionalCallExpression> = <Box<
                    OptionalCallExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    AssignmentTarget::Expression(
                        Expression::OptionalCallExpression(node),
                    ),
                )
            }
            __AssignmentTargetTag::OptionalMemberExpression => {
                let node: Box<OptionalMemberExpression> = <Box<
                    OptionalMemberExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    AssignmentTarget::Expression(
                        Expression::OptionalMemberExpression(node),
                    ),
                )
            }
            __AssignmentTargetTag::SequenceExpression => {
                let node: Box<SequenceExpression> = <Box<
                    SequenceExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::SequenceExpression(node)))
            }
            __AssignmentTargetTag::StringLiteral => {
                let node: Box<StringLiteral> = <Box<
                    StringLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::StringLiteral(node)))
            }
            __AssignmentTargetTag::TaggedTemplateExpression => {
                let node: Box<TaggedTemplateExpression> = <Box<
                    TaggedTemplateExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    AssignmentTarget::Expression(
                        Expression::TaggedTemplateExpression(node),
                    ),
                )
            }
            __AssignmentTargetTag::TemplateLiteral => {
                let node: Box<TemplateLiteral> = <Box<
                    TemplateLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::TemplateLiteral(node)))
            }
            __AssignmentTargetTag::ThisExpression => {
                let node: Box<ThisExpression> = <Box<
                    ThisExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::ThisExpression(node)))
            }
            __AssignmentTargetTag::UnaryExpression => {
                let node: Box<UnaryExpression> = <Box<
                    UnaryExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::UnaryExpression(node)))
            }
            __AssignmentTargetTag::UpdateExpression => {
                let node: Box<UpdateExpression> = <Box<
                    UpdateExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::UpdateExpression(node)))
            }
            __AssignmentTargetTag::YieldExpression => {
                let node: Box<YieldExpression> = <Box<
                    YieldExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::YieldExpression(node)))
            }
            __AssignmentTargetTag::ArrayPattern => {
                let node: Box<ArrayPattern> = <Box<
                    ArrayPattern,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Pattern(Pattern::ArrayPattern(node)))
            }
            __AssignmentTargetTag::ObjectPattern => {
                let node: Box<ObjectPattern> = <Box<
                    ObjectPattern,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Pattern(Pattern::ObjectPattern(node)))
            }
            __AssignmentTargetTag::RestElement => {
                let node: Box<RestElement> = <Box<
                    RestElement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Pattern(Pattern::RestElement(node)))
            }
            __AssignmentTargetTag::AssignmentPattern => {
                let node: Box<AssignmentPattern> = <Box<
                    AssignmentPattern,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Pattern(Pattern::AssignmentPattern(node)))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum ChainElement {
    CallExpression(Box<CallExpression>),
    MemberExpression(Box<MemberExpression>),
}
#[derive(Deserialize, Debug)]
enum __ChainElementTag {
    CallExpression,
    MemberExpression,
}
impl<'de> serde::Deserialize<'de> for ChainElement {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __ChainElementTag,
            >::new("type", "ChainElement"),
        )?;
        match tagged.0 {
            __ChainElementTag::CallExpression => {
                let node: Box<CallExpression> = <Box<
                    CallExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ChainElement::CallExpression(node))
            }
            __ChainElementTag::MemberExpression => {
                let node: Box<MemberExpression> = <Box<
                    MemberExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ChainElement::MemberExpression(node))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum JSXMemberExpressionOrIdentifier {
    JSXIdentifier(Box<JSXIdentifier>),
    JSXMemberExpression(Box<JSXMemberExpression>),
}
#[derive(Deserialize, Debug)]
enum __JSXMemberExpressionOrIdentifierTag {
    JSXMemberExpression,
    JSXIdentifier,
}
impl<'de> serde::Deserialize<'de> for JSXMemberExpressionOrIdentifier {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __JSXMemberExpressionOrIdentifierTag,
            >::new("type", "JSXMemberExpressionOrIdentifier"),
        )?;
        match tagged.0 {
            __JSXMemberExpressionOrIdentifierTag::JSXMemberExpression => {
                let node: Box<JSXMemberExpression> = <Box<
                    JSXMemberExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXMemberExpressionOrIdentifier::JSXMemberExpression(node))
            }
            __JSXMemberExpressionOrIdentifierTag::JSXIdentifier => {
                let node: Box<JSXIdentifier> = <Box<
                    JSXIdentifier,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXMemberExpressionOrIdentifier::JSXIdentifier(node))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum JSXExpressionOrEmpty {
    Expression(Expression),
    JSXEmptyExpression(Box<JSXEmptyExpression>),
}
#[derive(Deserialize, Debug)]
enum __JSXExpressionOrEmptyTag {
    ArrayExpression,
    ArrowFunctionExpression,
    AssignmentExpression,
    AwaitExpression,
    BinaryExpression,
    BooleanLiteral,
    CallExpression,
    ChainExpression,
    ClassExpression,
    ConditionalExpression,
    FunctionExpression,
    Identifier,
    ImportExpression,
    JSXElement,
    Literal,
    LogicalExpression,
    MemberExpression,
    MetaProperty,
    NewExpression,
    NullLiteral,
    NumericLiteral,
    ObjectExpression,
    OptionalCallExpression,
    OptionalMemberExpression,
    SequenceExpression,
    StringLiteral,
    TaggedTemplateExpression,
    TemplateLiteral,
    ThisExpression,
    UnaryExpression,
    UpdateExpression,
    YieldExpression,
    JSXEmptyExpression,
}
impl<'de> serde::Deserialize<'de> for JSXExpressionOrEmpty {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __JSXExpressionOrEmptyTag,
            >::new("type", "JSXExpressionOrEmpty"),
        )?;
        match tagged.0 {
            __JSXExpressionOrEmptyTag::ArrayExpression => {
                let node: Box<ArrayExpression> = <Box<
                    ArrayExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::ArrayExpression(node)))
            }
            __JSXExpressionOrEmptyTag::ArrowFunctionExpression => {
                let node: Box<ArrowFunctionExpression> = <Box<
                    ArrowFunctionExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    JSXExpressionOrEmpty::Expression(
                        Expression::ArrowFunctionExpression(node),
                    ),
                )
            }
            __JSXExpressionOrEmptyTag::AssignmentExpression => {
                let node: Box<AssignmentExpression> = <Box<
                    AssignmentExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    JSXExpressionOrEmpty::Expression(
                        Expression::AssignmentExpression(node),
                    ),
                )
            }
            __JSXExpressionOrEmptyTag::AwaitExpression => {
                let node: Box<AwaitExpression> = <Box<
                    AwaitExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::AwaitExpression(node)))
            }
            __JSXExpressionOrEmptyTag::BinaryExpression => {
                let node: Box<BinaryExpression> = <Box<
                    BinaryExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::BinaryExpression(node)))
            }
            __JSXExpressionOrEmptyTag::BooleanLiteral => {
                let node: Box<BooleanLiteral> = <Box<
                    BooleanLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::BooleanLiteral(node)))
            }
            __JSXExpressionOrEmptyTag::CallExpression => {
                let node: Box<CallExpression> = <Box<
                    CallExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::CallExpression(node)))
            }
            __JSXExpressionOrEmptyTag::ChainExpression => {
                let node: Box<ChainExpression> = <Box<
                    ChainExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::ChainExpression(node)))
            }
            __JSXExpressionOrEmptyTag::ClassExpression => {
                let node: Box<ClassExpression> = <Box<
                    ClassExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::ClassExpression(node)))
            }
            __JSXExpressionOrEmptyTag::ConditionalExpression => {
                let node: Box<ConditionalExpression> = <Box<
                    ConditionalExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    JSXExpressionOrEmpty::Expression(
                        Expression::ConditionalExpression(node),
                    ),
                )
            }
            __JSXExpressionOrEmptyTag::FunctionExpression => {
                let node: Box<FunctionExpression> = <Box<
                    FunctionExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    JSXExpressionOrEmpty::Expression(
                        Expression::FunctionExpression(node),
                    ),
                )
            }
            __JSXExpressionOrEmptyTag::Identifier => {
                let node: Box<Identifier> = <Box<
                    Identifier,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::Identifier(node)))
            }
            __JSXExpressionOrEmptyTag::ImportExpression => {
                let node: Box<ImportExpression> = <Box<
                    ImportExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::ImportExpression(node)))
            }
            __JSXExpressionOrEmptyTag::JSXElement => {
                let node: Box<JSXElement> = <Box<
                    JSXElement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::JSXElement(node)))
            }
            __JSXExpressionOrEmptyTag::Literal => {
                let node: Box<Literal> = <Box<
                    Literal,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::Literal(node)))
            }
            __JSXExpressionOrEmptyTag::LogicalExpression => {
                let node: Box<LogicalExpression> = <Box<
                    LogicalExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::LogicalExpression(node)))
            }
            __JSXExpressionOrEmptyTag::MemberExpression => {
                let node: Box<MemberExpression> = <Box<
                    MemberExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::MemberExpression(node)))
            }
            __JSXExpressionOrEmptyTag::MetaProperty => {
                let node: Box<MetaProperty> = <Box<
                    MetaProperty,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::MetaProperty(node)))
            }
            __JSXExpressionOrEmptyTag::NewExpression => {
                let node: Box<NewExpression> = <Box<
                    NewExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::NewExpression(node)))
            }
            __JSXExpressionOrEmptyTag::NullLiteral => {
                let node: Box<NullLiteral> = <Box<
                    NullLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::NullLiteral(node)))
            }
            __JSXExpressionOrEmptyTag::NumericLiteral => {
                let node: Box<NumericLiteral> = <Box<
                    NumericLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::NumericLiteral(node)))
            }
            __JSXExpressionOrEmptyTag::ObjectExpression => {
                let node: Box<ObjectExpression> = <Box<
                    ObjectExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::ObjectExpression(node)))
            }
            __JSXExpressionOrEmptyTag::OptionalCallExpression => {
                let node: Box<OptionalCallExpression> = <Box<
                    OptionalCallExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    JSXExpressionOrEmpty::Expression(
                        Expression::OptionalCallExpression(node),
                    ),
                )
            }
            __JSXExpressionOrEmptyTag::OptionalMemberExpression => {
                let node: Box<OptionalMemberExpression> = <Box<
                    OptionalMemberExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    JSXExpressionOrEmpty::Expression(
                        Expression::OptionalMemberExpression(node),
                    ),
                )
            }
            __JSXExpressionOrEmptyTag::SequenceExpression => {
                let node: Box<SequenceExpression> = <Box<
                    SequenceExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    JSXExpressionOrEmpty::Expression(
                        Expression::SequenceExpression(node),
                    ),
                )
            }
            __JSXExpressionOrEmptyTag::StringLiteral => {
                let node: Box<StringLiteral> = <Box<
                    StringLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::StringLiteral(node)))
            }
            __JSXExpressionOrEmptyTag::TaggedTemplateExpression => {
                let node: Box<TaggedTemplateExpression> = <Box<
                    TaggedTemplateExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(
                    JSXExpressionOrEmpty::Expression(
                        Expression::TaggedTemplateExpression(node),
                    ),
                )
            }
            __JSXExpressionOrEmptyTag::TemplateLiteral => {
                let node: Box<TemplateLiteral> = <Box<
                    TemplateLiteral,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::TemplateLiteral(node)))
            }
            __JSXExpressionOrEmptyTag::ThisExpression => {
                let node: Box<ThisExpression> = <Box<
                    ThisExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::ThisExpression(node)))
            }
            __JSXExpressionOrEmptyTag::UnaryExpression => {
                let node: Box<UnaryExpression> = <Box<
                    UnaryExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::UnaryExpression(node)))
            }
            __JSXExpressionOrEmptyTag::UpdateExpression => {
                let node: Box<UpdateExpression> = <Box<
                    UpdateExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::UpdateExpression(node)))
            }
            __JSXExpressionOrEmptyTag::YieldExpression => {
                let node: Box<YieldExpression> = <Box<
                    YieldExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::Expression(Expression::YieldExpression(node)))
            }
            __JSXExpressionOrEmptyTag::JSXEmptyExpression => {
                let node: Box<JSXEmptyExpression> = <Box<
                    JSXEmptyExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXExpressionOrEmpty::JSXEmptyExpression(node))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum JSXAttributeOrSpread {
    JSXAttribute(Box<JSXAttribute>),
    JSXSpreadAttribute(Box<JSXSpreadAttribute>),
}
#[derive(Deserialize, Debug)]
enum __JSXAttributeOrSpreadTag {
    JSXAttribute,
    JSXSpreadAttribute,
}
impl<'de> serde::Deserialize<'de> for JSXAttributeOrSpread {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __JSXAttributeOrSpreadTag,
            >::new("type", "JSXAttributeOrSpread"),
        )?;
        match tagged.0 {
            __JSXAttributeOrSpreadTag::JSXAttribute => {
                let node: Box<JSXAttribute> = <Box<
                    JSXAttribute,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXAttributeOrSpread::JSXAttribute(node))
            }
            __JSXAttributeOrSpreadTag::JSXSpreadAttribute => {
                let node: Box<JSXSpreadAttribute> = <Box<
                    JSXSpreadAttribute,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXAttributeOrSpread::JSXSpreadAttribute(node))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum JSXAttributeValue {
    JSXElement(Box<JSXElement>),
    JSXExpressionContainer(Box<JSXExpressionContainer>),
    JSXFragment(Box<JSXFragment>),
    Literal(Box<Literal>),
}
#[derive(Deserialize, Debug)]
enum __JSXAttributeValueTag {
    Literal,
    JSXExpressionContainer,
    JSXElement,
    JSXFragment,
}
impl<'de> serde::Deserialize<'de> for JSXAttributeValue {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __JSXAttributeValueTag,
            >::new("type", "JSXAttributeValue"),
        )?;
        match tagged.0 {
            __JSXAttributeValueTag::Literal => {
                let node: Box<Literal> = <Box<
                    Literal,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXAttributeValue::Literal(node))
            }
            __JSXAttributeValueTag::JSXExpressionContainer => {
                let node: Box<JSXExpressionContainer> = <Box<
                    JSXExpressionContainer,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXAttributeValue::JSXExpressionContainer(node))
            }
            __JSXAttributeValueTag::JSXElement => {
                let node: Box<JSXElement> = <Box<
                    JSXElement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXAttributeValue::JSXElement(node))
            }
            __JSXAttributeValueTag::JSXFragment => {
                let node: Box<JSXFragment> = <Box<
                    JSXFragment,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXAttributeValue::JSXFragment(node))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum JSXElementName {
    JSXIdentifier(Box<JSXIdentifier>),
    JSXMemberExpression(Box<JSXMemberExpression>),
    JSXNamespacedName(Box<JSXNamespacedName>),
}
#[derive(Deserialize, Debug)]
enum __JSXElementNameTag {
    JSXIdentifier,
    JSXMemberExpression,
    JSXNamespacedName,
}
impl<'de> serde::Deserialize<'de> for JSXElementName {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __JSXElementNameTag,
            >::new("type", "JSXElementName"),
        )?;
        match tagged.0 {
            __JSXElementNameTag::JSXIdentifier => {
                let node: Box<JSXIdentifier> = <Box<
                    JSXIdentifier,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXElementName::JSXIdentifier(node))
            }
            __JSXElementNameTag::JSXMemberExpression => {
                let node: Box<JSXMemberExpression> = <Box<
                    JSXMemberExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXElementName::JSXMemberExpression(node))
            }
            __JSXElementNameTag::JSXNamespacedName => {
                let node: Box<JSXNamespacedName> = <Box<
                    JSXNamespacedName,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXElementName::JSXNamespacedName(node))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum JSXIdentifierOrNamespacedName {
    JSXIdentifier(Box<JSXIdentifier>),
    JSXNamespacedName(Box<JSXNamespacedName>),
}
#[derive(Deserialize, Debug)]
enum __JSXIdentifierOrNamespacedNameTag {
    JSXIdentifier,
    JSXNamespacedName,
}
impl<'de> serde::Deserialize<'de> for JSXIdentifierOrNamespacedName {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __JSXIdentifierOrNamespacedNameTag,
            >::new("type", "JSXIdentifierOrNamespacedName"),
        )?;
        match tagged.0 {
            __JSXIdentifierOrNamespacedNameTag::JSXIdentifier => {
                let node: Box<JSXIdentifier> = <Box<
                    JSXIdentifier,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXIdentifierOrNamespacedName::JSXIdentifier(node))
            }
            __JSXIdentifierOrNamespacedNameTag::JSXNamespacedName => {
                let node: Box<JSXNamespacedName> = <Box<
                    JSXNamespacedName,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXIdentifierOrNamespacedName::JSXNamespacedName(node))
            }
        }
    }
}
#[derive(Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum JSXChildItem {
    JSXElement(Box<JSXElement>),
    JSXExpressionContainer(Box<JSXExpressionContainer>),
    JSXFragment(Box<JSXFragment>),
    JSXSpreadChild(Box<JSXSpreadChild>),
    JSXText(Box<JSXText>),
}
#[derive(Deserialize, Debug)]
enum __JSXChildItemTag {
    JSXText,
    JSXExpressionContainer,
    JSXSpreadChild,
    JSXElement,
    JSXFragment,
}
impl<'de> serde::Deserialize<'de> for JSXChildItem {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let tagged = serde::Deserializer::deserialize_any(
            deserializer,
            serde::__private::de::TaggedContentVisitor::<
                __JSXChildItemTag,
            >::new("type", "JSXChildItem"),
        )?;
        match tagged.0 {
            __JSXChildItemTag::JSXText => {
                let node: Box<JSXText> = <Box<
                    JSXText,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXChildItem::JSXText(node))
            }
            __JSXChildItemTag::JSXExpressionContainer => {
                let node: Box<JSXExpressionContainer> = <Box<
                    JSXExpressionContainer,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXChildItem::JSXExpressionContainer(node))
            }
            __JSXChildItemTag::JSXSpreadChild => {
                let node: Box<JSXSpreadChild> = <Box<
                    JSXSpreadChild,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXChildItem::JSXSpreadChild(node))
            }
            __JSXChildItemTag::JSXElement => {
                let node: Box<JSXElement> = <Box<
                    JSXElement,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXChildItem::JSXElement(node))
            }
            __JSXChildItemTag::JSXFragment => {
                let node: Box<JSXFragment> = <Box<
                    JSXFragment,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(JSXChildItem::JSXFragment(node))
            }
        }
    }
}
#[derive(
    Serialize,
    Deserialize,
    Clone,
    Copy,
    Eq,
    PartialEq,
    Ord,
    PartialOrd,
    Hash,
    Debug
)]
pub enum VariableDeclarationKind {
    /// const
    #[serde(rename = "const")]
    Const,
    /// let
    #[serde(rename = "let")]
    Let,
    /// var
    #[serde(rename = "var")]
    Var,
}
impl std::fmt::Display for VariableDeclarationKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let name = match self {
            Self::Const => "const",
            Self::Let => "let",
            Self::Var => "var",
        };
        f.write_str(name)
    }
}
impl std::str::FromStr for VariableDeclarationKind {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "const" => Ok(Self::Const),
            "let" => Ok(Self::Let),
            "var" => Ok(Self::Var),
            _ => Err(()),
        }
    }
}
#[derive(
    Serialize,
    Deserialize,
    Clone,
    Copy,
    Eq,
    PartialEq,
    Ord,
    PartialOrd,
    Hash,
    Debug
)]
pub enum PropertyKind {
    /// get
    #[serde(rename = "get")]
    Get,
    /// init
    #[serde(rename = "init")]
    Init,
    /// set
    #[serde(rename = "set")]
    Set,
}
impl std::fmt::Display for PropertyKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let name = match self {
            Self::Get => "get",
            Self::Init => "init",
            Self::Set => "set",
        };
        f.write_str(name)
    }
}
impl std::str::FromStr for PropertyKind {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "get" => Ok(Self::Get),
            "init" => Ok(Self::Init),
            "set" => Ok(Self::Set),
            _ => Err(()),
        }
    }
}
#[derive(
    Serialize,
    Deserialize,
    Clone,
    Copy,
    Eq,
    PartialEq,
    Ord,
    PartialOrd,
    Hash,
    Debug
)]
pub enum UnaryOperator {
    /// delete
    #[serde(rename = "delete")]
    Delete,
    /// -
    #[serde(rename = "-")]
    Minus,
    /// !
    #[serde(rename = "!")]
    Negation,
    /// +
    #[serde(rename = "+")]
    Plus,
    /// ~
    #[serde(rename = "~")]
    Tilde,
    /// typeof
    #[serde(rename = "typeof")]
    Typeof,
    /// void
    #[serde(rename = "void")]
    Void,
}
impl std::fmt::Display for UnaryOperator {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let name = match self {
            Self::Delete => "delete",
            Self::Minus => "-",
            Self::Negation => "!",
            Self::Plus => "+",
            Self::Tilde => "~",
            Self::Typeof => "typeof",
            Self::Void => "void",
        };
        f.write_str(name)
    }
}
impl std::str::FromStr for UnaryOperator {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "delete" => Ok(Self::Delete),
            "-" => Ok(Self::Minus),
            "!" => Ok(Self::Negation),
            "+" => Ok(Self::Plus),
            "~" => Ok(Self::Tilde),
            "typeof" => Ok(Self::Typeof),
            "void" => Ok(Self::Void),
            _ => Err(()),
        }
    }
}
#[derive(
    Serialize,
    Deserialize,
    Clone,
    Copy,
    Eq,
    PartialEq,
    Ord,
    PartialOrd,
    Hash,
    Debug
)]
pub enum UpdateOperator {
    /// --
    #[serde(rename = "--")]
    Decrement,
    /// ++
    #[serde(rename = "++")]
    Increment,
}
impl std::fmt::Display for UpdateOperator {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let name = match self {
            Self::Decrement => "--",
            Self::Increment => "++",
        };
        f.write_str(name)
    }
}
impl std::str::FromStr for UpdateOperator {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "--" => Ok(Self::Decrement),
            "++" => Ok(Self::Increment),
            _ => Err(()),
        }
    }
}
#[derive(
    Serialize,
    Deserialize,
    Clone,
    Copy,
    Eq,
    PartialEq,
    Ord,
    PartialOrd,
    Hash,
    Debug
)]
pub enum BinaryOperator {
    /// +
    #[serde(rename = "+")]
    Add,
    /// &
    #[serde(rename = "&")]
    BinaryAnd,
    /// |
    #[serde(rename = "|")]
    BinaryOr,
    /// ^
    #[serde(rename = "^")]
    BinaryXor,
    /// /
    #[serde(rename = "/")]
    Divide,
    /// ==
    #[serde(rename = "==")]
    Equals,
    /// **
    #[serde(rename = "**")]
    Exponent,
    /// >
    #[serde(rename = ">")]
    GreaterThan,
    /// >=
    #[serde(rename = ">=")]
    GreaterThanOrEqual,
    /// in
    #[serde(rename = "in")]
    In,
    /// instanceof
    #[serde(rename = "instanceof")]
    Instanceof,
    /// <
    #[serde(rename = "<")]
    LessThan,
    /// <=
    #[serde(rename = "<=")]
    LessThanOrEqual,
    /// %
    #[serde(rename = "%")]
    Modulo,
    /// *
    #[serde(rename = "*")]
    Multiply,
    /// !=
    #[serde(rename = "!=")]
    NotEquals,
    /// !==
    #[serde(rename = "!==")]
    NotStrictEquals,
    /// <<
    #[serde(rename = "<<")]
    ShiftLeft,
    /// >>
    #[serde(rename = ">>")]
    ShiftRight,
    /// ===
    #[serde(rename = "===")]
    StrictEquals,
    /// -
    #[serde(rename = "-")]
    Subtract,
    /// >>>
    #[serde(rename = ">>>")]
    UnsignedShiftRight,
}
impl std::fmt::Display for BinaryOperator {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let name = match self {
            Self::Add => "+",
            Self::BinaryAnd => "&",
            Self::BinaryOr => "|",
            Self::BinaryXor => "^",
            Self::Divide => "/",
            Self::Equals => "==",
            Self::Exponent => "**",
            Self::GreaterThan => ">",
            Self::GreaterThanOrEqual => ">=",
            Self::In => "in",
            Self::Instanceof => "instanceof",
            Self::LessThan => "<",
            Self::LessThanOrEqual => "<=",
            Self::Modulo => "%",
            Self::Multiply => "*",
            Self::NotEquals => "!=",
            Self::NotStrictEquals => "!==",
            Self::ShiftLeft => "<<",
            Self::ShiftRight => ">>",
            Self::StrictEquals => "===",
            Self::Subtract => "-",
            Self::UnsignedShiftRight => ">>>",
        };
        f.write_str(name)
    }
}
impl std::str::FromStr for BinaryOperator {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "+" => Ok(Self::Add),
            "&" => Ok(Self::BinaryAnd),
            "|" => Ok(Self::BinaryOr),
            "^" => Ok(Self::BinaryXor),
            "/" => Ok(Self::Divide),
            "==" => Ok(Self::Equals),
            "**" => Ok(Self::Exponent),
            ">" => Ok(Self::GreaterThan),
            ">=" => Ok(Self::GreaterThanOrEqual),
            "in" => Ok(Self::In),
            "instanceof" => Ok(Self::Instanceof),
            "<" => Ok(Self::LessThan),
            "<=" => Ok(Self::LessThanOrEqual),
            "%" => Ok(Self::Modulo),
            "*" => Ok(Self::Multiply),
            "!=" => Ok(Self::NotEquals),
            "!==" => Ok(Self::NotStrictEquals),
            "<<" => Ok(Self::ShiftLeft),
            ">>" => Ok(Self::ShiftRight),
            "===" => Ok(Self::StrictEquals),
            "-" => Ok(Self::Subtract),
            ">>>" => Ok(Self::UnsignedShiftRight),
            _ => Err(()),
        }
    }
}
#[derive(
    Serialize,
    Deserialize,
    Clone,
    Copy,
    Eq,
    PartialEq,
    Ord,
    PartialOrd,
    Hash,
    Debug
)]
pub enum AssignmentOperator {
    /// &&=
    #[serde(rename = "&&=")]
    AndEquals,
    /// &=
    #[serde(rename = "&=")]
    BinaryAndEquals,
    /// |=
    #[serde(rename = "|=")]
    BinaryOrEquals,
    /// ^=
    #[serde(rename = "^=")]
    BinaryXorEquals,
    /// /=
    #[serde(rename = "/=")]
    DivideEquals,
    /// =
    #[serde(rename = "=")]
    Equals,
    /// **=
    #[serde(rename = "**=")]
    Exponent,
    /// -=
    #[serde(rename = "-=")]
    MinusEquals,
    /// %=
    #[serde(rename = "%=")]
    ModuloEquals,
    /// *=
    #[serde(rename = "*=")]
    MultiplyEquals,
    /// ??=
    #[serde(rename = "??=")]
    NullCoalescingEquals,
    /// ||=
    #[serde(rename = "||=")]
    OrEquals,
    /// +=
    #[serde(rename = "+=")]
    PlusEquals,
    /// <<=
    #[serde(rename = "<<=")]
    ShiftLeftEquals,
    /// >>=
    #[serde(rename = ">>=")]
    ShiftRightEquals,
    /// >>>=
    #[serde(rename = ">>>=")]
    UnsignedShiftRightEquals,
}
impl std::fmt::Display for AssignmentOperator {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let name = match self {
            Self::AndEquals => "&&=",
            Self::BinaryAndEquals => "&=",
            Self::BinaryOrEquals => "|=",
            Self::BinaryXorEquals => "^=",
            Self::DivideEquals => "/=",
            Self::Equals => "=",
            Self::Exponent => "**=",
            Self::MinusEquals => "-=",
            Self::ModuloEquals => "%=",
            Self::MultiplyEquals => "*=",
            Self::NullCoalescingEquals => "??=",
            Self::OrEquals => "||=",
            Self::PlusEquals => "+=",
            Self::ShiftLeftEquals => "<<=",
            Self::ShiftRightEquals => ">>=",
            Self::UnsignedShiftRightEquals => ">>>=",
        };
        f.write_str(name)
    }
}
impl std::str::FromStr for AssignmentOperator {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "&&=" => Ok(Self::AndEquals),
            "&=" => Ok(Self::BinaryAndEquals),
            "|=" => Ok(Self::BinaryOrEquals),
            "^=" => Ok(Self::BinaryXorEquals),
            "/=" => Ok(Self::DivideEquals),
            "=" => Ok(Self::Equals),
            "**=" => Ok(Self::Exponent),
            "-=" => Ok(Self::MinusEquals),
            "%=" => Ok(Self::ModuloEquals),
            "*=" => Ok(Self::MultiplyEquals),
            "??=" => Ok(Self::NullCoalescingEquals),
            "||=" => Ok(Self::OrEquals),
            "+=" => Ok(Self::PlusEquals),
            "<<=" => Ok(Self::ShiftLeftEquals),
            ">>=" => Ok(Self::ShiftRightEquals),
            ">>>=" => Ok(Self::UnsignedShiftRightEquals),
            _ => Err(()),
        }
    }
}
#[derive(
    Serialize,
    Deserialize,
    Clone,
    Copy,
    Eq,
    PartialEq,
    Ord,
    PartialOrd,
    Hash,
    Debug
)]
pub enum LogicalOperator {
    /// &&
    #[serde(rename = "&&")]
    And,
    /// ??
    #[serde(rename = "??")]
    NullCoalescing,
    /// ||
    #[serde(rename = "||")]
    Or,
}
impl std::fmt::Display for LogicalOperator {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let name = match self {
            Self::And => "&&",
            Self::NullCoalescing => "??",
            Self::Or => "||",
        };
        f.write_str(name)
    }
}
impl std::str::FromStr for LogicalOperator {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "&&" => Ok(Self::And),
            "??" => Ok(Self::NullCoalescing),
            "||" => Ok(Self::Or),
            _ => Err(()),
        }
    }
}
#[derive(
    Serialize,
    Deserialize,
    Clone,
    Copy,
    Eq,
    PartialEq,
    Ord,
    PartialOrd,
    Hash,
    Debug
)]
pub enum SourceType {
    /// module
    #[serde(rename = "module")]
    Module,
    /// script
    #[serde(rename = "script")]
    Script,
}
impl std::fmt::Display for SourceType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let name = match self {
            Self::Module => "module",
            Self::Script => "script",
        };
        f.write_str(name)
    }
}
impl std::str::FromStr for SourceType {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "module" => Ok(Self::Module),
            "script" => Ok(Self::Script),
            _ => Err(()),
        }
    }
}
#[derive(
    Serialize,
    Deserialize,
    Clone,
    Copy,
    Eq,
    PartialEq,
    Ord,
    PartialOrd,
    Hash,
    Debug
)]
pub enum MethodKind {
    /// constructor
    #[serde(rename = "constructor")]
    Constructor,
    /// get
    #[serde(rename = "get")]
    Get,
    /// method
    #[serde(rename = "method")]
    Method,
    /// set
    #[serde(rename = "set")]
    Set,
}
impl std::fmt::Display for MethodKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let name = match self {
            Self::Constructor => "constructor",
            Self::Get => "get",
            Self::Method => "method",
            Self::Set => "set",
        };
        f.write_str(name)
    }
}
impl std::str::FromStr for MethodKind {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "constructor" => Ok(Self::Constructor),
            "get" => Ok(Self::Get),
            "method" => Ok(Self::Method),
            "set" => Ok(Self::Set),
            _ => Err(()),
        }
    }
}
