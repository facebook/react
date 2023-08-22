use crate::{FunctionId, ObjectId, TypeVarId};

#[derive(Clone, Debug)]
pub enum Type {
    Builtin(BuiltinType),
    // Phi(Box<PhiType>),
    Var(TypeVarId),
    // Poly(Box<PolyType>),
    // Prop(Box<PropType>),
}

#[derive(Clone, Debug)]
pub enum BuiltinType {
    Primitive,
    Function(Option<FunctionId>),
    Object(Option<ObjectId>),
}
