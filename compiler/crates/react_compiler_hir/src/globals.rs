// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Global type registry and built-in shape definitions, ported from Globals.ts.
//!
//! Provides `DEFAULT_SHAPES` (built-in object shapes) and `DEFAULT_GLOBALS`
//! (global variable types including React hooks and JS built-ins).

use std::collections::HashMap;

use crate::object_shape::*;
use crate::type_config::{
    AliasingEffectConfig, AliasingSignatureConfig, BuiltInTypeRef,
    TypeConfig, TypeReferenceConfig, ValueKind, ValueReason,
};
use crate::Effect;
use crate::Type;

/// Type alias matching TS `Global = BuiltInType | PolyType`.
/// In the Rust port, both map to our `Type` enum.
pub type Global = Type;

/// Registry mapping global names to their types.
pub type GlobalRegistry = HashMap<String, Global>;

// =============================================================================
// installTypeConfig — converts TypeConfig to internal Type
// =============================================================================

/// Convert a user-provided TypeConfig into an internal Type, registering shapes
/// as needed. Ported from TS `installTypeConfig` in Globals.ts.
pub fn install_type_config(
    _globals: &mut GlobalRegistry,
    shapes: &mut ShapeRegistry,
    type_config: &TypeConfig,
    module_name: &str,
    _loc: (),
) -> Global {
    match type_config {
        TypeConfig::TypeReference(TypeReferenceConfig { name }) => match name {
            BuiltInTypeRef::Array => Type::Object {
                shape_id: Some(BUILT_IN_ARRAY_ID.to_string()),
            },
            BuiltInTypeRef::MixedReadonly => Type::Object {
                shape_id: Some(BUILT_IN_MIXED_READONLY_ID.to_string()),
            },
            BuiltInTypeRef::Primitive => Type::Primitive,
            BuiltInTypeRef::Ref => Type::Object {
                shape_id: Some(BUILT_IN_USE_REF_ID.to_string()),
            },
            BuiltInTypeRef::Any => Type::Poly,
        },
        TypeConfig::Function(func_config) => {
            // Compute return type first to avoid double-borrow of shapes
            let return_type = install_type_config(
                _globals,
                shapes,
                &func_config.return_type,
                module_name,
                (),
            );
            add_function(
                shapes,
                Vec::new(),
                FunctionSignatureBuilder {
                    positional_params: func_config.positional_params.clone(),
                    rest_param: func_config.rest_param,
                    callee_effect: func_config.callee_effect,
                    return_type,
                    return_value_kind: func_config.return_value_kind,
                    no_alias: func_config.no_alias.unwrap_or(false),
                    mutable_only_if_operands_are_mutable: func_config
                        .mutable_only_if_operands_are_mutable
                        .unwrap_or(false),
                    impure: func_config.impure.unwrap_or(false),
                    canonical_name: func_config.canonical_name.clone(),
                    aliasing: func_config.aliasing.clone(),
                    known_incompatible: func_config.known_incompatible.clone(),
                    ..Default::default()
                },
                None,
                false,
            )
        }
        TypeConfig::Hook(hook_config) => {
            // Compute return type first to avoid double-borrow of shapes
            let return_type = install_type_config(
                _globals,
                shapes,
                &hook_config.return_type,
                module_name,
                (),
            );
            add_hook(
                shapes,
                HookSignatureBuilder {
                    hook_kind: HookKind::Custom,
                    positional_params: hook_config
                        .positional_params
                        .clone()
                        .unwrap_or_default(),
                    rest_param: hook_config.rest_param.or(Some(Effect::Freeze)),
                    callee_effect: Effect::Read,
                    return_type,
                    return_value_kind: hook_config.return_value_kind.unwrap_or(ValueKind::Frozen),
                    no_alias: hook_config.no_alias.unwrap_or(false),
                    aliasing: hook_config.aliasing.clone(),
                    known_incompatible: hook_config.known_incompatible.clone(),
                    ..Default::default()
                },
                None,
            )
        }
        TypeConfig::Object(obj_config) => {
            let properties: Vec<(String, Type)> = obj_config
                .properties
                .as_ref()
                .map(|props| {
                    props
                        .iter()
                        .map(|(key, value)| {
                            let ty = install_type_config(
                                _globals,
                                shapes,
                                value,
                                module_name,
                                (),
                            );
                            // Note: TS validates hook-name vs hook-type consistency here.
                            // We skip that validation for now.
                            (key.clone(), ty)
                        })
                        .collect()
                })
                .unwrap_or_default();
            add_object(shapes, None, properties)
        }
    }
}

// =============================================================================
// Build built-in shapes (BUILTIN_SHAPES from ObjectShape.ts)
// =============================================================================

/// Build the built-in shapes registry. This corresponds to TS `BUILTIN_SHAPES`
/// defined at module level in ObjectShape.ts.
pub fn build_builtin_shapes() -> ShapeRegistry {
    let mut shapes = ShapeRegistry::new();

    // BuiltInProps: { ref: UseRefType }
    add_object(
        &mut shapes,
        Some(BUILT_IN_PROPS_ID),
        vec![(
            "ref".to_string(),
            Type::Object {
                shape_id: Some(BUILT_IN_USE_REF_ID.to_string()),
            },
        )],
    );

    build_array_shape(&mut shapes);
    build_set_shape(&mut shapes);
    build_map_shape(&mut shapes);
    build_weak_set_shape(&mut shapes);
    build_weak_map_shape(&mut shapes);
    build_object_shape(&mut shapes);
    build_ref_shapes(&mut shapes);
    build_state_shapes(&mut shapes);
    build_hook_shapes(&mut shapes);
    build_misc_shapes(&mut shapes);

    shapes
}

