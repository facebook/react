use std::collections::{HashMap, HashSet};
use crate::*;
use crate::default_module_type_provider::default_module_type_provider;
use crate::environment_config::EnvironmentConfig;
use crate::globals::{self, Global, GlobalRegistry, install_type_config};
use crate::object_shape::{
    FunctionSignature, HookKind, HookSignatureBuilder, ShapeRegistry,
    BUILT_IN_MIXED_READONLY_ID,
    add_hook, default_mutating_hook, default_nonmutating_hook,
};
use react_compiler_diagnostics::{
    CompilerDiagnostic, CompilerError, CompilerErrorDetail, ErrorCategory,
};

/// Output mode for the compiler, mirrored from the entrypoint's CompilerOutputMode.
/// Stored on Environment so pipeline passes can access it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OutputMode {
    Ssr,
    Client,
    Lint,
}

pub struct Environment {
    // Counters
    pub next_block_id_counter: u32,
    pub next_scope_id_counter: u32,

    // Arenas (use direct field access for sliced borrows)
    pub identifiers: Vec<Identifier>,
    pub types: Vec<Type>,
    pub scopes: Vec<ReactiveScope>,
    pub functions: Vec<HirFunction>,

    // Error accumulation
    pub errors: CompilerError,

    // Function type classification (Component, Hook, Other)
    pub fn_type: ReactFunctionType,

    // Output mode (Client, Ssr, Lint)
    pub output_mode: OutputMode,

    // Hoisted identifiers: tracks which bindings have already been hoisted
    // via DeclareContext to avoid duplicate hoisting.
    // Uses u32 to avoid depending on react_compiler_ast types.
    hoisted_identifiers: HashSet<u32>,

    // Config flags for validation passes (kept for backwards compat with existing pipeline code)
    pub validate_preserve_existing_memoization_guarantees: bool,
    pub validate_no_set_state_in_render: bool,
    pub enable_preserve_existing_memoization_guarantees: bool,

    // Type system registries
    globals: GlobalRegistry,
    pub shapes: ShapeRegistry,
    module_types: HashMap<String, Option<Global>>,

    // Environment configuration (feature flags, custom hooks, etc.)
    pub config: EnvironmentConfig,

    // Cached default hook types (lazily initialized)
    default_nonmutating_hook: Option<Global>,
    default_mutating_hook: Option<Global>,
}

impl Environment {
    pub fn new() -> Self {
        Self::with_config(EnvironmentConfig::default())
    }

    /// Create a new Environment with the given configuration.
    ///
    /// Initializes the shape and global registries, registers custom hooks,
    /// and sets up the module type cache.
    pub fn with_config(config: EnvironmentConfig) -> Self {
        let mut shapes = globals::build_builtin_shapes();
        let mut global_registry = globals::build_default_globals(&mut shapes);

        // Register custom hooks from config
        for (hook_name, hook) in &config.custom_hooks {
            // Don't overwrite existing globals (matches TS invariant)
            if global_registry.contains_key(hook_name) {
                continue;
            }
            let return_type = if hook.transitive_mixed_data {
                Type::Object {
                    shape_id: Some(BUILT_IN_MIXED_READONLY_ID.to_string()),
                }
            } else {
                Type::Poly
            };
            let hook_type = add_hook(
                &mut shapes,
                HookSignatureBuilder {
                    rest_param: Some(hook.effect_kind),
                    return_type,
                    return_value_kind: hook.value_kind,
                    hook_kind: HookKind::Custom,
                    no_alias: hook.no_alias,
                    ..Default::default()
                },
                None,
            );
            global_registry.insert(hook_name.clone(), hook_type);
        }

        // Register reanimated module type when enabled
        let mut module_types: HashMap<String, Option<Global>> = HashMap::new();
        if config.enable_custom_type_definition_for_reanimated {
            let reanimated_module_type =
                globals::get_reanimated_module_type(&mut shapes);
            module_types.insert(
                "react-native-reanimated".to_string(),
                Some(reanimated_module_type),
            );
        }

        Self {
            next_block_id_counter: 0,
            next_scope_id_counter: 0,
            identifiers: Vec::new(),
            types: Vec::new(),
            scopes: Vec::new(),
            functions: Vec::new(),
            errors: CompilerError::new(),
            fn_type: ReactFunctionType::Other,
            output_mode: OutputMode::Client,
            hoisted_identifiers: HashSet::new(),
            validate_preserve_existing_memoization_guarantees: config
                .validate_preserve_existing_memoization_guarantees,
            validate_no_set_state_in_render: config.validate_no_set_state_in_render,
            enable_preserve_existing_memoization_guarantees: config
                .enable_preserve_existing_memoization_guarantees,
            globals: global_registry,
            shapes,
            module_types,
            default_nonmutating_hook: None,
            default_mutating_hook: None,
            config,
        }
    }

