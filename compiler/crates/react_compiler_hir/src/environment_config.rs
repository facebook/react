// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Environment configuration, ported from EnvironmentConfigSchema in Environment.ts.
//!
//! Contains feature flags and custom hook definitions that control compiler behavior.

use std::collections::HashMap;

use crate::type_config::ValueKind;
use crate::Effect;

/// Custom hook configuration, ported from TS `HookSchema`.
#[derive(Debug, Clone)]
pub struct HookConfig {
    pub effect_kind: Effect,
    pub value_kind: ValueKind,
    pub no_alias: bool,
    pub transitive_mixed_data: bool,
}

/// Compiler environment configuration. Contains feature flags and settings.
///
/// Fields that would require passing JS functions across the JS/Rust boundary
/// are omitted with TODO comments. The Rust port uses hardcoded defaults for
/// these (e.g., `defaultModuleTypeProvider`).
#[derive(Debug, Clone)]
pub struct EnvironmentConfig {
    /// Custom hook type definitions, keyed by hook name.
    pub custom_hooks: HashMap<String, HookConfig>,

    // TODO: moduleTypeProvider — requires JS function callback.
    // The Rust port always uses defaultModuleTypeProvider (hardcoded).

    // TODO: customMacros — only used by Babel plugin codegen.

    // TODO: enableResetCacheOnSourceFileChanges — only used in codegen.

    pub enable_preserve_existing_memoization_guarantees: bool,
    pub validate_preserve_existing_memoization_guarantees: bool,
    pub validate_exhaustive_memoization_dependencies: bool,
    pub validate_exhaustive_effect_dependencies: ExhaustiveEffectDepsMode,

    // TODO: flowTypeProvider — requires JS function callback.

    pub enable_optional_dependencies: bool,
    pub enable_name_anonymous_functions: bool,
    pub validate_hooks_usage: bool,
    pub validate_ref_access_during_render: bool,
    pub validate_no_set_state_in_render: bool,
    pub enable_use_keyed_state: bool,
    pub validate_no_set_state_in_effects: bool,
    pub validate_no_derived_computations_in_effects: bool,
    pub validate_no_derived_computations_in_effects_exp: bool,
    pub validate_no_jsx_in_try_statements: bool,
    pub validate_static_components: bool,
    pub validate_no_capitalized_calls: Option<Vec<String>>,
    pub validate_blocklisted_imports: Option<Vec<String>>,
    pub validate_source_locations: bool,
    pub validate_no_impure_functions_in_render: bool,
    pub validate_no_freezing_known_mutable_functions: bool,
    pub enable_assume_hooks_follow_rules_of_react: bool,
    pub enable_transitively_freeze_function_expressions: bool,

    // TODO: enableEmitHookGuards — ExternalFunction, requires codegen.
    // TODO: enableEmitInstrumentForget — InstrumentationSchema, requires codegen.

    pub enable_function_outlining: bool,
    pub enable_jsx_outlining: bool,
    pub assert_valid_mutable_ranges: bool,
    pub throw_unknown_exception_testonly: bool,
    pub enable_custom_type_definition_for_reanimated: bool,
    pub enable_treat_ref_like_identifiers_as_refs: bool,
    pub enable_treat_set_identifiers_as_state_setters: bool,
    pub validate_no_void_use_memo: bool,
    pub enable_allow_set_state_from_refs_in_effects: bool,
    pub enable_verbose_no_set_state_in_effect: bool,

    // 🌲
    pub enable_forest: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExhaustiveEffectDepsMode {
    Off,
    All,
    MissingOnly,
    ExtraOnly,
}

impl Default for EnvironmentConfig {
    fn default() -> Self {
        Self {
            custom_hooks: HashMap::new(),
            enable_preserve_existing_memoization_guarantees: true,
            validate_preserve_existing_memoization_guarantees: true,
            validate_exhaustive_memoization_dependencies: true,
            validate_exhaustive_effect_dependencies: ExhaustiveEffectDepsMode::Off,
            enable_optional_dependencies: true,
            enable_name_anonymous_functions: false,
            validate_hooks_usage: true,
            validate_ref_access_during_render: true,
            validate_no_set_state_in_render: true,
            enable_use_keyed_state: false,
            validate_no_set_state_in_effects: false,
            validate_no_derived_computations_in_effects: false,
            validate_no_derived_computations_in_effects_exp: false,
            validate_no_jsx_in_try_statements: false,
            validate_static_components: false,
            validate_no_capitalized_calls: None,
            validate_blocklisted_imports: None,
            validate_source_locations: false,
            validate_no_impure_functions_in_render: false,
            validate_no_freezing_known_mutable_functions: false,
            enable_assume_hooks_follow_rules_of_react: true,
            enable_transitively_freeze_function_expressions: true,
            enable_function_outlining: true,
            enable_jsx_outlining: false,
            assert_valid_mutable_ranges: false,
            throw_unknown_exception_testonly: false,
            enable_custom_type_definition_for_reanimated: false,
            enable_treat_ref_like_identifiers_as_refs: true,
            enable_treat_set_identifiers_as_state_setters: false,
            validate_no_void_use_memo: true,
            enable_allow_set_state_from_refs_in_effects: true,
            enable_verbose_no_set_state_in_effect: false,
            enable_forest: false,
        }
    }
}
