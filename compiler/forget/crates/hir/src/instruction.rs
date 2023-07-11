use std::{cell::RefCell, fmt::Display, rc::Rc};

use bumpalo::collections::{String, Vec};
use estree::BinaryOperator;

use crate::{IdentifierId, InstrIx, InstructionId, ScopeId, Type};

#[derive(Debug)]
pub struct Instruction<'a> {
    pub id: InstructionId,
    pub value: InstructionValue<'a>,
}

#[derive(Debug)]
pub enum InstructionValue<'a> {
    Array(Array<'a>),
    // Await(Await<'a>),
    Binary(Binary),
    // Call(Call<'a>),
    // ComputedDelete(ComputedDelete<'a>),
    // ComputedLoad(ComputedLoad<'a>),
    // ComputedStore(ComputedStore<'a>),
    // Debugger(Debugger<'a>),
    DeclareContext(DeclareContext<'a>),
    DeclareLocal(DeclareLocal<'a>),
    // Destructure(Destructure<'a>),
    // Function(Function<'a>),
    // JsxFragment(JsxFragment<'a>),
    // JsxText(JsxText<'a>),
    LoadContext(LoadContext),
    LoadGlobal(LoadGlobal<'a>),
    LoadLocal(LoadLocal<'a>),
    // MethodCall(MethodCall<'a>),
    // New(New<'a>),
    // NextIterable(NextIterable<'a>),
    // Object(Object<'a>),
    Primitive(Primitive<'a>),
    // PropertyDelete(PropertyDelete<'a>),
    // PropertyLoad(PropertyLoad<'a>),
    // PropertyStore(PropertyStore<'a>),
    // RegExp(RegExp<'a>),
    // StoreContext(StoreContext<'a>),
    StoreLocal(StoreLocal<'a>),
    // TaggedTemplate(TaggedTemplate<'a>),
    // Template(Template<'a>),
    // TypeCast(TypeCast<'a>),
    // Unary(Unary<'a>),
    // Unsupported(Unsupported<'a>),
}

#[derive(Debug)]
pub struct Array<'a> {
    pub elements: Vec<'a, Option<ArrayElement>>,
}

#[derive(Debug)]
pub enum ArrayElement {
    Place(Operand),
    Spread(Operand),
}

#[derive(Debug)]
pub struct Binary {
    pub left: Operand,
    pub operator: BinaryOperator,
    pub right: Operand,
}

#[derive(Debug)]
pub struct Primitive<'a> {
    pub value: PrimitiveValue<'a>,
}

#[derive(Debug)]
pub enum PrimitiveValue<'a> {
    Boolean(bool),
    Null,
    Number(Number),
    String(String<'a>),
    Undefined,
}

/// Represents a JavaScript Number as its binary representation so that
/// -1 == -1, NaN == Nan etc.
#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Debug, Hash)]
pub struct Number(u64);

impl From<f64> for Number {
    fn from(value: f64) -> Self {
        Self(value.to_bits())
    }
}

impl From<Number> for f64 {
    fn from(value: Number) -> Self {
        f64::from_bits(value.0)
    }
}

#[derive(Debug)]
pub struct LoadLocal<'a> {
    pub place: IdentifierOperand<'a>,
}

#[derive(Debug)]
pub struct LoadContext {
    pub place: Operand,
}

#[derive(Debug)]
pub struct LoadGlobal<'a> {
    pub name: String<'a>,
}

#[derive(Debug)]
pub struct DeclareLocal<'a> {
    pub lvalue: LValue<'a>,
}

#[derive(Debug)]
pub struct DeclareContext<'a> {
    pub lvalue: LValue<'a>, // note: kind must be InstructionKind::Let
}

#[derive(Debug)]
pub struct StoreLocal<'a> {
    pub lvalue: LValue<'a>,
    pub value: Operand,
}

#[derive(Clone, Debug)]
pub struct Operand {
    pub ix: InstrIx,
    pub effect: Option<Effect>,
}

#[derive(Clone, Debug)]
pub struct IdentifierOperand<'a> {
    pub identifier: Identifier<'a>,
    pub effect: Option<Effect>,
}

#[derive(Debug)]
pub struct LValue<'a> {
    pub identifier: IdentifierOperand<'a>,
    pub kind: InstructionKind,
}

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Debug)]
pub enum InstructionKind {
    /// `const` declaration
    Const,

    /// `let` declaration
    Let,

    /// Reassignment from `=` or assignment-update (`+=` etc)
    Reassign,
}

impl Display for InstructionKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Const => f.write_str("Const"),
            Self::Let => f.write_str("Let"),
            Self::Reassign => f.write_str("Reassign"),
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Debug)]
pub enum Effect {
    /// This reference freezes the value (corresponds to a place where codegen should emit a freeze instruction)
    Freeze,

    /// This reference reads the value
    Read,

    /// This reference reads and stores the value
    Capture,

    /// This reference *may* write to (mutate) the value. This covers two similar cases:
    /// - The compiler is being conservative and assuming that a value *may* be mutated
    /// - The effect is polymorphic: mutable values may be mutated, non-mutable values
    ///   will not be mutated.
    /// In both cases, we conservatively assume that mutable values will be mutated.
    /// But we do not error if the value is known to be immutable.
    ConditionallyMutate,

    /// This reference *does* write to (mutate) the value. It is an error (invalid input)
    /// if an immutable value flows into a location with this effect.
    Mutate,

    /// This reference may alias to (mutate) the value
    Store,
}

impl Effect {
    pub fn is_mutable(self) -> bool {
        match self {
            Self::Capture | Self::Store | Self::ConditionallyMutate | Self::Mutate => true,
            Self::Read | Self::Freeze => false,
        }
    }
}

impl Display for Effect {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(match self {
            Effect::Capture => "capture",
            Effect::ConditionallyMutate => "mutate?",
            Effect::Freeze => "freeze",
            Effect::Mutate => "mutate",
            Effect::Read => "read",
            Effect::Store => "store",
        })
    }
}

#[derive(Clone, Debug)]
pub struct Identifier<'a> {
    /// Uniquely identifiers this identifier
    pub id: IdentifierId,
    pub name: Option<String<'a>>,

    pub data: Rc<RefCell<IdentifierData>>,
}

#[derive(Debug)]
pub struct IdentifierData {
    pub mutable_range: MutableRange,

    pub scope: Option<ReactiveScope>,

    pub type_: Type,
}

/// Describes a span of code, generally used to describe the range in which
/// a particular value or set of values is mutable (hence the name).
///
/// Start is inclusive, end is exclusive (ie end is the "first" instruction
/// for which the value is not mutable).
#[derive(Clone, Debug)]
pub struct MutableRange {
    /// start of the range, inclusive.
    pub start: InstructionId,

    /// end of the range, exclusive
    pub end: InstructionId,
}

impl MutableRange {
    pub fn new() -> Self {
        Self {
            start: InstructionId(0),
            end: InstructionId(0),
        }
    }
}

impl Default for MutableRange {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Clone, Debug)]
pub struct ReactiveScope {
    pub id: ScopeId,
    pub range: MutableRange,
}