fn simple_function(
    shapes: &mut ShapeRegistry,
    positional_params: Vec<Effect>,
    rest_param: Option<Effect>,
    return_type: Type,
    return_value_kind: ValueKind,
) -> Type {
    add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params,
            rest_param,
            return_type,
            return_value_kind,
            ..Default::default()
        },
        None,
        false,
    )
}

/// Shorthand for a pure function returning Primitive.
fn pure_primitive_fn(shapes: &mut ShapeRegistry) -> Type {
    simple_function(
        shapes,
        Vec::new(),
        Some(Effect::Read),
        Type::Primitive,
        ValueKind::Primitive,
    )
}

fn build_array_shape(shapes: &mut ShapeRegistry) {
    let index_of = pure_primitive_fn(shapes);
    let includes = pure_primitive_fn(shapes);
    let pop = simple_function(shapes, Vec::new(), None, Type::Poly, ValueKind::Mutable);
    let at = simple_function(
        shapes,
        vec![Effect::Read],
        None,
        Type::Poly,
        ValueKind::Mutable,
    );
    let concat = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            rest_param: Some(Effect::Capture),
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_ARRAY_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            callee_effect: Effect::Capture,
            ..Default::default()
        },
        None,
        false,
    );
    let join = pure_primitive_fn(shapes);
    let flat = simple_function(
        shapes,
        Vec::new(),
        Some(Effect::Read),
        Type::Object {
            shape_id: Some(BUILT_IN_ARRAY_ID.to_string()),
        },
        ValueKind::Mutable,
    );
    let to_reversed = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            callee_effect: Effect::Capture,
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_ARRAY_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            ..Default::default()
        },
        None,
        false,
    );
    let slice = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            rest_param: Some(Effect::Read),
            callee_effect: Effect::Capture,
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_ARRAY_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            ..Default::default()
        },
        None,
        false,
    );
    let map = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::ConditionallyMutate],
            rest_param: Some(Effect::Read),
            callee_effect: Effect::ConditionallyMutate,
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_ARRAY_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            mutable_only_if_operands_are_mutable: true,
            ..Default::default()
        },
        None,
        false,
    );
    let filter = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::ConditionallyMutate],
            rest_param: Some(Effect::Read),
            callee_effect: Effect::ConditionallyMutate,
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_ARRAY_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            mutable_only_if_operands_are_mutable: true,
            ..Default::default()
        },
        None,
        false,
    );
    let find = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::ConditionallyMutate],
            rest_param: Some(Effect::Read),
            callee_effect: Effect::ConditionallyMutate,
            return_type: Type::Poly,
            return_value_kind: ValueKind::Mutable,
            mutable_only_if_operands_are_mutable: true,
            ..Default::default()
        },
        None,
        false,
    );
    let find_index = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::ConditionallyMutate],
            rest_param: Some(Effect::Read),
            callee_effect: Effect::ConditionallyMutate,
            return_type: Type::Primitive,
            return_value_kind: ValueKind::Primitive,
            mutable_only_if_operands_are_mutable: true,
            ..Default::default()
        },
        None,
        false,
    );
    let find_last = find.clone();
    let find_last_index = find_index.clone();
    let reduce = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::ConditionallyMutate],
            rest_param: Some(Effect::Capture),
            callee_effect: Effect::ConditionallyMutate,
            return_type: Type::Poly,
            return_value_kind: ValueKind::Mutable,
            mutable_only_if_operands_are_mutable: true,
            ..Default::default()
        },
        None,
        false,
    );
    let reduce_right = reduce.clone();
    let for_each = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::ConditionallyMutate],
            rest_param: Some(Effect::Read),
            callee_effect: Effect::ConditionallyMutate,
            return_type: Type::Primitive,
            return_value_kind: ValueKind::Primitive,
            mutable_only_if_operands_are_mutable: true,
            ..Default::default()
        },
        None,
        false,
    );
    let every = for_each.clone();
    let some = for_each.clone();
    let flat_map = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::ConditionallyMutate],
            rest_param: Some(Effect::Read),
            callee_effect: Effect::ConditionallyMutate,
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_ARRAY_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            mutable_only_if_operands_are_mutable: true,
            ..Default::default()
        },
        None,
        false,
    );
    let sort = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::Read],
            rest_param: None,
            callee_effect: Effect::Store,
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_ARRAY_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            ..Default::default()
        },
        None,
        false,
    );
    let to_sorted = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::Read],
            rest_param: None,
            callee_effect: Effect::Capture,
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_ARRAY_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            ..Default::default()
        },
        None,
        false,
    );
    let to_spliced = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            rest_param: Some(Effect::Capture),
            callee_effect: Effect::Capture,
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_ARRAY_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            ..Default::default()
        },
        None,
        false,
    );
    let push = simple_function(
        shapes,
        Vec::new(),
        Some(Effect::Capture),
        Type::Primitive,
        ValueKind::Primitive,
    );
    let length = Type::Primitive;
    let reverse = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            callee_effect: Effect::Store,
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_ARRAY_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            ..Default::default()
        },
        None,
        false,
    );
    let fill = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            rest_param: Some(Effect::Capture),
            callee_effect: Effect::Store,
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_ARRAY_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            ..Default::default()
        },
        None,
        false,
    );
    let splice = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            rest_param: Some(Effect::Capture),
            callee_effect: Effect::Store,
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_ARRAY_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            ..Default::default()
        },
        None,
        false,
    );
    let unshift = simple_function(
        shapes,
        Vec::new(),
        Some(Effect::Capture),
        Type::Primitive,
        ValueKind::Primitive,
    );
    let keys = simple_function(
        shapes,
        Vec::new(),
        None,
        Type::Poly,
        ValueKind::Mutable,
    );
    let values = keys.clone();
    let entries = keys.clone();
    let to_string = pure_primitive_fn(shapes);
    let last_index_of = pure_primitive_fn(shapes);

    add_object(
        shapes,
        Some(BUILT_IN_ARRAY_ID),
        vec![
            ("indexOf".to_string(), index_of),
            ("includes".to_string(), includes),
            ("pop".to_string(), pop),
            ("at".to_string(), at),
            ("concat".to_string(), concat),
            ("join".to_string(), join),
            ("flat".to_string(), flat),
            ("toReversed".to_string(), to_reversed),
            ("slice".to_string(), slice),
            ("map".to_string(), map),
            ("filter".to_string(), filter),
            ("find".to_string(), find),
            ("findIndex".to_string(), find_index),
            ("findLast".to_string(), find_last),
            ("findLastIndex".to_string(), find_last_index),
            ("reduce".to_string(), reduce),
            ("reduceRight".to_string(), reduce_right),
            ("forEach".to_string(), for_each),
            ("every".to_string(), every),
            ("some".to_string(), some),
            ("flatMap".to_string(), flat_map),
            ("sort".to_string(), sort),
            ("toSorted".to_string(), to_sorted),
            ("toSpliced".to_string(), to_spliced),
            ("push".to_string(), push),
            ("length".to_string(), length),
            ("reverse".to_string(), reverse),
            ("fill".to_string(), fill),
            ("splice".to_string(), splice),
            ("unshift".to_string(), unshift),
            ("keys".to_string(), keys),
            ("values".to_string(), values),
            ("entries".to_string(), entries),
            ("toString".to_string(), to_string),
            ("lastIndexOf".to_string(), last_index_of),
        ],
    );
}

