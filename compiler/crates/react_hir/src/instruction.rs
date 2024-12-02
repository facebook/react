/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use std::cell::RefCell;
use std::fmt::Display;
use std::rc::Rc;

use react_estree::{BinaryOperator, JsValue};

use crate::{Function, IdentifierId, InstructionId, ScopeId, Type};

#[derive(Debug)]
pub struct Instruction {
    pub id: InstructionId,
    pub lvalue: IdentifierOperand,
    pub value: InstructionValue,
}

impl Instruction {
    pub fn each_lvalue<F>(&mut self, mut f: F)
    where
        F: FnMut(&mut IdentifierOperand),
    {
        match &mut self.value {
            InstructionValue::DeclareContext(instr) => {
                f(&mut instr.lvalue.identifier);
            }
            InstructionValue::DeclareLocal(instr) => {
                f(&mut instr.lvalue.identifier);
            }
            InstructionValue::StoreLocal(instr) => {
                f(&mut instr.lvalue.identifier);
            }
            InstructionValue::Destructure(instr) => {
                instr.pattern.each_operand(&mut f);
            }
            InstructionValue::Array(_)
            | InstructionValue::Binary(_)
            | InstructionValue::Call(_)
            | InstructionValue::LoadContext(_)
            | InstructionValue::LoadGlobal(_)
            | InstructionValue::LoadLocal(_)
            | InstructionValue::Primitive(_)
            | InstructionValue::Function(_)
            | InstructionValue::JSXElement(_)
            | InstructionValue::Tombstone => {}
        }
        f(&mut self.lvalue);
    }

    pub fn try_each_lvalue<F, E>(&mut self, mut f: F) -> Result<(), E>
    where
        F: FnMut(&mut IdentifierOperand) -> Result<(), E>,
    {
        match &mut self.value {
            InstructionValue::DeclareContext(instr) => {
                f(&mut instr.lvalue.identifier)?;
            }
            InstructionValue::DeclareLocal(instr) => {
                f(&mut instr.lvalue.identifier)?;
            }
            InstructionValue::StoreLocal(instr) => {
                f(&mut instr.lvalue.identifier)?;
            }
            InstructionValue::Destructure(instr) => instr.pattern.try_each_operand(&mut f)?,
            InstructionValue::Array(_)
            | InstructionValue::Binary(_)
            | InstructionValue::Call(_)
            | InstructionValue::LoadContext(_)
            | InstructionValue::LoadGlobal(_)
            | InstructionValue::LoadLocal(_)
            | InstructionValue::Primitive(_)
            | InstructionValue::Function(_)
            | InstructionValue::JSXElement(_)
            | InstructionValue::Tombstone => {}
        }
        f(&mut self.lvalue)?;
        Ok(())
    }

    pub fn each_rvalue<F>(&mut self, mut f: F)
    where
        F: FnMut(&mut IdentifierOperand),
    {
        match &mut self.value {
            InstructionValue::Array(value) => {
                for item in &mut value.elements {
                    match item {
                        Some(PlaceOrSpread::Place(item)) => f(item),
                        Some(PlaceOrSpread::Spread(item)) => f(item),
                        None => {}
                    }
                }
            }
            InstructionValue::Binary(value) => {
                f(&mut value.left);
                f(&mut value.right);
            }
            InstructionValue::Call(value) => {
                f(&mut value.callee);
                for arg in &mut value.arguments {
                    match arg {
                        PlaceOrSpread::Place(item) => f(item),
                        PlaceOrSpread::Spread(item) => f(item),
                    }
                }
            }
            InstructionValue::StoreLocal(value) => {
                f(&mut value.value);
            }
            InstructionValue::Function(value) => {
                for dep in &mut value.dependencies {
                    f(dep)
                }
            }
            InstructionValue::JSXElement(value) => {
                f(&mut value.tag);
                for attr in &mut value.props {
                    match attr {
                        JSXAttribute::Spread { argument } => f(argument),
                        JSXAttribute::Attribute { name: _, value } => f(value),
                    }
                }
                if let Some(children) = &mut value.children {
                    for child in children {
                        f(child)
                    }
                }
            }
            InstructionValue::Destructure(value) => {
                f(&mut value.value);
            }
            InstructionValue::LoadLocal(value) => {
                f(&mut value.place);
            }
            InstructionValue::DeclareContext(_)
            | InstructionValue::LoadContext(_)
            | InstructionValue::LoadGlobal(_)
            | InstructionValue::DeclareLocal(_)
            | InstructionValue::Primitive(_)
            | InstructionValue::Tombstone => {}
        }
    }
}

#[derive(Debug)]
pub enum InstructionValue {
    Array(Array),
    // Await(Await),
    Binary(Binary),
    Call(Call),
    // ComputedDelete(ComputedDelete),
    // ComputedLoad(ComputedLoad),
    // ComputedStore(ComputedStore),
    // Debugger(Debugger),
    DeclareContext(DeclareContext),
    DeclareLocal(DeclareLocal),
    Destructure(Destructure),
    Function(FunctionExpression),
    JSXElement(JSXElement),
    // JsxFragment(JsxFragment),
    // JsxText(JsxText),
    LoadContext(LoadContext),
    LoadGlobal(LoadGlobal),
    LoadLocal(LoadLocal),
    // MethodCall(MethodCall),
    // New(New),
    // NextIterable(NextIterable),
    // Object(Object),
    Primitive(Primitive),
    // PropertyDelete(PropertyDelete),
    // PropertyLoad(PropertyLoad),
    // PropertyStore(PropertyStore),
    // RegExp(RegExp),
    // StoreContext(StoreContext),
    StoreLocal(StoreLocal),
    // TaggedTemplate(TaggedTemplate),
    // Template(Template),
    // TypeCast(TypeCast),
    // Unary(Unary),
    Tombstone,
}

