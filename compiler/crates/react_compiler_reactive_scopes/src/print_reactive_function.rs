// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Verbose debug printer for ReactiveFunction.
//!
//! Produces output identical to the TS `printDebugReactiveFunction`.
//! Analogous to `debug_print.rs` in `react_compiler` for HIR.

use std::collections::HashSet;

use react_compiler_diagnostics::{CompilerError, CompilerErrorOrDiagnostic, SourceLocation};
use react_compiler_hir::environment::Environment;
use react_compiler_hir::{
    AliasingEffect, IdentifierId, IdentifierName, InstructionValue, LValue, ParamPattern,
    Pattern, Place, PlaceOrSpreadOrHole, ReactiveBlock, ReactiveFunction, ReactiveInstruction,
    ReactiveStatement, ReactiveTerminal, ReactiveTerminalStatement, ReactiveValue, ScopeId, Type,
};

// =============================================================================
// DebugPrinter
// =============================================================================

pub struct DebugPrinter<'a> {
    env: &'a Environment,
    seen_identifiers: HashSet<IdentifierId>,
    seen_scopes: HashSet<ScopeId>,
    output: Vec<String>,
    indent_level: usize,
    /// Optional formatter for HIR functions (used for inner functions in FunctionExpression/ObjectMethod)
    pub hir_formatter: Option<&'a HirFunctionFormatter>,
}

impl<'a> DebugPrinter<'a> {
    pub fn new(env: &'a Environment) -> Self {
        Self {
            env,
            seen_identifiers: HashSet::new(),
            seen_scopes: HashSet::new(),
            output: Vec::new(),
            indent_level: 0,
            hir_formatter: None,
        }
    }

    pub fn line(&mut self, text: &str) {
        let indent = "  ".repeat(self.indent_level);
        self.output.push(format!("{}{}", indent, text));
    }

    pub fn indent(&mut self) {
        self.indent_level += 1;
    }

    pub fn dedent(&mut self) {
        self.indent_level -= 1;
    }

    pub fn to_string_output(&self) -> String {
        self.output.join("\n")
    }

    /// Write a line without adding indentation (used when copying pre-formatted output)
    pub fn line_raw(&mut self, text: &str) {
        self.output.push(text.to_string());
    }