fn build_set_shape(shapes: &mut ShapeRegistry) {
    let has = pure_primitive_fn(shapes);
    let add = simple_function(
        shapes,
        vec![Effect::Capture],
        None,
        Type::Poly,
        ValueKind::Mutable,
    );
    let delete = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::Read],
            callee_effect: Effect::Store,
            return_type: Type::Primitive,
            return_value_kind: ValueKind::Primitive,
            ..Default::default()
        },
        None,
        false,
    );
    let size = Type::Primitive;
    let for_each = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::ConditionallyMutate],
            callee_effect: Effect::ConditionallyMutate,
            return_type: Type::Primitive,
            return_value_kind: ValueKind::Primitive,
            mutable_only_if_operands_are_mutable: true,
            ..Default::default()
        },
        None,
        false,
    );
    let values = simple_function(shapes, Vec::new(), None, Type::Poly, ValueKind::Mutable);
    let keys = values.clone();
    let entries = values.clone();

    add_object(
        shapes,
        Some(BUILT_IN_SET_ID),
        vec![
            ("has".to_string(), has),
            ("add".to_string(), add),
            ("delete".to_string(), delete),
            ("size".to_string(), size),
            ("forEach".to_string(), for_each),
            ("values".to_string(), values),
            ("keys".to_string(), keys),
            ("entries".to_string(), entries),
        ],
    );
}

fn build_map_shape(shapes: &mut ShapeRegistry) {
    let has = pure_primitive_fn(shapes);
    let get = simple_function(
        shapes,
        vec![Effect::Read],
        None,
        Type::Poly,
        ValueKind::Mutable,
    );
    let set = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::Capture, Effect::Capture],
            callee_effect: Effect::Store,
            return_type: Type::Poly,
            return_value_kind: ValueKind::Mutable,
            ..Default::default()
        },
        None,
        false,
    );
    let delete = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::Read],
            callee_effect: Effect::Store,
            return_type: Type::Primitive,
            return_value_kind: ValueKind::Primitive,
            ..Default::default()
        },
        None,
        false,
    );
    let size = Type::Primitive;
    let for_each = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::ConditionallyMutate],
            callee_effect: Effect::ConditionallyMutate,
            return_type: Type::Primitive,
            return_value_kind: ValueKind::Primitive,
            mutable_only_if_operands_are_mutable: true,
            ..Default::default()
        },
        None,
        false,
    );
    let values = simple_function(shapes, Vec::new(), None, Type::Poly, ValueKind::Mutable);
    let keys = values.clone();
    let entries = values.clone();

    add_object(
        shapes,
        Some(BUILT_IN_MAP_ID),
        vec![
            ("has".to_string(), has),
            ("get".to_string(), get),
            ("set".to_string(), set),
            ("delete".to_string(), delete),
            ("size".to_string(), size),
            ("forEach".to_string(), for_each),
            ("values".to_string(), values),
            ("keys".to_string(), keys),
            ("entries".to_string(), entries),
        ],
    );
}

