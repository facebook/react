use crate::*;
use react_compiler_diagnostics::{CompilerDiagnostic, CompilerError, CompilerErrorDetail};

pub struct Environment {
    next_block_id: u32,
    next_identifier_id: u32,
    next_scope_id: u32,
    next_type_id: u32,
    next_function_id: u32,
    errors: CompilerError,
    pub functions: Vec<HirFunction>,
}

impl Environment {
    pub fn new() -> Self {
        Self {
            next_block_id: 0,
            next_identifier_id: 0,
            next_scope_id: 0,
            next_type_id: 0,
            next_function_id: 0,
            errors: CompilerError::new(),
            functions: Vec::new(),
        }
    }

    pub fn next_block_id(&mut self) -> BlockId {
        let id = BlockId(self.next_block_id);
        self.next_block_id += 1;
        id
    }

    pub fn next_identifier_id(&mut self) -> IdentifierId {
        let id = IdentifierId(self.next_identifier_id);
        self.next_identifier_id += 1;
        id
    }

    pub fn next_scope_id(&mut self) -> ScopeId {
        let id = ScopeId(self.next_scope_id);
        self.next_scope_id += 1;
        id
    }

    pub fn next_type_id(&mut self) -> TypeId {
        let id = TypeId(self.next_type_id);
        self.next_type_id += 1;
        id
    }

    pub fn make_type(&mut self) -> Type {
        let id = self.next_type_id();
        Type::TypeVar { id }
    }

    pub fn add_function(&mut self, func: HirFunction) -> FunctionId {
        let id = FunctionId(self.next_function_id);
        self.next_function_id += 1;
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
