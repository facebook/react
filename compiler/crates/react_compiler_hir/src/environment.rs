use crate::*;
use react_compiler_diagnostics::{CompilerDiagnostic, CompilerError, CompilerErrorDetail};

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
}

impl Environment {
    pub fn new() -> Self {
        Self {
            next_block_id_counter: 0,
            next_scope_id_counter: 0,
            identifiers: Vec::new(),
            types: Vec::new(),
            scopes: Vec::new(),
            functions: Vec::new(),
            errors: CompilerError::new(),
            fn_type: ReactFunctionType::Other,
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
}

impl Default for Environment {
    fn default() -> Self {
        Self::new()
    }
}
