// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

use indexmap::IndexMap;
use react_compiler_ast::scope::*;
use std::collections::{HashMap, HashSet};
use swc_ecma_ast::*;
use swc_ecma_visit::{Visit, VisitWith};

/// Helper to convert an SWC `Str` node's value to a Rust String.
/// `Str.value` is a `Wtf8Atom` which doesn't implement `Display`,
/// so we go through `Atom` via lossy conversion.
fn str_value_to_string(s: &Str) -> String {
    s.value.to_atom_lossy().to_string()
}

/// Build scope information from an SWC Module AST.
///
/// This performs two passes over the AST:
/// 1. Build the scope tree and collect all bindings
/// 2. Resolve identifier references to their bindings
pub fn build_scope_info(module: &Module) -> ScopeInfo {
    // Pass 1: Build scope tree and collect bindings
    let mut collector = ScopeCollector::new();
    collector.visit_module(module);

    // Pass 2: Resolve references
    // We scope the resolver borrow so we can move out of collector afterwards.
    let reference_to_binding = {
        let mut resolver = ReferenceResolver::new(&collector);
        resolver.visit_module(module);

        // Also map declaration identifiers to their bindings
        for binding in &collector.bindings {
            if let Some(start) = binding.declaration_start {
                resolver
                    .reference_to_binding
                    .entry(start)
                    .or_insert(binding.id);
            }
        }

        resolver.reference_to_binding
    };

    ScopeInfo {
        scopes: collector.scopes,
        bindings: collector.bindings,
        node_to_scope: collector.node_to_scope,
        reference_to_binding,
        program_scope: ScopeId(0),
    }
}

// ── Pass 1: Scope tree + binding collection ─────────────────────────────────

struct ScopeCollector {
    scopes: Vec<ScopeData>,
    bindings: Vec<BindingData>,
    node_to_scope: HashMap<u32, ScopeId>,
    /// Stack of scope IDs representing the current nesting.
    scope_stack: Vec<ScopeId>,
    /// Set of span starts for block statements that are direct function/catch bodies.
    /// These should NOT create a separate Block scope.
    function_body_spans: HashSet<u32>,
}

impl ScopeCollector {
    fn new() -> Self {
        Self {
            scopes: Vec::new(),
            bindings: Vec::new(),
            node_to_scope: HashMap::new(),
            scope_stack: Vec::new(),
            function_body_spans: HashSet::new(),
        }
    }

    fn current_scope(&self) -> ScopeId {
        *self.scope_stack.last().expect("scope stack is empty")
    }

    fn push_scope(&mut self, kind: ScopeKind, node_start: u32) -> ScopeId {
        let id = ScopeId(self.scopes.len() as u32);
        let parent = self.scope_stack.last().copied();
        self.scopes.push(ScopeData {
            id,
            parent,
            kind,
            bindings: HashMap::new(),
        });
        self.node_to_scope.insert(node_start, id);
        self.scope_stack.push(id);
        id
    }

    fn pop_scope(&mut self) {
        self.scope_stack.pop();
    }

    /// Find the nearest enclosing function or program scope (for hoisting `var` and function decls).
    fn enclosing_function_scope(&self) -> ScopeId {
        for &scope_id in self.scope_stack.iter().rev() {
            let scope = &self.scopes[scope_id.0 as usize];
            match scope.kind {
                ScopeKind::Function | ScopeKind::Program => return scope_id,
                _ => {}
            }
        }
        ScopeId(0)
    }

    fn add_binding(
        &mut self,
        name: String,
        kind: BindingKind,
        scope: ScopeId,
        declaration_type: String,
        declaration_start: Option<u32>,
        import: Option<ImportBindingData>,
    ) -> BindingId {
        let id = BindingId(self.bindings.len() as u32);
        self.bindings.push(BindingData {
            id,
            name: name.clone(),
            kind,
            scope,
            declaration_type,
            declaration_start,
            import,
        });
        self.scopes[scope.0 as usize].bindings.insert(name, id);
        id
    }

