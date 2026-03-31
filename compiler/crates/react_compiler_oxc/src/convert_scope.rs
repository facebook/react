// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

use indexmap::IndexMap;
use oxc_ast::ast::Program;
use oxc_ast::AstKind;
use oxc_semantic::Semantic;
use oxc_span::GetSpan;
use oxc_syntax::symbol::SymbolFlags;
use react_compiler_ast::scope::*;
use std::collections::HashMap;

/// Convert OXC's semantic analysis into React Compiler's ScopeInfo.
pub fn convert_scope_info(semantic: &Semantic, _program: &Program) -> ScopeInfo {
    let scoping = semantic.scoping();
    let nodes = semantic.nodes();

    let mut scopes: Vec<ScopeData> = Vec::new();
    let mut bindings: Vec<BindingData> = Vec::new();
    let mut node_to_scope: HashMap<u32, ScopeId> = HashMap::new();
    let mut reference_to_binding: IndexMap<u32, BindingId> = IndexMap::new();

    // Map OXC symbol IDs to our binding IDs
    let mut symbol_to_binding: HashMap<oxc_syntax::symbol::SymbolId, BindingId> = HashMap::new();

    // First pass: Create all bindings from symbols
    for symbol_id in scoping.symbol_ids() {
        let symbol_flags = scoping.symbol_flags(symbol_id);
        let name = scoping.symbol_name(symbol_id).to_string();

        let kind = get_binding_kind(symbol_flags, semantic, symbol_id);

        let (declaration_type, declaration_start) =
            get_declaration_info(semantic, symbol_id, &name);

        let import = if matches!(kind, BindingKind::Module) {
            get_import_data(semantic, symbol_id)
        } else {
            None
        };

        let binding_id = BindingId(bindings.len() as u32);
        symbol_to_binding.insert(symbol_id, binding_id);

        bindings.push(BindingData {
            id: binding_id,
            name,
            kind,
            scope: ScopeId(0), // Placeholder, filled in second pass
            declaration_type,
            declaration_start,
            import,
        });
    }

    // Second pass: Create all scopes and update binding scope references
    for scope_id in scoping.scope_descendants_from_root() {
        let scope_flags = scoping.scope_flags(scope_id);
        let parent = scoping.scope_parent_id(scope_id);

        let our_scope_id = ScopeId(scope_id.index() as u32);

        let kind = get_scope_kind(scope_flags, semantic, scope_id);

        // Collect bindings in this scope
        let mut scope_bindings: HashMap<String, BindingId> = HashMap::new();
        for symbol_id in scoping.iter_bindings_in(scope_id) {
            if let Some(&binding_id) = symbol_to_binding.get(&symbol_id) {
                let name = bindings[binding_id.0 as usize].name.clone();
                scope_bindings.insert(name, binding_id);
                bindings[binding_id.0 as usize].scope = our_scope_id;
            }
        }

        // Map the AST node that created this scope to the scope ID
        let node_id = scoping.get_node_id(scope_id);
        let node = nodes.get_node(node_id);
        let start = node.kind().span().start;
        // For function scopes inside object methods, also map the parent
        // ObjectProperty start so the compiler can look up the scope using the
        // ObjectMethod's start position (which matches the property start in Babel).
        if matches!(kind, ScopeKind::Function) {
            if let AstKind::Function(_) = node.kind() {
                let parent_node_id = nodes.parent_id(node_id);
                let parent_node = nodes.get_node(parent_node_id);
                match parent_node.kind() {
                    AstKind::ObjectProperty(prop) if prop.method || matches!(prop.kind, oxc_ast::ast::PropertyKind::Get | oxc_ast::ast::PropertyKind::Set) => {
                        let prop_start = parent_node.kind().span().start;
                        if prop_start != start {
                            node_to_scope.insert(prop_start, our_scope_id);
                        }
                    }
                    _ => {}
                }
            }
        }

        node_to_scope.insert(start, our_scope_id);

        scopes.push(ScopeData {
            id: our_scope_id,
            parent: parent.map(|p| ScopeId(p.index() as u32)),
            kind,
            bindings: scope_bindings,
        });
    }

    // Third pass: Map all resolved references to bindings
    for symbol_id in scoping.symbol_ids() {
        if let Some(&binding_id) = symbol_to_binding.get(&symbol_id) {
            for &ref_id in scoping.get_resolved_reference_ids(symbol_id) {
                let reference = scoping.get_reference(ref_id);
                let ref_node = nodes.get_node(reference.node_id());
                let start = ref_node.kind().span().start;
                reference_to_binding.insert(start, binding_id);
            }
        }
    }

    // Also map declaration identifiers to their bindings
    for symbol_id in scoping.symbol_ids() {
        if let Some(&binding_id) = symbol_to_binding.get(&symbol_id) {
            if let Some(start) = bindings[binding_id.0 as usize].declaration_start {
                reference_to_binding.entry(start).or_insert(binding_id);
            }
        }
    }

    let program_scope = ScopeId(scoping.root_scope_id().index() as u32);

    ScopeInfo {
        scopes,
        bindings,
        node_to_scope,
        reference_to_binding,
        program_scope,
    }
}

