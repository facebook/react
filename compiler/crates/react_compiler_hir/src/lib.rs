pub mod environment;

pub use react_compiler_diagnostics::{SourceLocation, Position, GENERATED_SOURCE};

use indexmap::{IndexMap, IndexSet};

// =============================================================================
// ID newtypes
// =============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct BlockId(pub u32);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct IdentifierId(pub u32);

/// Index into the flat instruction table on HirFunction.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct InstructionId(pub u32);

/// Evaluation order assigned to instructions and terminals during numbering.
/// This was previously called InstructionId in the TypeScript compiler.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct EvaluationOrder(pub u32);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct DeclarationId(pub u32);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct ScopeId(pub u32);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct TypeId(pub u32);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct FunctionId(pub u32);

// =============================================================================
// FloatValue wrapper
// =============================================================================

/// Wrapper around f64 that stores raw bytes for deterministic equality and hashing.
/// This allows use in HashMap keys and ensures NaN == NaN (bitwise comparison).
#[derive(Debug, Clone, Copy)]
pub struct FloatValue(u64);

impl FloatValue {
    pub fn new(value: f64) -> Self {
        FloatValue(value.to_bits())
    }

    pub fn value(self) -> f64 {
        f64::from_bits(self.0)
    }
}

impl From<f64> for FloatValue {
    fn from(value: f64) -> Self {
        FloatValue::new(value)
    }
}

impl From<FloatValue> for f64 {
    fn from(value: FloatValue) -> Self {
        value.value()
    }
}

impl PartialEq for FloatValue {
    fn eq(&self, other: &Self) -> bool {
        self.0 == other.0
    }
}

impl Eq for FloatValue {}

impl std::hash::Hash for FloatValue {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        self.0.hash(state);
    }
}

impl std::fmt::Display for FloatValue {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.value())
    }
}

// =============================================================================
// Core HIR types
// =============================================================================