    /// Extract all binding identifiers from a pattern, adding each as a binding.
    fn collect_pat_bindings(
        &mut self,
        pat: &Pat,
        kind: BindingKind,
        scope: ScopeId,
        declaration_type: &str,
    ) {
        match pat {
            Pat::Ident(binding_ident) => {
                let name = binding_ident.id.sym.to_string();
                let start = binding_ident.id.span.lo.0;
                self.add_binding(
                    name,
                    kind,
                    scope,
                    declaration_type.to_string(),
                    Some(start),
                    None,
                );
            }
            Pat::Array(arr) => {
                for elem in &arr.elems {
                    if let Some(p) = elem {
                        self.collect_pat_bindings(p, kind.clone(), scope, declaration_type);
                    }
                }
            }
            Pat::Object(obj) => {
                for prop in &obj.props {
                    match prop {
                        ObjectPatProp::KeyValue(kv) => {
                            self.collect_pat_bindings(
                                &kv.value,
                                kind.clone(),
                                scope,
                                declaration_type,
                            );
                        }
                        ObjectPatProp::Assign(assign) => {
                            let name = assign.key.sym.to_string();
                            let start = assign.key.span.lo.0;
                            self.add_binding(
                                name,
                                kind.clone(),
                                scope,
                                declaration_type.to_string(),
                                Some(start),
                                None,
                            );
                        }
                        ObjectPatProp::Rest(rest) => {
                            self.collect_pat_bindings(
                                &rest.arg,
                                kind.clone(),
                                scope,
                                declaration_type,
                            );
                        }
                    }
                }
            }
            Pat::Rest(rest) => {
                self.collect_pat_bindings(&rest.arg, kind, scope, declaration_type);
            }
            Pat::Assign(assign) => {
                self.collect_pat_bindings(&assign.left, kind, scope, declaration_type);
            }
            Pat::Expr(_) | Pat::Invalid(_) => {}
        }
    }

    /// Visit a function's internals (params + body), creating the function scope.
    /// Used for method definitions and other Function nodes not covered by FnDecl/FnExpr.
    fn visit_function_inner(&mut self, function: &Function) {
        let func_start = function.span.lo.0;
        self.push_scope(ScopeKind::Function, func_start);

        for param in &function.params {
            self.collect_pat_bindings(
                &param.pat,
                BindingKind::Param,
                self.current_scope(),
                "FormalParameter",
            );
        }

        if let Some(body) = &function.body {
            self.function_body_spans.insert(body.span.lo.0);
            body.visit_with(self);
        }

        self.pop_scope();
    }
}

impl Visit for ScopeCollector {
    fn visit_module(&mut self, module: &Module) {
        self.push_scope(ScopeKind::Program, module.span.lo.0);
        module.visit_children_with(self);
        self.pop_scope();
    }

    fn visit_import_decl(&mut self, import: &ImportDecl) {
        let source = str_value_to_string(&import.src);
        let program_scope = ScopeId(0);

        for spec in &import.specifiers {
            match spec {
                ImportSpecifier::Named(named) => {
                    let local_name = named.local.sym.to_string();
                    let start = named.local.span.lo.0;
                    let imported_name = match &named.imported {
                        Some(ModuleExportName::Ident(ident)) => Some(ident.sym.to_string()),
                        Some(ModuleExportName::Str(s)) => Some(str_value_to_string(s)),
                        None => Some(local_name.clone()),
                    };
                    self.add_binding(
                        local_name,
                        BindingKind::Module,
                        program_scope,
                        "ImportSpecifier".to_string(),
                        Some(start),
                        Some(ImportBindingData {
                            source: source.clone(),
                            kind: ImportBindingKind::Named,
                            imported: imported_name,
                        }),
                    );
                }
                ImportSpecifier::Default(default) => {
                    let local_name = default.local.sym.to_string();
                    let start = default.local.span.lo.0;
                    self.add_binding(
                        local_name,
                        BindingKind::Module,
                        program_scope,
                        "ImportDefaultSpecifier".to_string(),
                        Some(start),
                        Some(ImportBindingData {
                            source: source.clone(),
                            kind: ImportBindingKind::Default,
                            imported: None,
                        }),
                    );
                }
                ImportSpecifier::Namespace(ns) => {
                    let local_name = ns.local.sym.to_string();
                    let start = ns.local.span.lo.0;
                    self.add_binding(
                        local_name,
                        BindingKind::Module,
                        program_scope,
                        "ImportNamespaceSpecifier".to_string(),
                        Some(start),
                        Some(ImportBindingData {
                            source: source.clone(),
                            kind: ImportBindingKind::Namespace,
                            imported: None,
                        }),
                    );
                }
            }
        }
    }