/// Map OXC ScopeFlags to our ScopeKind.
fn get_scope_kind(
    flags: oxc_syntax::scope::ScopeFlags,
    semantic: &Semantic,
    scope_id: oxc_syntax::scope::ScopeId,
) -> ScopeKind {
    if flags.contains(oxc_syntax::scope::ScopeFlags::Top) {
        return ScopeKind::Program;
    }

    if flags.intersects(oxc_syntax::scope::ScopeFlags::Function) {
        return ScopeKind::Function;
    }

    if flags.contains(oxc_syntax::scope::ScopeFlags::CatchClause) {
        return ScopeKind::Catch;
    }

    if flags.contains(oxc_syntax::scope::ScopeFlags::ClassStaticBlock) {
        return ScopeKind::Class;
    }

    // Check the AST node to determine if it's a for loop, class, or switch
    let node_id = semantic.scoping().get_node_id(scope_id);
    let node = semantic.nodes().get_node(node_id);
    match node.kind() {
        AstKind::ForStatement(_) | AstKind::ForInStatement(_) | AstKind::ForOfStatement(_) => {
            ScopeKind::For
        }
        AstKind::Class(_) => ScopeKind::Class,
        AstKind::SwitchStatement(_) => ScopeKind::Switch,
        _ => ScopeKind::Block,
    }
}

/// Map OXC SymbolFlags to our BindingKind.
fn get_binding_kind(
    flags: SymbolFlags,
    semantic: &Semantic,
    symbol_id: oxc_syntax::symbol::SymbolId,
) -> BindingKind {
    if flags.contains(SymbolFlags::Import) {
        return BindingKind::Module;
    }

    // Check the declaration node first — FormalParameter and CatchParameter
    // need to be detected before the FunctionScopedVariable flag check, because
    // OXC marks function parameters and catch parameters with FunctionScopedVariable.
    let decl_node = semantic.symbol_declaration(symbol_id);
    match decl_node.kind() {
        AstKind::FormalParameter(_) => return BindingKind::Param,
        AstKind::FormalParameterRest(_) => return BindingKind::Param,
        AstKind::CatchParameter(_) => return BindingKind::Let,
        AstKind::TSTypeAliasDeclaration(_) => return BindingKind::Local,
        AstKind::TSEnumDeclaration(_) => return BindingKind::Local,
        AstKind::TSModuleDeclaration(_) => return BindingKind::Local,
        AstKind::Function(_) => {
            if flags.contains(SymbolFlags::Function) {
                return BindingKind::Hoisted;
            }
            return BindingKind::Local;
        }
        AstKind::Class(_) => return BindingKind::Local,
        _ => {}
    }

    if flags.contains(SymbolFlags::FunctionScopedVariable) {
        return BindingKind::Var;
    }

    if flags.contains(SymbolFlags::BlockScopedVariable) {
        if flags.contains(SymbolFlags::ConstVariable) {
            return BindingKind::Const;
        } else {
            return BindingKind::Let;
        }
    }

    if flags.contains(SymbolFlags::Function) {
        BindingKind::Hoisted
    } else if flags.contains(SymbolFlags::Class) {
        BindingKind::Local
    } else {
        BindingKind::Unknown
    }
}