    pub fn next_block_id(&mut self) -> BlockId {
        let id = BlockId(self.next_block_id_counter);
        self.next_block_id_counter += 1;
        id
    }

    /// Allocate a new Identifier in the arena with default values,
    /// returns its IdentifierId.
    pub fn next_identifier_id(&mut self) -> IdentifierId {
        let id = IdentifierId(self.identifiers.len() as u32);
        let type_id = self.make_type();
        self.identifiers.push(Identifier {
            id,
            declaration_id: DeclarationId(id.0),
            name: None,
            mutable_range: MutableRange {
                start: EvaluationOrder(0),
                end: EvaluationOrder(0),
            },
            scope: None,
            type_: type_id,
            loc: None,
        });
        id
    }

    /// Allocate a new ReactiveScope in the arena, returns its ScopeId.
    pub fn next_scope_id(&mut self) -> ScopeId {
        let id = ScopeId(self.next_scope_id_counter);
        self.next_scope_id_counter += 1;
        self.scopes.push(ReactiveScope {
            id,
            range: MutableRange {
                start: EvaluationOrder(0),
                end: EvaluationOrder(0),
            },
            dependencies: Vec::new(),
            declarations: Vec::new(),
            reassignments: Vec::new(),
            early_return_value: None,
            merged: Vec::new(),
            loc: None,
        });
        id
    }

    /// Allocate a new Type in the arena, returns its TypeId.
    pub fn next_type_id(&mut self) -> TypeId {
        let id = TypeId(self.types.len() as u32);
        self.types.push(Type::TypeVar { id });
        id
    }

    /// Allocate a new Type (TypeVar) in the arena, returns its TypeId.
    pub fn make_type(&mut self) -> TypeId {
        self.next_type_id()
    }

    pub fn add_function(&mut self, func: HirFunction) -> FunctionId {
        let id = FunctionId(self.functions.len() as u32);
        self.functions.push(func);
        id
    }

    pub fn record_error(&mut self, detail: CompilerErrorDetail) {
        self.errors.push_error_detail(detail);
    }

    pub fn record_diagnostic(&mut self, diagnostic: CompilerDiagnostic) {
        self.errors.push_diagnostic(diagnostic);
    }

    pub fn has_errors(&self) -> bool {
        self.errors.has_any_errors()
    }

    pub fn error_count(&self) -> usize {
        self.errors.details.len()
    }

    /// Check if any recorded errors have Invariant category.
    /// In TS, Invariant errors throw immediately from recordError(),
    /// which aborts the current operation.
    pub fn has_invariant_errors(&self) -> bool {
        self.errors.has_invariant_errors()
    }

    pub fn errors(&self) -> &CompilerError {
        &self.errors
    }

    pub fn take_errors(&mut self) -> CompilerError {
        std::mem::take(&mut self.errors)
    }

    /// Take errors added after position `since_count`, leaving earlier errors in place.
    /// Used to detect new errors added by a specific pass.
    pub fn take_errors_since(&mut self, since_count: usize) -> CompilerError {
        let mut taken = CompilerError::new();
        if self.errors.details.len() > since_count {
            taken.details = self.errors.details.split_off(since_count);
        }
        taken
    }