#[derive(Debug)]
pub struct Array {
    pub elements: Vec<Option<PlaceOrSpread>>,
}

#[derive(Debug)]
pub enum PlaceOrSpread {
    Place(IdentifierOperand),
    Spread(IdentifierOperand),
}

#[derive(Debug)]
pub struct Binary {
    pub left: IdentifierOperand,
    pub operator: BinaryOperator,
    pub right: IdentifierOperand,
}

#[derive(Debug)]
pub struct Call {
    pub callee: IdentifierOperand,
    pub arguments: Vec<PlaceOrSpread>,
}

#[derive(Debug)]
pub struct FunctionExpression {
    pub dependencies: Vec<IdentifierOperand>,
    pub lowered_function: Box<Function>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Primitive {
    pub value: JsValue,
}

#[derive(Debug)]
pub struct LoadLocal {
    pub place: IdentifierOperand,
}

#[derive(Debug)]
pub struct LoadContext {
    pub place: IdentifierOperand,
}

#[derive(Debug, PartialEq, Eq, Clone)]
pub struct LoadGlobal {
    pub name: String,
}

#[derive(Debug)]
pub struct DeclareLocal {
    pub lvalue: LValue,
}

#[derive(Debug)]
pub struct DeclareContext {
    pub lvalue: LValue, // note: kind must be InstructionKind::Let
}

#[derive(Debug)]
pub struct StoreLocal {
    pub lvalue: LValue,
    pub value: IdentifierOperand,
}

#[derive(Debug)]
pub struct JSXElement {
    pub tag: IdentifierOperand,
    pub props: Vec<JSXAttribute>,
    pub children: Option<Vec<IdentifierOperand>>,
}

#[derive(Debug)]
pub enum JSXAttribute {
    Spread {
        argument: IdentifierOperand,
    },
    Attribute {
        name: String,
        value: IdentifierOperand,
    },
}

#[derive(Debug)]
pub struct Destructure {
    pub kind: InstructionKind,
    pub pattern: DestructurePattern,
    pub value: IdentifierOperand,
}

#[derive(Debug)]
pub enum DestructurePattern {
    Array(Vec<ArrayDestructureItem>),
    Object(Vec<ObjectDestructureItem>),
}

impl DestructurePattern {
    pub fn try_each_operand<E, F>(&mut self, f: &mut F) -> Result<(), E>
    where
        F: FnMut(&mut IdentifierOperand) -> Result<(), E>,
    {
        match self {
            Self::Array(elements) => {
                for item in elements {
                    match item {
                        ArrayDestructureItem::Hole => { /* no-op */ }
                        ArrayDestructureItem::Value(item) => f(item)?,
                        ArrayDestructureItem::Spread(item) => f(item)?,
                    }
                }
            }
            Self::Object(properties) => {
                for property in properties {
                    match property {
                        ObjectDestructureItem::Property(property) => {
                            f(&mut property.value)?;
                        }
                        ObjectDestructureItem::Spread(property) => f(property)?,
                    }
                }
            }
        }
        Ok(())
    }
    pub fn each_operand<F>(&mut self, f: &mut F)
    where
        F: FnMut(&mut IdentifierOperand),
    {
        match self {
            Self::Array(elements) => {
                for item in elements {
                    match item {
                        ArrayDestructureItem::Hole => { /* no-op */ }
                        ArrayDestructureItem::Value(item) => f(item),
                        ArrayDestructureItem::Spread(item) => f(item),
                    }
                }
            }
            Self::Object(properties) => {
                for property in properties {
                    match property {
                        ObjectDestructureItem::Property(property) => {
                            f(&mut property.value);
                        }
                        ObjectDestructureItem::Spread(property) => f(property),
                    }
                }
            }
        }
    }
}

#[derive(Debug)]
pub enum ArrayDestructureItem {
    Hole,
    Value(IdentifierOperand),
    Spread(IdentifierOperand),
}

#[derive(Debug)]
pub enum ObjectDestructureItem {
    Property(ObjectDestructureProperty),
    Spread(IdentifierOperand),
}

#[derive(Debug)]
pub struct ObjectDestructureProperty {
    pub name: String,
    pub value: IdentifierOperand,
}

#[derive(Clone, Debug)]
pub struct IdentifierOperand {
    pub identifier: Identifier,
    pub effect: Option<Effect>,
}

#[derive(Debug)]
pub struct LValue {
    pub identifier: IdentifierOperand,
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
pub struct Identifier {
    /// Uniquely identifies this identifier
    pub id: IdentifierId,

    /// The name of the identifier, if this corresponds to a named identifier in the
    /// original program. May also be set for generated identifiers that must be
    /// emitted as a variable declaration.
    pub name: Option<String>,

    /// Shared data, such as the mutable range and scope of the value referred to by
    /// the identifier.
    pub data: Rc<RefCell<IdentifierData>>,
}

#[derive(Debug)]
pub struct IdentifierData {
    pub mutable_range: MutableRange,

    pub scope: Option<ReactiveScope>,

    /// NOTE: consider moving this to `Identifier` to support control-flow specific
    /// type information
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