    fn visit_var_decl(&mut self, var_decl: &VarDecl) {
        let (kind, declaration_type) = match var_decl.kind {
            VarDeclKind::Var => (BindingKind::Var, "VariableDeclarator"),
            VarDeclKind::Let => (BindingKind::Let, "VariableDeclarator"),
            VarDeclKind::Const => (BindingKind::Const, "VariableDeclarator"),
        };

        let target_scope = match var_decl.kind {
            VarDeclKind::Var => self.enclosing_function_scope(),
            VarDeclKind::Let | VarDeclKind::Const => self.current_scope(),
        };

        for declarator in &var_decl.decls {
            self.collect_pat_bindings(
                &declarator.name,
                kind.clone(),
                target_scope,
                declaration_type,
            );
            // Visit initializers so nested functions/arrows get their scopes
            if let Some(init) = &declarator.init {
                init.visit_with(self);
            }
        }
    }

    fn visit_fn_decl(&mut self, fn_decl: &FnDecl) {
        // Function declarations are hoisted to the enclosing function/program scope
        let hoist_scope = self.enclosing_function_scope();
        let name = fn_decl.ident.sym.to_string();
        let start = fn_decl.ident.span.lo.0;
        self.add_binding(
            name,
            BindingKind::Hoisted,
            hoist_scope,
            "FunctionDeclaration".to_string(),
            Some(start),
            None,
        );

        self.visit_function_inner(&fn_decl.function);
    }

    fn visit_fn_expr(&mut self, fn_expr: &FnExpr) {
        let func_start = fn_expr.function.span.lo.0;
        self.push_scope(ScopeKind::Function, func_start);

        // Named function expressions bind their name in the function scope
        if let Some(ident) = &fn_expr.ident {
            let name = ident.sym.to_string();
            let start = ident.span.lo.0;
            self.add_binding(
                name,
                BindingKind::Local,
                self.current_scope(),
                "FunctionExpression".to_string(),
                Some(start),
                None,
            );
        }

        for param in &fn_expr.function.params {
            self.collect_pat_bindings(
                &param.pat,
                BindingKind::Param,
                self.current_scope(),
                "FormalParameter",
            );
        }

        if let Some(body) = &fn_expr.function.body {
            self.function_body_spans.insert(body.span.lo.0);
            body.visit_with(self);
        }

        self.pop_scope();
    }

    fn visit_arrow_expr(&mut self, arrow: &ArrowExpr) {
        let func_start = arrow.span.lo.0;
        self.push_scope(ScopeKind::Function, func_start);

        for param in &arrow.params {
            self.collect_pat_bindings(
                param,
                BindingKind::Param,
                self.current_scope(),
                "FormalParameter",
            );
        }

        match &*arrow.body {
            BlockStmtOrExpr::BlockStmt(block) => {
                self.function_body_spans.insert(block.span.lo.0);
                block.visit_with(self);
            }
            BlockStmtOrExpr::Expr(expr) => {
                expr.visit_with(self);
            }
        }

        self.pop_scope();
    }

    fn visit_block_stmt(&mut self, block: &BlockStmt) {
        if self.function_body_spans.remove(&block.span.lo.0) {
            // This block is a function/catch body — don't create a separate scope
            block.visit_children_with(self);
        } else {
            self.push_scope(ScopeKind::Block, block.span.lo.0);
            block.visit_children_with(self);
            self.pop_scope();
        }
    }

    fn visit_for_stmt(&mut self, for_stmt: &ForStmt) {
        self.push_scope(ScopeKind::For, for_stmt.span.lo.0);

        if let Some(init) = &for_stmt.init {
            init.visit_with(self);
        }
        if let Some(test) = &for_stmt.test {
            test.visit_with(self);
        }
        if let Some(update) = &for_stmt.update {
            update.visit_with(self);
        }
        for_stmt.body.visit_with(self);

        self.pop_scope();
    }

    fn visit_for_in_stmt(&mut self, for_in: &ForInStmt) {
        self.push_scope(ScopeKind::For, for_in.span.lo.0);
        for_in.left.visit_with(self);
        for_in.right.visit_with(self);
        for_in.body.visit_with(self);
        self.pop_scope();
    }

    fn visit_for_of_stmt(&mut self, for_of: &ForOfStmt) {
        self.push_scope(ScopeKind::For, for_of.span.lo.0);
        for_of.left.visit_with(self);
        for_of.right.visit_with(self);
        for_of.body.visit_with(self);
        self.pop_scope();
    }