    /// Take only the Invariant errors, leaving non-Invariant errors in place.
    /// In TS, Invariant errors throw as a separate CompilerError, so only
    /// the Invariant error is surfaced.
    pub fn take_invariant_errors(&mut self) -> CompilerError {
        let mut invariant = CompilerError::new();
        let mut remaining = CompilerError::new();
        let old = std::mem::take(&mut self.errors);
        for detail in old.details {
            let is_invariant = match &detail {
                react_compiler_diagnostics::CompilerErrorOrDiagnostic::Diagnostic(d) => d.category == react_compiler_diagnostics::ErrorCategory::Invariant,
                react_compiler_diagnostics::CompilerErrorOrDiagnostic::ErrorDetail(d) => d.category == react_compiler_diagnostics::ErrorCategory::Invariant,
            };
            if is_invariant {
                invariant.details.push(detail);
            } else {
                remaining.details.push(detail);
            }
        }
        self.errors = remaining;
        invariant
    }

    /// Check if any recorded errors have Todo category.
    /// In TS, Todo errors throw immediately via CompilerError.throwTodo().
    pub fn has_todo_errors(&self) -> bool {
        self.errors.details.iter().any(|d| match d {
            react_compiler_diagnostics::CompilerErrorOrDiagnostic::Diagnostic(d) => d.category == react_compiler_diagnostics::ErrorCategory::Todo,
            react_compiler_diagnostics::CompilerErrorOrDiagnostic::ErrorDetail(d) => d.category == react_compiler_diagnostics::ErrorCategory::Todo,
        })
    }

    /// Take errors that would have been thrown in TS (Invariant and Todo),
    /// leaving other accumulated errors in place.
    pub fn take_thrown_errors(&mut self) -> CompilerError {
        let mut thrown = CompilerError::new();
        let mut remaining = CompilerError::new();
        let old = std::mem::take(&mut self.errors);
        for detail in old.details {
            let is_thrown = match &detail {
                react_compiler_diagnostics::CompilerErrorOrDiagnostic::Diagnostic(d) => {
                    d.category == react_compiler_diagnostics::ErrorCategory::Invariant
                        || d.category == react_compiler_diagnostics::ErrorCategory::Todo
                }
                react_compiler_diagnostics::CompilerErrorOrDiagnostic::ErrorDetail(d) => {
                    d.category == react_compiler_diagnostics::ErrorCategory::Invariant
                        || d.category == react_compiler_diagnostics::ErrorCategory::Todo
                }
            };
            if is_thrown {
                thrown.details.push(detail);
            } else {
                remaining.details.push(detail);
            }
        }
        self.errors = remaining;
        thrown
    }

    /// Check if a binding has been hoisted (via DeclareContext) already.
    pub fn is_hoisted_identifier(&self, binding_id: u32) -> bool {
        self.hoisted_identifiers.contains(&binding_id)
    }

    /// Mark a binding as hoisted.
    pub fn add_hoisted_identifier(&mut self, binding_id: u32) {
        self.hoisted_identifiers.insert(binding_id);
    }

    // =========================================================================
    // Type resolution methods (ported from Environment.ts)
    // =========================================================================

