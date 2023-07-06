use bumpalo::collections::{String, Vec};

use crate::{IdentifierId, InstructionId, ScopeId, Type};

pub struct Instruction<'a> {
    pub id: InstructionId,
    pub lvalue: Place<'a>,
    pub value: InstructionValue<'a>,
}

pub enum InstructionValue<'a> {
    Array(Array<'a>),
    // Await(Await<'a>),
    // Binary(Binary<'a>),
    // Call(Call<'a>),
    // ComputedDelete(ComputedDelete<'a>),
    // ComputedLoad(ComputedLoad<'a>),
    // ComputedStore(ComputedStore<'a>),
    // Debugger(Debugger<'a>),
    DeclareContext(DeclareContext<'a>),
    DeclareLocal(DeclareLocal<'a>),
    // Destructure(Destructure<'a>),
    // Expression(Expression<'a>),
    // Function(Function<'a>),
    // JsxFragment(JsxFragment<'a>),
    // JsxText(JsxText<'a>),
    LoadContext(LoadContext<'a>),
    // LoadGlobal(LoadGlobal<'a>),
    LoadLocal(LoadLocal<'a>),
    // MethodCall(MethodCall<'a>),
    // New(New<'a>),
    // NextIterable(NextIterable<'a>),
    // Object(Object<'a>),
    // Primitive(Primitive<'a>),
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

pub struct Array<'a> {
    pub elements: Vec<'a, ArrayElement<'a>>,
}

pub enum ArrayElement<'a> {
    Place(Place<'a>),
    Spread(Place<'a>),
}

pub struct LoadLocal<'a> {
    pub place: Place<'a>,
}

pub struct LoadContext<'a> {
    pub place: Place<'a>,
}

pub struct DeclareLocal<'a> {
    pub lvalue: LValue<'a>,
}

pub struct DeclareContext<'a> {
    pub lvalue: LValue<'a>, // note: kind must be InstructionKind::Let
}

pub struct StoreLocal<'a> {
    pub lvalue: LValue<'a>,
    pub value: Place<'a>,
}

pub struct Place<'a> {
    pub identifier: Identifier<'a>,
    pub effect: Option<Effect>,
}

pub struct LValue<'a> {
    pub place: Place<'a>,
    pub kind: InstructionKind,
}

pub enum InstructionKind {
    /// `const` declaration
    Const,

    /// `let` declaration
    Let,

    /// Reassignment from `=` or assignment-update (`+=` etc)
    Reassign,
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
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

pub struct Identifier<'a> {
    /// Uniquely identifiers this identifier
    pub id: IdentifierId,

    pub name: Option<String<'a>>,

    pub mutable_range: MutableRange,

    pub scope: Option<ReactiveScope>,

    pub type_: Type,
}

/// Describes a span of code, generally used to describe the range in which
/// a particular value or set of values is mutable (hence the name).
///
/// Start is inclusive, end is exclusive (ie end is the "first" instruction
/// for which the value is not mutable).
pub struct MutableRange {
    /// start of the range, inclusive.
    pub start: InstructionId,

    /// end of the range, exclusive
    pub end: InstructionId,
}

pub struct ReactiveScope {
    pub id: ScopeId,
    pub range: MutableRange,
}
