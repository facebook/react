/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
use std::collections::{HashMap, HashSet};

use react_compiler_ast::common::BaseNode;
use react_compiler_ast::declarations::{
    ImportDeclaration, ImportKind, ImportSpecifier, ImportSpecifierData, ModuleExportName,
};
use react_compiler_ast::expressions::Identifier;
use react_compiler_ast::literals::StringLiteral;
use react_compiler_ast::scope::ScopeInfo;
use react_compiler_ast::statements::Statement;
use react_compiler_ast::{Program, SourceType};
use react_compiler_diagnostics::{CompilerError, CompilerErrorDetail, ErrorCategory};

use super::compile_result::{DebugLogEntry, LoggerEvent, OrderedLogItem};
use super::plugin_options::{CompilerTarget, PluginOptions};
use super::suppression::SuppressionRange;

/// An import specifier tracked by ProgramContext.
/// Corresponds to NonLocalImportSpecifier in the TS compiler.
#[derive(Debug, Clone)]
pub struct NonLocalImportSpecifier {
    pub name: String,
    pub module: String,
    pub imported: String,
}

/// Context for the program being compiled.
/// Tracks compiled functions, generated names, and import requirements.
/// Equivalent to ProgramContext class in Imports.ts.
pub struct ProgramContext {
    pub opts: PluginOptions,
    pub filename: Option<String>,
    pub code: Option<String>,
    pub react_runtime_module: String,
    pub suppressions: Vec<SuppressionRange>,
    pub has_module_scope_opt_out: bool,
    pub events: Vec<LoggerEvent>,
    pub debug_logs: Vec<DebugLogEntry>,
    /// Unified ordered log that interleaves events and debug entries
    /// in the order they were emitted during compilation.
    pub ordered_log: Vec<OrderedLogItem>,

    // Internal state
    already_compiled: HashSet<u32>,
    known_referenced_names: HashSet<String>,
    imports: HashMap<String, HashMap<String, NonLocalImportSpecifier>>,
}

impl ProgramContext {
    pub fn new(
        opts: PluginOptions,
        filename: Option<String>,
        code: Option<String>,
        suppressions: Vec<SuppressionRange>,
        has_module_scope_opt_out: bool,
    ) -> Self {
        let react_runtime_module = get_react_compiler_runtime_module(&opts.target);
        Self {
            opts,
            filename,
            code,
            react_runtime_module,
            suppressions,
            has_module_scope_opt_out,
            events: Vec::new(),
            debug_logs: Vec::new(),
            ordered_log: Vec::new(),
            already_compiled: HashSet::new(),
            known_referenced_names: HashSet::new(),
            imports: HashMap::new(),
        }
    }

    /// Check if a function at the given start position has already been compiled.
    /// This is a workaround for Babel not consistently respecting skip().
    pub fn is_already_compiled(&self, start: u32) -> bool {
        self.already_compiled.contains(&start)
    }

    /// Mark a function at the given start position as compiled.
    pub fn mark_compiled(&mut self, start: u32) {
        self.already_compiled.insert(start);
    }

    /// Initialize known referenced names from scope bindings.
    /// Call this after construction to seed conflict detection with program scope bindings.
    pub fn init_from_scope(&mut self, scope: &ScopeInfo) {
        for binding in scope.scope_bindings(scope.program_scope) {
            self.known_referenced_names.insert(binding.name.clone());
        }
    }

    /// Check if a name conflicts with known references.
    pub fn has_reference(&self, name: &str) -> bool {
        self.known_referenced_names.contains(name)
    }

    /// Generate a unique identifier name that doesn't conflict with existing bindings.
    ///
    /// For hook names (use*), preserves the original name to avoid breaking
    /// hook-name-based type inference. For other names, prefixes with underscore
    /// similar to Babel's generateUid.
    pub fn new_uid(&mut self, name: &str) -> String {
        if is_hook_name(name) {
            // Don't prefix hooks with underscore, since InferTypes might
            // type HookKind based on callee naming convention.
            let mut uid = name.to_string();
            let mut i = 0;
            while self.has_reference(&uid) {
                uid = format!("{}_{}", name, i);
                i += 1;
            }
            self.known_referenced_names.insert(uid.clone());
            uid
        } else if !self.has_reference(name) {
            self.known_referenced_names.insert(name.to_string());
            name.to_string()
        } else {
            // Generate unique name with underscore prefix (similar to Babel's generateUid)
            let mut uid = format!("_{}", name);
            let mut i = 0;
            while self.has_reference(&uid) {
                uid = format!("_{}${}", name, i);
                i += 1;
            }
            self.known_referenced_names.insert(uid.clone());
            uid
        }
    }