    /// Resolve a non-local binding to its type. Ported from TS `getGlobalDeclaration`.
    ///
    /// The `loc` parameter is used for error diagnostics when validating module type
    /// configurations. Pass `None` if no source location is available.
    pub fn get_global_declaration(
        &mut self,
        binding: &NonLocalBinding,
        loc: Option<SourceLocation>,
    ) -> Option<Global> {
        match binding {
            NonLocalBinding::ModuleLocal { name, .. } => {
                if is_hook_name(name) {
                    Some(self.get_custom_hook_type())
                } else {
                    None
                }
            }
            NonLocalBinding::Global { name, .. } => {
                if let Some(ty) = self.globals.get(name) {
                    return Some(ty.clone());
                }
                if is_hook_name(name) {
                    Some(self.get_custom_hook_type())
                } else {
                    None
                }
            }
            NonLocalBinding::ImportSpecifier {
                name,
                module,
                imported,
            } => {
                if self.is_known_react_module(module) {
                    if let Some(ty) = self.globals.get(imported) {
                        return Some(ty.clone());
                    }
                    if is_hook_name(imported) || is_hook_name(name) {
                        return Some(self.get_custom_hook_type());
                    }
                    return None;
                }

                // Try module type provider. We resolve first, then do property
                // lookup on the cloned result to avoid double-borrow of self.
                let module_type = self.resolve_module_type(module);
                if let Some(module_type) = module_type {
                    if let Some(imported_type) = Self::get_property_type_from_shapes(
                        &self.shapes,
                        &module_type,
                        imported,
                    ) {
                        // Validate hook-name vs hook-type consistency
                        let expect_hook = is_hook_name(imported);
                        let is_hook = self.get_hook_kind_for_type(&imported_type).is_some();
                        if expect_hook != is_hook {
                            self.record_error(
                            CompilerErrorDetail::new(
                                ErrorCategory::Config,
                                "Invalid type configuration for module",
                            )
                            .with_description(format!(
                                "Expected type for `import {{{}}} from '{}'` {} based on the exported name",
                                imported,
                                module,
                                if expect_hook { "to be a hook" } else { "not to be a hook" }
                            ))
                            .with_loc(loc),
                        );
                        }
                        return Some(imported_type);
                    }
                }

                if is_hook_name(imported) || is_hook_name(name) {
                    Some(self.get_custom_hook_type())
                } else {
                    None
                }
            }
            NonLocalBinding::ImportDefault { name, module }
            | NonLocalBinding::ImportNamespace { name, module } => {
                let is_default = matches!(binding, NonLocalBinding::ImportDefault { .. });

                if self.is_known_react_module(module) {
                    if let Some(ty) = self.globals.get(name) {
                        return Some(ty.clone());
                    }
                    if is_hook_name(name) {
                        return Some(self.get_custom_hook_type());
                    }
                    return None;
                }

                let module_type = self.resolve_module_type(module);
                if let Some(module_type) = module_type {
                    let imported_type = if is_default {
                        Self::get_property_type_from_shapes(
                            &self.shapes,
                            &module_type,
                            "default",
                        )
                    } else {
                        Some(module_type)
                    };
                    if let Some(imported_type) = imported_type {
                        // Validate hook-name vs hook-type consistency
                        let expect_hook = is_hook_name(module);
                        let is_hook = self.get_hook_kind_for_type(&imported_type).is_some();
                        if expect_hook != is_hook {
                            self.record_error(
                            CompilerErrorDetail::new(
                                ErrorCategory::Config,
                                "Invalid type configuration for module",
                            )
                            .with_description(format!(
                                "Expected type for `import ... from '{}'` {} based on the module name",
                                module,
                                if expect_hook { "to be a hook" } else { "not to be a hook" }
                            ))
                            .with_loc(loc),
                        );
                        }
                        return Some(imported_type);
                    }
                }

                if is_hook_name(name) {
                    Some(self.get_custom_hook_type())
                } else {
                    None
                }
            }
        }
    }

    /// Static helper: resolve a property type using only the shapes registry.
    /// Used internally to avoid double-borrow of `self`. Includes hook-name
    /// fallback matching TS `getPropertyType`.
    fn get_property_type_from_shapes(
        shapes: &ShapeRegistry,
        receiver: &Type,
        property: &str,
    ) -> Option<Type> {
        let shape_id = match receiver {
            Type::Object { shape_id } | Type::Function { shape_id, .. } => shape_id.as_deref(),
            _ => None,
        };
        if let Some(shape_id) = shape_id {
            let shape = shapes.get(shape_id)?;
            if let Some(ty) = shape.properties.get(property) {
                return Some(ty.clone());
            }
            if let Some(ty) = shape.properties.get("*") {
                return Some(ty.clone());
            }
            // Hook-name fallback: callers that need the custom hook type
            // check is_hook_name after this returns None, which produces
            // the same result as the TS getPropertyType hook-name fallback.
        }
        None
    }

    /// Get the type of a named property on a receiver type.
    /// Ported from TS `getPropertyType`.
    pub fn get_property_type(&mut self, receiver: &Type, property: &str) -> Option<Type> {
        let shape_id = match receiver {
            Type::Object { shape_id } | Type::Function { shape_id, .. } => shape_id.as_deref(),
            _ => None,
        };
        if let Some(shape_id) = shape_id {
            let shape = self.shapes.get(shape_id).unwrap_or_else(|| {
                panic!(
                    "[HIR] Forget internal error: cannot resolve shape {}",
                    shape_id
                )
            });
            if let Some(ty) = shape.properties.get(property) {
                return Some(ty.clone());
            }
            // Fall through to wildcard
            if let Some(ty) = shape.properties.get("*") {
                return Some(ty.clone());
            }
            // If property name looks like a hook, return custom hook type
            if is_hook_name(property) {
                return Some(self.get_custom_hook_type());
            }
            return None;
        }
        // No shape ID — if property looks like a hook, return custom hook type
        if is_hook_name(property) {
            return Some(self.get_custom_hook_type());
        }
        None
    }