/// Get the declaration type string and start position for a binding.
fn get_declaration_info(
    semantic: &Semantic,
    symbol_id: oxc_syntax::symbol::SymbolId,
    name: &str,
) -> (String, Option<u32>) {
    let decl_node = semantic.symbol_declaration(symbol_id);
    let declaration_type = ast_kind_to_string(decl_node.kind());
    let declaration_start = find_binding_identifier_start(decl_node.kind(), name);
    (declaration_type, declaration_start)
}

/// Convert an AstKind to its Babel-equivalent string representation.
fn ast_kind_to_string(kind: AstKind) -> String {
    match kind {
        AstKind::BindingIdentifier(_) => "BindingIdentifier",
        AstKind::VariableDeclarator(_) => "VariableDeclarator",
        AstKind::Function(f) => {
            if f.is_declaration() {
                "FunctionDeclaration"
            } else {
                "FunctionExpression"
            }
        }
        AstKind::Class(c) => {
            if c.is_declaration() {
                "ClassDeclaration"
            } else {
                "ClassExpression"
            }
        }
        AstKind::FormalParameter(_) => "FormalParameter",
        AstKind::FormalParameterRest(_) => "FormalParameter",
        AstKind::ImportSpecifier(_) => "ImportSpecifier",
        AstKind::ImportDefaultSpecifier(_) => "ImportDefaultSpecifier",
        AstKind::ImportNamespaceSpecifier(_) => "ImportNamespaceSpecifier",
        AstKind::CatchClause(_) => "CatchClause",
        AstKind::CatchParameter(_) => "CatchClause",
        AstKind::TSTypeAliasDeclaration(_) => "TSTypeAliasDeclaration",
        AstKind::TSEnumDeclaration(_) => "TSEnumDeclaration",
        AstKind::TSModuleDeclaration(_) => "TSModuleDeclaration",
        _ => "Unknown",
    }
    .to_string()
}

/// Find the binding identifier's start position within an AST node.
fn find_binding_identifier_start(kind: AstKind, name: &str) -> Option<u32> {
    match kind {
        AstKind::BindingIdentifier(ident) => {
            if ident.name.as_str() == name {
                Some(ident.span.start)
            } else {
                None
            }
        }
        AstKind::VariableDeclarator(decl) => find_identifier_in_pattern(&decl.id, name),
        AstKind::Function(func) => func.id.as_ref().and_then(|id| {
            if id.name.as_str() == name {
                Some(id.span.start)
            } else {
                None
            }
        }),
        AstKind::Class(class) => class.id.as_ref().and_then(|id| {
            if id.name.as_str() == name {
                Some(id.span.start)
            } else {
                None
            }
        }),
        AstKind::FormalParameter(param) => find_identifier_in_pattern(&param.pattern, name),
        AstKind::FormalParameterRest(rest) => find_identifier_in_pattern(&rest.rest.argument, name),
        AstKind::ImportSpecifier(spec) => Some(spec.local.span.start),
        AstKind::ImportDefaultSpecifier(spec) => Some(spec.local.span.start),
        AstKind::ImportNamespaceSpecifier(spec) => Some(spec.local.span.start),
        AstKind::CatchClause(catch) => catch
            .param
            .as_ref()
            .and_then(|p| find_identifier_in_pattern(&p.pattern, name)),
        AstKind::CatchParameter(param) => find_identifier_in_pattern(&param.pattern, name),
        AstKind::TSTypeAliasDeclaration(decl) => {
            if decl.id.name.as_str() == name {
                Some(decl.id.span.start)
            } else {
                None
            }
        }
        AstKind::TSEnumDeclaration(decl) => {
            if decl.id.name.as_str() == name {
                Some(decl.id.span.start)
            } else {
                None
            }
        }
        AstKind::TSModuleDeclaration(decl) => {
            match &decl.id {
                oxc_ast::ast::TSModuleDeclarationName::Identifier(id) => {
                    if id.name.as_str() == name {
                        Some(id.span.start)
                    } else {
                        None
                    }
                }
                _ => None,
            }
        }
        _ => None,
    }
}