    fn visit_catch_clause(&mut self, catch: &CatchClause) {
        self.push_scope(ScopeKind::Catch, catch.span.lo.0);

        if let Some(param) = &catch.param {
            self.collect_pat_bindings(
                param,
                BindingKind::Let,
                self.current_scope(),
                "CatchClause",
            );
        }

        // Mark catch body as already scoped (the catch scope covers it)
        self.function_body_spans.insert(catch.body.span.lo.0);
        catch.body.visit_with(self);

        self.pop_scope();
    }

    fn visit_switch_stmt(&mut self, switch: &SwitchStmt) {
        // Visit the discriminant in the outer scope
        switch.discriminant.visit_with(self);

        self.push_scope(ScopeKind::Switch, switch.span.lo.0);
        for case in &switch.cases {
            case.visit_with(self);
        }
        self.pop_scope();
    }

    fn visit_class_decl(&mut self, class_decl: &ClassDecl) {
        let name = class_decl.ident.sym.to_string();
        let start = class_decl.ident.span.lo.0;
        self.add_binding(
            name,
            BindingKind::Local,
            self.current_scope(),
            "ClassDeclaration".to_string(),
            Some(start),
            None,
        );

        self.push_scope(ScopeKind::Class, class_decl.class.span.lo.0);
        class_decl.class.visit_children_with(self);
        self.pop_scope();
    }

    fn visit_class_expr(&mut self, class_expr: &ClassExpr) {
        self.push_scope(ScopeKind::Class, class_expr.class.span.lo.0);

        if let Some(ident) = &class_expr.ident {
            let name = ident.sym.to_string();
            let start = ident.span.lo.0;
            self.add_binding(
                name,
                BindingKind::Local,
                self.current_scope(),
                "ClassExpression".to_string(),
                Some(start),
                None,
            );
        }

        class_expr.class.visit_children_with(self);
        self.pop_scope();
    }

    // Method definitions contain a Function node. We intercept here
    // so that the Function gets its own scope with params.
    fn visit_function(&mut self, f: &Function) {
        // This is reached for object/class methods via default traversal.
        self.visit_function_inner(f);
    }
}

// ── Pass 2: Reference resolution ────────────────────────────────────────────

struct ReferenceResolver<'a> {
    scopes: &'a [ScopeData],
    #[allow(dead_code)]
    bindings: &'a [BindingData],
    node_to_scope: &'a HashMap<u32, ScopeId>,
    reference_to_binding: IndexMap<u32, BindingId>,
    /// Stack of scope IDs for resolution
    scope_stack: Vec<ScopeId>,
    /// Declaration positions to skip (these are binding sites, not references)
    declaration_starts: HashSet<u32>,
    /// Span starts for block statements that are direct function/catch bodies.
    function_body_spans: HashSet<u32>,
}

impl<'a> ReferenceResolver<'a> {
    fn new(collector: &'a ScopeCollector) -> Self {
        let mut declaration_starts = HashSet::new();
        for binding in &collector.bindings {
            if let Some(start) = binding.declaration_start {
                declaration_starts.insert(start);
            }
        }
        Self {
            scopes: &collector.scopes,
            bindings: &collector.bindings,
            node_to_scope: &collector.node_to_scope,
            reference_to_binding: IndexMap::new(),
            scope_stack: Vec::new(),
            declaration_starts,
            function_body_spans: HashSet::new(),
        }
    }

    fn current_scope(&self) -> ScopeId {
        *self.scope_stack.last().expect("scope stack is empty")
    }

    fn resolve_ident(&mut self, name: &str, start: u32) {
        // Skip declaration sites — they'll be added separately
        if self.declaration_starts.contains(&start) {
            return;
        }

        // Walk up the scope chain to find the binding
        let mut current = Some(self.current_scope());
        while let Some(scope_id) = current {
            let scope = &self.scopes[scope_id.0 as usize];
            if let Some(&binding_id) = scope.bindings.get(name) {
                self.reference_to_binding.insert(start, binding_id);
                return;
            }
            current = scope.parent;
        }
        // Not found — it's a global, don't record it
    }

    fn find_scope_at(&self, node_start: u32) -> Option<&ScopeId> {
        self.node_to_scope.get(&node_start)
    }

