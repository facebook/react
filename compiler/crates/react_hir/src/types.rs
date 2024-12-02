/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
