use serde::{Deserialize, Serialize};
use static_assertions::assert_eq_size;
use std::{fmt::Display, num::NonZeroU32};

#[derive(Serialize, Deserialize, Debug)]
pub struct SourceLocation {
    pub source: Option<String>,

    pub start: Position,

    pub end: Position,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Position {
    /// >= 1
    pub line: NonZeroU32,
    /// >= 0
    pub column: u32,
}
assert_eq_size!(Option<Position>, u64);

#[derive(Serialize, Deserialize, Debug)]
pub struct SourceRange {
    pub start: u32,
    // end is exclusive so it can always be non-zero. This allows
    // Option<SourceRange> to not take any additional bytes.
    pub end: NonZeroU32,
}
assert_eq_size!(Option<SourceRange>, u64);

#[derive(Serialize, Deserialize, Debug)]
pub struct Program {
    /// sourceType
    #[serde(rename = "sourceType")]
    #[serde(default)]
    pub source_type: SourceType,

    pub body: Vec<ModuleItem>,

    #[serde(default)]
    pub comments: Option<Vec<Comment>>,

    pub loc: Option<SourceLocation>,

    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum SourceType {
    /// "module"
    #[serde(rename = "module")]
    Module,
    /// "script"
    #[serde(rename = "script")]
    Script,
}

impl Default for SourceType {
    fn default() -> Self {
        Self::Module
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Comment {
    pub type_: CommentType,
    pub value: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum CommentType {
    /// "Line"
    Line,
    /// "Block"
    Block,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(untagged)]
pub enum ModuleItem {
    Statement(Box<Statement>),
    ImportDeclaration(Box<ImportDeclaration>),
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum ImportExportDeclaration {
    ImportDeclaration(Box<ImportDeclaration>),
    // TODO:
    // ExportNamedDeclaration(Box<ExportNamedDeclaration>),
    // ExportDefaultDeclaration(Box<ExportDefaultDeclaration>),
    // ExportAllDeclaration(Box<ExportAllDeclaration>),
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ImportDeclaration {
    pub specifiers: Vec<ImportSpecifiers>,
    pub source: Literal,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum ImportSpecifiers {
    ImportSpecifier(Box<ImportSpecifier>),
    ImportDefaultSpecifier(Box<ImportDefaultSpecifier>),
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ImportSpecifier {
    pub imported: Identifier,

    pub local: Identifier,

    pub loc: Option<SourceLocation>,

    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ImportDefaultSpecifier {
    pub local: Identifier,

    pub loc: Option<SourceLocation>,

    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
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
    StaticBlock(Box<StaticBlock>),
    SwitchStatement(Box<SwitchStatement>),
    ThrowStatement(Box<ThrowStatement>),
    TryStatement(Box<TryStatement>),
    VariableDeclaration(Box<VariableDeclaration>),
    WhileStatement(Box<WhileStatement>),
    WithStatement(Box<WithStatement>),
}
// Prevent unboxed variants from increasing the size
assert_eq_size!(Statement, u128);

#[derive(Serialize, Deserialize, Debug)]
pub struct BlockStatement {
    pub body: Vec<Statement>,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct BreakStatement {
    #[serde(default)]
    pub label: Option<Identifier>,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ClassDeclaration {
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ContinueStatement {
    #[serde(default)]
    pub label: Option<Identifier>,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DebuggerStatement {
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DoWhileStatement {
    pub body: Statement,
    pub test: ExpressionLike,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct EmptyStatement {
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FunctionDeclaration {
    pub id: Option<Identifier>,

    pub params: Vec<Pattern>,

    #[serde(rename = "generator")]
    #[serde(default)]
    pub is_generator: bool,

    #[serde(rename = "async")]
    #[serde(default)]
    pub is_async: bool,

    // TODO: BlockStatement
    pub body: Option<Statement>,

    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct StaticBlock {
    pub body: Vec<Statement>,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ExpressionStatement {
    pub expression: ExpressionLike,

    #[serde(default)]
    pub directive: Option<String>,

    pub loc: Option<SourceLocation>,

    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ForInStatement {
    pub left: ForPattern,
    pub right: ExpressionLike,
    pub body: Statement,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ForOfStatement {
    #[serde(rename = "await")]
    #[serde(default)]
    pub is_await: bool,

    pub left: ForPattern,

    pub right: ExpressionLike,

    pub body: Statement,

    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum ForPattern {
    VariableDeclaration(Box<VariableDeclaration>),
    Expression(Box<ExpressionLike>),
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ForStatement {
    pub init: Option<ForInit>,
    pub test: Option<ExpressionLike>,
    pub update: Option<ExpressionLike>,
    pub body: Statement,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum ForInit {
    VariableDeclaration(Box<VariableDeclaration>),
    Expression(Box<ExpressionLike>),
}

#[derive(Serialize, Deserialize, Debug)]
pub struct IfStatement {
    pub test: ExpressionLike,
    pub consequent: Statement,
    pub alternate: Option<Statement>,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LabeledStatement {
    pub label: Identifier,
    pub body: Statement,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ReturnStatement {
    pub argument: Option<ExpressionLike>,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SwitchStatement {
    pub discriminant: ExpressionLike,
    pub cases: Vec<SwitchCase>,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SwitchCase {
    pub test: Option<ExpressionLike>,
    pub consequent: Vec<Statement>,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ThrowStatement {
    pub argument: ExpressionLike,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct TryStatement {
    // TODO: block: BlockStatement
    pub block: Statement,
    pub handler: Option<CatchClause>,
    // TODO: finalizer: BlockStatement
    pub finalizer: Option<Statement>,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CatchClause {
    pub param: Option<Pattern>,
    pub body: Statement,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct VariableDeclaration {
    pub declarations: Vec<VariableDeclarator>,
    pub kind: VariableDeclarationKind,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct VariableDeclarator {
    pub id: Pattern,
    pub init: Option<ExpressionLike>,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum VariableDeclarationKind {
    #[serde(rename = "const")]
    Const,
    #[serde(rename = "let")]
    Let,
    #[serde(rename = "var")]
    Var,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct WhileStatement {
    pub test: ExpressionLike,
    pub body: Statement,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct WithStatement {
    pub object: ExpressionLike,
    pub body: Statement,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

/// Expressions and expression-like nodes
/// we flatten these into a single enum to work around limits
/// of serde enum format with handling arbitrary unions
#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum ExpressionLike {
    ArrayExpression(Box<ArrayExpression>),
    ArrowFunctionExpression(Box<ArrowFunctionExpression>),
    AssignmentExpression(Box<AssignmentExpression>),
    AwaitExpression(Box<AwaitExpression>),
    BinaryExpression(Box<BinaryExpression>),
    CallExpression(Box<CallExpression>),
    ChainExpression(Box<ChainExpression>),
    ClassExpression(Box<ClassExpression>),
    ConditionalExpression(Box<ConditionalExpression>),
    FunctionExpression(Box<FunctionExpression>),
    Identifier(Box<Identifier>),
    ImportExpression(Box<ImportExpression>),
    Literal(Box<Literal>),
    LogicalExpression(Box<LogicalExpression>),
    MemberExpression(Box<MemberExpression>),
    MetaProperty(Box<MetaProperty>),
    NewExpression(Box<NewExpression>),
    ObjectExpression(Box<ObjectExpression>),
    SequenceExpression(Box<SequenceExpression>),
    TaggedTemplateExpression(Box<TaggedTemplateExpression>),
    TemplateLiteral(Box<TemplateLiteral>),
    ThisExpression(Box<ThisExpression>),
    UnaryExpression(Box<UnaryExpression>),
    UpdateExpression(Box<UpdateExpression>),
    YieldExpression(Box<YieldExpression>),

    // pseudo-expressions to work with serde
    Super(Box<Super>),

    // patterns to work with serde
    ArrayPattern(Box<ArrayPattern>),
    AssignmentPattern(Box<AssignmentPattern>),
    ObjectPattern(Box<ObjectPattern>),
    Property(Box<Property>),
    RestElement(Box<RestElement>),
    SpreadElement(Box<SpreadElement>),

    // jsx expression-ish types to work with serde
    JSXClosingElement(Box<JSXClosingElement>),
    JSXElement(Box<JSXElement>),
    JSXExpressionContainer(Box<JSXExpressionContainer>),
    JSXIdentifier(Box<JSXIdentifier>),
    JSXMemberExpression(Box<JSXMemberExpression>),
    JSXNamedspacedName(Box<JSXNamedspacedName>),
    JSXOpeningElement(Box<JSXOpeningElement>),
    JSXText(Box<JSXText>),
}
// Prevent unboxed variants from increasing the size
assert_eq_size!(ExpressionLike, u128);

#[derive(Serialize, Deserialize, Debug)]
pub struct ArrayExpression {
    pub elements: Vec<ExpressionLike>,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ArrowFunctionExpression {
    pub params: Vec<Pattern>,

    #[serde(rename = "generator")]
    #[serde(default)]
    pub is_generator: bool,

    #[serde(rename = "async")]
    #[serde(default)]
    pub is_async: bool,

    #[serde(rename = "expression")]
    #[serde(default)]
    pub is_expression: bool,

    pub body: BlockOrExpression,

    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum BlockOrExpression {
    BlockStatement(Box<BlockStatement>),
    Expression(Box<ExpressionLike>),
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AssignmentExpression {
    pub operator: AssignmentOperator,
    pub left: AssignmentTarget,
    pub right: ExpressionLike,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum AssignmentOperator {
    /// =
    #[serde(rename = "=")]
    Equals,
    /// +=
    #[serde(rename = "+=")]
    PlusEquals,
    // -=
    #[serde(rename = "-=")]
    MinusEquals,
    /// *=
    #[serde(rename = "*=")]
    AsteriskEquals,
    /// /=
    #[serde(rename = "/=")]
    SlashEquals,
    /// %=
    #[serde(rename = "%=")]
    PercentEquals,
    /// **=
    #[serde(rename = "**=")]
    AsteriskAsteriskEquals,
    /// <<=
    #[serde(rename = "<<=")]
    LtLtEquals,
    /// >>=
    #[serde(rename = ">>=")]
    GtGtEquals,
    /// >>>=
    #[serde(rename = ">>>=")]
    GtGtGtEquals,
    /// |=
    #[serde(rename = "|=")]
    PipeEquals,
    /// ^=
    #[serde(rename = "^=")]
    CaretEquals,
    /// &=
    #[serde(rename = "&&=")]
    AmpersandEquals,
    /// ||=
    #[serde(rename = "||=")]
    PipePipeEquals,
    /// &&=
    #[serde(rename = "&&=")]
    AmpersandAmpersandEquals,
    // ??=
    #[serde(rename = "??=")]
    QuestionQuestionEquals,
}

impl AssignmentOperator {
    pub fn is_simple_equals(&self) -> bool {
        matches!(self, AssignmentOperator::Equals)
    }
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(untagged)]
pub enum AssignmentTarget {
    Pattern(Box<Pattern>),
    MemberExpression(Box<MemberExpression>),
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AwaitExpression {
    pub argument: ExpressionLike,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct BinaryExpression {
    pub operator: BinaryOperator,
    pub left: ExpressionLike,
    pub right: ExpressionLike,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum BinaryOperator {
    /// ==
    #[serde(rename = "==")]
    EqualsEquals,
    /// !=
    #[serde(rename = "!=")]
    NotEquals,
    /// ===
    #[serde(rename = "===")]
    TripleEquals,
    /// !==
    #[serde(rename = "!==")]
    NotTripleEquals,
    /// <
    #[serde(rename = "<")]
    LessThan,
    /// <=
    #[serde(rename = "<=")]
    LessThanEquals,
    /// >
    #[serde(rename = ">")]
    GreaterThan,
    /// >=
    #[serde(rename = ">=")]
    GreaterThanEquals,
    /// <<
    #[serde(rename = "<<")]
    LtLt,
    /// >>
    #[serde(rename = ">>")]
    GtGt,
    /// >>>
    #[serde(rename = ">>>")]
    GtGtGt,
    /// +
    #[serde(rename = "+")]
    Plus,
    /// -
    #[serde(rename = "-")]
    Minus,
    /// *
    #[serde(rename = "*")]
    Asterisk,
    /// /
    #[serde(rename = "/")]
    Slash,
    /// %
    #[serde(rename = "%")]
    Percent,
    /// **
    #[serde(rename = "**")]
    AsteriskAsterisk,
    /// |
    #[serde(rename = "|")]
    Pipe,
    /// ^
    #[serde(rename = "^")]
    Caret,
    /// &
    #[serde(rename = "&")]
    Ampersand,
    /// in
    #[serde(rename = "in")]
    In,
    /// instanceof
    #[serde(rename = "instanceof")]
    Instanceof,
}

impl Display for BinaryOperator {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let name = match self {
            Self::Plus => "+",
            Self::LessThan => "<",
            _ => todo!("display for operator: {:#?}", self),
        };
        f.write_str(name)
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CallExpression {
    #[serde(rename = "optional")]
    #[serde(default)]
    pub is_optional: bool,

    pub callee: ExpressionLike,

    pub arguments: Vec<ExpressionLike>,

    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ChainExpression {
    pub expression: ChainElement,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum ChainElement {
    CallExpression(Box<CallExpression>),
    MemberExpression(Box<MemberExpression>),
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ClassExpression {
    // TODO
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ConditionalExpression {
    pub test: ExpressionLike,
    pub alternate: ExpressionLike,
    pub consequent: ExpressionLike,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FunctionExpression {
    // TODO
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ImportExpression {
    // TODO
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Literal {
    pub value: LiteralValue,

    #[serde(default)]
    pub raw: Option<String>,

    pub loc: Option<SourceLocation>,

    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(untagged)]
pub enum LiteralValue {
    BigInt(String),
    Boolean(bool),
    Null,
    Number(Number),
    RegExp(RegExp),
    String(String),
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Number(u64);

impl From<u64> for Number {
    fn from(value: u64) -> Self {
        Number(value)
    }
}

impl From<f64> for Number {
    fn from(value: f64) -> Self {
        Number(value.to_bits())
    }
}

impl From<Number> for f64 {
    fn from(value: Number) -> Self {
        f64::from_bits(value.0)
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RegExp {
    pub raw: Option<String>,
    pub regex: Option<RegExpValue>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RegExpValue {
    pub pattern: String,
    pub flags: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LogicalExpression {
    pub operator: LogicalOperator,
    pub left: ExpressionLike,
    pub right: ExpressionLike,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum LogicalOperator {
    /// ||
    #[serde(rename = "||")]
    PipePipe,
    /// &&
    #[serde(rename = "&&")]
    AmpersandAmpersand,
    /// ??
    #[serde(rename = "??")]
    QuestionQuestion,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct MetaProperty {
    // TODO
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct NewExpression {
    pub callee: ExpressionLike,
    pub arguments: Vec<ExpressionLike>,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ObjectExpression {
    pub properties: Vec<ExpressionLike>,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SequenceExpression {
    pub expressions: Vec<ExpressionLike>,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct TaggedTemplateExpression {
    pub tag: ExpressionLike,
    pub quasi: TemplateLiteral,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct TemplateLiteral {
    pub quasis: Vec<TemplateElement>,
    pub expressions: Vec<ExpressionLike>,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct TemplateElement {
    #[serde(rename = "tail")]
    #[serde(default)]
    pub is_tail: bool,

    // TODO: add value: {cooked, raw} wrapper object
    pub cooked: Option<String>,

    pub raw: String,

    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ThisExpression {
    // TODO
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UnaryExpression {
    pub operator: UnaryOperator,

    #[serde(rename = "prefix")]
    #[serde(default)]
    pub is_prefix: bool,

    pub argument: ExpressionLike,

    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum UnaryOperator {
    /// -
    #[serde(rename = "+")]
    Minus,
    /// +
    #[serde(rename = "+")]
    Plus,
    /// !
    #[serde(rename = "!")]
    Exclamation,
    /// ~
    #[serde(rename = "~")]
    Tilde,
    /// typeof
    #[serde(rename = "typeof")]
    Typeof,
    /// void
    #[serde(rename = "void")]
    Void,
    /// delete
    #[serde(rename = "delete")]
    Delete,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateExpression {
    pub operator: UpdateOperator,

    pub argument: ExpressionLike,

    #[serde(rename = "prefix")]
    #[serde(default)]
    pub is_prefix: bool,

    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum UpdateOperator {
    /// ++
    #[serde(rename = "++")]
    PlusPlus,
    /// --
    #[serde(rename = "--")]
    MinusMinus,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct YieldExpression {
    pub argument: Option<ExpressionLike>,

    #[serde(rename = "delegate")]
    #[serde(default)]
    pub is_delegate: bool,

    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

// Pattern etc

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum Pattern {
    ArrayPattern(Box<ArrayPattern>),
    AssignmentPattern(Box<AssignmentPattern>),
    Identifier(Box<Identifier>),
    MemberExpression(Box<MemberExpression>),
    ObjectPattern(Box<ObjectPattern>),
    RestElement(Box<RestElement>),
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ArrayPattern {
    pub elements: Vec<Pattern>,

    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AssignmentPattern {
    pub left: Pattern,
    pub right: ExpressionLike,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Identifier {
    pub name: String,

    #[serde(default)]
    pub binding: Option<Binding>,

    pub loc: Option<SourceLocation>,

    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum Binding {
    Local(BindingId),
    Module(BindingId),
    Global,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Eq, Hash, Clone, Copy)]
#[serde(transparent)]
pub struct BindingId(NonZeroU32);

impl BindingId {
    pub fn new(id: NonZeroU32) -> Self {
        Self(id)
    }
}

impl From<BindingId> for u32 {
    fn from(value: BindingId) -> Self {
        value.0.into()
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct MemberExpression {
    pub object: ExpressionLike,

    pub property: ExpressionLike, // ExpressionOrPrivateIdentifier

    #[serde(rename = "computed")]
    #[serde(default)]
    pub is_computed: bool,

    #[serde(rename = "optional")]
    #[serde(default)]
    pub is_optional: bool,

    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Super {
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PrivateIdentifier {
    pub name: String,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ObjectPattern {
    pub properties: Vec<ExpressionLike>,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Property {
    pub key: ExpressionLike,

    pub value: PropertyValue,

    pub kind: PropertyKind,

    #[serde(rename = "method")]
    #[serde(default)]
    pub is_method: bool,

    #[serde(rename = "shorthand")]
    #[serde(default)]
    pub is_shorthand: bool,

    #[serde(rename = "computed")]
    #[serde(default)]
    pub is_computed: bool,

    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(untagged)]
pub enum PropertyValue {
    Expression(Box<ExpressionLike>),
    Pattern(Box<Pattern>),
}

#[derive(Serialize, Deserialize, Debug)]
pub enum PropertyKind {
    #[serde(rename = "init")]
    Init,
    #[serde(rename = "get")]
    Get,
    #[serde(rename = "set")]
    Set,
}

impl Default for PropertyKind {
    fn default() -> Self {
        Self::Init
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RestElement {
    pub argument: Pattern,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SpreadElement {
    pub argument: ExpressionLike,
    pub loc: Option<SourceLocation>,
    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct JSXElement {
    #[serde(rename = "openingElement")]
    pub opening_element: ExpressionLike,

    pub children: Vec<ExpressionLike>,

    #[serde(rename = "closingElement")]
    pub closing_element: Option<ExpressionLike>,

    pub loc: Option<SourceLocation>,

    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct JSXOpeningElement {
    pub name: ExpressionLike,

    pub attributes: Vec<JSXAttribute>,

    #[serde(rename = "selfClosing")]
    #[serde(default)]
    pub self_closing: bool,

    pub loc: Option<SourceLocation>,

    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct JSXClosingElement {
    pub name: ExpressionLike,

    pub loc: Option<SourceLocation>,

    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct JSXMemberExpression {
    pub object: ExpressionLike,

    pub property: ExpressionLike,

    pub loc: Option<SourceLocation>,

    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct JSXIdentifier {
    pub name: String,

    pub loc: Option<SourceLocation>,

    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct JSXNamedspacedName {
    pub namespace: ExpressionLike,

    pub name: ExpressionLike,

    pub loc: Option<SourceLocation>,

    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct JSXAttribute {
    pub name: ExpressionLike,

    pub value: ExpressionLike,

    pub loc: Option<SourceLocation>,

    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct JSXExpressionContainer {
    expression: ExpressionLike,

    pub loc: Option<SourceLocation>,

    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct JSXText {
    value: String,
    raw: String,

    pub loc: Option<SourceLocation>,

    #[serde(default)]
    pub range: Option<SourceRange>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use insta::{assert_snapshot, glob};
    use serde_json;

    #[test]
    fn for_statement() {
        let source = include_str!("for-statement.json");
        let ast: Program = serde_json::from_str(&source).unwrap();
        println!("deserialized:\n{:#?}", ast);
        let serialized = serde_json::to_string_pretty(&ast).unwrap();
        println!("serialized:\n{}", serialized);
    }

    #[test]
    fn simple() {
        let source = include_str!("simple.json");
        let ast: Program = serde_json::from_str(&source).unwrap();
        println!("deserialized:\n{:#?}", ast);
        let serialized = serde_json::to_string_pretty(&ast).unwrap();
        println!("serialized:\n{}", serialized);
    }

    /// TODO: enable once this deserializes
    fn _kitchen_sink() {
        let source = include_str!("kitchen-sink.json");
        let ast: Program = match serde_json::from_str(&source) {
            Ok(ast) => ast,
            Err(err) => panic!("{:#?}", err),
        };
        println!("deserialized:\n{:#?}", ast);
        let serialized = serde_json::to_string_pretty(&ast).unwrap();
        println!("serialized:\n{}", serialized);
    }

    #[test]
    fn import() {
        let source = include_str!("import.json");
        let ast: Program = serde_json::from_str(&source).unwrap();
        println!("deserialized:\n{:#?}", ast);
        let serialized = serde_json::to_string_pretty(&ast).unwrap();
        println!("serialized:\n{}", serialized);
    }

    #[test]
    fn test() {
        let source = include_str!("test.json");
        let ast: Program = serde_json::from_str(&source).unwrap();
        println!("deserialized:\n{:#?}", ast);
        let serialized = serde_json::to_string_pretty(&ast).unwrap();
        println!("serialized:\n{}", serialized);
    }

    #[test]
    fn fixtures() {
        glob!("fixtures/**.json", |path| {
            let input = std::fs::read_to_string(path).unwrap();
            let ast: Program = serde_json::from_str(&input).unwrap();
            let serialized = serde_json::to_string_pretty(&ast).unwrap();
            assert_snapshot!(format!("Input:\n{input}\n\nOutput:\n{serialized}"));
        });
    }
}