    pub fn env(&self) -> &'a Environment {
        self.env
    }

    pub fn indent_level(&self) -> usize {
        self.indent_level
    }

    pub fn seen_identifiers(&self) -> &HashSet<IdentifierId> {
        &self.seen_identifiers
    }

    pub fn seen_identifiers_mut(&mut self) -> &mut HashSet<IdentifierId> {
        &mut self.seen_identifiers
    }

    pub fn seen_scopes(&self) -> &HashSet<ScopeId> {
        &self.seen_scopes
    }

    pub fn seen_scopes_mut(&mut self) -> &mut HashSet<ScopeId> {
        &mut self.seen_scopes
    }

    // =========================================================================
    // ReactiveFunction
    // =========================================================================

    pub fn format_reactive_function(&mut self, func: &ReactiveFunction) {
        self.indent();
        self.line(&format!(
            "id: {}",
            match &func.id {
                Some(id) => format!("\"{}\"", id),
                None => "null".to_string(),
            }
        ));
        self.line(&format!(
            "name_hint: {}",
            match &func.name_hint {
                Some(h) => format!("\"{}\"", h),
                None => "null".to_string(),
            }
        ));
        self.line(&format!("generator: {}", func.generator));
        self.line(&format!("is_async: {}", func.is_async));
        self.line(&format!("loc: {}", format_loc(&func.loc)));

        // params
        self.line("params:");
        self.indent();
        for (i, param) in func.params.iter().enumerate() {
            match param {
                ParamPattern::Place(place) => {
                    self.format_place_field(&format!("[{}]", i), place);
                }
                ParamPattern::Spread(spread) => {
                    self.line(&format!("[{}] Spread:", i));
                    self.indent();
                    self.format_place_field("place", &spread.place);
                    self.dedent();
                }
            }
        }
        self.dedent();

        // directives
        self.line("directives:");
        self.indent();
        for (i, d) in func.directives.iter().enumerate() {
            self.line(&format!("[{}] \"{}\"", i, d));
        }
        self.dedent();

        self.line("");
        self.line("Body:");
        self.indent();
        self.format_reactive_block(&func.body);
        self.dedent();
        self.dedent();
    }

    // =========================================================================
    // ReactiveBlock
    // =========================================================================

    fn format_reactive_block(&mut self, block: &ReactiveBlock) {
        for stmt in block.iter() {
            self.format_reactive_statement(stmt);
        }
    }

    fn format_reactive_statement(&mut self, stmt: &ReactiveStatement) {
        match stmt {
            ReactiveStatement::Instruction(instr) => {
                self.format_reactive_instruction_block(instr);
            }
            ReactiveStatement::Terminal(term) => {
                self.line("ReactiveTerminalStatement {");
                self.indent();
                self.format_terminal_statement(term);
                self.dedent();
                self.line("}");
            }
            ReactiveStatement::Scope(scope) => {
                self.line("ReactiveScopeBlock {");
                self.indent();
                self.format_scope_field("scope", scope.scope);
                self.line("instructions:");
                self.indent();
                self.format_reactive_block(&scope.instructions);
                self.dedent();
                self.dedent();
                self.line("}");
            }
            ReactiveStatement::PrunedScope(scope) => {
                self.line("PrunedReactiveScopeBlock {");
                self.indent();
                self.format_scope_field("scope", scope.scope);
                self.line("instructions:");
                self.indent();
                self.format_reactive_block(&scope.instructions);
                self.dedent();
                self.dedent();
                self.line("}");
            }
        }
    }

    // =========================================================================
    // ReactiveInstruction
    // =========================================================================

    fn format_reactive_instruction_block(&mut self, instr: &ReactiveInstruction) {
        self.line("ReactiveInstruction {");
        self.indent();
        self.format_reactive_instruction(instr);
        self.dedent();
        self.line("}");
    }

    fn format_reactive_instruction(&mut self, instr: &ReactiveInstruction) {
        self.line(&format!("id: {}", instr.id.0));
        match &instr.lvalue {
            Some(place) => self.format_place_field("lvalue", place),
            None => self.line("lvalue: null"),
        }
        self.line("value:");
        self.indent();
        self.format_reactive_value(&instr.value);
        self.dedent();
        match &instr.effects {
            Some(effects) => {
                self.line("effects:");
                self.indent();
                for (i, eff) in effects.iter().enumerate() {
                    self.line(&format!("[{}] {}", i, self.format_effect(eff)));
                }
                self.dedent();
            }
            None => self.line("effects: null"),
        }
        self.line(&format!("loc: {}", format_loc(&instr.loc)));
    }

    // =========================================================================
    // ReactiveValue
    // =========================================================================

    fn format_reactive_value(&mut self, value: &ReactiveValue) {
        match value {
            ReactiveValue::Instruction(iv) => {
                self.format_instruction_value(iv);
            }
            ReactiveValue::LogicalExpression {
                operator,
                left,
                right,
                loc,
            } => {
                self.line("LogicalExpression {");
                self.indent();
                self.line(&format!("operator: \"{}\"", operator));
                self.line("left:");
                self.indent();
                self.format_reactive_value(left);
                self.dedent();
                self.line("right:");
                self.indent();
                self.format_reactive_value(right);
                self.dedent();
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            ReactiveValue::ConditionalExpression {
                test,
                consequent,
                alternate,
                loc,
            } => {
                self.line("ConditionalExpression {");
                self.indent();
                self.line("test:");
                self.indent();
                self.format_reactive_value(test);
                self.dedent();
                self.line("consequent:");
                self.indent();
                self.format_reactive_value(consequent);
                self.dedent();
                self.line("alternate:");
                self.indent();
                self.format_reactive_value(alternate);
                self.dedent();
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            ReactiveValue::SequenceExpression {
                instructions,
                id,
                value,
                loc,
            } => {
                self.line("SequenceExpression {");
                self.indent();
                self.line("instructions:");
                self.indent();
                for (i, instr) in instructions.iter().enumerate() {
                    self.line(&format!("[{}]:", i));
                    self.indent();
                    self.format_reactive_instruction_block(instr);
                    self.dedent();
                }
                self.dedent();
                self.line(&format!("id: {}", id.0));
                self.line("value:");
                self.indent();
                self.format_reactive_value(value);
                self.dedent();
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            ReactiveValue::OptionalExpression {
                id,
                value,
                optional,
                loc,
            } => {
                self.line("OptionalExpression {");
                self.indent();
                self.line(&format!("id: {}", id.0));
                self.line("value:");
                self.indent();
                self.format_reactive_value(value);
                self.dedent();
                self.line(&format!("optional: {}", optional));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
        }
    }

    // =========================================================================
    // ReactiveTerminal
    // =========================================================================

    fn format_terminal_statement(&mut self, stmt: &ReactiveTerminalStatement) {
        // label
        match &stmt.label {
            Some(label) => {
                self.line(&format!(
                    "label: {{ id: bb{}, implicit: {} }}",
                    label.id.0, label.implicit
                ));
            }
            None => self.line("label: null"),
        }
        self.line("terminal:");
        self.indent();
        self.format_reactive_terminal(&stmt.terminal);
        self.dedent();
    }

    fn format_reactive_terminal(&mut self, terminal: &ReactiveTerminal) {
        match terminal {
            ReactiveTerminal::Break {
                target,
                id,
                target_kind,
                loc,
            } => {
                self.line("Break {");
                self.indent();
                self.line(&format!("target: bb{}", target.0));
                self.line(&format!("id: {}", id.0));
                self.line(&format!("targetKind: \"{}\"", target_kind));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            ReactiveTerminal::Continue {
                target,
                id,
                target_kind,
                loc,
            } => {
                self.line("Continue {");
                self.indent();
                self.line(&format!("target: bb{}", target.0));
                self.line(&format!("id: {}", id.0));
                self.line(&format!("targetKind: \"{}\"", target_kind));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            ReactiveTerminal::Return { value, id, loc } => {
                self.line("Return {");
                self.indent();
                self.format_place_field("value", value);
                self.line(&format!("id: {}", id.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            ReactiveTerminal::Throw { value, id, loc } => {
                self.line("Throw {");
                self.indent();
                self.format_place_field("value", value);
                self.line(&format!("id: {}", id.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            ReactiveTerminal::Switch {
                test,
                cases,
                id,
                loc,
            } => {
                self.line("Switch {");
                self.indent();
                self.format_place_field("test", test);
                self.line("cases:");
                self.indent();
                for (i, case) in cases.iter().enumerate() {
                    self.line(&format!("[{}] {{", i));
                    self.indent();
                    match &case.test {
                        Some(p) => {
                            self.format_place_field("test", p);
                        }
                        None => {
                            self.line("test: null");
                        }
                    }
                    match &case.block {
                        Some(block) => {
                            self.line("block:");
                            self.indent();
                            self.format_reactive_block(block);
                            self.dedent();
                        }
                        None => self.line("block: undefined"),
                    }
                    self.dedent();
                    self.line("}");
                }
                self.dedent();
                self.line(&format!("id: {}", id.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            ReactiveTerminal::DoWhile {
                loop_block,
                test,
                id,
                loc,
            } => {
                self.line("DoWhile {");
                self.indent();
                self.line("loop:");
                self.indent();
                self.format_reactive_block(loop_block);
                self.dedent();
                self.line("test:");
                self.indent();
                self.format_reactive_value(test);
                self.dedent();
                self.line(&format!("id: {}", id.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            ReactiveTerminal::While {
                test,
                loop_block,
                id,
                loc,
            } => {
                self.line("While {");
                self.indent();
                self.line("test:");
                self.indent();
                self.format_reactive_value(test);
                self.dedent();
                self.line("loop:");
                self.indent();
                self.format_reactive_block(loop_block);
                self.dedent();
                self.line(&format!("id: {}", id.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            ReactiveTerminal::For {
                init,
                test,
                update,
                loop_block,
                id,
                loc,
            } => {
                self.line("For {");
                self.indent();
                self.line("init:");
                self.indent();
                self.format_reactive_value(init);
                self.dedent();
                self.line("test:");
                self.indent();
                self.format_reactive_value(test);
                self.dedent();
                match update {
                    Some(u) => {
                        self.line("update:");
                        self.indent();
                        self.format_reactive_value(u);
                        self.dedent();
                    }
                    None => self.line("update: null"),
                }
                self.line("loop:");
                self.indent();
                self.format_reactive_block(loop_block);
                self.dedent();
                self.line(&format!("id: {}", id.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            ReactiveTerminal::ForOf {
                init,
                test,
                loop_block,
                id,
                loc,
            } => {
                self.line("ForOf {");
                self.indent();
                self.line("init:");
                self.indent();
                self.format_reactive_value(init);
                self.dedent();
                self.line("test:");
                self.indent();
                self.format_reactive_value(test);
                self.dedent();
                self.line("loop:");
                self.indent();
                self.format_reactive_block(loop_block);
                self.dedent();
                self.line(&format!("id: {}", id.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            ReactiveTerminal::ForIn {
                init,
                loop_block,
                id,
                loc,
            } => {
                self.line("ForIn {");
                self.indent();
                self.line("init:");
                self.indent();
                self.format_reactive_value(init);
                self.dedent();
                self.line("loop:");
                self.indent();
                self.format_reactive_block(loop_block);
                self.dedent();
                self.line(&format!("id: {}", id.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            ReactiveTerminal::If {
                test,
                consequent,
                alternate,
                id,
                loc,
            } => {
                self.line("If {");
                self.indent();
                self.format_place_field("test", test);
                self.line("consequent:");
                self.indent();
                self.format_reactive_block(consequent);
                self.dedent();
                match alternate {
                    Some(alt) => {
                        self.line("alternate:");
                        self.indent();
                        self.format_reactive_block(alt);
                        self.dedent();
                    }
                    None => self.line("alternate: null"),
                }
                self.line(&format!("id: {}", id.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            ReactiveTerminal::Label { block, id, loc } => {
                self.line("Label {");
                self.indent();
                self.line("block:");
                self.indent();
                self.format_reactive_block(block);
                self.dedent();
                self.line(&format!("id: {}", id.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
            ReactiveTerminal::Try {
                block,
                handler_binding,
                handler,
                id,
                loc,
            } => {
                self.line("Try {");
                self.indent();
                self.line("block:");
                self.indent();
                self.format_reactive_block(block);
                self.dedent();
                match handler_binding {
                    Some(p) => self.format_place_field("handlerBinding", p),
                    None => self.line("handlerBinding: null"),
                }
                self.line("handler:");
                self.indent();
                self.format_reactive_block(handler);
                self.dedent();
                self.line(&format!("id: {}", id.0));
                self.line(&format!("loc: {}", format_loc(loc)));
                self.dedent();
                self.line("}");
            }
        }
    }

    // =========================================================================
    // Place (with identifier deduplication) - mirrors debug_print.rs
    // =========================================================================

    pub fn format_place_field(&mut self, field_name: &str, place: &Place) {
        let is_seen = self.seen_identifiers.contains(&place.identifier);
        if is_seen {
            self.line(&format!(
                "{}: Place {{ identifier: Identifier({}), effect: {}, reactive: {}, loc: {} }}",
                field_name,
                place.identifier.0,
                place.effect,
                place.reactive,
                format_loc(&place.loc)
            ));
        } else {
            self.line(&format!("{}: Place {{", field_name));
            self.indent();
            self.line("identifier:");
            self.indent();
            self.format_identifier(place.identifier);
            self.dedent();
            self.line(&format!("effect: {}", place.effect));
            self.line(&format!("reactive: {}", place.reactive));
            self.line(&format!("loc: {}", format_loc(&place.loc)));
            self.dedent();
            self.line("}");
        }
    }

    // =========================================================================
    // Identifier (first-seen expansion) - mirrors debug_print.rs
    // =========================================================================

    fn format_identifier(&mut self, id: IdentifierId) {
        self.seen_identifiers.insert(id);
        let ident = &self.env.identifiers[id.0 as usize];
        self.line("Identifier {");
        self.indent();
        self.line(&format!("id: {}", ident.id.0));
        self.line(&format!("declarationId: {}", ident.declaration_id.0));
        match &ident.name {
            Some(name) => {
                let (kind, value) = match name {
                    IdentifierName::Named(n) => ("named", n.as_str()),
                    IdentifierName::Promoted(n) => ("promoted", n.as_str()),
                };
                self.line(&format!(
                    "name: {{ kind: \"{}\", value: \"{}\" }}",
                    kind, value
                ));
            }
            None => self.line("name: null"),
        }
        self.line(&format!(
            "mutableRange: [{}:{}]",
            ident.mutable_range.start.0, ident.mutable_range.end.0
        ));
        match ident.scope {
            Some(scope_id) => self.format_scope_field("scope", scope_id),
            None => self.line("scope: null"),
        }
        self.line(&format!("type: {}", self.format_type(ident.type_)));
        self.line(&format!("loc: {}", format_loc(&ident.loc)));
        self.dedent();
        self.line("}");
    }

    // =========================================================================
    // Scope (with deduplication) - mirrors debug_print.rs
    // =========================================================================

    pub fn format_scope_field(&mut self, field_name: &str, scope_id: ScopeId) {
        let is_seen = self.seen_scopes.contains(&scope_id);
        if is_seen {
            self.line(&format!("{}: Scope({})", field_name, scope_id.0));
        } else {
            self.seen_scopes.insert(scope_id);
            if let Some(scope) = self.env.scopes.iter().find(|s| s.id == scope_id) {
                let range_start = scope.range.start.0;
                let range_end = scope.range.end.0;
                let dependencies = scope.dependencies.clone();
                let declarations = scope.declarations.clone();
                let reassignments = scope.reassignments.clone();
                let early_return_value = scope.early_return_value.clone();
                let merged = scope.merged.clone();
                let loc = scope.loc;

                self.line(&format!("{}: Scope {{", field_name));
                self.indent();
                self.line(&format!("id: {}", scope_id.0));
                self.line(&format!("range: [{}:{}]", range_start, range_end));

                self.line("dependencies:");
                self.indent();
                for (i, dep) in dependencies.iter().enumerate() {
                    let path_str: String = dep
                        .path
                        .iter()
                        .map(|p| {
                            let prop = match &p.property {
                                react_compiler_hir::PropertyLiteral::String(s) => s.clone(),
                                react_compiler_hir::PropertyLiteral::Number(n) => {
                                    format!("{}", n.value())
                                }
                            };
                            format!(
                                "{}{}",
                                if p.optional { "?." } else { "." },
                                prop
                            )
                        })
                        .collect();
                    self.line(&format!(
                        "[{}] {{ identifier: {}, reactive: {}, path: \"{}\" }}",
                        i, dep.identifier.0, dep.reactive, path_str
                    ));
                }
                self.dedent();

                self.line("declarations:");
                self.indent();
                for (ident_id, decl) in &declarations {
                    self.line(&format!(
                        "{}: {{ identifier: {}, scope: {} }}",
                        ident_id.0, decl.identifier.0, decl.scope.0
                    ));
                }
                self.dedent();

                self.line("reassignments:");
                self.indent();
                for ident_id in &reassignments {
                    self.line(&format!("{}", ident_id.0));
                }
                self.dedent();

                if let Some(early_return) = &early_return_value {
                    self.line("earlyReturnValue:");
                    self.indent();
                    self.line(&format!("value: {}", early_return.value.0));
                    self.line(&format!("loc: {}", format_loc(&early_return.loc)));
                    self.line(&format!("label: bb{}", early_return.label.0));
                    self.dedent();
                } else {
                    self.line("earlyReturnValue: null");
                }

                let merged_str: Vec<String> =
                    merged.iter().map(|s| s.0.to_string()).collect();
                self.line(&format!("merged: [{}]", merged_str.join(", ")));
                self.line(&format!("loc: {}", format_loc(&loc)));

                self.dedent();
                self.line("}");
            } else {
                self.line(&format!("{}: Scope({})", field_name, scope_id.0));
            }
        }
    }

    // =========================================================================
    // Type - mirrors debug_print.rs
    // =========================================================================

    fn format_type(&self, type_id: react_compiler_hir::TypeId) -> String {
        if let Some(ty) = self.env.types.get(type_id.0 as usize) {
            match ty {
                Type::Primitive => "Primitive".to_string(),
                Type::Function {
                    shape_id,
                    return_type,
                    is_constructor,
                } => {
                    format!(
                        "Function {{ shapeId: {}, return: {}, isConstructor: {} }}",
                        match shape_id {
                            Some(s) => format!("\"{}\"", s),
                            None => "null".to_string(),
                        },
                        self.format_type_value(return_type),
                        is_constructor
                    )
                }
                Type::Object { shape_id } => {
                    format!(
                        "Object {{ shapeId: {} }}",
                        match shape_id {
                            Some(s) => format!("\"{}\"", s),
                            None => "null".to_string(),
                        }
                    )
                }
                Type::TypeVar { id } => format!("Type({})", id.0),
                Type::Poly => "Poly".to_string(),
                Type::Phi { operands } => {
                    let ops: Vec<String> = operands
                        .iter()
                        .map(|op| self.format_type_value(op))
                        .collect();
                    format!("Phi {{ operands: [{}] }}", ops.join(", "))
                }
                Type::Property {
                    object_type,
                    object_name,
                    property_name,
                } => {
                    let prop_str = match property_name {
                        react_compiler_hir::PropertyNameKind::Literal { value } => {
                            format!("\"{}\"", format_property_literal(value))
                        }
                        react_compiler_hir::PropertyNameKind::Computed { value } => {
                            format!("computed({})", self.format_type_value(value))
                        }
                    };
                    format!(
                        "Property {{ objectType: {}, objectName: \"{}\", propertyName: {} }}",
                        self.format_type_value(object_type),
                        object_name,
                        prop_str
                    )
                }
                Type::ObjectMethod => "ObjectMethod".to_string(),
            }
        } else {
            format!("Type({})", type_id.0)
        }
    }

    fn format_type_value(&self, ty: &Type) -> String {
        match ty {
            Type::Primitive => "Primitive".to_string(),
            Type::Function {
                shape_id,
                return_type,
                is_constructor,
            } => {
                format!(
                    "Function {{ shapeId: {}, return: {}, isConstructor: {} }}",
                    match shape_id {
                        Some(s) => format!("\"{}\"", s),
                        None => "null".to_string(),
                    },
                    self.format_type_value(return_type),
                    is_constructor
                )
            }
            Type::Object { shape_id } => {
                format!(
                    "Object {{ shapeId: {} }}",
                    match shape_id {
                        Some(s) => format!("\"{}\"", s),
                        None => "null".to_string(),
                    }
                )
            }
            Type::TypeVar { id } => format!("Type({})", id.0),
            Type::Poly => "Poly".to_string(),
            Type::Phi { operands } => {
                let ops: Vec<String> = operands
                    .iter()
                    .map(|op| self.format_type_value(op))
                    .collect();
                format!("Phi {{ operands: [{}] }}", ops.join(", "))
            }
            Type::Property {
                object_type,
                object_name,
                property_name,
            } => {
                let prop_str = match property_name {
                    react_compiler_hir::PropertyNameKind::Literal { value } => {
                        format!("\"{}\"", format_property_literal(value))
                    }
                    react_compiler_hir::PropertyNameKind::Computed { value } => {
                        format!("computed({})", self.format_type_value(value))
                    }
                };
                format!(
                    "Property {{ objectType: {}, objectName: \"{}\", propertyName: {} }}",
                    self.format_type_value(object_type),
                    object_name,
                    prop_str
                )
            }
            Type::ObjectMethod => "ObjectMethod".to_string(),
        }
    }

    // =========================================================================
    // Effect formatting - mirrors debug_print.rs
    // =========================================================================

    fn format_effect(&self, effect: &AliasingEffect) -> String {
        match effect {
            AliasingEffect::Freeze { value, reason } => {
                format!(
                    "Freeze {{ value: {}, reason: {} }}",
                    value.identifier.0,
                    format_value_reason(*reason)
                )
            }
            AliasingEffect::Mutate { value, reason } => match reason {
                Some(react_compiler_hir::MutationReason::AssignCurrentProperty) => {
                    format!(
                        "Mutate {{ value: {}, reason: AssignCurrentProperty }}",
                        value.identifier.0
                    )
                }
                None => format!("Mutate {{ value: {} }}", value.identifier.0),
            },
            AliasingEffect::MutateConditionally { value } => {
                format!("MutateConditionally {{ value: {} }}", value.identifier.0)
            }
            AliasingEffect::MutateTransitive { value } => {
                format!("MutateTransitive {{ value: {} }}", value.identifier.0)
            }
            AliasingEffect::MutateTransitiveConditionally { value } => {
                format!(
                    "MutateTransitiveConditionally {{ value: {} }}",
                    value.identifier.0
                )
            }
            AliasingEffect::Capture { from, into } => {
                format!(
                    "Capture {{ into: {}, from: {} }}",
                    into.identifier.0, from.identifier.0
                )
            }
            AliasingEffect::Alias { from, into } => {
                format!(
                    "Alias {{ into: {}, from: {} }}",
                    into.identifier.0, from.identifier.0
                )
            }
            AliasingEffect::MaybeAlias { from, into } => {
                format!(
                    "MaybeAlias {{ into: {}, from: {} }}",
                    into.identifier.0, from.identifier.0
                )
            }
            AliasingEffect::Assign { from, into } => {
                format!(
                    "Assign {{ into: {}, from: {} }}",
                    into.identifier.0, from.identifier.0
                )
            }
            AliasingEffect::Create { into, value, reason } => {
                format!(
                    "Create {{ into: {}, value: {}, reason: {} }}",
                    into.identifier.0,
                    format_value_kind(*value),
                    format_value_reason(*reason)
                )
            }
            AliasingEffect::CreateFrom { from, into } => {
                format!(
                    "CreateFrom {{ into: {}, from: {} }}",
                    into.identifier.0, from.identifier.0
                )
            }
            AliasingEffect::ImmutableCapture { from, into } => {
                format!(
                    "ImmutableCapture {{ into: {}, from: {} }}",
                    into.identifier.0, from.identifier.0
                )
            }
            AliasingEffect::Apply {
                receiver,
                function,
                mutates_function,
                args,
                into,
                ..
            } => {
                let args_str: Vec<String> = args
                    .iter()
                    .map(|a| match a {
                        PlaceOrSpreadOrHole::Hole => "hole".to_string(),
                        PlaceOrSpreadOrHole::Place(p) => p.identifier.0.to_string(),
                        PlaceOrSpreadOrHole::Spread(s) => format!("...{}", s.place.identifier.0),
                    })
                    .collect();
                format!(
                    "Apply {{ into: {}, receiver: {}, function: {}, mutatesFunction: {}, args: [{}] }}",
                    into.identifier.0,
                    receiver.identifier.0,
                    function.identifier.0,
                    mutates_function,
                    args_str.join(", ")
                )
            }
            AliasingEffect::CreateFunction {
                captures,
                function_id: _,
                into,
            } => {
                let cap_str: Vec<String> =
                    captures.iter().map(|p| p.identifier.0.to_string()).collect();
                format!(
                    "CreateFunction {{ into: {}, captures: [{}] }}",
                    into.identifier.0,
                    cap_str.join(", ")
                )
            }
            AliasingEffect::MutateFrozen { place, error } => {
                format!(
                    "MutateFrozen {{ place: {}, reason: {:?} }}",
                    place.identifier.0, error.reason
                )
            }
            AliasingEffect::MutateGlobal { place, error } => {
                format!(
                    "MutateGlobal {{ place: {}, reason: {:?} }}",
                    place.identifier.0, error.reason
                )
            }
            AliasingEffect::Impure { place, error } => {
                format!(
                    "Impure {{ place: {}, reason: {:?} }}",
                    place.identifier.0, error.reason
                )
            }
            AliasingEffect::Render { place } => {
                format!("Render {{ place: {} }}", place.identifier.0)
            }
        }
    }

    // =========================================================================
    // InstructionValue - mirrors debug_print.rs
    // =========================================================================

    pub fn format_instruction_value(&mut self, value: &InstructionValue) {
        // Delegate to the same logic as debug_print.rs
        // This is a large match that formats each instruction value kind
        format_instruction_value_impl(self, value);
    }

    // =========================================================================
    // LValue
    // =========================================================================

    fn format_lvalue(&mut self, field_name: &str, lv: &LValue) {
        self.line(&format!("{}:", field_name));
        self.indent();
        self.line(&format!("kind: {:?}", lv.kind));
        self.format_place_field("place", &lv.place);
        self.dedent();
    }

    // =========================================================================
    // Pattern
    // =========================================================================

    fn format_pattern(&mut self, pattern: &Pattern) {
        match pattern {
            Pattern::Array(arr) => {
                self.line("pattern: ArrayPattern {");
                self.indent();
                self.line("items:");
                self.indent();
                for (i, item) in arr.items.iter().enumerate() {
                    match item {
                        react_compiler_hir::ArrayPatternElement::Hole => {
                            self.line(&format!("[{}] Hole", i));
                        }
                        react_compiler_hir::ArrayPatternElement::Place(p) => {
                            self.format_place_field(&format!("[{}]", i), p);
                        }
                        react_compiler_hir::ArrayPatternElement::Spread(s) => {
                            self.line(&format!("[{}] Spread:", i));
                            self.indent();
                            self.format_place_field("place", &s.place);
                            self.dedent();
                        }
                    }
                }
                self.dedent();
                self.line(&format!("loc: {}", format_loc(&arr.loc)));
                self.dedent();
                self.line("}");
            }
            Pattern::Object(obj) => {
                self.line("pattern: ObjectPattern {");
                self.indent();
                self.line("properties:");
                self.indent();
                for (i, prop) in obj.properties.iter().enumerate() {
                    match prop {
                        react_compiler_hir::ObjectPropertyOrSpread::Property(p) => {
                            self.line(&format!("[{}] ObjectProperty {{", i));
                            self.indent();
                            self.line(&format!(
                                "key: {}",
                                format_object_property_key(&p.key)
                            ));
                            self.line(&format!("type: \"{}\"", p.property_type));
                            self.format_place_field("place", &p.place);
                            self.dedent();
                            self.line("}");
                        }
                        react_compiler_hir::ObjectPropertyOrSpread::Spread(s) => {
                            self.line(&format!("[{}] Spread:", i));
                            self.indent();
                            self.format_place_field("place", &s.place);
                            self.dedent();
                        }
                    }
                }
                self.dedent();
                self.line(&format!("loc: {}", format_loc(&obj.loc)));
                self.dedent();
                self.line("}");
            }
        }
    }

    // =========================================================================
    // Arguments
    // =========================================================================

    fn format_argument(&mut self, arg: &react_compiler_hir::PlaceOrSpread, index: usize) {
        match arg {
            react_compiler_hir::PlaceOrSpread::Place(p) => {
                self.format_place_field(&format!("[{}]", index), p);
            }
            react_compiler_hir::PlaceOrSpread::Spread(s) => {
                self.line(&format!("[{}] Spread:", index));
                self.indent();
                self.format_place_field("place", &s.place);
                self.dedent();
            }
        }
    }

    // =========================================================================
    // Errors
    // =========================================================================

    pub fn format_errors(&mut self, error: &CompilerError) {
        if error.details.is_empty() {
            self.line("Errors: []");
            return;
        }
        self.line("Errors:");
        self.indent();
        for (i, detail) in error.details.iter().enumerate() {
            self.line(&format!("[{}] {{", i));
            self.indent();
            match detail {
                CompilerErrorOrDiagnostic::Diagnostic(d) => {
                    self.line(&format!("severity: {:?}", d.severity()));
                    self.line(&format!("reason: {:?}", d.reason));
                    self.line(&format!(
                        "description: {}",
                        match &d.description {
                            Some(desc) => format!("{:?}", desc),
                            None => "null".to_string(),
                        }
                    ));
                    self.line(&format!("category: {:?}", d.category));
                    let loc = d.primary_location();
                    self.line(&format!(
                        "loc: {}",
                        match loc {
                            Some(l) => format_loc_value(l),
                            None => "null".to_string(),
                        }
                    ));
                }
                CompilerErrorOrDiagnostic::ErrorDetail(d) => {
                    self.line(&format!("severity: {:?}", d.severity()));
                    self.line(&format!("reason: {:?}", d.reason));
                    self.line(&format!(
                        "description: {}",
                        match &d.description {
                            Some(desc) => format!("{:?}", desc),
                            None => "null".to_string(),
                        }
                    ));
                    self.line(&format!("category: {:?}", d.category));
                    self.line(&format!(
                        "loc: {}",
                        match &d.loc {
                            Some(l) => format_loc_value(l),
                            None => "null".to_string(),
                        }
                    ));
                }
            }
            self.dedent();
            self.line("}");
        }
        self.dedent();
    }
}

// =============================================================================
// Entry point
// =============================================================================

/// Type alias for a function formatter callback that can print HIR functions.
/// Used to format inner functions in FunctionExpression/ObjectMethod values.
pub type HirFunctionFormatter = dyn Fn(&mut DebugPrinter, &react_compiler_hir::HirFunction);

pub fn debug_reactive_function(func: &ReactiveFunction, env: &Environment) -> String {
    debug_reactive_function_with_formatter(func, env, None)
}

pub fn debug_reactive_function_with_formatter(
    func: &ReactiveFunction,
    env: &Environment,
    hir_formatter: Option<&HirFunctionFormatter>,
) -> String {
    let mut printer = DebugPrinter::new(env);
    printer.hir_formatter = hir_formatter;
    printer.format_reactive_function(func);

    // TODO: Print outlined functions when they've been converted to reactive form

    printer.line("");
    printer.line("Environment:");
    printer.indent();
    printer.format_errors(&env.errors);
    printer.dedent();

    printer.to_string_output()
}

// =============================================================================
// Standalone helper functions
// =============================================================================

pub fn format_loc(loc: &Option<SourceLocation>) -> String {
    match loc {
        Some(l) => format_loc_value(l),
        None => "generated".to_string(),
    }
}

pub fn format_loc_value(loc: &SourceLocation) -> String {
    format!(
        "{}:{}-{}:{}",
        loc.start.line, loc.start.column, loc.end.line, loc.end.column
    )
}

fn format_primitive(prim: &react_compiler_hir::PrimitiveValue) -> String {
    match prim {
        react_compiler_hir::PrimitiveValue::Null => "null".to_string(),
        react_compiler_hir::PrimitiveValue::Undefined => "undefined".to_string(),
        react_compiler_hir::PrimitiveValue::Boolean(b) => format!("{}", b),
        react_compiler_hir::PrimitiveValue::Number(n) => {
            let v = n.value();
            if v == 0.0 && v.is_sign_negative() {
                "0".to_string()
            } else {
                format!("{}", v)
            }
        }
        react_compiler_hir::PrimitiveValue::String(s) => {
            let mut result = String::with_capacity(s.len() + 2);
            result.push('"');
            for c in s.chars() {
                match c {
                    '"' => result.push_str("\\\""),
                    '\\' => result.push_str("\\\\"),
                    '\n' => result.push_str("\\n"),
                    '\r' => result.push_str("\\r"),
                    '\t' => result.push_str("\\t"),
                    c if c.is_control() => {
                        result.push_str(&format!("\\u{{{:04x}}}", c as u32));
                    }
                    c => result.push(c),
                }
            }
            result.push('"');
            result
        }
    }
}

fn format_property_literal(prop: &react_compiler_hir::PropertyLiteral) -> String {
    match prop {
        react_compiler_hir::PropertyLiteral::String(s) => s.clone(),
        react_compiler_hir::PropertyLiteral::Number(n) => format!("{}", n.value()),
    }
}

fn format_object_property_key(key: &react_compiler_hir::ObjectPropertyKey) -> String {
    match key {
        react_compiler_hir::ObjectPropertyKey::String { name } => format!("String(\"{}\")", name),
        react_compiler_hir::ObjectPropertyKey::Identifier { name } => {
            format!("Identifier(\"{}\")", name)
        }
        react_compiler_hir::ObjectPropertyKey::Computed { name } => {
            format!("Computed({})", name.identifier.0)
        }
        react_compiler_hir::ObjectPropertyKey::Number { name } => {
            format!("Number({})", name.value())
        }
    }
}

fn format_non_local_binding(binding: &react_compiler_hir::NonLocalBinding) -> String {
    match binding {
        react_compiler_hir::NonLocalBinding::Global { name } => {
            format!("Global {{ name: \"{}\" }}", name)
        }
        react_compiler_hir::NonLocalBinding::ModuleLocal { name } => {
            format!("ModuleLocal {{ name: \"{}\" }}", name)
        }
        react_compiler_hir::NonLocalBinding::ImportDefault { name, module } => {
            format!(
                "ImportDefault {{ name: \"{}\", module: \"{}\" }}",
                name, module
            )
        }
        react_compiler_hir::NonLocalBinding::ImportNamespace { name, module } => {
            format!(
                "ImportNamespace {{ name: \"{}\", module: \"{}\" }}",
                name, module
            )
        }
        react_compiler_hir::NonLocalBinding::ImportSpecifier {
            name,
            module,
            imported,
        } => {
            format!(
                "ImportSpecifier {{ name: \"{}\", module: \"{}\", imported: \"{}\" }}",
                name, module, imported
            )
        }
    }
}

fn format_value_kind(kind: react_compiler_hir::type_config::ValueKind) -> &'static str {
    match kind {
        react_compiler_hir::type_config::ValueKind::Mutable => "mutable",
        react_compiler_hir::type_config::ValueKind::Frozen => "frozen",
        react_compiler_hir::type_config::ValueKind::Primitive => "primitive",
        react_compiler_hir::type_config::ValueKind::MaybeFrozen => "maybe-frozen",
        react_compiler_hir::type_config::ValueKind::Global => "global",
        react_compiler_hir::type_config::ValueKind::Context => "context",
    }
}

fn format_value_reason(
    reason: react_compiler_hir::type_config::ValueReason,
) -> &'static str {
    match reason {
        react_compiler_hir::type_config::ValueReason::KnownReturnSignature => {
            "known-return-signature"
        }
        react_compiler_hir::type_config::ValueReason::State => "state",
        react_compiler_hir::type_config::ValueReason::ReducerState => "reducer-state",
        react_compiler_hir::type_config::ValueReason::Context => "context",
        react_compiler_hir::type_config::ValueReason::Effect => "effect",
        react_compiler_hir::type_config::ValueReason::HookCaptured => "hook-captured",
        react_compiler_hir::type_config::ValueReason::HookReturn => "hook-return",
        react_compiler_hir::type_config::ValueReason::Global => "global",
        react_compiler_hir::type_config::ValueReason::JsxCaptured => "jsx-captured",
        react_compiler_hir::type_config::ValueReason::StoreLocal => "store-local",
        react_compiler_hir::type_config::ValueReason::ReactiveFunctionArgument => {
            "reactive-function-argument"
        }
        react_compiler_hir::type_config::ValueReason::Other => "other",
    }
}

// =============================================================================
// InstructionValue formatting (extracted to avoid deep nesting)
// =============================================================================

fn format_instruction_value_impl(printer: &mut DebugPrinter, value: &InstructionValue) {
    match value {
        InstructionValue::ArrayExpression { elements, loc } => {
            printer.line("ArrayExpression {");
            printer.indent();
            printer.line("elements:");
            printer.indent();
            for (i, elem) in elements.iter().enumerate() {
                match elem {
                    react_compiler_hir::ArrayElement::Place(p) => {
                        printer.format_place_field(&format!("[{}]", i), p);
                    }
                    react_compiler_hir::ArrayElement::Hole => {
                        printer.line(&format!("[{}] Hole", i));
                    }
                    react_compiler_hir::ArrayElement::Spread(s) => {
                        printer.line(&format!("[{}] Spread:", i));
                        printer.indent();
                        printer.format_place_field("place", &s.place);
                        printer.dedent();
                    }
                }
            }
            printer.dedent();
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::ObjectExpression { properties, loc } => {
            printer.line("ObjectExpression {");
            printer.indent();
            printer.line("properties:");
            printer.indent();
            for (i, prop) in properties.iter().enumerate() {
                match prop {
                    react_compiler_hir::ObjectPropertyOrSpread::Property(p) => {
                        printer.line(&format!("[{}] ObjectProperty {{", i));
                        printer.indent();
                        printer.line(&format!("key: {}", format_object_property_key(&p.key)));
                        printer.line(&format!("type: \"{}\"", p.property_type));
                        printer.format_place_field("place", &p.place);
                        printer.dedent();
                        printer.line("}");
                    }
                    react_compiler_hir::ObjectPropertyOrSpread::Spread(s) => {
                        printer.line(&format!("[{}] Spread:", i));
                        printer.indent();
                        printer.format_place_field("place", &s.place);
                        printer.dedent();
                    }
                }
            }
            printer.dedent();
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::UnaryExpression { operator, value: val, loc } => {
            printer.line("UnaryExpression {");
            printer.indent();
            printer.line(&format!("operator: \"{}\"", operator));
            printer.format_place_field("value", val);
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::BinaryExpression { operator, left, right, loc } => {
            printer.line("BinaryExpression {");
            printer.indent();
            printer.line(&format!("operator: \"{}\"", operator));
            printer.format_place_field("left", left);
            printer.format_place_field("right", right);
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::NewExpression { callee, args, loc } => {
            printer.line("NewExpression {");
            printer.indent();
            printer.format_place_field("callee", callee);
            printer.line("args:");
            printer.indent();
            for (i, arg) in args.iter().enumerate() {
                printer.format_argument(arg, i);
            }
            printer.dedent();
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::CallExpression { callee, args, loc } => {
            printer.line("CallExpression {");
            printer.indent();
            printer.format_place_field("callee", callee);
            printer.line("args:");
            printer.indent();
            for (i, arg) in args.iter().enumerate() {
                printer.format_argument(arg, i);
            }
            printer.dedent();
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::MethodCall { receiver, property, args, loc } => {
            printer.line("MethodCall {");
            printer.indent();
            printer.format_place_field("receiver", receiver);
            printer.format_place_field("property", property);
            printer.line("args:");
            printer.indent();
            for (i, arg) in args.iter().enumerate() {
                printer.format_argument(arg, i);
            }
            printer.dedent();
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::JSXText { value: val, loc } => {
            printer.line(&format!("JSXText {{ value: {:?}, loc: {} }}", val, format_loc(loc)));
        }
        InstructionValue::Primitive { value: prim, loc } => {
            printer.line(&format!("Primitive {{ value: {}, loc: {} }}", format_primitive(prim), format_loc(loc)));
        }
        InstructionValue::TypeCastExpression { value: val, type_, type_annotation_name, type_annotation_kind, type_annotation: _, loc } => {
            printer.line("TypeCastExpression {");
            printer.indent();
            printer.format_place_field("value", val);
            printer.line(&format!("type: {}", printer.format_type_value(type_)));
            if let Some(annotation_name) = type_annotation_name {
                printer.line(&format!("typeAnnotation: {}", annotation_name));
            }
            if let Some(annotation_kind) = type_annotation_kind {
                printer.line(&format!("typeAnnotationKind: \"{}\"", annotation_kind));
            }
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::JsxExpression { tag, props, children, loc, opening_loc, closing_loc } => {
            printer.line("JsxExpression {");
            printer.indent();
            match tag {
                react_compiler_hir::JsxTag::Place(p) => printer.format_place_field("tag", p),
                react_compiler_hir::JsxTag::Builtin(b) => printer.line(&format!("tag: BuiltinTag(\"{}\")", b.name)),
            }
            printer.line("props:");
            printer.indent();
            for (i, prop) in props.iter().enumerate() {
                match prop {
                    react_compiler_hir::JsxAttribute::Attribute { name, place } => {
                        printer.line(&format!("[{}] JsxAttribute {{", i));
                        printer.indent();
                        printer.line(&format!("name: \"{}\"", name));
                        printer.format_place_field("place", place);
                        printer.dedent();
                        printer.line("}");
                    }
                    react_compiler_hir::JsxAttribute::SpreadAttribute { argument } => {
                        printer.line(&format!("[{}] JsxSpreadAttribute:", i));
                        printer.indent();
                        printer.format_place_field("argument", argument);
                        printer.dedent();
                    }
                }
            }
            printer.dedent();
            match children {
                Some(c) => {
                    printer.line("children:");
                    printer.indent();
                    for (i, child) in c.iter().enumerate() {
                        printer.format_place_field(&format!("[{}]", i), child);
                    }
                    printer.dedent();
                }
                None => printer.line("children: null"),
            }
            printer.line(&format!("openingLoc: {}", format_loc(opening_loc)));
            printer.line(&format!("closingLoc: {}", format_loc(closing_loc)));
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::JsxFragment { children, loc } => {
            printer.line("JsxFragment {");
            printer.indent();
            printer.line("children:");
            printer.indent();
            for (i, child) in children.iter().enumerate() {
                printer.format_place_field(&format!("[{}]", i), child);
            }
            printer.dedent();
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::UnsupportedNode { node_type, loc } => {
            match node_type {
                Some(t) => printer.line(&format!("UnsupportedNode {{ type: {:?}, loc: {} }}", t, format_loc(loc))),
                None => printer.line(&format!("UnsupportedNode {{ loc: {} }}", format_loc(loc))),
            }
        }
        InstructionValue::LoadLocal { place, loc } => {
            printer.line("LoadLocal {");
            printer.indent();
            printer.format_place_field("place", place);
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::DeclareLocal { lvalue, type_annotation, loc } => {
            printer.line("DeclareLocal {");
            printer.indent();
            printer.format_lvalue("lvalue", lvalue);
            printer.line(&format!("type: {}", match type_annotation { Some(t) => t.clone(), None => "null".to_string() }));
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::DeclareContext { lvalue, loc } => {
            printer.line("DeclareContext {");
            printer.indent();
            printer.line("lvalue:");
            printer.indent();
            printer.line(&format!("kind: {:?}", lvalue.kind));
            printer.format_place_field("place", &lvalue.place);
            printer.dedent();
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::StoreLocal { lvalue, value: val, type_annotation, loc } => {
            printer.line("StoreLocal {");
            printer.indent();
            printer.format_lvalue("lvalue", lvalue);
            printer.format_place_field("value", val);
            printer.line(&format!("type: {}", match type_annotation { Some(t) => t.clone(), None => "null".to_string() }));
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::LoadContext { place, loc } => {
            printer.line("LoadContext {");
            printer.indent();
            printer.format_place_field("place", place);
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::StoreContext { lvalue, value: val, loc } => {
            printer.line("StoreContext {");
            printer.indent();
            printer.line("lvalue:");
            printer.indent();
            printer.line(&format!("kind: {:?}", lvalue.kind));
            printer.format_place_field("place", &lvalue.place);
            printer.dedent();
            printer.format_place_field("value", val);
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::Destructure { lvalue, value: val, loc } => {
            printer.line("Destructure {");
            printer.indent();
            printer.line("lvalue:");
            printer.indent();
            printer.line(&format!("kind: {:?}", lvalue.kind));
            printer.format_pattern(&lvalue.pattern);
            printer.dedent();
            printer.format_place_field("value", val);
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::PropertyLoad { object, property, loc } => {
            printer.line("PropertyLoad {");
            printer.indent();
            printer.format_place_field("object", object);
            printer.line(&format!("property: \"{}\"", format_property_literal(property)));
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::PropertyStore { object, property, value: val, loc } => {
            printer.line("PropertyStore {");
            printer.indent();
            printer.format_place_field("object", object);
            printer.line(&format!("property: \"{}\"", format_property_literal(property)));
            printer.format_place_field("value", val);
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::PropertyDelete { object, property, loc } => {
            printer.line("PropertyDelete {");
            printer.indent();
            printer.format_place_field("object", object);
            printer.line(&format!("property: \"{}\"", format_property_literal(property)));
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::ComputedLoad { object, property, loc } => {
            printer.line("ComputedLoad {");
            printer.indent();
            printer.format_place_field("object", object);
            printer.format_place_field("property", property);
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::ComputedStore { object, property, value: val, loc } => {
            printer.line("ComputedStore {");
            printer.indent();
            printer.format_place_field("object", object);
            printer.format_place_field("property", property);
            printer.format_place_field("value", val);
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::ComputedDelete { object, property, loc } => {
            printer.line("ComputedDelete {");
            printer.indent();
            printer.format_place_field("object", object);
            printer.format_place_field("property", property);
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::LoadGlobal { binding, loc } => {
            printer.line("LoadGlobal {");
            printer.indent();
            printer.line(&format!("binding: {}", format_non_local_binding(binding)));
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::StoreGlobal { name, value: val, loc } => {
            printer.line("StoreGlobal {");
            printer.indent();
            printer.line(&format!("name: \"{}\"", name));
            printer.format_place_field("value", val);
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::FunctionExpression { name, name_hint, lowered_func, expr_type, loc } => {
            printer.line("FunctionExpression {");
            printer.indent();
            printer.line(&format!("name: {}", match name { Some(n) => format!("\"{}\"", n), None => "null".to_string() }));
            printer.line(&format!("nameHint: {}", match name_hint { Some(h) => format!("\"{}\"", h), None => "null".to_string() }));
            printer.line(&format!("type: \"{:?}\"", expr_type));
            printer.line("loweredFunc:");
            let inner_func = &printer.env.functions[lowered_func.func.0 as usize];
            if let Some(formatter) = printer.hir_formatter {
                formatter(printer, inner_func);
            } else {
                printer.line(&format!("  <function {}>", lowered_func.func.0));
            }
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::ObjectMethod { loc, lowered_func } => {
            printer.line("ObjectMethod {");
            printer.indent();
            printer.line("loweredFunc:");
            let inner_func = &printer.env.functions[lowered_func.func.0 as usize];
            if let Some(formatter) = printer.hir_formatter {
                formatter(printer, inner_func);
            } else {
                printer.line(&format!("  <function {}>", lowered_func.func.0));
            }
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::TaggedTemplateExpression { tag, value: val, loc } => {
            printer.line("TaggedTemplateExpression {");
            printer.indent();
            printer.format_place_field("tag", tag);
            printer.line(&format!("raw: {:?}", val.raw));
            printer.line(&format!("cooked: {}", match &val.cooked { Some(c) => format!("{:?}", c), None => "undefined".to_string() }));
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::TemplateLiteral { subexprs, quasis, loc } => {
            printer.line("TemplateLiteral {");
            printer.indent();
            printer.line("subexprs:");
            printer.indent();
            for (i, sub) in subexprs.iter().enumerate() {
                printer.format_place_field(&format!("[{}]", i), sub);
            }
            printer.dedent();
            printer.line("quasis:");
            printer.indent();
            for (i, q) in quasis.iter().enumerate() {
                printer.line(&format!("[{}] {{ raw: {:?}, cooked: {} }}", i, q.raw, match &q.cooked { Some(c) => format!("{:?}", c), None => "undefined".to_string() }));
            }
            printer.dedent();
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::RegExpLiteral { pattern, flags, loc } => {
            printer.line(&format!("RegExpLiteral {{ pattern: \"{}\", flags: \"{}\", loc: {} }}", pattern, flags, format_loc(loc)));
        }
        InstructionValue::MetaProperty { meta, property, loc } => {
            printer.line(&format!("MetaProperty {{ meta: \"{}\", property: \"{}\", loc: {} }}", meta, property, format_loc(loc)));
        }
        InstructionValue::Await { value: val, loc } => {
            printer.line("Await {");
            printer.indent();
            printer.format_place_field("value", val);
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::GetIterator { collection, loc } => {
            printer.line("GetIterator {");
            printer.indent();
            printer.format_place_field("collection", collection);
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::IteratorNext { iterator, collection, loc } => {
            printer.line("IteratorNext {");
            printer.indent();
            printer.format_place_field("iterator", iterator);
            printer.format_place_field("collection", collection);
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::NextPropertyOf { value: val, loc } => {
            printer.line("NextPropertyOf {");
            printer.indent();
            printer.format_place_field("value", val);
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::Debugger { loc } => {
            printer.line(&format!("Debugger {{ loc: {} }}", format_loc(loc)));
        }
        InstructionValue::PostfixUpdate { lvalue, operation, value: val, loc } => {
            printer.line("PostfixUpdate {");
            printer.indent();
            printer.format_place_field("lvalue", lvalue);
            printer.line(&format!("operation: \"{}\"", operation));
            printer.format_place_field("value", val);
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::PrefixUpdate { lvalue, operation, value: val, loc } => {
            printer.line("PrefixUpdate {");
            printer.indent();
            printer.format_place_field("lvalue", lvalue);
            printer.line(&format!("operation: \"{}\"", operation));
            printer.format_place_field("value", val);
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::StartMemoize { manual_memo_id, deps, deps_loc: _, loc } => {
            printer.line("StartMemoize {");
            printer.indent();
            printer.line(&format!("manualMemoId: {}", manual_memo_id));
            match deps {
                Some(d) => {
                    printer.line("deps:");
                    printer.indent();
                    for (i, dep) in d.iter().enumerate() {
                        let root_str = match &dep.root {
                            react_compiler_hir::ManualMemoDependencyRoot::Global { identifier_name } => {
                                format!("Global(\"{}\")", identifier_name)
                            }
                            react_compiler_hir::ManualMemoDependencyRoot::NamedLocal { value: val, constant } => {
                                format!("NamedLocal({}, constant={})", val.identifier.0, constant)
                            }
                        };
                        let path_str: String = dep.path.iter().map(|p| {
                            format!("{}.{}", if p.optional { "?" } else { "" }, format_property_literal(&p.property))
                        }).collect();
                        printer.line(&format!("[{}] {}{}", i, root_str, path_str));
                    }
                    printer.dedent();
                }
                None => printer.line("deps: null"),
            }
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
        InstructionValue::FinishMemoize { manual_memo_id, decl, pruned, loc } => {
            printer.line("FinishMemoize {");
            printer.indent();
            printer.line(&format!("manualMemoId: {}", manual_memo_id));
            printer.format_place_field("decl", decl);
            printer.line(&format!("pruned: {}", pruned));
            printer.line(&format!("loc: {}", format_loc(loc)));
            printer.dedent();
            printer.line("}");
        }
    }
}