/// Recursively find a binding identifier within a binding pattern.
fn find_identifier_in_pattern(
    pattern: &oxc_ast::ast::BindingPattern,
    name: &str,
) -> Option<u32> {
    use oxc_ast::ast::BindingPattern;

    match pattern {
        BindingPattern::BindingIdentifier(ident) => {
            if ident.name.as_str() == name {
                Some(ident.span.start)
            } else {
                None
            }
        }
        BindingPattern::ObjectPattern(obj) => {
            for prop in &obj.properties {
                if let Some(start) = find_identifier_in_pattern(&prop.value, name) {
                    return Some(start);
                }
            }
            if let Some(rest) = &obj.rest {
                if let Some(start) = find_identifier_in_pattern(&rest.argument, name) {
                    return Some(start);
                }
            }
            None
        }
        BindingPattern::ArrayPattern(arr) => {
            for element in arr.elements.iter().flatten() {
                if let Some(start) = find_identifier_in_pattern(element, name) {
                    return Some(start);
                }
            }
            if let Some(rest) = &arr.rest {
                if let Some(start) = find_identifier_in_pattern(&rest.argument, name) {
                    return Some(start);
                }
            }
            None
        }
        BindingPattern::AssignmentPattern(assign) => {
            find_identifier_in_pattern(&assign.left, name)
        }
    }
}

/// Extract import data for a module binding.
fn get_import_data(
    semantic: &Semantic,
    symbol_id: oxc_syntax::symbol::SymbolId,
) -> Option<ImportBindingData> {
    let decl_node = semantic.symbol_declaration(symbol_id);

    match decl_node.kind() {
        AstKind::ImportDefaultSpecifier(_) => {
            let import_decl = find_import_declaration(semantic, decl_node.id())?;
            Some(ImportBindingData {
                source: import_decl.source.value.to_string(),
                kind: ImportBindingKind::Default,
                imported: None,
            })
        }
        AstKind::ImportNamespaceSpecifier(_) => {
            let import_decl = find_import_declaration(semantic, decl_node.id())?;
            Some(ImportBindingData {
                source: import_decl.source.value.to_string(),
                kind: ImportBindingKind::Namespace,
                imported: None,
            })
        }
        AstKind::ImportSpecifier(spec) => {
            let import_decl = find_import_declaration(semantic, decl_node.id())?;
            let imported_name = match &spec.imported {
                oxc_ast::ast::ModuleExportName::IdentifierName(ident) => ident.name.to_string(),
                oxc_ast::ast::ModuleExportName::IdentifierReference(ident) => {
                    ident.name.to_string()
                }
                oxc_ast::ast::ModuleExportName::StringLiteral(lit) => lit.value.to_string(),
            };
            Some(ImportBindingData {
                source: import_decl.source.value.to_string(),
                kind: ImportBindingKind::Named,
                imported: Some(imported_name),
            })
        }
        _ => None,
    }
}

/// Find the ImportDeclaration node that contains the given import specifier.
fn find_import_declaration<'a>(
    semantic: &'a Semantic,
    specifier_node_id: oxc_semantic::NodeId,
) -> Option<&'a oxc_ast::ast::ImportDeclaration<'a>> {
    let mut current_id = specifier_node_id;
    // Walk up the parent chain (max 10 levels to avoid infinite loop)
    for _ in 0..10 {
        let parent_id = semantic.nodes().parent_id(current_id);
        if parent_id == current_id {
            // Root node, no more parents
            return None;
        }
        let parent_node = semantic.nodes().get_node(parent_id);

        if let AstKind::ImportDeclaration(decl) = parent_node.kind() {
            return Some(decl);
        }

        current_id = parent_id;
    }
    None
}
