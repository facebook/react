use crate::{FunctionId, ObjectId};

pub enum Type {
    Builtin(Box<BuiltinType>),
    // Phi(Box<PhiType>),
    // Var(Box<TypeVar>),
    // Poly(Box<PolyType>),
    // Prop(Box<PropType>),
}

pub enum BuiltinType {
    Primitive,
    Function(Option<FunctionId>),
    Object(Option<ObjectId>),
}