    /// Add the memo cache import (the `c` function from the compiler runtime).
    pub fn add_memo_cache_import(&mut self) -> NonLocalImportSpecifier {
        let module = self.react_runtime_module.clone();
        self.add_import_specifier(&module, "c", Some("_c"))
    }

    /// Add an import specifier, reusing an existing one if it was already added.
    ///
    /// If `name_hint` is provided, it will be used as the basis for the local
    /// name; otherwise `specifier` is used.
    pub fn add_import_specifier(
        &mut self,
        module: &str,
        specifier: &str,
        name_hint: Option<&str>,
    ) -> NonLocalImportSpecifier {
        // Check if already imported
        if let Some(module_imports) = self.imports.get(module) {
            if let Some(existing) = module_imports.get(specifier) {
                return existing.clone();
            }
        }

        let name = self.new_uid(name_hint.unwrap_or(specifier));
        let binding = NonLocalImportSpecifier {
            name,
            module: module.to_string(),
            imported: specifier.to_string(),
        };

        self.imports
            .entry(module.to_string())
            .or_default()
            .insert(specifier.to_string(), binding.clone());

        binding
    }

    /// Register a name as referenced so future uid generation avoids it.
    pub fn add_new_reference(&mut self, name: String) {
        self.known_referenced_names.insert(name);
    }

    /// Log a compilation event.
    pub fn log_event(&mut self, event: LoggerEvent) {
        self.ordered_log.push(OrderedLogItem::Event { event: event.clone() });
        self.events.push(event);
    }

    /// Log a debug entry (for debugLogIRs support).
    pub fn log_debug(&mut self, entry: DebugLogEntry) {
        self.ordered_log.push(OrderedLogItem::Debug { entry: entry.clone() });
        self.debug_logs.push(entry);
    }

    /// Get an immutable view of the generated imports.
    pub fn imports(&self) -> &HashMap<String, HashMap<String, NonLocalImportSpecifier>> {
        &self.imports
    }
}

/// Check for blocklisted import modules.
/// Returns a CompilerError if any blocklisted imports are found.
pub fn validate_restricted_imports(
    program: &Program,
    blocklisted: &Option<Vec<String>>,
) -> Option<CompilerError> {
    let blocklisted = match blocklisted {
        Some(b) if !b.is_empty() => b,
        _ => return None,
    };
    let restricted: HashSet<&str> = blocklisted.iter().map(|s| s.as_str()).collect();
    let mut error = CompilerError::new();

    for stmt in &program.body {
        if let Statement::ImportDeclaration(import) = stmt {
            if restricted.contains(import.source.value.as_str()) {
                error.push_error_detail(
                    CompilerErrorDetail::new(
                        ErrorCategory::Todo,
                        "Bailing out due to blocklisted import",
                    )
                    .with_description(format!("Import from module {}", import.source.value)),
                );
            }
        }
    }

    if error.has_any_errors() {
        Some(error)
    } else {
        None
    }
}