/// A function lowered to HIR form
#[derive(Debug, Clone)]
pub struct HirFunction {
    pub loc: Option<SourceLocation>,
    pub id: Option<String>,
    pub name_hint: Option<String>,
    pub fn_type: ReactFunctionType,
    pub params: Vec<ParamPattern>,
    pub return_type_annotation: Option<String>,
    pub returns: Place,
    pub context: Vec<Place>,
    pub body: HIR,
    pub instructions: Vec<Instruction>,
    pub generator: bool,
    pub is_async: bool,
    pub directives: Vec<String>,
    pub aliasing_effects: Option<Vec<()>>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ReactFunctionType {
    Component,
    Hook,
    Other,
}

#[derive(Debug, Clone)]
pub enum ParamPattern {
    Place(Place),
    Spread(SpreadPattern),
}

/// The HIR control-flow graph
#[derive(Debug, Clone)]
pub struct HIR {
    pub entry: BlockId,
    pub blocks: IndexMap<BlockId, BasicBlock>,
}

/// Block kinds
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BlockKind {
    Block,
    Value,
    Loop,
    Sequence,
    Catch,
}

/// A basic block in the CFG
#[derive(Debug, Clone)]
pub struct BasicBlock {
    pub kind: BlockKind,
    pub id: BlockId,
    pub instructions: Vec<InstructionId>,
    pub terminal: Terminal,
    pub preds: IndexSet<BlockId>,
    pub phis: Vec<Phi>,
}

/// Phi node for SSA
#[derive(Debug, Clone)]
pub struct Phi {
    pub place: Place,
    pub operands: IndexMap<BlockId, Place>,
}

// =============================================================================
// Terminal enum
// =============================================================================

#[derive(Debug, Clone)]
pub enum Terminal {
    Unsupported {
        id: EvaluationOrder,
        loc: Option<SourceLocation>,
    },
    Unreachable {
        id: EvaluationOrder,
        loc: Option<SourceLocation>,
    },
    Throw {
        value: Place,
        id: EvaluationOrder,
        loc: Option<SourceLocation>,
    },
    Return {
        value: Place,
        return_variant: ReturnVariant,
        id: EvaluationOrder,
        loc: Option<SourceLocation>,
        effects: Option<Vec<()>>,
    },
    Goto {
        block: BlockId,
        variant: GotoVariant,
        id: EvaluationOrder,
        loc: Option<SourceLocation>,
    },
    If {
        test: Place,
        consequent: BlockId,
        alternate: BlockId,
        fallthrough: BlockId,
        id: EvaluationOrder,
        loc: Option<SourceLocation>,
    },
    Branch {
        test: Place,
        consequent: BlockId,
        alternate: BlockId,
        fallthrough: BlockId,
        id: EvaluationOrder,
        loc: Option<SourceLocation>,
    },
    Switch {
        test: Place,
        cases: Vec<Case>,
        fallthrough: BlockId,
        id: EvaluationOrder,
        loc: Option<SourceLocation>,
    },
    DoWhile {
        loop_block: BlockId,
        test: BlockId,
        fallthrough: BlockId,
        id: EvaluationOrder,
        loc: Option<SourceLocation>,
    },
    While {
        test: BlockId,
        loop_block: BlockId,
        fallthrough: BlockId,
        id: EvaluationOrder,
        loc: Option<SourceLocation>,
    },
    For {
        init: BlockId,
        test: BlockId,
        update: Option<BlockId>,
        loop_block: BlockId,
        fallthrough: BlockId,
        id: EvaluationOrder,
        loc: Option<SourceLocation>,
    },
    ForOf {
        init: BlockId,
        test: BlockId,
        loop_block: BlockId,
        fallthrough: BlockId,
        id: EvaluationOrder,
        loc: Option<SourceLocation>,
    },
    ForIn {
        init: BlockId,
        loop_block: BlockId,
        fallthrough: BlockId,
        id: EvaluationOrder,
        loc: Option<SourceLocation>,
    },
    Logical {
        operator: LogicalOperator,
        test: BlockId,
        fallthrough: BlockId,
        id: EvaluationOrder,
        loc: Option<SourceLocation>,
    },
    Ternary {
        test: BlockId,
        fallthrough: BlockId,
        id: EvaluationOrder,
        loc: Option<SourceLocation>,
    },
    Optional {
        optional: bool,
        test: BlockId,
        fallthrough: BlockId,
        id: EvaluationOrder,
        loc: Option<SourceLocation>,
    },
    Label {
        block: BlockId,
        fallthrough: BlockId,
        id: EvaluationOrder,
        loc: Option<SourceLocation>,
    },
    Sequence {
        block: BlockId,
        fallthrough: BlockId,
        id: EvaluationOrder,
        loc: Option<SourceLocation>,
    },
    MaybeThrow {
        continuation: BlockId,
        handler: Option<BlockId>,
        id: EvaluationOrder,
        loc: Option<SourceLocation>,
        effects: Option<Vec<()>>,
    },
    Try {
        block: BlockId,
        handler_binding: Option<Place>,
        handler: BlockId,
        fallthrough: BlockId,
        id: EvaluationOrder,
        loc: Option<SourceLocation>,
    },
    Scope {
        fallthrough: BlockId,
        block: BlockId,
        scope: ScopeId,
        id: EvaluationOrder,
        loc: Option<SourceLocation>,
    },
    PrunedScope {
        fallthrough: BlockId,
        block: BlockId,
        scope: ScopeId,
        id: EvaluationOrder,
        loc: Option<SourceLocation>,
    },
}

impl Terminal {
    /// Get the evaluation order of this terminal
    pub fn evaluation_order(&self) -> EvaluationOrder {
        match self {
            Terminal::Unsupported { id, .. }
            | Terminal::Unreachable { id, .. }
            | Terminal::Throw { id, .. }
            | Terminal::Return { id, .. }
            | Terminal::Goto { id, .. }
            | Terminal::If { id, .. }
            | Terminal::Branch { id, .. }
            | Terminal::Switch { id, .. }
            | Terminal::DoWhile { id, .. }
            | Terminal::While { id, .. }
            | Terminal::For { id, .. }
            | Terminal::ForOf { id, .. }
            | Terminal::ForIn { id, .. }
            | Terminal::Logical { id, .. }
            | Terminal::Ternary { id, .. }
            | Terminal::Optional { id, .. }
            | Terminal::Label { id, .. }
            | Terminal::Sequence { id, .. }
            | Terminal::MaybeThrow { id, .. }
            | Terminal::Try { id, .. }
            | Terminal::Scope { id, .. }
            | Terminal::PrunedScope { id, .. } => *id,
        }
    }