fn build_weak_set_shape(shapes: &mut ShapeRegistry) {
    let has = pure_primitive_fn(shapes);
    let add = simple_function(
        shapes,
        vec![Effect::Capture],
        None,
        Type::Poly,
        ValueKind::Mutable,
    );
    let delete = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::Read],
            callee_effect: Effect::Store,
            return_type: Type::Primitive,
            return_value_kind: ValueKind::Primitive,
            ..Default::default()
        },
        None,
        false,
    );

    add_object(
        shapes,
        Some(BUILT_IN_WEAK_SET_ID),
        vec![
            ("has".to_string(), has),
            ("add".to_string(), add),
            ("delete".to_string(), delete),
        ],
    );
}

fn build_weak_map_shape(shapes: &mut ShapeRegistry) {
    let has = pure_primitive_fn(shapes);
    let get = simple_function(
        shapes,
        vec![Effect::Read],
        None,
        Type::Poly,
        ValueKind::Mutable,
    );
    let set = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::Capture, Effect::Capture],
            callee_effect: Effect::Store,
            return_type: Type::Poly,
            return_value_kind: ValueKind::Mutable,
            ..Default::default()
        },
        None,
        false,
    );
    let delete = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::Read],
            callee_effect: Effect::Store,
            return_type: Type::Primitive,
            return_value_kind: ValueKind::Primitive,
            ..Default::default()
        },
        None,
        false,
    );

    add_object(
        shapes,
        Some(BUILT_IN_WEAK_MAP_ID),
        vec![
            ("has".to_string(), has),
            ("get".to_string(), get),
            ("set".to_string(), set),
            ("delete".to_string(), delete),
        ],
    );
}

fn build_object_shape(shapes: &mut ShapeRegistry) {
    // BuiltInObject: empty shape (used as the default for object literals)
    add_object(shapes, Some(BUILT_IN_OBJECT_ID), Vec::new());
    // BuiltInFunction: empty shape
    add_object(shapes, Some(BUILT_IN_FUNCTION_ID), Vec::new());
    // BuiltInJsx: empty shape
    add_object(shapes, Some(BUILT_IN_JSX_ID), Vec::new());
    // BuiltInMixedReadonly: has a wildcard property that returns Poly
    let mut props = HashMap::new();
    props.insert("*".to_string(), Type::Poly);
    shapes.insert(
        BUILT_IN_MIXED_READONLY_ID.to_string(),
        ObjectShape {
            properties: props,
            function_type: None,
        },
    );
}

fn build_ref_shapes(shapes: &mut ShapeRegistry) {
    // BuiltInUseRefId: { current: Poly }
    add_object(
        shapes,
        Some(BUILT_IN_USE_REF_ID),
        vec![("current".to_string(), Type::Poly)],
    );
    // BuiltInRefValue: Poly (the .current value itself)
    add_object(shapes, Some(BUILT_IN_REF_VALUE_ID), Vec::new());
}

fn build_state_shapes(shapes: &mut ShapeRegistry) {
    // BuiltInSetState: function that freezes its argument
    let set_state = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            rest_param: Some(Effect::Freeze),
            return_type: Type::Primitive,
            return_value_kind: ValueKind::Primitive,
            ..Default::default()
        },
        Some(BUILT_IN_SET_STATE_ID),
        false,
    );

    // BuiltInUseState: object with [0] and [1] (via wildcard) — use Poly wildcard
    add_object(
        shapes,
        Some(BUILT_IN_USE_STATE_ID),
        vec![("*".to_string(), Type::Poly)],
    );

    // BuiltInSetActionState
    let _set_action_state = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            rest_param: Some(Effect::Freeze),
            return_type: Type::Primitive,
            return_value_kind: ValueKind::Primitive,
            ..Default::default()
        },
        Some(BUILT_IN_SET_ACTION_STATE_ID),
        false,
    );

    // BuiltInUseActionState
    add_object(
        shapes,
        Some(BUILT_IN_USE_ACTION_STATE_ID),
        vec![("*".to_string(), Type::Poly)],
    );

    // BuiltInDispatch
    add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            rest_param: Some(Effect::Freeze),
            return_type: Type::Primitive,
            return_value_kind: ValueKind::Primitive,
            ..Default::default()
        },
        Some(BUILT_IN_DISPATCH_ID),
        false,
    );

    // BuiltInUseReducer
    add_object(
        shapes,
        Some(BUILT_IN_USE_REDUCER_ID),
        vec![("*".to_string(), Type::Poly)],
    );

    // BuiltInStartTransition
    add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            rest_param: Some(Effect::Freeze),
            return_type: Type::Primitive,
            return_value_kind: ValueKind::Primitive,
            ..Default::default()
        },
        Some(BUILT_IN_START_TRANSITION_ID),
        false,
    );

    // BuiltInUseTransition
    add_object(
        shapes,
        Some(BUILT_IN_USE_TRANSITION_ID),
        vec![("*".to_string(), Type::Poly)],
    );

    // BuiltInSetOptimistic
    add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            rest_param: Some(Effect::Freeze),
            return_type: Type::Primitive,
            return_value_kind: ValueKind::Primitive,
            ..Default::default()
        },
        Some(BUILT_IN_SET_OPTIMISTIC_ID),
        false,
    );

    // BuiltInUseOptimistic
    add_object(
        shapes,
        Some(BUILT_IN_USE_OPTIMISTIC_ID),
        vec![("*".to_string(), Type::Poly)],
    );

    let _ = set_state;
}