/// Insert import declarations into the program body.
/// Handles both ESM imports and CommonJS require.
///
/// For existing imports of the same module (non-namespaced, value imports),
/// new specifiers are merged into the existing declaration. Otherwise,
/// new import/require statements are prepended to the program body.
pub fn add_imports_to_program(program: &mut Program, context: &ProgramContext) {
    if context.imports.is_empty() {
        return;
    }

    // Collect existing non-namespaced imports by module name
    let existing_import_indices: HashMap<String, usize> = program
        .body
        .iter()
        .enumerate()
        .filter_map(|(idx, stmt)| {
            if let Statement::ImportDeclaration(import) = stmt {
                if is_non_namespaced_import(import) {
                    return Some((import.source.value.clone(), idx));
                }
            }
            None
        })
        .collect();

    let mut stmts: Vec<Statement> = Vec::new();
    let mut sorted_modules: Vec<_> = context.imports.iter().collect();
    sorted_modules.sort_by_key(|(k, _)| (*k).clone());

    for (module_name, imports_map) in sorted_modules {
        let sorted_imports = {
            let mut sorted: Vec<_> = imports_map.values().collect();
            sorted.sort_by_key(|s| &s.imported);
            sorted
        };

        let import_specifiers: Vec<ImportSpecifier> = sorted_imports
            .iter()
            .map(|spec| make_import_specifier(spec))
            .collect();

        // If an existing import of this module exists, merge into it
        if let Some(&idx) = existing_import_indices.get(module_name.as_str()) {
            if let Statement::ImportDeclaration(ref mut import) = program.body[idx] {
                import.specifiers.extend(import_specifiers);
            }
        } else if matches!(program.source_type, SourceType::Module) {
            // ESM: import { ... } from 'module'
            stmts.push(Statement::ImportDeclaration(ImportDeclaration {
                base: BaseNode::default(),
                specifiers: import_specifiers,
                source: StringLiteral {
                    base: BaseNode::default(),
                    value: module_name.clone(),
                },
                import_kind: None,
                assertions: None,
                attributes: None,
            }));
        } else {
            // CommonJS: const { imported: name } = require('module')
            // Build as a VariableDeclaration with destructuring.
            // For now, we emit an import declaration since most React code
            // uses ESM, and proper CJS require generation needs ObjectPattern
            // support which can be added later.
            stmts.push(Statement::ImportDeclaration(ImportDeclaration {
                base: BaseNode::default(),
                specifiers: import_specifiers,
                source: StringLiteral {
                    base: BaseNode::default(),
                    value: module_name.clone(),
                },
                import_kind: None,
                assertions: None,
                attributes: None,
            }));
        }
    }

    // Prepend new import statements to the program body
    if !stmts.is_empty() {
        let mut new_body = stmts;
        new_body.append(&mut program.body);
        program.body = new_body;
    }
}

/// Create an ImportSpecifier AST node from a NonLocalImportSpecifier.
fn make_import_specifier(spec: &NonLocalImportSpecifier) -> ImportSpecifier {
    ImportSpecifier::ImportSpecifier(ImportSpecifierData {
        base: BaseNode::default(),
        local: Identifier {
            base: BaseNode::default(),
            name: spec.name.clone(),
            type_annotation: None,
            optional: None,
            decorators: None,
        },
        imported: ModuleExportName::Identifier(Identifier {
            base: BaseNode::default(),
            name: spec.imported.clone(),
            type_annotation: None,
            optional: None,
            decorators: None,
        }),
        import_kind: None,
    })
}

/// Check if an import declaration is a non-namespaced value import.
/// Matches `import { ... } from 'module'` but NOT:
///   - `import * as Foo from 'module'` (namespace)
///   - `import type { Foo } from 'module'` (type import)
///   - `import typeof { Foo } from 'module'` (typeof import)
fn is_non_namespaced_import(import: &ImportDeclaration) -> bool {
    import
        .specifiers
        .iter()
        .all(|s| matches!(s, ImportSpecifier::ImportSpecifier(_)))
        && import
            .import_kind
            .as_ref()
            .map_or(true, |k| matches!(k, ImportKind::Value))
}

/// Check if a name follows the React hook naming convention (use[A-Z0-9]...).
fn is_hook_name(name: &str) -> bool {
    let bytes = name.as_bytes();
    bytes.len() >= 4
        && bytes[0] == b'u'
        && bytes[1] == b's'
        && bytes[2] == b'e'
        && bytes
            .get(3)
            .map_or(false, |c| c.is_ascii_uppercase() || c.is_ascii_digit())
}

/// Get the runtime module name based on the compiler target.
pub fn get_react_compiler_runtime_module(target: &CompilerTarget) -> String {
    match target {
        CompilerTarget::Version(v) if v == "19" => "react/compiler-runtime".to_string(),
        CompilerTarget::Version(v) if v == "17" || v == "18" => {
            "react-compiler-runtime".to_string()
        }
        CompilerTarget::MetaInternal { runtime_module, .. } => runtime_module.clone(),
        // Default to React 19 runtime for unrecognized versions
        CompilerTarget::Version(_) => "react/compiler-runtime".to_string(),
    }
}