    /// Visit a pattern in parameter position: skip binding idents, but visit
    /// default values and computed keys as references.
    fn visit_param_pattern(&mut self, pat: &Pat) {
        match pat {
            Pat::Ident(_) => {
                // Declaration — skip
            }
            Pat::Array(arr) => {
                for elem in &arr.elems {
                    if let Some(p) = elem {
                        self.visit_param_pattern(p);
                    }
                }
            }
            Pat::Object(obj) => {
                for prop in &obj.props {
                    match prop {
                        ObjectPatProp::KeyValue(kv) => {
                            if let PropName::Computed(computed) = &kv.key {
                                computed.visit_with(self);
                            }
                            self.visit_param_pattern(&kv.value);
                        }
                        ObjectPatProp::Assign(assign) => {
                            if let Some(value) = &assign.value {
                                value.visit_with(self);
                            }
                        }
                        ObjectPatProp::Rest(rest) => {
                            self.visit_param_pattern(&rest.arg);
                        }
                    }
                }
            }
            Pat::Assign(assign) => {
                self.visit_param_pattern(&assign.left);
                // Default value IS a reference
                assign.right.visit_with(self);
            }
            Pat::Rest(rest) => {
                self.visit_param_pattern(&rest.arg);
            }
            Pat::Expr(expr) => {
                expr.visit_with(self);
            }
            Pat::Invalid(_) => {}
        }
    }

    /// Visit function internals for the resolver (params + body), mirroring the collector.
    fn visit_function_inner(&mut self, function: &Function) {
        let func_start = function.span.lo.0;
        if let Some(&scope_id) = self.find_scope_at(func_start) {
            self.scope_stack.push(scope_id);

            for param in &function.params {
                self.visit_param_pattern(&param.pat);
            }

            if let Some(body) = &function.body {
                self.function_body_spans.insert(body.span.lo.0);
                body.visit_with(self);
            }

            self.scope_stack.pop();
        }
    }
}

impl<'a> Visit for ReferenceResolver<'a> {
    fn visit_module(&mut self, module: &Module) {
        self.scope_stack.push(ScopeId(0));
        module.visit_children_with(self);
        self.scope_stack.pop();
    }

    fn visit_ident(&mut self, ident: &Ident) {
        let name = ident.sym.to_string();
        let start = ident.span.lo.0;
        self.resolve_ident(&name, start);
    }

    fn visit_import_decl(&mut self, _import: &ImportDecl) {
        // Don't recurse — import identifiers are declarations
    }

    fn visit_var_decl(&mut self, var_decl: &VarDecl) {
        // Only visit initializers, not patterns (which are declarations)
        for declarator in &var_decl.decls {
            if let Some(init) = &declarator.init {
                init.visit_with(self);
            }
        }
    }

    fn visit_fn_decl(&mut self, fn_decl: &FnDecl) {
        // Don't resolve the function name — it's a declaration
        self.visit_function_inner(&fn_decl.function);
    }

    fn visit_fn_expr(&mut self, fn_expr: &FnExpr) {
        let func_start = fn_expr.function.span.lo.0;
        if let Some(&scope_id) = self.find_scope_at(func_start) {
            self.scope_stack.push(scope_id);

            // Don't resolve named fn expr ident — it's a declaration

            for param in &fn_expr.function.params {
                self.visit_param_pattern(&param.pat);
            }

            if let Some(body) = &fn_expr.function.body {
                self.function_body_spans.insert(body.span.lo.0);
                body.visit_with(self);
            }

            self.scope_stack.pop();
        }
    }

    fn visit_arrow_expr(&mut self, arrow: &ArrowExpr) {
        let func_start = arrow.span.lo.0;
        if let Some(&scope_id) = self.find_scope_at(func_start) {
            self.scope_stack.push(scope_id);

            for param in &arrow.params {
                self.visit_param_pattern(param);
            }

            match &*arrow.body {
                BlockStmtOrExpr::BlockStmt(block) => {
                    self.function_body_spans.insert(block.span.lo.0);
                    block.visit_with(self);
                }
                BlockStmtOrExpr::Expr(expr) => {
                    expr.visit_with(self);
                }
            }

            self.scope_stack.pop();
        }
    }

    fn visit_block_stmt(&mut self, block: &BlockStmt) {
        if self.function_body_spans.remove(&block.span.lo.0) {
            // Function/catch body — scope already pushed
            block.visit_children_with(self);
        } else if let Some(&scope_id) = self.find_scope_at(block.span.lo.0) {
            self.scope_stack.push(scope_id);
            block.visit_children_with(self);
            self.scope_stack.pop();
        } else {
            block.visit_children_with(self);
        }
    }