    /// Get the source location of this terminal
    pub fn loc(&self) -> Option<&SourceLocation> {
        match self {
            Terminal::Unsupported { loc, .. }
            | Terminal::Unreachable { loc, .. }
            | Terminal::Throw { loc, .. }
            | Terminal::Return { loc, .. }
            | Terminal::Goto { loc, .. }
            | Terminal::If { loc, .. }
            | Terminal::Branch { loc, .. }
            | Terminal::Switch { loc, .. }
            | Terminal::DoWhile { loc, .. }
            | Terminal::While { loc, .. }
            | Terminal::For { loc, .. }
            | Terminal::ForOf { loc, .. }
            | Terminal::ForIn { loc, .. }
            | Terminal::Logical { loc, .. }
            | Terminal::Ternary { loc, .. }
            | Terminal::Optional { loc, .. }
            | Terminal::Label { loc, .. }
            | Terminal::Sequence { loc, .. }
            | Terminal::MaybeThrow { loc, .. }
            | Terminal::Try { loc, .. }
            | Terminal::Scope { loc, .. }
            | Terminal::PrunedScope { loc, .. } => loc.as_ref(),
        }
    }

    /// Set the evaluation order of this terminal
    pub fn set_evaluation_order(&mut self, new_id: EvaluationOrder) {
        match self {
            Terminal::Unsupported { id, .. }
            | Terminal::Unreachable { id, .. }
            | Terminal::Throw { id, .. }
            | Terminal::Return { id, .. }
            | Terminal::Goto { id, .. }
            | Terminal::If { id, .. }
            | Terminal::Branch { id, .. }
            | Terminal::Switch { id, .. }
            | Terminal::DoWhile { id, .. }
            | Terminal::While { id, .. }
            | Terminal::For { id, .. }
            | Terminal::ForOf { id, .. }
            | Terminal::ForIn { id, .. }
            | Terminal::Logical { id, .. }
            | Terminal::Ternary { id, .. }
            | Terminal::Optional { id, .. }
            | Terminal::Label { id, .. }
            | Terminal::Sequence { id, .. }
            | Terminal::MaybeThrow { id, .. }
            | Terminal::Try { id, .. }
            | Terminal::Scope { id, .. }
            | Terminal::PrunedScope { id, .. } => *id = new_id,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ReturnVariant {
    Void,
    Implicit,
    Explicit,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GotoVariant {
    Break,
    Continue,
    Try,
}

#[derive(Debug, Clone)]
pub struct Case {
    pub test: Option<Place>,
    pub block: BlockId,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogicalOperator {
    And,
    Or,
    NullishCoalescing,
}

// =============================================================================
// Instruction types
// =============================================================================

#[derive(Debug, Clone)]
pub struct Instruction {
    pub id: EvaluationOrder,
    pub lvalue: Place,
    pub value: InstructionValue,
    pub loc: Option<SourceLocation>,
    pub effects: Option<Vec<()>>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InstructionKind {
    Const,
    Let,
    Reassign,
    Catch,
    HoistedConst,
    HoistedLet,
    HoistedFunction,
    Function,
}

#[derive(Debug, Clone)]
pub struct LValue {
    pub place: Place,
    pub kind: InstructionKind,
}

#[derive(Debug, Clone)]
pub struct LValuePattern {
    pub pattern: Pattern,
    pub kind: InstructionKind,
}

#[derive(Debug, Clone)]
pub enum Pattern {
    Array(ArrayPattern),
    Object(ObjectPattern),
}

// =============================================================================
// InstructionValue enum
// =============================================================================

#[derive(Debug, Clone)]
pub enum InstructionValue {
    LoadLocal {
        place: Place,
        loc: Option<SourceLocation>,
    },
    LoadContext {
        place: Place,
        loc: Option<SourceLocation>,
    },
    DeclareLocal {
        lvalue: LValue,
        type_annotation: Option<String>,
        loc: Option<SourceLocation>,
    },
    DeclareContext {
        lvalue: LValue,
        loc: Option<SourceLocation>,
    },
    StoreLocal {
        lvalue: LValue,
        value: Place,
        type_annotation: Option<String>,
        loc: Option<SourceLocation>,
    },
    StoreContext {
        lvalue: LValue,
        value: Place,
        loc: Option<SourceLocation>,
    },
    Destructure {
        lvalue: LValuePattern,
        value: Place,
        loc: Option<SourceLocation>,
    },
    Primitive {
        value: PrimitiveValue,
        loc: Option<SourceLocation>,
    },
    JSXText {
        value: String,
        loc: Option<SourceLocation>,
    },
    BinaryExpression {
        operator: BinaryOperator,
        left: Place,
        right: Place,
        loc: Option<SourceLocation>,
    },
    NewExpression {
        callee: Place,
        args: Vec<PlaceOrSpread>,
        loc: Option<SourceLocation>,
    },
    CallExpression {
        callee: Place,
        args: Vec<PlaceOrSpread>,
        loc: Option<SourceLocation>,
    },
    MethodCall {
        receiver: Place,
        property: Place,
        args: Vec<PlaceOrSpread>,
        loc: Option<SourceLocation>,
    },
    UnaryExpression {
        operator: UnaryOperator,
        value: Place,
        loc: Option<SourceLocation>,
    },
    TypeCastExpression {
        value: Place,
        type_: Type,
        loc: Option<SourceLocation>,
    },
    JsxExpression {
        tag: JsxTag,
        props: Vec<JsxAttribute>,
        children: Option<Vec<Place>>,
        loc: Option<SourceLocation>,
        opening_loc: Option<SourceLocation>,
        closing_loc: Option<SourceLocation>,
    },
    ObjectExpression {
        properties: Vec<ObjectPropertyOrSpread>,
        loc: Option<SourceLocation>,
    },
    ObjectMethod {
        loc: Option<SourceLocation>,
        lowered_func: LoweredFunction,
    },
    ArrayExpression {
        elements: Vec<ArrayElement>,
        loc: Option<SourceLocation>,
    },
    JsxFragment {
        children: Vec<Place>,
        loc: Option<SourceLocation>,
    },
    RegExpLiteral {
        pattern: String,
        flags: String,
        loc: Option<SourceLocation>,
    },
    MetaProperty {
        meta: String,
        property: String,
        loc: Option<SourceLocation>,
    },
    PropertyStore {
        object: Place,
        property: PropertyLiteral,
        value: Place,
        loc: Option<SourceLocation>,
    },
    PropertyLoad {
        object: Place,
        property: PropertyLiteral,
        loc: Option<SourceLocation>,
    },
    PropertyDelete {
        object: Place,
        property: PropertyLiteral,
        loc: Option<SourceLocation>,
    },
    ComputedStore {
        object: Place,
        property: Place,
        value: Place,
        loc: Option<SourceLocation>,
    },
    ComputedLoad {
        object: Place,
        property: Place,
        loc: Option<SourceLocation>,
    },
    ComputedDelete {
        object: Place,
        property: Place,
        loc: Option<SourceLocation>,
    },
    LoadGlobal {
        binding: NonLocalBinding,
        loc: Option<SourceLocation>,
    },
    StoreGlobal {
        name: String,
        value: Place,
        loc: Option<SourceLocation>,
    },
    FunctionExpression {
        name: Option<String>,
        name_hint: Option<String>,
        lowered_func: LoweredFunction,
        expr_type: FunctionExpressionType,
        loc: Option<SourceLocation>,
    },
    TaggedTemplateExpression {
        tag: Place,
        value: TemplateQuasi,
        loc: Option<SourceLocation>,
    },
    TemplateLiteral {
        subexprs: Vec<Place>,
        quasis: Vec<TemplateQuasi>,
        loc: Option<SourceLocation>,
    },
    Await {
        value: Place,
        loc: Option<SourceLocation>,
    },
    GetIterator {
        collection: Place,
        loc: Option<SourceLocation>,
    },
    IteratorNext {
        iterator: Place,
        collection: Place,
        loc: Option<SourceLocation>,
    },
    NextPropertyOf {
        value: Place,
        loc: Option<SourceLocation>,
    },
    PrefixUpdate {
        lvalue: Place,
        operation: UpdateOperator,
        value: Place,
        loc: Option<SourceLocation>,
    },
    PostfixUpdate {
        lvalue: Place,
        operation: UpdateOperator,
        value: Place,
        loc: Option<SourceLocation>,
    },
    Debugger {
        loc: Option<SourceLocation>,
    },
    StartMemoize {
        manual_memo_id: u32,
        deps: Option<Vec<ManualMemoDependency>>,
        deps_loc: Option<Option<SourceLocation>>,
        loc: Option<SourceLocation>,
    },
    FinishMemoize {
        manual_memo_id: u32,
        decl: Place,
        pruned: bool,
        loc: Option<SourceLocation>,
    },
    UnsupportedNode {
        loc: Option<SourceLocation>,
    },
}

impl InstructionValue {
    pub fn loc(&self) -> Option<&SourceLocation> {
        match self {
            InstructionValue::LoadLocal { loc, .. }
            | InstructionValue::LoadContext { loc, .. }
            | InstructionValue::DeclareLocal { loc, .. }
            | InstructionValue::DeclareContext { loc, .. }
            | InstructionValue::StoreLocal { loc, .. }
            | InstructionValue::StoreContext { loc, .. }
            | InstructionValue::Destructure { loc, .. }
            | InstructionValue::Primitive { loc, .. }
            | InstructionValue::JSXText { loc, .. }
            | InstructionValue::BinaryExpression { loc, .. }
            | InstructionValue::NewExpression { loc, .. }
            | InstructionValue::CallExpression { loc, .. }
            | InstructionValue::MethodCall { loc, .. }
            | InstructionValue::UnaryExpression { loc, .. }
            | InstructionValue::TypeCastExpression { loc, .. }
            | InstructionValue::JsxExpression { loc, .. }
            | InstructionValue::ObjectExpression { loc, .. }
            | InstructionValue::ObjectMethod { loc, .. }
            | InstructionValue::ArrayExpression { loc, .. }
            | InstructionValue::JsxFragment { loc, .. }
            | InstructionValue::RegExpLiteral { loc, .. }
            | InstructionValue::MetaProperty { loc, .. }
            | InstructionValue::PropertyStore { loc, .. }
            | InstructionValue::PropertyLoad { loc, .. }
            | InstructionValue::PropertyDelete { loc, .. }
            | InstructionValue::ComputedStore { loc, .. }
            | InstructionValue::ComputedLoad { loc, .. }
            | InstructionValue::ComputedDelete { loc, .. }
            | InstructionValue::LoadGlobal { loc, .. }
            | InstructionValue::StoreGlobal { loc, .. }
            | InstructionValue::FunctionExpression { loc, .. }
            | InstructionValue::TaggedTemplateExpression { loc, .. }
            | InstructionValue::TemplateLiteral { loc, .. }
            | InstructionValue::Await { loc, .. }
            | InstructionValue::GetIterator { loc, .. }
            | InstructionValue::IteratorNext { loc, .. }
            | InstructionValue::NextPropertyOf { loc, .. }
            | InstructionValue::PrefixUpdate { loc, .. }
            | InstructionValue::PostfixUpdate { loc, .. }
            | InstructionValue::Debugger { loc, .. }
            | InstructionValue::StartMemoize { loc, .. }
            | InstructionValue::FinishMemoize { loc, .. }
            | InstructionValue::UnsupportedNode { loc, .. } => loc.as_ref(),
        }
    }
}

// =============================================================================
// Supporting types
// =============================================================================

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum PrimitiveValue {
    Null,
    Undefined,
    Boolean(bool),
    Number(FloatValue),
    String(String),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BinaryOperator {
    Equal,
    NotEqual,
    StrictEqual,
    StrictNotEqual,
    LessThan,
    LessEqual,
    GreaterThan,
    GreaterEqual,
    ShiftLeft,
    ShiftRight,
    UnsignedShiftRight,
    Add,
    Subtract,
    Multiply,
    Divide,
    Modulo,
    Exponent,
    BitwiseOr,
    BitwiseXor,
    BitwiseAnd,
    In,
    InstanceOf,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UnaryOperator {
    Minus,
    Plus,
    Not,
    BitwiseNot,
    TypeOf,
    Void,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UpdateOperator {
    Increment,
    Decrement,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FunctionExpressionType {
    ArrowFunctionExpression,
    FunctionExpression,
    FunctionDeclaration,
}

#[derive(Debug, Clone)]
pub struct TemplateQuasi {
    pub raw: String,
    pub cooked: Option<String>,
}

#[derive(Debug, Clone)]
pub struct ManualMemoDependency {
    pub root: ManualMemoDependencyRoot,
    pub path: Vec<DependencyPathEntry>,
    pub loc: Option<SourceLocation>,
}

#[derive(Debug, Clone)]
pub enum ManualMemoDependencyRoot {
    NamedLocal { value: Place, constant: bool },
    Global { identifier_name: String },
}

#[derive(Debug, Clone)]
pub struct DependencyPathEntry {
    pub property: PropertyLiteral,
    pub optional: bool,
    pub loc: Option<SourceLocation>,
}

// =============================================================================
// Place, Identifier, and related types
// =============================================================================

#[derive(Debug, Clone)]
pub struct Place {
    pub identifier: IdentifierId,
    pub effect: Effect,
    pub reactive: bool,
    pub loc: Option<SourceLocation>,
}

#[derive(Debug, Clone)]
pub struct Identifier {
    pub id: IdentifierId,
    pub declaration_id: DeclarationId,
    pub name: Option<IdentifierName>,
    pub mutable_range: MutableRange,
    pub scope: Option<ScopeId>,
    pub type_: TypeId,
    pub loc: Option<SourceLocation>,
}

#[derive(Debug, Clone)]
pub struct MutableRange {
    pub start: EvaluationOrder,
    pub end: EvaluationOrder,
}

#[derive(Debug, Clone)]
pub enum IdentifierName {
    Named(String),
    Promoted(String),
}

impl IdentifierName {
    pub fn value(&self) -> &str {
        match self {
            IdentifierName::Named(v) | IdentifierName::Promoted(v) => v,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Effect {
    Unknown,
    Freeze,
    Read,
    Capture,
    ConditionallyMutateIterator,
    ConditionallyMutate,
    Mutate,
    Store,
}

#[derive(Debug, Clone)]
pub struct SpreadPattern {
    pub place: Place,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Hole {
    Hole,
}

#[derive(Debug, Clone)]
pub struct ArrayPattern {
    pub items: Vec<ArrayPatternElement>,
    pub loc: Option<SourceLocation>,
}

#[derive(Debug, Clone)]
pub enum ArrayPatternElement {
    Place(Place),
    Spread(SpreadPattern),
    Hole,
}

#[derive(Debug, Clone)]
pub struct ObjectPattern {
    pub properties: Vec<ObjectPropertyOrSpread>,
    pub loc: Option<SourceLocation>,
}

#[derive(Debug, Clone)]
pub enum ObjectPropertyOrSpread {
    Property(ObjectProperty),
    Spread(SpreadPattern),
}

#[derive(Debug, Clone)]
pub struct ObjectProperty {
    pub key: ObjectPropertyKey,
    pub property_type: ObjectPropertyType,
    pub place: Place,
}

#[derive(Debug, Clone)]
pub enum ObjectPropertyKey {
    String { name: String },
    Identifier { name: String },
    Computed { name: Place },
    Number { name: FloatValue },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ObjectPropertyType {
    Property,
    Method,
}

#[derive(Debug, Clone)]
pub enum PropertyLiteral {
    String(String),
    Number(FloatValue),
}

#[derive(Debug, Clone)]
pub enum PlaceOrSpread {
    Place(Place),
    Spread(SpreadPattern),
}

#[derive(Debug, Clone)]
pub enum ArrayElement {
    Place(Place),
    Spread(SpreadPattern),
    Hole,
}

#[derive(Debug, Clone)]
pub struct LoweredFunction {
    pub func: FunctionId,
}

#[derive(Debug, Clone)]
pub struct BuiltinTag {
    pub name: String,
    pub loc: Option<SourceLocation>,
}

#[derive(Debug, Clone)]
pub enum JsxTag {
    Place(Place),
    Builtin(BuiltinTag),
}

#[derive(Debug, Clone)]
pub enum JsxAttribute {
    SpreadAttribute { argument: Place },
    Attribute { name: String, place: Place },
}

// =============================================================================
// Variable Binding types
// =============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BindingKind {
    Var,
    Let,
    Const,
    Param,
    Module,
    Hoisted,
    Local,
    Unknown,
}

#[derive(Debug, Clone)]
pub enum VariableBinding {
    Identifier {
        identifier: IdentifierId,
        binding_kind: BindingKind,
    },
    Global {
        name: String,
    },
    ImportDefault {
        name: String,
        module: String,
    },
    ImportSpecifier {
        name: String,
        module: String,
        imported: String,
    },
    ImportNamespace {
        name: String,
        module: String,
    },
    ModuleLocal {
        name: String,
    },
}

#[derive(Debug, Clone)]
pub enum NonLocalBinding {
    ImportDefault {
        name: String,
        module: String,
    },
    ImportSpecifier {
        name: String,
        module: String,
        imported: String,
    },
    ImportNamespace {
        name: String,
        module: String,
    },
    ModuleLocal {
        name: String,
    },
    Global {
        name: String,
    },
}

// =============================================================================
// Type system (from Types.ts)
// =============================================================================

#[derive(Debug, Clone)]
pub enum Type {
    Primitive,
    Function {
        shape_id: Option<String>,
        return_type: Box<Type>,
        is_constructor: bool,
    },
    Object {
        shape_id: Option<String>,
    },
    TypeVar {
        id: TypeId,
    },
    Poly,
    Phi {
        operands: Vec<Type>,
    },
    Property {
        object_type: Box<Type>,
        object_name: String,
        property_name: PropertyNameKind,
    },
    ObjectMethod,
}

#[derive(Debug, Clone)]
pub enum PropertyNameKind {
    Literal { value: PropertyLiteral },
    Computed { value: Box<Type> },
}

// =============================================================================
// ReactiveScope
// =============================================================================

#[derive(Debug, Clone)]
pub struct ReactiveScope {
    pub id: ScopeId,
    pub range: MutableRange,
}