fn build_hook_shapes(shapes: &mut ShapeRegistry) {
    // BuiltInEffectEvent function shape (the return value of useEffectEvent)
    add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            rest_param: Some(Effect::Read),
            return_type: Type::Poly,
            return_value_kind: ValueKind::Mutable,
            ..Default::default()
        },
        Some(BUILT_IN_EFFECT_EVENT_ID),
        false,
    );
}

fn build_misc_shapes(shapes: &mut ShapeRegistry) {
    // ReanimatedSharedValue
    add_object(
        shapes,
        Some(REANIMATED_SHARED_VALUE_ID),
        vec![("value".to_string(), Type::Poly)],
    );
}

// =============================================================================
// Build default globals (DEFAULT_GLOBALS from Globals.ts)
// =============================================================================

/// Build the default globals registry. This corresponds to TS `DEFAULT_GLOBALS`.
///
/// Requires a mutable reference to the shapes registry because some globals
/// (like Object.keys, Array.isArray) register new shapes.
pub fn build_default_globals(shapes: &mut ShapeRegistry) -> GlobalRegistry {
    let mut globals = GlobalRegistry::new();

    // React APIs
    build_react_apis(shapes, &mut globals);

    // Typed JS globals
    build_typed_globals(shapes, &mut globals);

    // Untyped globals (treated as Poly)
    for name in UNTYPED_GLOBALS {
        globals.insert(name.to_string(), Type::Poly);
    }

    // globalThis and global
    // Note: TS builds these recursively with all typed globals. We register
    // them as Poly objects since the recursive definition isn't critical for
    // the passes currently ported.
    globals.insert(
        "globalThis".to_string(),
        Type::Object {
            shape_id: Some("globalThis".to_string()),
        },
    );
    globals.insert(
        "global".to_string(),
        Type::Object {
            shape_id: Some("global".to_string()),
        },
    );
    // Register simple globalThis/global shapes
    add_object(shapes, Some("globalThis"), Vec::new());
    add_object(shapes, Some("global"), Vec::new());

    globals
}

const UNTYPED_GLOBALS: &[&str] = &[
    "Object",
    "Function",
    "RegExp",
    "Date",
    "Error",
    "TypeError",
    "RangeError",
    "ReferenceError",
    "SyntaxError",
    "URIError",
    "EvalError",
    "DataView",
    "Float32Array",
    "Float64Array",
    "Int8Array",
    "Int16Array",
    "Int32Array",
    "WeakMap",
    "Uint8Array",
    "Uint8ClampedArray",
    "Uint16Array",
    "Uint32Array",
    "ArrayBuffer",
    "JSON",
    "console",
    "eval",
];