    fn visit_for_stmt(&mut self, for_stmt: &ForStmt) {
        if let Some(&scope_id) = self.find_scope_at(for_stmt.span.lo.0) {
            self.scope_stack.push(scope_id);

            if let Some(init) = &for_stmt.init {
                init.visit_with(self);
            }
            if let Some(test) = &for_stmt.test {
                test.visit_with(self);
            }
            if let Some(update) = &for_stmt.update {
                update.visit_with(self);
            }
            for_stmt.body.visit_with(self);

            self.scope_stack.pop();
        }
    }

    fn visit_for_in_stmt(&mut self, for_in: &ForInStmt) {
        if let Some(&scope_id) = self.find_scope_at(for_in.span.lo.0) {
            self.scope_stack.push(scope_id);
            for_in.left.visit_with(self);
            for_in.right.visit_with(self);
            for_in.body.visit_with(self);
            self.scope_stack.pop();
        }
    }

    fn visit_for_of_stmt(&mut self, for_of: &ForOfStmt) {
        if let Some(&scope_id) = self.find_scope_at(for_of.span.lo.0) {
            self.scope_stack.push(scope_id);
            for_of.left.visit_with(self);
            for_of.right.visit_with(self);
            for_of.body.visit_with(self);
            self.scope_stack.pop();
        }
    }

    fn visit_catch_clause(&mut self, catch: &CatchClause) {
        if let Some(&scope_id) = self.find_scope_at(catch.span.lo.0) {
            self.scope_stack.push(scope_id);
            // Don't visit catch param — it's a declaration
            self.function_body_spans.insert(catch.body.span.lo.0);
            catch.body.visit_with(self);
            self.scope_stack.pop();
        }
    }

    fn visit_switch_stmt(&mut self, switch: &SwitchStmt) {
        switch.discriminant.visit_with(self);

        if let Some(&scope_id) = self.find_scope_at(switch.span.lo.0) {
            self.scope_stack.push(scope_id);
            for case in &switch.cases {
                case.visit_with(self);
            }
            self.scope_stack.pop();
        }
    }

    fn visit_class_decl(&mut self, class_decl: &ClassDecl) {
        // Don't resolve the class name — it's a declaration
        if let Some(&scope_id) = self.find_scope_at(class_decl.class.span.lo.0) {
            self.scope_stack.push(scope_id);
            class_decl.class.visit_children_with(self);
            self.scope_stack.pop();
        }
    }

    fn visit_class_expr(&mut self, class_expr: &ClassExpr) {
        if let Some(&scope_id) = self.find_scope_at(class_expr.class.span.lo.0) {
            self.scope_stack.push(scope_id);
            // Don't resolve named class expr ident — it's a declaration
            class_expr.class.visit_children_with(self);
            self.scope_stack.pop();
        }
    }

    fn visit_function(&mut self, f: &Function) {
        // Reached for object/class methods via default traversal
        self.visit_function_inner(f);
    }

    // Don't resolve property idents on member expressions as references
    fn visit_member_expr(&mut self, member: &MemberExpr) {
        member.obj.visit_with(self);
        if let MemberProp::Computed(computed) = &member.prop {
            computed.visit_with(self);
        }
    }

    // Handle property definitions — don't resolve non-computed keys
    fn visit_prop(&mut self, prop: &Prop) {
        match prop {
            Prop::Shorthand(ident) => {
                // Shorthand property `{ x }` — `x` is a reference
                self.visit_ident(ident);
            }
            Prop::KeyValue(kv) => {
                if let PropName::Computed(computed) = &kv.key {
                    computed.visit_with(self);
                }
                kv.value.visit_with(self);
            }
            Prop::Assign(assign) => {
                assign.value.visit_with(self);
            }
            Prop::Getter(getter) => {
                if let PropName::Computed(computed) = &getter.key {
                    computed.visit_with(self);
                }
                if let Some(body) = &getter.body {
                    body.visit_with(self);
                }
            }
            Prop::Setter(setter) => {
                if let PropName::Computed(computed) = &setter.key {
                    computed.visit_with(self);
                }
                setter.param.visit_with(self);
                if let Some(body) = &setter.body {
                    body.visit_with(self);
                }
            }
            Prop::Method(method) => {
                if let PropName::Computed(computed) = &method.key {
                    computed.visit_with(self);
                }
                method.function.visit_with(self);
            }
        }
    }

    // Don't resolve labels
    fn visit_labeled_stmt(&mut self, labeled: &LabeledStmt) {
        labeled.body.visit_with(self);
    }

    fn visit_break_stmt(&mut self, _break_stmt: &BreakStmt) {}

    fn visit_continue_stmt(&mut self, _continue_stmt: &ContinueStmt) {}
}
