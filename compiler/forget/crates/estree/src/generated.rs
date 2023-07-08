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
    pub source_type: Option<SourceType>,
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
#[derive(Serialize, Deserialize, Clone, Debug)]
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
#[derive(Serialize, Deserialize, Clone, Debug)]
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
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "type")]
pub enum ImportDeclarationSpecifier {
    ImportDefaultSpecifier(Box<ImportDefaultSpecifier>),
    ImportNamespaceSpecifier(Box<ImportNamespaceSpecifier>),
    ImportSpecifier(Box<ImportSpecifier>),
}
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum ModuleItem {
    ImportOrExportDeclaration(ImportOrExportDeclaration),
    Statement(Statement),
}
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "type")]
pub enum ImportOrExportDeclaration {
    ImportDeclaration(Box<ImportDeclaration>),
}
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum ExpressionOrSuper {
    Expression(Expression),
    Super(Box<Super>),
}
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum ExpressionOrSpread {
    Expression(Expression),
    SpreadElement(Box<SpreadElement>),
}
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum FunctionBody {
    BlockStatement(Box<BlockStatement>),
    Expression(Expression),
}
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "type")]
pub enum Pattern {
    Identifier(Box<Identifier>),
}
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum ForInit {
    Expression(Expression),
    VariableDeclaration(Box<VariableDeclaration>),
}
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum ForInInit {
    Pattern(Pattern),
    VariableDeclaration(Box<VariableDeclaration>),
}
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "type")]
pub enum PropertyKey {
    Identifier(Box<Identifier>),
    Literal(Box<Literal>),
}
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum AssignmentTarget {
    Expression(Expression),
    Pattern(Pattern),
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