fn build_react_apis(shapes: &mut ShapeRegistry, globals: &mut GlobalRegistry) {
    // useContext
    let use_context = add_hook(
        shapes,
        HookSignatureBuilder {
            rest_param: Some(Effect::Read),
            return_type: Type::Poly,
            return_value_kind: ValueKind::Frozen,
            return_value_reason: Some(ValueReason::Context),
            hook_kind: HookKind::UseContext,
            ..Default::default()
        },
        Some(BUILT_IN_USE_CONTEXT_HOOK_ID),
    );
    globals.insert("useContext".to_string(), use_context);

    // useState
    let use_state = add_hook(
        shapes,
        HookSignatureBuilder {
            rest_param: Some(Effect::Freeze),
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_USE_STATE_ID.to_string()),
            },
            return_value_kind: ValueKind::Frozen,
            return_value_reason: Some(ValueReason::State),
            hook_kind: HookKind::UseState,
            ..Default::default()
        },
        None,
    );
    globals.insert("useState".to_string(), use_state);

    // useActionState
    let use_action_state = add_hook(
        shapes,
        HookSignatureBuilder {
            rest_param: Some(Effect::Freeze),
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_USE_ACTION_STATE_ID.to_string()),
            },
            return_value_kind: ValueKind::Frozen,
            return_value_reason: Some(ValueReason::State),
            hook_kind: HookKind::UseActionState,
            ..Default::default()
        },
        None,
    );
    globals.insert("useActionState".to_string(), use_action_state);

    // useReducer
    let use_reducer = add_hook(
        shapes,
        HookSignatureBuilder {
            rest_param: Some(Effect::Freeze),
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_USE_REDUCER_ID.to_string()),
            },
            return_value_kind: ValueKind::Frozen,
            return_value_reason: Some(ValueReason::ReducerState),
            hook_kind: HookKind::UseReducer,
            ..Default::default()
        },
        None,
    );
    globals.insert("useReducer".to_string(), use_reducer);

    // useRef
    let use_ref = add_hook(
        shapes,
        HookSignatureBuilder {
            rest_param: Some(Effect::Capture),
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_USE_REF_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            hook_kind: HookKind::UseRef,
            ..Default::default()
        },
        None,
    );
    globals.insert("useRef".to_string(), use_ref);

    // useImperativeHandle
    let use_imperative_handle = add_hook(
        shapes,
        HookSignatureBuilder {
            rest_param: Some(Effect::Freeze),
            return_type: Type::Primitive,
            return_value_kind: ValueKind::Frozen,
            hook_kind: HookKind::UseImperativeHandle,
            ..Default::default()
        },
        None,
    );
    globals.insert("useImperativeHandle".to_string(), use_imperative_handle);

    // useMemo
    let use_memo = add_hook(
        shapes,
        HookSignatureBuilder {
            rest_param: Some(Effect::Freeze),
            return_type: Type::Poly,
            return_value_kind: ValueKind::Frozen,
            hook_kind: HookKind::UseMemo,
            ..Default::default()
        },
        None,
    );
    globals.insert("useMemo".to_string(), use_memo);

    // useCallback
    let use_callback = add_hook(
        shapes,
        HookSignatureBuilder {
            rest_param: Some(Effect::Freeze),
            return_type: Type::Poly,
            return_value_kind: ValueKind::Frozen,
            hook_kind: HookKind::UseCallback,
            ..Default::default()
        },
        None,
    );
    globals.insert("useCallback".to_string(), use_callback);

    // useEffect (with aliasing signature)
    let use_effect = add_hook(
        shapes,
        HookSignatureBuilder {
            rest_param: Some(Effect::Freeze),
            return_type: Type::Primitive,
            return_value_kind: ValueKind::Frozen,
            hook_kind: HookKind::UseEffect,
            aliasing: Some(AliasingSignatureConfig {
                receiver: "@receiver".to_string(),
                params: Vec::new(),
                rest: Some("@rest".to_string()),
                returns: "@returns".to_string(),
                temporaries: vec!["@effect".to_string()],
                effects: vec![
                    AliasingEffectConfig::Freeze {
                        value: "@rest".to_string(),
                        reason: ValueReason::Effect,
                    },
                    AliasingEffectConfig::Create {
                        into: "@effect".to_string(),
                        value: ValueKind::Frozen,
                        reason: ValueReason::KnownReturnSignature,
                    },
                    AliasingEffectConfig::Capture {
                        from: "@rest".to_string(),
                        into: "@effect".to_string(),
                    },
                    AliasingEffectConfig::Create {
                        into: "@returns".to_string(),
                        value: ValueKind::Primitive,
                        reason: ValueReason::KnownReturnSignature,
                    },
                ],
            }),
            ..Default::default()
        },
        Some(BUILT_IN_USE_EFFECT_HOOK_ID),
    );
    globals.insert("useEffect".to_string(), use_effect);

    // useLayoutEffect
    let use_layout_effect = add_hook(
        shapes,
        HookSignatureBuilder {
            rest_param: Some(Effect::Freeze),
            return_type: Type::Poly,
            return_value_kind: ValueKind::Frozen,
            hook_kind: HookKind::UseLayoutEffect,
            ..Default::default()
        },
        Some(BUILT_IN_USE_LAYOUT_EFFECT_HOOK_ID),
    );
    globals.insert("useLayoutEffect".to_string(), use_layout_effect);

    // useInsertionEffect
    let use_insertion_effect = add_hook(
        shapes,
        HookSignatureBuilder {
            rest_param: Some(Effect::Freeze),
            return_type: Type::Poly,
            return_value_kind: ValueKind::Frozen,
            hook_kind: HookKind::UseInsertionEffect,
            ..Default::default()
        },
        Some(BUILT_IN_USE_INSERTION_EFFECT_HOOK_ID),
    );
    globals.insert("useInsertionEffect".to_string(), use_insertion_effect);

    // useTransition
    let use_transition = add_hook(
        shapes,
        HookSignatureBuilder {
            rest_param: None,
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_USE_TRANSITION_ID.to_string()),
            },
            return_value_kind: ValueKind::Frozen,
            hook_kind: HookKind::UseTransition,
            ..Default::default()
        },
        None,
    );
    globals.insert("useTransition".to_string(), use_transition);

    // useOptimistic
    let use_optimistic = add_hook(
        shapes,
        HookSignatureBuilder {
            rest_param: Some(Effect::Freeze),
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_USE_OPTIMISTIC_ID.to_string()),
            },
            return_value_kind: ValueKind::Frozen,
            return_value_reason: Some(ValueReason::State),
            hook_kind: HookKind::UseOptimistic,
            ..Default::default()
        },
        None,
    );
    globals.insert("useOptimistic".to_string(), use_optimistic);

    // use (not a hook, it's a function)
    let use_fn = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            rest_param: Some(Effect::Freeze),
            return_type: Type::Poly,
            return_value_kind: ValueKind::Frozen,
            ..Default::default()
        },
        Some(BUILT_IN_USE_OPERATOR_ID),
        false,
    );
    globals.insert("use".to_string(), use_fn);

    // useEffectEvent
    let use_effect_event = add_hook(
        shapes,
        HookSignatureBuilder {
            rest_param: Some(Effect::Freeze),
            return_type: Type::Function {
                shape_id: Some(BUILT_IN_EFFECT_EVENT_ID.to_string()),
                return_type: Box::new(Type::Poly),
                is_constructor: false,
            },
            return_value_kind: ValueKind::Frozen,
            hook_kind: HookKind::UseEffectEvent,
            ..Default::default()
        },
        Some(BUILT_IN_USE_EFFECT_EVENT_ID),
    );
    globals.insert("useEffectEvent".to_string(), use_effect_event);
}