    /// Get the type of a numeric property on a receiver type.
    /// Ported from the numeric branch of TS `getPropertyType`.
    pub fn get_property_type_numeric(&self, receiver: &Type) -> Option<Type> {
        let shape_id = match receiver {
            Type::Object { shape_id } | Type::Function { shape_id, .. } => shape_id.as_deref(),
            _ => None,
        };
        if let Some(shape_id) = shape_id {
            let shape = self.shapes.get(shape_id).unwrap_or_else(|| {
                panic!(
                    "[HIR] Forget internal error: cannot resolve shape {}",
                    shape_id
                )
            });
            return shape.properties.get("*").cloned();
        }
        None
    }

    /// Get the fallthrough (wildcard `*`) property type for computed property access.
    /// Ported from TS `getFallthroughPropertyType`.
    pub fn get_fallthrough_property_type(&self, receiver: &Type) -> Option<Type> {
        let shape_id = match receiver {
            Type::Object { shape_id } | Type::Function { shape_id, .. } => shape_id.as_deref(),
            _ => None,
        };
        if let Some(shape_id) = shape_id {
            let shape = self.shapes.get(shape_id).unwrap_or_else(|| {
                panic!(
                    "[HIR] Forget internal error: cannot resolve shape {}",
                    shape_id
                )
            });
            return shape.properties.get("*").cloned();
        }
        None
    }

    /// Get the function signature for a function type.
    /// Ported from TS `getFunctionSignature`.
    pub fn get_function_signature(&self, ty: &Type) -> Option<&FunctionSignature> {
        let shape_id = match ty {
            Type::Function { shape_id, .. } => shape_id.as_deref(),
            _ => return None,
        };
        if let Some(shape_id) = shape_id {
            let shape = self.shapes.get(shape_id).unwrap_or_else(|| {
                panic!(
                    "[HIR] Forget internal error: cannot resolve shape {}",
                    shape_id
                )
            });
            return shape.function_type.as_ref();
        }
        None
    }

    /// Get the hook kind for a type, if it represents a hook.
    /// Ported from TS `getHookKindForType` in HIR.ts.
    pub fn get_hook_kind_for_type(&self, ty: &Type) -> Option<&HookKind> {
        self.get_function_signature(ty)
            .and_then(|sig| sig.hook_kind.as_ref())
    }

    /// Resolve the module type provider for a given module name.
    /// Caches results. Uses `defaultModuleTypeProvider` (hardcoded).
    ///
    /// TODO: Support custom moduleTypeProvider from config (requires JS function callback).
    fn resolve_module_type(&mut self, module_name: &str) -> Option<Global> {
        if let Some(cached) = self.module_types.get(module_name) {
            return cached.clone();
        }

        let module_config = default_module_type_provider(module_name);
        let module_type = module_config.map(|config| {
            install_type_config(
                &mut self.globals,
                &mut self.shapes,
                &config,
                module_name,
                (),
            )
        });
        self.module_types
            .insert(module_name.to_string(), module_type.clone());
        module_type
    }

    fn is_known_react_module(&self, module_name: &str) -> bool {
        let lower = module_name.to_lowercase();
        lower == "react" || lower == "react-dom"
    }

    fn get_custom_hook_type(&mut self) -> Global {
        if self.config.enable_assume_hooks_follow_rules_of_react {
            if self.default_nonmutating_hook.is_none() {
                self.default_nonmutating_hook =
                    Some(default_nonmutating_hook(&mut self.shapes));
            }
            self.default_nonmutating_hook.clone().unwrap()
        } else {
            if self.default_mutating_hook.is_none() {
                self.default_mutating_hook =
                    Some(default_mutating_hook(&mut self.shapes));
            }
            self.default_mutating_hook.clone().unwrap()
        }
    }

    /// Public accessor for the custom hook type, used by InferTypes for
    /// property resolution fallback when a property name looks like a hook.
    pub fn get_custom_hook_type_opt(&mut self) -> Option<Global> {
        Some(self.get_custom_hook_type())
    }

