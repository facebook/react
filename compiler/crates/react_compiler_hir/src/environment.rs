use std::collections::HashSet;
use crate::*;
use react_compiler_diagnostics::{CompilerDiagnostic, CompilerError, CompilerErrorDetail};

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
}

impl Environment {
    /// Number of built-in type slots pre-allocated by the TypeScript compiler's
    /// global shapes/globals initialization (ObjectShape.ts, Globals.ts).
    /// We reserve the same slots so that type IDs are consistent between TS and Rust.
    const BUILTIN_TYPE_COUNT: u32 = 28;

    pub fn new() -> Self {
        // Pre-allocate built-in type slots to match the TypeScript compiler's
        // global type counter (28 types are allocated during module initialization
        // for built-in shapes and globals).
        let mut types = Vec::with_capacity(Self::BUILTIN_TYPE_COUNT as usize);
        for i in 0..Self::BUILTIN_TYPE_COUNT {
            types.push(Type::TypeVar { id: TypeId(i) });
        }

        Self {
            next_block_id_counter: 0,
            next_scope_id_counter: 0,
            identifiers: Vec::new(),
            types,
            scopes: Vec::new(),
            functions: Vec::new(),
            errors: CompilerError::new(),
            fn_type: ReactFunctionType::Other,
            output_mode: OutputMode::Client,
            hoisted_identifiers: HashSet::new(),
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

    pub fn errors(&self) -> &CompilerError {
        &self.errors
    }

    pub fn take_errors(&mut self) -> CompilerError {
        std::mem::take(&mut self.errors)
    }

    /// Check if a binding has been hoisted (via DeclareContext) already.
    pub fn is_hoisted_identifier(&self, binding_id: u32) -> bool {
        self.hoisted_identifiers.contains(&binding_id)
    }

    /// Mark a binding as hoisted.
    pub fn add_hoisted_identifier(&mut self, binding_id: u32) {
        self.hoisted_identifiers.insert(binding_id);
    }
}

impl Default for Environment {
    fn default() -> Self {
        Self::new()
    }
}
