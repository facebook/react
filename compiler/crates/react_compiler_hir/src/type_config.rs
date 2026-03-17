// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Type configuration types, ported from TypeSchema.ts.
//!
//! These are the JSON-serializable config types used by `moduleTypeProvider`
//! and `installTypeConfig` to describe module/function/hook types.

use crate::Effect;

/// Mirrors TS `ValueKind` enum for use in config.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ValueKind {
    Mutable,
    Frozen,
    Primitive,
}

/// Mirrors TS `ValueReason` enum for use in config.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ValueReason {
    KnownReturnSignature,
    State,
    ReducerState,
    Context,
    Effect,
    HookCaptured,
    HookReturn,
    Global,
    JsxCaptured,
    StoreLocal,
    ReactiveFunctionArgument,
    Other,
}

// =============================================================================
// Aliasing effect config types (from TypeSchema.ts)
// =============================================================================

#[derive(Debug, Clone)]
pub enum AliasingEffectConfig {
    Freeze {
        value: String,
        reason: ValueReason,
    },
    Create {
        into: String,
        value: ValueKind,
        reason: ValueReason,
    },
    CreateFrom {
        from: String,
        into: String,
    },
    Assign {
        from: String,
        into: String,
    },
    Alias {
        from: String,
        into: String,
    },
    Capture {
        from: String,
        into: String,
    },
    ImmutableCapture {
        from: String,
        into: String,
    },
    Impure {
        place: String,
    },
    Mutate {
        value: String,
    },
    MutateTransitiveConditionally {
        value: String,
    },
    Apply {
        receiver: String,
        function: String,
        mutates_function: bool,
        args: Vec<ApplyArgConfig>,
        into: String,
    },
}

#[derive(Debug, Clone)]
pub enum ApplyArgConfig {
    Place(String),
    Spread { place: String },
    Hole,
}

/// Aliasing signature config, the JSON-serializable form.
#[derive(Debug, Clone)]
pub struct AliasingSignatureConfig {
    pub receiver: String,
    pub params: Vec<String>,
    pub rest: Option<String>,
    pub returns: String,
    pub temporaries: Vec<String>,
    pub effects: Vec<AliasingEffectConfig>,
}

// =============================================================================
// Type config (from TypeSchema.ts)
// =============================================================================

#[derive(Debug, Clone)]
pub enum TypeConfig {
    Object(ObjectTypeConfig),
    Function(FunctionTypeConfig),
    Hook(HookTypeConfig),
    TypeReference(TypeReferenceConfig),
}

#[derive(Debug, Clone)]
pub struct ObjectTypeConfig {
    pub properties: Option<Vec<(String, TypeConfig)>>,
}

#[derive(Debug, Clone)]
pub struct FunctionTypeConfig {
    pub positional_params: Vec<Effect>,
    pub rest_param: Option<Effect>,
    pub callee_effect: Effect,
    pub return_type: Box<TypeConfig>,
    pub return_value_kind: ValueKind,
    pub no_alias: Option<bool>,
    pub mutable_only_if_operands_are_mutable: Option<bool>,
    pub impure: Option<bool>,
    pub canonical_name: Option<String>,
    pub aliasing: Option<AliasingSignatureConfig>,
    pub known_incompatible: Option<String>,
}

#[derive(Debug, Clone)]
pub struct HookTypeConfig {
    pub positional_params: Option<Vec<Effect>>,
    pub rest_param: Option<Effect>,
    pub return_type: Box<TypeConfig>,
    pub return_value_kind: Option<ValueKind>,
    pub no_alias: Option<bool>,
    pub aliasing: Option<AliasingSignatureConfig>,
    pub known_incompatible: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BuiltInTypeRef {
    Any,
    Ref,
    Array,
    Primitive,
    MixedReadonly,
}

#[derive(Debug, Clone)]
pub struct TypeReferenceConfig {
    pub name: BuiltInTypeRef,
}