    /// Get a reference to the shapes registry.
    pub fn shapes(&self) -> &ShapeRegistry {
        &self.shapes
    }

    /// Get a reference to the globals registry.
    pub fn globals(&self) -> &GlobalRegistry {
        &self.globals
    }

    /// Whether memoization is enabled for this compilation.
    /// Ported from TS `get enableMemoization()` in Environment.ts.
    /// Returns true for client/lint modes, false for SSR.
    pub fn enable_memoization(&self) -> bool {
        match self.output_mode {
            OutputMode::Client | OutputMode::Lint => true,
            OutputMode::Ssr => false,
        }
    }

    /// Whether validations are enabled for this compilation.
    /// Ported from TS `get enableValidations()` in Environment.ts.
    pub fn enable_validations(&self) -> bool {
        match self.output_mode {
            OutputMode::Client | OutputMode::Lint | OutputMode::Ssr => true,
        }
    }
}

impl Default for Environment {
    fn default() -> Self {
        Self::new()
    }
}

/// Check if a name matches the React hook naming convention: `use[A-Z0-9]`.
/// Ported from TS `isHookName` in Environment.ts.
pub fn is_hook_name(name: &str) -> bool {
    if name.len() < 4 {
        return false;
    }
    if !name.starts_with("use") {
        return false;
    }
    let fourth_char = name.as_bytes()[3];
    fourth_char.is_ascii_uppercase() || fourth_char.is_ascii_digit()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_hook_name() {
        assert!(is_hook_name("useState"));
        assert!(is_hook_name("useEffect"));
        assert!(is_hook_name("useMyHook"));
        assert!(is_hook_name("use3rdParty"));
        assert!(!is_hook_name("use"));
        assert!(!is_hook_name("used"));
        assert!(!is_hook_name("useless"));
        assert!(!is_hook_name("User"));
        assert!(!is_hook_name("foo"));
    }

    #[test]
    fn test_environment_has_globals() {
        let env = Environment::new();
        assert!(env.globals().contains_key("useState"));
        assert!(env.globals().contains_key("useEffect"));
        assert!(env.globals().contains_key("useRef"));
        assert!(env.globals().contains_key("Math"));
        assert!(env.globals().contains_key("console"));
        assert!(env.globals().contains_key("Array"));
        assert!(env.globals().contains_key("Object"));
    }

    #[test]
    fn test_get_property_type_array() {
        let mut env = Environment::new();
        let array_type = Type::Object {
            shape_id: Some("BuiltInArray".to_string()),
        };
        let map_type = env.get_property_type(&array_type, "map");
        assert!(map_type.is_some());
        let push_type = env.get_property_type(&array_type, "push");
        assert!(push_type.is_some());
        let nonexistent = env.get_property_type(&array_type, "nonExistentMethod");
        assert!(nonexistent.is_none());
    }

    #[test]
    fn test_get_function_signature() {
        let env = Environment::new();
        let use_state_type = env.globals().get("useState").unwrap();
        let sig = env.get_function_signature(use_state_type);
        assert!(sig.is_some());
        let sig = sig.unwrap();
        assert!(sig.hook_kind.is_some());
        assert_eq!(sig.hook_kind.as_ref().unwrap(), &HookKind::UseState);
    }

    #[test]
    fn test_get_global_declaration() {
        let mut env = Environment::new();
        // Global binding
        let binding = NonLocalBinding::Global {
            name: "Math".to_string(),
        };
        let result = env.get_global_declaration(&binding, None);
        assert!(result.is_some());

        // Import from react
        let binding = NonLocalBinding::ImportSpecifier {
            name: "useState".to_string(),
            module: "react".to_string(),
            imported: "useState".to_string(),
        };
        let result = env.get_global_declaration(&binding, None);
        assert!(result.is_some());

        // Unknown global
        let binding = NonLocalBinding::Global {
            name: "unknownThing".to_string(),
        };
        let result = env.get_global_declaration(&binding, None);
        assert!(result.is_none());

        // Hook-like name gets default hook type
        let binding = NonLocalBinding::Global {
            name: "useCustom".to_string(),
        };
        let result = env.get_global_declaration(&binding, None);
        assert!(result.is_some());
    }
}
