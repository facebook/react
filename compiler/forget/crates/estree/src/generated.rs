use std::num::NonZeroU32;
use serde::{Serialize, Deserialize};
use crate::{JsValue, Binding, SourceRange};
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SourceLocation {
    pub source: Option<String>,
    pub start: Position,
    pub end: Position,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Position {
    pub line: NonZeroU32,
    pub column: u32,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
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
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RegExpValue {
    pub pattern: String,
    pub flags: String,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
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
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Literal {
    pub value: JsValue,
    #[serde(default)]
    pub raw: Option<String>,
    #[serde(default)]
    pub regex: Option<RegExpValue>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
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
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ExpressionStatement {
    pub expression: Expression,
    #[serde(default)]
    pub directive: Option<String>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct BlockStatement {
    pub body: Vec<Statement>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct EmptyStatement {
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DebuggerStatement {
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WithStatement {
    pub object: Expression,
    pub body: Statement,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ReturnStatement {
    pub argument: Option<Expression>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LabeledStatement {
    pub label: Identifier,
    pub body: Statement,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct BreakStatement {
    pub label: Option<Identifier>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ContinueStatement {
    pub label: Option<Identifier>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct IfStatement {
    pub test: Expression,
    pub consequent: Statement,
    pub alternate: Option<Statement>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SwitchStatement {
    pub discriminant: Expression,
    pub cases: Vec<SwitchCase>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SwitchCase {
    pub test: Option<Expression>,
    pub consequent: Vec<Statement>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ThrowStatement {
    pub argument: Expression,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TryStatement {
    pub block: BlockStatement,
    pub handler: Option<CatchClause>,
    pub finalizer: Option<BlockStatement>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CatchClause {
    pub param: Pattern,
    pub body: BlockStatement,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WhileStatement {
    pub test: Expression,
    pub body: Statement,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DoWhileStatement {
    pub body: Statement,
    pub test: Expression,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
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
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ForInStatement {
    pub left: ForInInit,
    pub right: Expression,
    pub body: Statement,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ForOfStatement {
    pub left: ForInInit,
    pub right: Expression,
    pub body: Statement,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FunctionDeclaration {
    #[serde(flatten)]
    pub function: Function,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VariableDeclaration {
    pub kind: VariableDeclarationKind,
    pub declarations: Vec<VariableDeclarator>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VariableDeclarator {
    pub id: Pattern,
    pub init: Option<Expression>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ThisExpression {
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ArrayExpression {
    pub elements: Vec<Option<ExpressionOrSpread>>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ObjectExpression {
    pub properties: Vec<Property>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Property {
    pub key: PropertyKey,
    pub value: Expression,
    pub kind: PropertyKind,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FunctionExpression {
    #[serde(flatten)]
    pub function: Function,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
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
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct UnaryExpression {
    pub operator: UnaryOperator,
    pub prefix: bool,
    pub argument: Expression,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct UpdateExpression {
    pub operator: UpdateOperator,
    pub argument: Expression,
    pub prefix: bool,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct BinaryExpression {
    pub left: Expression,
    pub operator: BinaryOperator,
    pub right: Expression,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AssignmentExpression {
    pub operator: AssignmentOperator,
    pub left: AssignmentTarget,
    pub right: Expression,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LogicalExpression {
    pub operator: LogicalOperator,
    pub left: Expression,
    pub right: Expression,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MemberExpression {
    pub object: ExpressionOrSuper,
    pub property: Expression,
    pub computed: bool,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ConditionalExpression {
    pub test: Expression,
    pub alternate: Expression,
    pub consequent: Expression,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CallExpression {
    pub callee: ExpressionOrSuper,
    pub arguments: Vec<ExpressionOrSpread>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct NewExpression {
    pub callee: Expression,
    pub arguments: Vec<ExpressionOrSpread>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SequenceExpression {
    pub expressions: Vec<Expression>,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Super {
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SpreadElement {
    pub argument: Expression,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
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
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ImportDeclaration {
    pub specifiers: Vec<ImportDeclarationSpecifier>,
    pub source: Literal,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ImportSpecifier {
    pub imported: Identifier,
    pub local: Identifier,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ImportDefaultSpecifier {
    pub local: Identifier,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ImportNamespaceSpecifier {
    pub local: Identifier,
    #[serde(default)]
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}
#[derive(Serialize, Clone, Debug)]
#[serde(tag = "type")]
pub enum Statement {
    BlockStatement(Box<BlockStatement>),
    BreakStatement(Box<BreakStatement>),
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
            >::new("type", "Pattern"),
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
#[serde(tag = "type")]
pub enum Expression {
    ArrayExpression(Box<ArrayExpression>),
    ArrowFunctionExpression(Box<ArrowFunctionExpression>),
    AssignmentExpression(Box<AssignmentExpression>),
    BinaryExpression(Box<BinaryExpression>),
    CallExpression(Box<CallExpression>),
    ConditionalExpression(Box<ConditionalExpression>),
    FunctionExpression(Box<FunctionExpression>),
    Identifier(Box<Identifier>),
    Literal(Box<Literal>),
    LogicalExpression(Box<LogicalExpression>),
    MemberExpression(Box<MemberExpression>),
    NewExpression(Box<NewExpression>),
    ObjectExpression(Box<ObjectExpression>),
    SequenceExpression(Box<SequenceExpression>),
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
    BinaryExpression,
    CallExpression,
    ConditionalExpression,
    FunctionExpression,
    Identifier,
    Literal,
    LogicalExpression,
    MemberExpression,
    NewExpression,
    ObjectExpression,
    SequenceExpression,
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
            >::new("type", "Pattern"),
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
            __ExpressionTag::BinaryExpression => {
                let node: Box<BinaryExpression> = <Box<
                    BinaryExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::BinaryExpression(node))
            }
            __ExpressionTag::CallExpression => {
                let node: Box<CallExpression> = <Box<
                    CallExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::CallExpression(node))
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
            __ExpressionTag::NewExpression => {
                let node: Box<NewExpression> = <Box<
                    NewExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::NewExpression(node))
            }
            __ExpressionTag::ObjectExpression => {
                let node: Box<ObjectExpression> = <Box<
                    ObjectExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::ObjectExpression(node))
            }
            __ExpressionTag::SequenceExpression => {
                let node: Box<SequenceExpression> = <Box<
                    SequenceExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(Expression::SequenceExpression(node))
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
#[serde(tag = "type")]
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
            >::new("type", "Pattern"),
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
    BlockStatement,
    BreakStatement,
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
            >::new("type", "Pattern"),
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
#[serde(tag = "type")]
pub enum ImportOrExportDeclaration {
    ImportDeclaration(Box<ImportDeclaration>),
}
#[derive(Deserialize, Debug)]
enum __ImportOrExportDeclarationTag {
    ImportDeclaration,
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
            >::new("type", "Pattern"),
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
    BinaryExpression,
    CallExpression,
    ConditionalExpression,
    FunctionExpression,
    Identifier,
    Literal,
    LogicalExpression,
    MemberExpression,
    NewExpression,
    ObjectExpression,
    SequenceExpression,
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
            >::new("type", "Pattern"),
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
            __ExpressionOrSuperTag::BinaryExpression => {
                let node: Box<BinaryExpression> = <Box<
                    BinaryExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::BinaryExpression(node)))
            }
            __ExpressionOrSuperTag::CallExpression => {
                let node: Box<CallExpression> = <Box<
                    CallExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::CallExpression(node)))
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
            __ExpressionOrSuperTag::NewExpression => {
                let node: Box<NewExpression> = <Box<
                    NewExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::NewExpression(node)))
            }
            __ExpressionOrSuperTag::ObjectExpression => {
                let node: Box<ObjectExpression> = <Box<
                    ObjectExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::ObjectExpression(node)))
            }
            __ExpressionOrSuperTag::SequenceExpression => {
                let node: Box<SequenceExpression> = <Box<
                    SequenceExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSuper::Expression(Expression::SequenceExpression(node)))
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
    BinaryExpression,
    CallExpression,
    ConditionalExpression,
    FunctionExpression,
    Identifier,
    Literal,
    LogicalExpression,
    MemberExpression,
    NewExpression,
    ObjectExpression,
    SequenceExpression,
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
            >::new("type", "Pattern"),
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
            __ExpressionOrSpreadTag::BinaryExpression => {
                let node: Box<BinaryExpression> = <Box<
                    BinaryExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::BinaryExpression(node)))
            }
            __ExpressionOrSpreadTag::CallExpression => {
                let node: Box<CallExpression> = <Box<
                    CallExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::CallExpression(node)))
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
            __ExpressionOrSpreadTag::NewExpression => {
                let node: Box<NewExpression> = <Box<
                    NewExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::NewExpression(node)))
            }
            __ExpressionOrSpreadTag::ObjectExpression => {
                let node: Box<ObjectExpression> = <Box<
                    ObjectExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::ObjectExpression(node)))
            }
            __ExpressionOrSpreadTag::SequenceExpression => {
                let node: Box<SequenceExpression> = <Box<
                    SequenceExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ExpressionOrSpread::Expression(Expression::SequenceExpression(node)))
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
    BinaryExpression,
    CallExpression,
    ConditionalExpression,
    FunctionExpression,
    Identifier,
    Literal,
    LogicalExpression,
    MemberExpression,
    NewExpression,
    ObjectExpression,
    SequenceExpression,
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
            >::new("type", "Pattern"),
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
            __FunctionBodyTag::BinaryExpression => {
                let node: Box<BinaryExpression> = <Box<
                    BinaryExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::BinaryExpression(node)))
            }
            __FunctionBodyTag::CallExpression => {
                let node: Box<CallExpression> = <Box<
                    CallExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::CallExpression(node)))
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
            __FunctionBodyTag::NewExpression => {
                let node: Box<NewExpression> = <Box<
                    NewExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::NewExpression(node)))
            }
            __FunctionBodyTag::ObjectExpression => {
                let node: Box<ObjectExpression> = <Box<
                    ObjectExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::ObjectExpression(node)))
            }
            __FunctionBodyTag::SequenceExpression => {
                let node: Box<SequenceExpression> = <Box<
                    SequenceExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(FunctionBody::Expression(Expression::SequenceExpression(node)))
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
#[serde(tag = "type")]
pub enum Pattern {
    Identifier(Box<Identifier>),
}
#[derive(Deserialize, Debug)]
enum __PatternTag {
    Identifier,
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
    BinaryExpression,
    CallExpression,
    ConditionalExpression,
    FunctionExpression,
    Identifier,
    Literal,
    LogicalExpression,
    MemberExpression,
    NewExpression,
    ObjectExpression,
    SequenceExpression,
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
            >::new("type", "Pattern"),
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
            __ForInitTag::BinaryExpression => {
                let node: Box<BinaryExpression> = <Box<
                    BinaryExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::BinaryExpression(node)))
            }
            __ForInitTag::CallExpression => {
                let node: Box<CallExpression> = <Box<
                    CallExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::CallExpression(node)))
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
            __ForInitTag::NewExpression => {
                let node: Box<NewExpression> = <Box<
                    NewExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::NewExpression(node)))
            }
            __ForInitTag::ObjectExpression => {
                let node: Box<ObjectExpression> = <Box<
                    ObjectExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::ObjectExpression(node)))
            }
            __ForInitTag::SequenceExpression => {
                let node: Box<SequenceExpression> = <Box<
                    SequenceExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(ForInit::Expression(Expression::SequenceExpression(node)))
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
            >::new("type", "Pattern"),
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
#[serde(tag = "type")]
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
            >::new("type", "Pattern"),
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
    BinaryExpression,
    CallExpression,
    ConditionalExpression,
    FunctionExpression,
    Identifier,
    Literal,
    LogicalExpression,
    MemberExpression,
    NewExpression,
    ObjectExpression,
    SequenceExpression,
    ThisExpression,
    UnaryExpression,
    UpdateExpression,
    YieldExpression,
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
            >::new("type", "Pattern"),
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
            __AssignmentTargetTag::BinaryExpression => {
                let node: Box<BinaryExpression> = <Box<
                    BinaryExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::BinaryExpression(node)))
            }
            __AssignmentTargetTag::CallExpression => {
                let node: Box<CallExpression> = <Box<
                    CallExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::CallExpression(node)))
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
            __AssignmentTargetTag::NewExpression => {
                let node: Box<NewExpression> = <Box<
                    NewExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::NewExpression(node)))
            }
            __AssignmentTargetTag::ObjectExpression => {
                let node: Box<ObjectExpression> = <Box<
                    ObjectExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::ObjectExpression(node)))
            }
            __AssignmentTargetTag::SequenceExpression => {
                let node: Box<SequenceExpression> = <Box<
                    SequenceExpression,
                > as Deserialize>::deserialize(
                    serde::__private::de::ContentDeserializer::<D::Error>::new(tagged.1),
                )?;
                Ok(AssignmentTarget::Expression(Expression::SequenceExpression(node)))
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
    /// -=
    #[serde(rename = "-=")]
    MinusEquals,
    /// %=
    #[serde(rename = "%=")]
    ModuloEquals,
    /// *=
    #[serde(rename = "*=")]
    MultiplyEquals,
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
            Self::BinaryAndEquals => "&=",
            Self::BinaryOrEquals => "|=",
            Self::BinaryXorEquals => "^=",
            Self::DivideEquals => "/=",
            Self::Equals => "=",
            Self::MinusEquals => "-=",
            Self::ModuloEquals => "%=",
            Self::MultiplyEquals => "*=",
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
            "&=" => Ok(Self::BinaryAndEquals),
            "|=" => Ok(Self::BinaryOrEquals),
            "^=" => Ok(Self::BinaryXorEquals),
            "/=" => Ok(Self::DivideEquals),
            "=" => Ok(Self::Equals),
            "-=" => Ok(Self::MinusEquals),
            "%=" => Ok(Self::ModuloEquals),
            "*=" => Ok(Self::MultiplyEquals),
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
