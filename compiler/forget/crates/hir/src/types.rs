use crate::{FunctionId, ObjectId, TypeVarId};

pub enum Type {
    Builtin(BuiltinType),
    // Phi(Box<PhiType>),
    Var(TypeVarId),
    // Poly(Box<PolyType>),
    // Prop(Box<PropType>),
}

pub enum BuiltinType {
    Primitive,
    Function(Option<FunctionId>),
    Object(Option<ObjectId>),
}