fn build_typed_globals(shapes: &mut ShapeRegistry, globals: &mut GlobalRegistry) {
    // Object
    let obj_keys = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::Read],
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_ARRAY_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            ..Default::default()
        },
        None,
        false,
    );
    let obj_from_entries = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::ConditionallyMutate],
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_OBJECT_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            ..Default::default()
        },
        None,
        false,
    );
    let obj_entries = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::Capture],
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_ARRAY_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            ..Default::default()
        },
        None,
        false,
    );
    let obj_values = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::Capture],
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_ARRAY_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            ..Default::default()
        },
        None,
        false,
    );
    let object_global = add_object(
        shapes,
        Some("Object"),
        vec![
            ("keys".to_string(), obj_keys),
            ("fromEntries".to_string(), obj_from_entries),
            ("entries".to_string(), obj_entries),
            ("values".to_string(), obj_values),
        ],
    );
    globals.insert("Object".to_string(), object_global);

    // Array
    let array_is_array = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::Read],
            return_type: Type::Primitive,
            return_value_kind: ValueKind::Primitive,
            ..Default::default()
        },
        None,
        false,
    );
    let array_from = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![
                Effect::ConditionallyMutateIterator,
                Effect::ConditionallyMutate,
                Effect::ConditionallyMutate,
            ],
            rest_param: Some(Effect::Read),
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_ARRAY_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            ..Default::default()
        },
        None,
        false,
    );
    let array_of = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            rest_param: Some(Effect::Read),
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_ARRAY_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            ..Default::default()
        },
        None,
        false,
    );
    let array_global = add_object(
        shapes,
        Some("Array"),
        vec![
            ("isArray".to_string(), array_is_array),
            ("from".to_string(), array_from),
            ("of".to_string(), array_of),
        ],
    );
    globals.insert("Array".to_string(), array_global);

    // Math
    let math_fns: Vec<(String, Type)> = [
        "max", "min", "trunc", "ceil", "floor", "pow", "round", "sqrt", "abs", "sign", "log",
        "log2", "log10",
    ]
    .iter()
    .map(|name| (name.to_string(), pure_primitive_fn(shapes)))
    .collect();
    let mut math_props = math_fns;
    math_props.push(("PI".to_string(), Type::Primitive));
    // Math.random is impure
    let math_random = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            return_type: Type::Poly,
            return_value_kind: ValueKind::Mutable,
            impure: true,
            canonical_name: Some("Math.random".to_string()),
            ..Default::default()
        },
        None,
        false,
    );
    math_props.push(("random".to_string(), math_random));
    let math_global = add_object(shapes, Some("Math"), math_props);
    globals.insert("Math".to_string(), math_global);

    // performance
    let perf_now = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            rest_param: Some(Effect::Read),
            return_type: Type::Poly,
            return_value_kind: ValueKind::Mutable,
            impure: true,
            canonical_name: Some("performance.now".to_string()),
            ..Default::default()
        },
        None,
        false,
    );
    let perf_global = add_object(
        shapes,
        Some("performance"),
        vec![("now".to_string(), perf_now)],
    );
    globals.insert("performance".to_string(), perf_global);

    // Date
    let date_now = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            rest_param: Some(Effect::Read),
            return_type: Type::Poly,
            return_value_kind: ValueKind::Mutable,
            impure: true,
            canonical_name: Some("Date.now".to_string()),
            ..Default::default()
        },
        None,
        false,
    );
    let date_global = add_object(shapes, Some("Date"), vec![("now".to_string(), date_now)]);
    globals.insert("Date".to_string(), date_global);

    // console
    let console_methods: Vec<(String, Type)> =
        ["error", "info", "log", "table", "trace", "warn"]
            .iter()
            .map(|name| (name.to_string(), pure_primitive_fn(shapes)))
            .collect();
    let console_global = add_object(shapes, Some("console"), console_methods);
    globals.insert("console".to_string(), console_global);

    // Simple global functions returning Primitive
    for name in &[
        "Boolean",
        "Number",
        "String",
        "parseInt",
        "parseFloat",
        "isNaN",
        "isFinite",
        "encodeURI",
        "encodeURIComponent",
        "decodeURI",
        "decodeURIComponent",
    ] {
        let f = pure_primitive_fn(shapes);
        globals.insert(name.to_string(), f);
    }

    // Primitive globals
    globals.insert("Infinity".to_string(), Type::Primitive);
    globals.insert("NaN".to_string(), Type::Primitive);

    // Map, Set, WeakMap, WeakSet constructors
    let map_ctor = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::ConditionallyMutateIterator],
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_MAP_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            ..Default::default()
        },
        None,
        true,
    );
    globals.insert("Map".to_string(), map_ctor);

    let set_ctor = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::ConditionallyMutateIterator],
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_SET_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            ..Default::default()
        },
        None,
        true,
    );
    globals.insert("Set".to_string(), set_ctor);

    let weak_map_ctor = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::ConditionallyMutateIterator],
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_WEAK_MAP_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            ..Default::default()
        },
        None,
        true,
    );
    globals.insert("WeakMap".to_string(), weak_map_ctor);

    let weak_set_ctor = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            positional_params: vec![Effect::ConditionallyMutateIterator],
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_WEAK_SET_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            ..Default::default()
        },
        None,
        true,
    );
    globals.insert("WeakSet".to_string(), weak_set_ctor);

    // React global object
    // Note: this duplicates the hook types into a React.* namespace
    let react_create_element = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            rest_param: Some(Effect::Freeze),
            return_type: Type::Poly,
            return_value_kind: ValueKind::Frozen,
            ..Default::default()
        },
        None,
        false,
    );
    let react_clone_element = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            rest_param: Some(Effect::Freeze),
            return_type: Type::Poly,
            return_value_kind: ValueKind::Frozen,
            ..Default::default()
        },
        None,
        false,
    );
    let react_create_ref = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            rest_param: Some(Effect::Capture),
            return_type: Type::Object {
                shape_id: Some(BUILT_IN_USE_REF_ID.to_string()),
            },
            return_value_kind: ValueKind::Mutable,
            ..Default::default()
        },
        None,
        false,
    );

    // We need to duplicate all React API types for React.* access. Rather than
    // re-registering shapes, we re-add hooks with fresh shape IDs.
    let mut react_props: Vec<(String, Type)> = Vec::new();

    // Re-register React hooks for the React namespace object
    let react_hooks: Vec<(&str, Type)> = vec![
        (
            "useContext",
            add_hook(
                shapes,
                HookSignatureBuilder {
                    rest_param: Some(Effect::Read),
                    return_type: Type::Poly,
                    return_value_kind: ValueKind::Frozen,
                    return_value_reason: Some(ValueReason::Context),
                    hook_kind: HookKind::UseContext,
                    ..Default::default()
                },
                None,
            ),
        ),
        (
            "useState",
            add_hook(
                shapes,
                HookSignatureBuilder {
                    rest_param: Some(Effect::Freeze),
                    return_type: Type::Object {
                        shape_id: Some(BUILT_IN_USE_STATE_ID.to_string()),
                    },
                    return_value_kind: ValueKind::Frozen,
                    return_value_reason: Some(ValueReason::State),
                    hook_kind: HookKind::UseState,
                    ..Default::default()
                },
                None,
            ),
        ),
        (
            "useRef",
            add_hook(
                shapes,
                HookSignatureBuilder {
                    rest_param: Some(Effect::Capture),
                    return_type: Type::Object {
                        shape_id: Some(BUILT_IN_USE_REF_ID.to_string()),
                    },
                    return_value_kind: ValueKind::Mutable,
                    hook_kind: HookKind::UseRef,
                    ..Default::default()
                },
                None,
            ),
        ),
        (
            "useMemo",
            add_hook(
                shapes,
                HookSignatureBuilder {
                    rest_param: Some(Effect::Freeze),
                    return_type: Type::Poly,
                    return_value_kind: ValueKind::Frozen,
                    hook_kind: HookKind::UseMemo,
                    ..Default::default()
                },
                None,
            ),
        ),
        (
            "useCallback",
            add_hook(
                shapes,
                HookSignatureBuilder {
                    rest_param: Some(Effect::Freeze),
                    return_type: Type::Poly,
                    return_value_kind: ValueKind::Frozen,
                    hook_kind: HookKind::UseCallback,
                    ..Default::default()
                },
                None,
            ),
        ),
        (
            "useEffect",
            add_hook(
                shapes,
                HookSignatureBuilder {
                    rest_param: Some(Effect::Freeze),
                    return_type: Type::Primitive,
                    return_value_kind: ValueKind::Frozen,
                    hook_kind: HookKind::UseEffect,
                    ..Default::default()
                },
                None,
            ),
        ),
        (
            "useLayoutEffect",
            add_hook(
                shapes,
                HookSignatureBuilder {
                    rest_param: Some(Effect::Freeze),
                    return_type: Type::Poly,
                    return_value_kind: ValueKind::Frozen,
                    hook_kind: HookKind::UseLayoutEffect,
                    ..Default::default()
                },
                None,
            ),
        ),
    ];

    for (name, ty) in react_hooks {
        react_props.push((name.to_string(), ty));
    }
    react_props.push(("createElement".to_string(), react_create_element));
    react_props.push(("cloneElement".to_string(), react_clone_element));
    react_props.push(("createRef".to_string(), react_create_ref));

    let react_global = add_object(shapes, None, react_props);
    globals.insert("React".to_string(), react_global);

    // _jsx (used by JSX transform)
    let jsx_fn = add_function(
        shapes,
        Vec::new(),
        FunctionSignatureBuilder {
            rest_param: Some(Effect::Freeze),
            return_type: Type::Poly,
            return_value_kind: ValueKind::Frozen,
            ..Default::default()
        },
        None,
        false,
    );
    globals.insert("_jsx".to_string(), jsx_fn);
}
