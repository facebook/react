/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use oxc_ast::ast as oxc;
use oxc_span::Span;
use react_compiler_ast::{
    common::{BaseNode, Comment, CommentData, Position, SourceLocation},
    declarations::*,
    expressions::*,
    jsx::*,
    literals::*,
    operators::*,
    patterns::*,
    statements::*,
    File, Program, SourceType,
};

/// Converts an OXC AST to the React compiler's Babel-compatible AST.
pub fn convert_program(program: &oxc::Program, source_text: &str) -> File {
    let ctx = ConvertCtx::new(source_text);
    let base = ctx.make_base_node(program.span);

    let mut body = Vec::new();
    for stmt in &program.body {
        body.push(ctx.convert_statement(stmt));
    }

    let directives = program
        .directives
        .iter()
        .map(|d| ctx.convert_directive(d))
        .collect();

    let source_type = match program.source_type.is_module() {
        true => SourceType::Module,
        false => SourceType::Script,
    };

    // Convert OXC comments
    let comments = ctx.convert_comments(&program.comments);

    File {
        base: ctx.make_base_node(program.span),
        program: Program {
            base,
            body,
            directives,
            source_type,
            interpreter: None,
            source_file: None,
        },
        comments,
        errors: vec![],
    }
}

struct ConvertCtx<'a> {
    source_text: &'a str,
    line_offsets: Vec<u32>,
}

impl<'a> ConvertCtx<'a> {
    fn new(source_text: &'a str) -> Self {
        let mut line_offsets = vec![0];
        for (i, ch) in source_text.char_indices() {
            if ch == '\n' {
                line_offsets.push((i + 1) as u32);
            }
        }
        Self {
            source_text,
            line_offsets,
        }
    }

    fn make_base_node(&self, span: Span) -> BaseNode {
        BaseNode {
            node_type: None,
            start: Some(span.start),
            end: Some(span.end),
            loc: Some(self.source_location(span)),
            range: None,
            extra: None,
            leading_comments: None,
            inner_comments: None,
            trailing_comments: None,
        }
    }

    fn position(&self, offset: u32) -> Position {
        let line_idx = match self.line_offsets.binary_search(&offset) {
            Ok(idx) => idx,
            Err(idx) => idx.saturating_sub(1),
        };
        let line_start = self.line_offsets[line_idx];
        Position {
            line: (line_idx + 1) as u32,
            column: offset - line_start,
            index: None,
        }
    }

    fn source_location(&self, span: Span) -> SourceLocation {
        SourceLocation {
            start: self.position(span.start),
            end: self.position(span.end),
            filename: None,
            identifier_name: None,
        }
    }

    fn convert_comments(&self, comments: &oxc::Comment) -> Vec<Comment> {
        comments
            .iter()
            .map(|(kind, span)| {
                let base = self.make_base_node(*span);
                let value = &self.source_text[span.start as usize..span.end as usize];
                let comment_data = CommentData {
                    value: value.to_string(),
                    start: base.start,
                    end: base.end,
                    loc: base.loc.clone(),
                };
                match kind {
                    oxc::CommentKind::Line => Comment::CommentLine(comment_data),
                    oxc::CommentKind::Block => Comment::CommentBlock(comment_data),
                }
            })
            .collect()
    }

    fn convert_directive(&self, directive: &oxc::Directive) -> Directive {
        let base = self.make_base_node(directive.span);
        Directive {
            base,
            value: DirectiveLiteral {
                base: self.make_base_node(directive.expression.span),
                value: directive.expression.value.to_string(),
            },
        }
    }

    fn convert_statement(&self, stmt: &oxc::Statement) -> Statement {
        match stmt {
            oxc::Statement::BlockStatement(s) => {
                Statement::BlockStatement(self.convert_block_statement(s))
            }
            oxc::Statement::ReturnStatement(s) => {
                Statement::ReturnStatement(self.convert_return_statement(s))
            }
            oxc::Statement::IfStatement(s) => {
                Statement::IfStatement(self.convert_if_statement(s))
            }
            oxc::Statement::ForStatement(s) => {
                Statement::ForStatement(self.convert_for_statement(s))
            }
            oxc::Statement::WhileStatement(s) => {
                Statement::WhileStatement(self.convert_while_statement(s))
            }
            oxc::Statement::DoWhileStatement(s) => {
                Statement::DoWhileStatement(self.convert_do_while_statement(s))
            }
            oxc::Statement::ForInStatement(s) => {
                Statement::ForInStatement(self.convert_for_in_statement(s))
            }
            oxc::Statement::ForOfStatement(s) => {
                Statement::ForOfStatement(self.convert_for_of_statement(s))
            }
            oxc::Statement::SwitchStatement(s) => {
                Statement::SwitchStatement(self.convert_switch_statement(s))
            }
            oxc::Statement::ThrowStatement(s) => {
                Statement::ThrowStatement(self.convert_throw_statement(s))
            }
            oxc::Statement::TryStatement(s) => {
                Statement::TryStatement(self.convert_try_statement(s))
            }
            oxc::Statement::BreakStatement(s) => {
                Statement::BreakStatement(self.convert_break_statement(s))
            }
            oxc::Statement::ContinueStatement(s) => {
                Statement::ContinueStatement(self.convert_continue_statement(s))
            }
            oxc::Statement::LabeledStatement(s) => {
                Statement::LabeledStatement(self.convert_labeled_statement(s))
            }
            oxc::Statement::ExpressionStatement(s) => {
                Statement::ExpressionStatement(self.convert_expression_statement(s))
            }
            oxc::Statement::EmptyStatement(s) => {
                Statement::EmptyStatement(EmptyStatement {
                    base: self.make_base_node(s.span),
                })
            }
            oxc::Statement::DebuggerStatement(s) => {
                Statement::DebuggerStatement(DebuggerStatement {
                    base: self.make_base_node(s.span),
                })
            }
            oxc::Statement::WithStatement(s) => {
                Statement::WithStatement(self.convert_with_statement(s))
            }
            oxc::Statement::VariableDeclaration(v) => {
                Statement::VariableDeclaration(self.convert_variable_declaration(v))
            }
            oxc::Statement::FunctionDeclaration(f) => {
                Statement::FunctionDeclaration(self.convert_function_declaration(f))
            }
            oxc::Statement::ClassDeclaration(c) => {
                Statement::ClassDeclaration(self.convert_class_declaration(c))
            }
            oxc::Statement::ModuleDeclaration(m) => self.convert_module_declaration(m),
            oxc::Statement::TSTypeAliasDeclaration(t) => {
                Statement::TSTypeAliasDeclaration(self.convert_ts_type_alias_declaration(t))
            }
            oxc::Statement::TSInterfaceDeclaration(t) => {
                Statement::TSInterfaceDeclaration(self.convert_ts_interface_declaration(t))
            }
            oxc::Statement::TSEnumDeclaration(t) => {
                Statement::TSEnumDeclaration(self.convert_ts_enum_declaration(t))
            }
            oxc::Statement::TSModuleDeclaration(t) => {
                Statement::TSModuleDeclaration(self.convert_ts_module_declaration(t))
            }
            oxc::Statement::TSImportEqualsDeclaration(_) => {
                // Pass through as opaque JSON for now
                todo!("TSImportEqualsDeclaration")
            }
        }
    }

    fn convert_block_statement(&self, block: &oxc::BlockStatement) -> BlockStatement {
        let base = self.make_base_node(block.span);
        let body = block
            .body
            .iter()
            .map(|s| self.convert_statement(s))
            .collect();
        let directives = block
            .directives
            .iter()
            .map(|d| self.convert_directive(d))
            .collect();
        BlockStatement {
            base,
            body,
            directives,
        }
    }

    fn convert_return_statement(&self, ret: &oxc::ReturnStatement) -> ReturnStatement {
        ReturnStatement {
            base: self.make_base_node(ret.span),
            argument: ret.argument.as_ref().map(|e| Box::new(self.convert_expression(e))),
        }
    }

    fn convert_if_statement(&self, if_stmt: &oxc::IfStatement) -> IfStatement {
        IfStatement {
            base: self.make_base_node(if_stmt.span),
            test: Box::new(self.convert_expression(&if_stmt.test)),
            consequent: Box::new(self.convert_statement(&if_stmt.consequent)),
            alternate: if_stmt
                .alternate
                .as_ref()
                .map(|a| Box::new(self.convert_statement(a))),
        }
    }

    fn convert_for_statement(&self, for_stmt: &oxc::ForStatement) -> ForStatement {
        ForStatement {
            base: self.make_base_node(for_stmt.span),
            init: for_stmt.init.as_ref().map(|init| {
                Box::new(match init {
                    oxc::ForStatementInit::VariableDeclaration(v) => {
                        ForInit::VariableDeclaration(self.convert_variable_declaration(v))
                    }
                    oxc::ForStatementInit::BooleanLiteral(e)
                    | oxc::ForStatementInit::NullLiteral(e)
                    | oxc::ForStatementInit::NumericLiteral(e)
                    | oxc::ForStatementInit::BigIntLiteral(e)
                    | oxc::ForStatementInit::RegExpLiteral(e)
                    | oxc::ForStatementInit::StringLiteral(e)
                    | oxc::ForStatementInit::TemplateLiteral(e)
                    | oxc::ForStatementInit::Identifier(e)
                    | oxc::ForStatementInit::MetaProperty(e)
                    | oxc::ForStatementInit::Super(e)
                    | oxc::ForStatementInit::ArrayExpression(e)
                    | oxc::ForStatementInit::ArrowFunctionExpression(e)
                    | oxc::ForStatementInit::AssignmentExpression(e)
                    | oxc::ForStatementInit::AwaitExpression(e)
                    | oxc::ForStatementInit::BinaryExpression(e)
                    | oxc::ForStatementInit::CallExpression(e)
                    | oxc::ForStatementInit::ChainExpression(e)
                    | oxc::ForStatementInit::ClassExpression(e)
                    | oxc::ForStatementInit::ConditionalExpression(e)
                    | oxc::ForStatementInit::FunctionExpression(e)
                    | oxc::ForStatementInit::ImportExpression(e)
                    | oxc::ForStatementInit::LogicalExpression(e)
                    | oxc::ForStatementInit::NewExpression(e)
                    | oxc::ForStatementInit::ObjectExpression(e)
                    | oxc::ForStatementInit::ParenthesizedExpression(e)
                    | oxc::ForStatementInit::SequenceExpression(e)
                    | oxc::ForStatementInit::TaggedTemplateExpression(e)
                    | oxc::ForStatementInit::ThisExpression(e)
                    | oxc::ForStatementInit::UnaryExpression(e)
                    | oxc::ForStatementInit::UpdateExpression(e)
                    | oxc::ForStatementInit::YieldExpression(e)
                    | oxc::ForStatementInit::PrivateInExpression(e)
                    | oxc::ForStatementInit::JSXElement(e)
                    | oxc::ForStatementInit::JSXFragment(e)
                    | oxc::ForStatementInit::TSAsExpression(e)
                    | oxc::ForStatementInit::TSSatisfiesExpression(e)
                    | oxc::ForStatementInit::TSTypeAssertion(e)
                    | oxc::ForStatementInit::TSNonNullExpression(e)
                    | oxc::ForStatementInit::TSInstantiationExpression(e)
                    | oxc::ForStatementInit::ComputedMemberExpression(e)
                    | oxc::ForStatementInit::StaticMemberExpression(e)
                    | oxc::ForStatementInit::PrivateFieldExpression(e) => {
                        ForInit::Expression(Box::new(self.convert_expression(e)))
                    }
                })
            }),
            test: for_stmt
                .test
                .as_ref()
                .map(|t| Box::new(self.convert_expression(t))),
            update: for_stmt
                .update
                .as_ref()
                .map(|u| Box::new(self.convert_expression(u))),
            body: Box::new(self.convert_statement(&for_stmt.body)),
        }
    }

    fn convert_while_statement(&self, while_stmt: &oxc::WhileStatement) -> WhileStatement {
        WhileStatement {
            base: self.make_base_node(while_stmt.span),
            test: Box::new(self.convert_expression(&while_stmt.test)),
            body: Box::new(self.convert_statement(&while_stmt.body)),
        }
    }

    fn convert_do_while_statement(&self, do_while: &oxc::DoWhileStatement) -> DoWhileStatement {
        DoWhileStatement {
            base: self.make_base_node(do_while.span),
            test: Box::new(self.convert_expression(&do_while.test)),
            body: Box::new(self.convert_statement(&do_while.body)),
        }
    }

    fn convert_for_in_statement(&self, for_in: &oxc::ForInStatement) -> ForInStatement {
        ForInStatement {
            base: self.make_base_node(for_in.span),
            left: Box::new(self.convert_for_in_of_left(&for_in.left)),
            right: Box::new(self.convert_expression(&for_in.right)),
            body: Box::new(self.convert_statement(&for_in.body)),
        }
    }

    fn convert_for_of_statement(&self, for_of: &oxc::ForOfStatement) -> ForOfStatement {
        ForOfStatement {
            base: self.make_base_node(for_of.span),
            left: Box::new(self.convert_for_in_of_left(&for_of.left)),
            right: Box::new(self.convert_expression(&for_of.right)),
            body: Box::new(self.convert_statement(&for_of.body)),
            is_await: for_of.r#await,
        }
    }

    fn convert_for_in_of_left(&self, left: &oxc::ForStatementLeft) -> ForInOfLeft {
        match left {
            oxc::ForStatementLeft::VariableDeclaration(v) => {
                ForInOfLeft::VariableDeclaration(self.convert_variable_declaration(v))
            }
            oxc::ForStatementLeft::AssignmentTargetIdentifier(i) => {
                ForInOfLeft::Pattern(Box::new(PatternLike::Identifier(Identifier {
                    base: self.make_base_node(i.span),
                    name: i.name.to_string(),
                    type_annotation: None,
                    optional: None,
                    decorators: None,
                })))
            }
            oxc::ForStatementLeft::ArrayAssignmentTarget(a) => {
                ForInOfLeft::Pattern(Box::new(self.convert_array_assignment_target(a)))
            }
            oxc::ForStatementLeft::ObjectAssignmentTarget(o) => {
                ForInOfLeft::Pattern(Box::new(self.convert_object_assignment_target(o)))
            }
            oxc::ForStatementLeft::ComputedMemberExpression(m)
            | oxc::ForStatementLeft::StaticMemberExpression(m)
            | oxc::ForStatementLeft::PrivateFieldExpression(m) => {
                let expr = self.convert_expression(m);
                if let Expression::MemberExpression(mem) = expr {
                    ForInOfLeft::Pattern(Box::new(PatternLike::MemberExpression(mem)))
                } else {
                    panic!("Expected MemberExpression");
                }
            }
            oxc::ForStatementLeft::TSAsExpression(_)
            | oxc::ForStatementLeft::TSSatisfiesExpression(_)
            | oxc::ForStatementLeft::TSNonNullExpression(_)
            | oxc::ForStatementLeft::TSTypeAssertion(_)
            | oxc::ForStatementLeft::TSInstantiationExpression(_) => {
                todo!("TypeScript expression in for-in/of left")
            }
        }
    }

    fn convert_switch_statement(&self, switch: &oxc::SwitchStatement) -> SwitchStatement {
        SwitchStatement {
            base: self.make_base_node(switch.span),
            discriminant: Box::new(self.convert_expression(&switch.discriminant)),
            cases: switch
                .cases
                .iter()
                .map(|c| self.convert_switch_case(c))
                .collect(),
        }
    }

    fn convert_switch_case(&self, case: &oxc::SwitchCase) -> SwitchCase {
        SwitchCase {
            base: self.make_base_node(case.span),
            test: case
                .test
                .as_ref()
                .map(|t| Box::new(self.convert_expression(t))),
            consequent: case
                .consequent
                .iter()
                .map(|s| self.convert_statement(s))
                .collect(),
        }
    }

    fn convert_throw_statement(&self, throw: &oxc::ThrowStatement) -> ThrowStatement {
        ThrowStatement {
            base: self.make_base_node(throw.span),
            argument: Box::new(self.convert_expression(&throw.argument)),
        }
    }

    fn convert_try_statement(&self, try_stmt: &oxc::TryStatement) -> TryStatement {
        TryStatement {
            base: self.make_base_node(try_stmt.span),
            block: self.convert_block_statement(&try_stmt.block),
            handler: try_stmt
                .handler
                .as_ref()
                .map(|h| self.convert_catch_clause(h)),
            finalizer: try_stmt
                .finalizer
                .as_ref()
                .map(|f| self.convert_block_statement(f)),
        }
    }

    fn convert_catch_clause(&self, catch: &oxc::CatchClause) -> CatchClause {
        CatchClause {
            base: self.make_base_node(catch.span),
            param: catch
                .param
                .as_ref()
                .map(|p| self.convert_binding_pattern(&p.pattern)),
            body: self.convert_block_statement(&catch.body),
        }
    }

    fn convert_break_statement(&self, brk: &oxc::BreakStatement) -> BreakStatement {
        BreakStatement {
            base: self.make_base_node(brk.span),
            label: brk
                .label
                .as_ref()
                .map(|l| self.convert_identifier_reference(l)),
        }
    }

    fn convert_continue_statement(&self, cont: &oxc::ContinueStatement) -> ContinueStatement {
        ContinueStatement {
            base: self.make_base_node(cont.span),
            label: cont
                .label
                .as_ref()
                .map(|l| self.convert_identifier_reference(l)),
        }
    }

    fn convert_labeled_statement(&self, labeled: &oxc::LabeledStatement) -> LabeledStatement {
        LabeledStatement {
            base: self.make_base_node(labeled.span),
            label: self.convert_identifier_name(&labeled.label),
            body: Box::new(self.convert_statement(&labeled.body)),
        }
    }

    fn convert_expression_statement(
        &self,
        expr_stmt: &oxc::ExpressionStatement,
    ) -> ExpressionStatement {
        ExpressionStatement {
            base: self.make_base_node(expr_stmt.span),
            expression: Box::new(self.convert_expression(&expr_stmt.expression)),
        }
    }

    fn convert_with_statement(&self, with: &oxc::WithStatement) -> WithStatement {
        WithStatement {
            base: self.make_base_node(with.span),
            object: Box::new(self.convert_expression(&with.object)),
            body: Box::new(self.convert_statement(&with.body)),
        }
    }

    fn convert_variable_declaration(&self, var: &oxc::VariableDeclaration) -> VariableDeclaration {
        VariableDeclaration {
            base: self.make_base_node(var.span),
            declarations: var
                .declarations
                .iter()
                .map(|d| self.convert_variable_declarator(d))
                .collect(),
            kind: match var.kind {
                oxc::VariableDeclarationKind::Var => VariableDeclarationKind::Var,
                oxc::VariableDeclarationKind::Let => VariableDeclarationKind::Let,
                oxc::VariableDeclarationKind::Const => VariableDeclarationKind::Const,
                oxc::VariableDeclarationKind::Using => VariableDeclarationKind::Using,
                oxc::VariableDeclarationKind::AwaitUsing => {
                    // Map to Using for now
                    VariableDeclarationKind::Using
                }
            },
            declare: if var.declare { Some(true) } else { None },
        }
    }

    fn convert_variable_declarator(&self, declarator: &oxc::VariableDeclarator) -> VariableDeclarator {
        VariableDeclarator {
            base: self.make_base_node(declarator.span),
            id: self.convert_binding_pattern(&declarator.id),
            init: declarator
                .init
                .as_ref()
                .map(|i| Box::new(self.convert_expression(i))),
            definite: if declarator.definite { Some(true) } else { None },
        }
    }

    fn convert_function_declaration(&self, func: &oxc::Function) -> FunctionDeclaration {
        FunctionDeclaration {
            base: self.make_base_node(func.span),
            id: func.id.as_ref().map(|id| self.convert_binding_identifier(id)),
            params: func
                .params
                .items
                .iter()
                .map(|p| self.convert_formal_parameter(p))
                .collect(),
            body: self.convert_function_body(func.body.as_ref().unwrap()),
            generator: func.generator,
            is_async: func.r#async,
            declare: if func.declare { Some(true) } else { None },
            return_type: func.return_type.as_ref().map(|t| {
                Box::new(serde_json::to_value(t).unwrap_or(serde_json::Value::Null))
            }),
            type_parameters: func.type_parameters.as_ref().map(|t| {
                Box::new(serde_json::to_value(t).unwrap_or(serde_json::Value::Null))
            }),
            predicate: None,
        }
    }

    fn convert_class_declaration(&self, class: &oxc::Class) -> ClassDeclaration {
        ClassDeclaration {
            base: self.make_base_node(class.span),
            id: class.id.as_ref().map(|id| self.convert_binding_identifier(id)),
            super_class: class
                .super_class
                .as_ref()
                .map(|s| Box::new(self.convert_expression(s))),
            body: ClassBody {
                base: self.make_base_node(class.body.span),
                body: class
                    .body
                    .body
                    .iter()
                    .map(|item| serde_json::to_value(item).unwrap_or(serde_json::Value::Null))
                    .collect(),
            },
            decorators: if class.decorators.is_empty() {
                None
            } else {
                Some(
                    class
                        .decorators
                        .iter()
                        .map(|d| serde_json::to_value(d).unwrap_or(serde_json::Value::Null))
                        .collect(),
                )
            },
            is_abstract: if class.r#abstract { Some(true) } else { None },
            declare: if class.declare { Some(true) } else { None },
            implements: if class.implements.is_some() && !class.implements.as_ref().unwrap().is_empty() {
                Some(
                    class
                        .implements
                        .as_ref()
                        .unwrap()
                        .iter()
                        .map(|i| serde_json::to_value(i).unwrap_or(serde_json::Value::Null))
                        .collect(),
                )
            } else {
                None
            },
            super_type_parameters: class.super_type_parameters.as_ref().map(|t| {
                Box::new(serde_json::to_value(t).unwrap_or(serde_json::Value::Null))
            }),
            type_parameters: class.type_parameters.as_ref().map(|t| {
                Box::new(serde_json::to_value(t).unwrap_or(serde_json::Value::Null))
            }),
            mixins: None,
        }
    }

    fn convert_module_declaration(&self, module: &oxc::ModuleDeclaration) -> Statement {
        match module {
            oxc::ModuleDeclaration::ImportDeclaration(i) => {
                Statement::ImportDeclaration(self.convert_import_declaration(i))
            }
            oxc::ModuleDeclaration::ExportAllDeclaration(e) => {
                Statement::ExportAllDeclaration(self.convert_export_all_declaration(e))
            }
            oxc::ModuleDeclaration::ExportDefaultDeclaration(e) => {
                Statement::ExportDefaultDeclaration(self.convert_export_default_declaration(e))
            }
            oxc::ModuleDeclaration::ExportNamedDeclaration(e) => {
                Statement::ExportNamedDeclaration(self.convert_export_named_declaration(e))
            }
            oxc::ModuleDeclaration::TSExportAssignment(_) => {
                todo!("TSExportAssignment")
            }
            oxc::ModuleDeclaration::TSNamespaceExportDeclaration(_) => {
                todo!("TSNamespaceExportDeclaration")
            }
        }
    }

    fn convert_import_declaration(&self, import: &oxc::ImportDeclaration) -> ImportDeclaration {
        ImportDeclaration {
            base: self.make_base_node(import.span),
            specifiers: import
                .specifiers
                .iter()
                .flat_map(|s| self.convert_import_declaration_specifier(s))
                .collect(),
            source: StringLiteral {
                base: self.make_base_node(import.source.span),
                value: import.source.value.to_string(),
            },
            import_kind: match import.import_kind {
                oxc::ImportOrExportKind::Value => None,
                oxc::ImportOrExportKind::Type => Some(ImportKind::Type),
            },
            assertions: None,
            attributes: if import.with_clause.is_some() {
                Some(
                    import
                        .with_clause
                        .as_ref()
                        .unwrap()
                        .with_entries
                        .iter()
                        .map(|e| self.convert_import_attribute(e))
                        .collect(),
                )
            } else {
                None
            },
        }
    }

    fn convert_import_declaration_specifier(
        &self,
        spec: &oxc::ImportDeclarationSpecifier,
    ) -> Option<ImportSpecifier> {
        match spec {
            oxc::ImportDeclarationSpecifier::ImportSpecifier(s) => {
                Some(ImportSpecifier::ImportSpecifier(ImportSpecifierData {
                    base: self.make_base_node(s.span),
                    local: self.convert_binding_identifier(&s.local),
                    imported: self.convert_module_export_name(&s.imported),
                    import_kind: match s.import_kind {
                        oxc::ImportOrExportKind::Value => None,
                        oxc::ImportOrExportKind::Type => Some(ImportKind::Type),
                    },
                }))
            }
            oxc::ImportDeclarationSpecifier::ImportDefaultSpecifier(s) => {
                Some(ImportSpecifier::ImportDefaultSpecifier(
                    ImportDefaultSpecifierData {
                        base: self.make_base_node(s.span),
                        local: self.convert_binding_identifier(&s.local),
                    },
                ))
            }
            oxc::ImportDeclarationSpecifier::ImportNamespaceSpecifier(s) => {
                Some(ImportSpecifier::ImportNamespaceSpecifier(
                    ImportNamespaceSpecifierData {
                        base: self.make_base_node(s.span),
                        local: self.convert_binding_identifier(&s.local),
                    },
                ))
            }
        }
    }

    fn convert_import_attribute(&self, attr: &oxc::ImportAttribute) -> ImportAttribute {
        ImportAttribute {
            base: self.make_base_node(attr.span),
            key: self.convert_import_attribute_key(&attr.key),
            value: StringLiteral {
                base: self.make_base_node(attr.value.span),
                value: attr.value.value.to_string(),
            },
        }
    }

    fn convert_import_attribute_key(&self, key: &oxc::ImportAttributeKey) -> Identifier {
        match key {
            oxc::ImportAttributeKey::Identifier(id) => Identifier {
                base: self.make_base_node(id.span),
                name: id.name.to_string(),
                type_annotation: None,
                optional: None,
                decorators: None,
            },
            oxc::ImportAttributeKey::StringLiteral(s) => Identifier {
                base: self.make_base_node(s.span),
                name: s.value.to_string(),
                type_annotation: None,
                optional: None,
                decorators: None,
            },
        }
    }

    fn convert_module_export_name(&self, name: &oxc::ModuleExportName) -> ModuleExportName {
        match name {
            oxc::ModuleExportName::IdentifierName(id) => {
                ModuleExportName::Identifier(self.convert_identifier_name(id))
            }
            oxc::ModuleExportName::IdentifierReference(id) => {
                ModuleExportName::Identifier(self.convert_identifier_reference(id))
            }
            oxc::ModuleExportName::StringLiteral(s) => {
                ModuleExportName::StringLiteral(StringLiteral {
                    base: self.make_base_node(s.span),
                    value: s.value.to_string(),
                })
            }
        }
    }

    fn convert_export_all_declaration(
        &self,
        export: &oxc::ExportAllDeclaration,
    ) -> ExportAllDeclaration {
        ExportAllDeclaration {
            base: self.make_base_node(export.span),
            source: StringLiteral {
                base: self.make_base_node(export.source.span),
                value: export.source.value.to_string(),
            },
            export_kind: match export.export_kind {
                oxc::ImportOrExportKind::Value => None,
                oxc::ImportOrExportKind::Type => Some(ExportKind::Type),
            },
            assertions: None,
            attributes: if export.with_clause.is_some() {
                Some(
                    export
                        .with_clause
                        .as_ref()
                        .unwrap()
                        .with_entries
                        .iter()
                        .map(|e| self.convert_import_attribute(e))
                        .collect(),
                )
            } else {
                None
            },
        }
    }

    fn convert_export_default_declaration(
        &self,
        export: &oxc::ExportDefaultDeclaration,
    ) -> ExportDefaultDeclaration {
        let declaration = match &export.declaration {
            oxc::ExportDefaultDeclarationKind::FunctionDeclaration(f) => {
                ExportDefaultDecl::FunctionDeclaration(self.convert_function_declaration(f))
            }
            oxc::ExportDefaultDeclarationKind::ClassDeclaration(c) => {
                ExportDefaultDecl::ClassDeclaration(self.convert_class_declaration(c))
            }
            oxc::ExportDefaultDeclarationKind::TSInterfaceDeclaration(_) => {
                todo!("TSInterfaceDeclaration in export default")
            }
            _ => {
                // All expression variants
                ExportDefaultDecl::Expression(Box::new(
                    self.convert_export_default_declaration_kind(&export.declaration),
                ))
            }
        };

        ExportDefaultDeclaration {
            base: self.make_base_node(export.span),
            declaration: Box::new(declaration),
            export_kind: None,
        }
    }

    fn convert_export_default_declaration_kind(
        &self,
        kind: &oxc::ExportDefaultDeclarationKind,
    ) -> Expression {
        match kind {
            oxc::ExportDefaultDeclarationKind::FunctionDeclaration(_)
            | oxc::ExportDefaultDeclarationKind::ClassDeclaration(_)
            | oxc::ExportDefaultDeclarationKind::TSInterfaceDeclaration(_) => {
                panic!("Should be handled separately")
            }
            oxc::ExportDefaultDeclarationKind::BooleanLiteral(e)
            | oxc::ExportDefaultDeclarationKind::NullLiteral(e)
            | oxc::ExportDefaultDeclarationKind::NumericLiteral(e)
            | oxc::ExportDefaultDeclarationKind::BigIntLiteral(e)
            | oxc::ExportDefaultDeclarationKind::RegExpLiteral(e)
            | oxc::ExportDefaultDeclarationKind::StringLiteral(e)
            | oxc::ExportDefaultDeclarationKind::TemplateLiteral(e)
            | oxc::ExportDefaultDeclarationKind::Identifier(e)
            | oxc::ExportDefaultDeclarationKind::MetaProperty(e)
            | oxc::ExportDefaultDeclarationKind::Super(e)
            | oxc::ExportDefaultDeclarationKind::ArrayExpression(e)
            | oxc::ExportDefaultDeclarationKind::ArrowFunctionExpression(e)
            | oxc::ExportDefaultDeclarationKind::AssignmentExpression(e)
            | oxc::ExportDefaultDeclarationKind::AwaitExpression(e)
            | oxc::ExportDefaultDeclarationKind::BinaryExpression(e)
            | oxc::ExportDefaultDeclarationKind::CallExpression(e)
            | oxc::ExportDefaultDeclarationKind::ChainExpression(e)
            | oxc::ExportDefaultDeclarationKind::ClassExpression(e)
            | oxc::ExportDefaultDeclarationKind::ConditionalExpression(e)
            | oxc::ExportDefaultDeclarationKind::LogicalExpression(e)
            | oxc::ExportDefaultDeclarationKind::NewExpression(e)
            | oxc::ExportDefaultDeclarationKind::ObjectExpression(e)
            | oxc::ExportDefaultDeclarationKind::ParenthesizedExpression(e)
            | oxc::ExportDefaultDeclarationKind::SequenceExpression(e)
            | oxc::ExportDefaultDeclarationKind::TaggedTemplateExpression(e)
            | oxc::ExportDefaultDeclarationKind::ThisExpression(e)
            | oxc::ExportDefaultDeclarationKind::UnaryExpression(e)
            | oxc::ExportDefaultDeclarationKind::UpdateExpression(e)
            | oxc::ExportDefaultDeclarationKind::YieldExpression(e)
            | oxc::ExportDefaultDeclarationKind::PrivateInExpression(e)
            | oxc::ExportDefaultDeclarationKind::JSXElement(e)
            | oxc::ExportDefaultDeclarationKind::JSXFragment(e)
            | oxc::ExportDefaultDeclarationKind::TSAsExpression(e)
            | oxc::ExportDefaultDeclarationKind::TSSatisfiesExpression(e)
            | oxc::ExportDefaultDeclarationKind::TSTypeAssertion(e)
            | oxc::ExportDefaultDeclarationKind::TSNonNullExpression(e)
            | oxc::ExportDefaultDeclarationKind::TSInstantiationExpression(e)
            | oxc::ExportDefaultDeclarationKind::ComputedMemberExpression(e)
            | oxc::ExportDefaultDeclarationKind::StaticMemberExpression(e)
            | oxc::ExportDefaultDeclarationKind::PrivateFieldExpression(e) => {
                self.convert_expression(e)
            }
        }
    }

    fn convert_export_named_declaration(
        &self,
        export: &oxc::ExportNamedDeclaration,
    ) -> ExportNamedDeclaration {
        ExportNamedDeclaration {
            base: self.make_base_node(export.span),
            declaration: export.declaration.as_ref().map(|d| {
                Box::new(match d {
                    oxc::Declaration::VariableDeclaration(v) => {
                        Declaration::VariableDeclaration(self.convert_variable_declaration(v))
                    }
                    oxc::Declaration::FunctionDeclaration(f) => {
                        Declaration::FunctionDeclaration(self.convert_function_declaration(f))
                    }
                    oxc::Declaration::ClassDeclaration(c) => {
                        Declaration::ClassDeclaration(self.convert_class_declaration(c))
                    }
                    oxc::Declaration::TSTypeAliasDeclaration(t) => {
                        Declaration::TSTypeAliasDeclaration(
                            self.convert_ts_type_alias_declaration(t),
                        )
                    }
                    oxc::Declaration::TSInterfaceDeclaration(t) => {
                        Declaration::TSInterfaceDeclaration(
                            self.convert_ts_interface_declaration(t),
                        )
                    }
                    oxc::Declaration::TSEnumDeclaration(t) => {
                        Declaration::TSEnumDeclaration(self.convert_ts_enum_declaration(t))
                    }
                    oxc::Declaration::TSModuleDeclaration(t) => {
                        Declaration::TSModuleDeclaration(self.convert_ts_module_declaration(t))
                    }
                    oxc::Declaration::TSImportEqualsDeclaration(_) => {
                        todo!("TSImportEqualsDeclaration")
                    }
                })
            }),
            specifiers: export
                .specifiers
                .iter()
                .map(|s| self.convert_export_specifier(s))
                .collect(),
            source: export.source.as_ref().map(|s| StringLiteral {
                base: self.make_base_node(s.span),
                value: s.value.to_string(),
            }),
            export_kind: match export.export_kind {
                oxc::ImportOrExportKind::Value => None,
                oxc::ImportOrExportKind::Type => Some(ExportKind::Type),
            },
            assertions: None,
            attributes: if export.with_clause.is_some() {
                Some(
                    export
                        .with_clause
                        .as_ref()
                        .unwrap()
                        .with_entries
                        .iter()
                        .map(|e| self.convert_import_attribute(e))
                        .collect(),
                )
            } else {
                None
            },
        }
    }

    fn convert_export_specifier(&self, spec: &oxc::ExportSpecifier) -> ExportSpecifier {
        match spec {
            oxc::ExportSpecifier::ExportSpecifier(s) => {
                ExportSpecifier::ExportSpecifier(ExportSpecifierData {
                    base: self.make_base_node(s.span),
                    local: self.convert_module_export_name(&s.local),
                    exported: self.convert_module_export_name(&s.exported),
                    export_kind: match s.export_kind {
                        oxc::ImportOrExportKind::Value => None,
                        oxc::ImportOrExportKind::Type => Some(ExportKind::Type),
                    },
                })
            }
            oxc::ExportSpecifier::ExportDefaultSpecifier(s) => {
                ExportSpecifier::ExportDefaultSpecifier(ExportDefaultSpecifierData {
                    base: self.make_base_node(s.span),
                    exported: self.convert_identifier_name(&s.exported),
                })
            }
            oxc::ExportSpecifier::ExportNamespaceSpecifier(s) => {
                ExportSpecifier::ExportNamespaceSpecifier(ExportNamespaceSpecifierData {
                    base: self.make_base_node(s.span),
                    exported: self.convert_module_export_name(&s.exported),
                })
            }
        }
    }

    fn convert_ts_type_alias_declaration(
        &self,
        type_alias: &oxc::TSTypeAliasDeclaration,
    ) -> TSTypeAliasDeclaration {
        TSTypeAliasDeclaration {
            base: self.make_base_node(type_alias.span),
            id: self.convert_binding_identifier(&type_alias.id),
            type_annotation: Box::new(
                serde_json::to_value(&type_alias.type_annotation)
                    .unwrap_or(serde_json::Value::Null),
            ),
            type_parameters: type_alias.type_parameters.as_ref().map(|t| {
                Box::new(serde_json::to_value(t).unwrap_or(serde_json::Value::Null))
            }),
            declare: if type_alias.declare { Some(true) } else { None },
        }
    }

    fn convert_ts_interface_declaration(
        &self,
        interface: &oxc::TSInterfaceDeclaration,
    ) -> TSInterfaceDeclaration {
        TSInterfaceDeclaration {
            base: self.make_base_node(interface.span),
            id: self.convert_binding_identifier(&interface.id),
            body: Box::new(
                serde_json::to_value(&interface.body).unwrap_or(serde_json::Value::Null),
            ),
            type_parameters: interface.type_parameters.as_ref().map(|t| {
                Box::new(serde_json::to_value(t).unwrap_or(serde_json::Value::Null))
            }),
            extends: if interface.extends.is_some() && !interface.extends.as_ref().unwrap().is_empty() {
                Some(
                    interface
                        .extends
                        .as_ref()
                        .unwrap()
                        .iter()
                        .map(|e| serde_json::to_value(e).unwrap_or(serde_json::Value::Null))
                        .collect(),
                )
            } else {
                None
            },
            declare: if interface.declare { Some(true) } else { None },
        }
    }

    fn convert_ts_enum_declaration(&self, ts_enum: &oxc::TSEnumDeclaration) -> TSEnumDeclaration {
        TSEnumDeclaration {
            base: self.make_base_node(ts_enum.span),
            id: self.convert_binding_identifier(&ts_enum.id),
            members: ts_enum
                .members
                .iter()
                .map(|m| serde_json::to_value(m).unwrap_or(serde_json::Value::Null))
                .collect(),
            declare: if ts_enum.declare { Some(true) } else { None },
            is_const: if ts_enum.r#const { Some(true) } else { None },
        }
    }

    fn convert_ts_module_declaration(
        &self,
        module: &oxc::TSModuleDeclaration,
    ) -> TSModuleDeclaration {
        TSModuleDeclaration {
            base: self.make_base_node(module.span),
            id: Box::new(serde_json::to_value(&module.id).unwrap_or(serde_json::Value::Null)),
            body: Box::new(serde_json::to_value(&module.body).unwrap_or(serde_json::Value::Null)),
            declare: if module.declare { Some(true) } else { None },
            global: if module.kind == oxc::TSModuleDeclarationKind::Global {
                Some(true)
            } else {
                None
            },
        }
    }

    fn convert_expression(&self, expr: &oxc::Expression) -> Expression {
        match expr {
            oxc::Expression::BooleanLiteral(b) => Expression::BooleanLiteral(BooleanLiteral {
                base: self.make_base_node(b.span),
                value: b.value,
            }),
            oxc::Expression::NullLiteral(n) => Expression::NullLiteral(NullLiteral {
                base: self.make_base_node(n.span),
            }),
            oxc::Expression::NumericLiteral(n) => Expression::NumericLiteral(NumericLiteral {
                base: self.make_base_node(n.span),
                value: n.value,
            }),
            oxc::Expression::BigIntLiteral(b) => Expression::BigIntLiteral(BigIntLiteral {
                base: self.make_base_node(b.span),
                value: b.raw.to_string(),
            }),
            oxc::Expression::RegExpLiteral(r) => Expression::RegExpLiteral(RegExpLiteral {
                base: self.make_base_node(r.span),
                pattern: r.regex.pattern.to_string(),
                flags: r.regex.flags.to_string(),
            }),
            oxc::Expression::StringLiteral(s) => Expression::StringLiteral(StringLiteral {
                base: self.make_base_node(s.span),
                value: s.value.to_string(),
            }),
            oxc::Expression::TemplateLiteral(t) => {
                Expression::TemplateLiteral(self.convert_template_literal(t))
            }
            oxc::Expression::Identifier(id) => {
                Expression::Identifier(self.convert_identifier_reference(id))
            }
            oxc::Expression::MetaProperty(m) => {
                Expression::MetaProperty(self.convert_meta_property(m))
            }
            oxc::Expression::Super(s) => Expression::Super(Super {
                base: self.make_base_node(s.span),
            }),
            oxc::Expression::ArrayExpression(a) => {
                Expression::ArrayExpression(self.convert_array_expression(a))
            }
            oxc::Expression::ArrowFunctionExpression(a) => {
                Expression::ArrowFunctionExpression(self.convert_arrow_function_expression(a))
            }
            oxc::Expression::AssignmentExpression(a) => {
                Expression::AssignmentExpression(self.convert_assignment_expression(a))
            }
            oxc::Expression::AwaitExpression(a) => {
                Expression::AwaitExpression(self.convert_await_expression(a))
            }
            oxc::Expression::BinaryExpression(b) => {
                Expression::BinaryExpression(self.convert_binary_expression(b))
            }
            oxc::Expression::CallExpression(c) => {
                Expression::CallExpression(self.convert_call_expression(c))
            }
            oxc::Expression::ChainExpression(c) => self.convert_chain_expression(c),
            oxc::Expression::ClassExpression(c) => {
                Expression::ClassExpression(self.convert_class_expression(c))
            }
            oxc::Expression::ConditionalExpression(c) => {
                Expression::ConditionalExpression(self.convert_conditional_expression(c))
            }
            oxc::Expression::FunctionExpression(f) => {
                Expression::FunctionExpression(self.convert_function_expression(f))
            }
            oxc::Expression::ImportExpression(_) => {
                todo!("ImportExpression")
            }
            oxc::Expression::LogicalExpression(l) => {
                Expression::LogicalExpression(self.convert_logical_expression(l))
            }
            oxc::Expression::NewExpression(n) => {
                Expression::NewExpression(self.convert_new_expression(n))
            }
            oxc::Expression::ObjectExpression(o) => {
                Expression::ObjectExpression(self.convert_object_expression(o))
            }
            oxc::Expression::ParenthesizedExpression(p) => {
                Expression::ParenthesizedExpression(self.convert_parenthesized_expression(p))
            }
            oxc::Expression::SequenceExpression(s) => {
                Expression::SequenceExpression(self.convert_sequence_expression(s))
            }
            oxc::Expression::TaggedTemplateExpression(t) => {
                Expression::TaggedTemplateExpression(self.convert_tagged_template_expression(t))
            }
            oxc::Expression::ThisExpression(t) => Expression::ThisExpression(ThisExpression {
                base: self.make_base_node(t.span),
            }),
            oxc::Expression::UnaryExpression(u) => {
                Expression::UnaryExpression(self.convert_unary_expression(u))
            }
            oxc::Expression::UpdateExpression(u) => {
                Expression::UpdateExpression(self.convert_update_expression(u))
            }
            oxc::Expression::YieldExpression(y) => {
                Expression::YieldExpression(self.convert_yield_expression(y))
            }
            oxc::Expression::PrivateInExpression(_) => {
                todo!("PrivateInExpression")
            }
            oxc::Expression::JSXElement(j) => {
                Expression::JSXElement(Box::new(self.convert_jsx_element(j)))
            }
            oxc::Expression::JSXFragment(j) => {
                Expression::JSXFragment(self.convert_jsx_fragment(j))
            }
            oxc::Expression::TSAsExpression(t) => {
                Expression::TSAsExpression(self.convert_ts_as_expression(t))
            }
            oxc::Expression::TSSatisfiesExpression(t) => {
                Expression::TSSatisfiesExpression(self.convert_ts_satisfies_expression(t))
            }
            oxc::Expression::TSTypeAssertion(t) => {
                Expression::TSTypeAssertion(self.convert_ts_type_assertion(t))
            }
            oxc::Expression::TSNonNullExpression(t) => {
                Expression::TSNonNullExpression(self.convert_ts_non_null_expression(t))
            }
            oxc::Expression::TSInstantiationExpression(t) => {
                Expression::TSInstantiationExpression(self.convert_ts_instantiation_expression(t))
            }
            oxc::Expression::ComputedMemberExpression(m) => {
                Expression::MemberExpression(MemberExpression {
                    base: self.make_base_node(m.span),
                    object: Box::new(self.convert_expression(&m.object)),
                    property: Box::new(self.convert_expression(&m.expression)),
                    computed: true,
                })
            }
            oxc::Expression::StaticMemberExpression(m) => {
                Expression::MemberExpression(MemberExpression {
                    base: self.make_base_node(m.span),
                    object: Box::new(self.convert_expression(&m.object)),
                    property: Box::new(Expression::Identifier(self.convert_identifier_name(
                        &m.property,
                    ))),
                    computed: false,
                })
            }
            oxc::Expression::PrivateFieldExpression(p) => {
                Expression::MemberExpression(MemberExpression {
                    base: self.make_base_node(p.span),
                    object: Box::new(self.convert_expression(&p.object)),
                    property: Box::new(Expression::PrivateName(PrivateName {
                        base: self.make_base_node(p.field.span),
                        id: Identifier {
                            base: self.make_base_node(p.field.span),
                            name: p.field.name.to_string(),
                            type_annotation: None,
                            optional: None,
                            decorators: None,
                        },
                    })),
                    computed: false,
                })
            }
        }
    }

    fn convert_template_literal(&self, template: &oxc::TemplateLiteral) -> TemplateLiteral {
        TemplateLiteral {
            base: self.make_base_node(template.span),
            quasis: template
                .quasis
                .iter()
                .map(|q| self.convert_template_element(q))
                .collect(),
            expressions: template
                .expressions
                .iter()
                .map(|e| self.convert_expression(e))
                .collect(),
        }
    }

    fn convert_template_element(&self, element: &oxc::TemplateElement) -> TemplateElement {
        TemplateElement {
            base: self.make_base_node(element.span),
            value: TemplateElementValue {
                raw: element.value.raw.to_string(),
                cooked: element.value.cooked.as_ref().map(|s| s.to_string()),
            },
            tail: element.tail,
        }
    }

    fn convert_meta_property(&self, meta: &oxc::MetaProperty) -> MetaProperty {
        MetaProperty {
            base: self.make_base_node(meta.span),
            meta: self.convert_identifier_name(&meta.meta),
            property: self.convert_identifier_name(&meta.property),
        }
    }

    fn convert_array_expression(&self, array: &oxc::ArrayExpression) -> ArrayExpression {
        ArrayExpression {
            base: self.make_base_node(array.span),
            elements: array
                .elements
                .iter()
                .map(|e| match e {
                    oxc::ArrayExpressionElement::SpreadElement(s) => {
                        Some(Expression::SpreadElement(SpreadElement {
                            base: self.make_base_node(s.span),
                            argument: Box::new(self.convert_expression(&s.argument)),
                        }))
                    }
                    oxc::ArrayExpressionElement::Elision(_) => None,
                    oxc::ArrayExpressionElement::BooleanLiteral(e)
                    | oxc::ArrayExpressionElement::NullLiteral(e)
                    | oxc::ArrayExpressionElement::NumericLiteral(e)
                    | oxc::ArrayExpressionElement::BigIntLiteral(e)
                    | oxc::ArrayExpressionElement::RegExpLiteral(e)
                    | oxc::ArrayExpressionElement::StringLiteral(e)
                    | oxc::ArrayExpressionElement::TemplateLiteral(e)
                    | oxc::ArrayExpressionElement::Identifier(e)
                    | oxc::ArrayExpressionElement::MetaProperty(e)
                    | oxc::ArrayExpressionElement::Super(e)
                    | oxc::ArrayExpressionElement::ArrayExpression(e)
                    | oxc::ArrayExpressionElement::ArrowFunctionExpression(e)
                    | oxc::ArrayExpressionElement::AssignmentExpression(e)
                    | oxc::ArrayExpressionElement::AwaitExpression(e)
                    | oxc::ArrayExpressionElement::BinaryExpression(e)
                    | oxc::ArrayExpressionElement::CallExpression(e)
                    | oxc::ArrayExpressionElement::ChainExpression(e)
                    | oxc::ArrayExpressionElement::ClassExpression(e)
                    | oxc::ArrayExpressionElement::ConditionalExpression(e)
                    | oxc::ArrayExpressionElement::FunctionExpression(e)
                    | oxc::ArrayExpressionElement::ImportExpression(e)
                    | oxc::ArrayExpressionElement::LogicalExpression(e)
                    | oxc::ArrayExpressionElement::NewExpression(e)
                    | oxc::ArrayExpressionElement::ObjectExpression(e)
                    | oxc::ArrayExpressionElement::ParenthesizedExpression(e)
                    | oxc::ArrayExpressionElement::SequenceExpression(e)
                    | oxc::ArrayExpressionElement::TaggedTemplateExpression(e)
                    | oxc::ArrayExpressionElement::ThisExpression(e)
                    | oxc::ArrayExpressionElement::UnaryExpression(e)
                    | oxc::ArrayExpressionElement::UpdateExpression(e)
                    | oxc::ArrayExpressionElement::YieldExpression(e)
                    | oxc::ArrayExpressionElement::PrivateInExpression(e)
                    | oxc::ArrayExpressionElement::JSXElement(e)
                    | oxc::ArrayExpressionElement::JSXFragment(e)
                    | oxc::ArrayExpressionElement::TSAsExpression(e)
                    | oxc::ArrayExpressionElement::TSSatisfiesExpression(e)
                    | oxc::ArrayExpressionElement::TSTypeAssertion(e)
                    | oxc::ArrayExpressionElement::TSNonNullExpression(e)
                    | oxc::ArrayExpressionElement::TSInstantiationExpression(e)
                    | oxc::ArrayExpressionElement::ComputedMemberExpression(e)
                    | oxc::ArrayExpressionElement::StaticMemberExpression(e)
                    | oxc::ArrayExpressionElement::PrivateFieldExpression(e) => {
                        Some(self.convert_expression(e))
                    }
                })
                .collect(),
        }
    }

    fn convert_arrow_function_expression(
        &self,
        arrow: &oxc::ArrowFunctionExpression,
    ) -> ArrowFunctionExpression {
        let body = if arrow.expression {
            ArrowFunctionBody::Expression(Box::new(self.convert_expression(&arrow.body.statements[0].as_expression_statement().unwrap().expression)))
        } else {
            ArrowFunctionBody::BlockStatement(self.convert_function_body(&arrow.body))
        };

        ArrowFunctionExpression {
            base: self.make_base_node(arrow.span),
            params: arrow
                .params
                .items
                .iter()
                .map(|p| self.convert_formal_parameter(p))
                .collect(),
            body: Box::new(body),
            id: None,
            generator: false,
            is_async: arrow.r#async,
            expression: if arrow.expression { Some(true) } else { None },
            return_type: arrow.return_type.as_ref().map(|t| {
                Box::new(serde_json::to_value(t).unwrap_or(serde_json::Value::Null))
            }),
            type_parameters: arrow.type_parameters.as_ref().map(|t| {
                Box::new(serde_json::to_value(t).unwrap_or(serde_json::Value::Null))
            }),
            predicate: None,
        }
    }

    fn convert_assignment_expression(
        &self,
        assign: &oxc::AssignmentExpression,
    ) -> AssignmentExpression {
        AssignmentExpression {
            base: self.make_base_node(assign.span),
            operator: self.convert_assignment_operator(assign.operator),
            left: Box::new(self.convert_assignment_target(&assign.left)),
            right: Box::new(self.convert_expression(&assign.right)),
        }
    }

    fn convert_assignment_operator(&self, op: oxc::AssignmentOperator) -> AssignmentOperator {
        match op {
            oxc::AssignmentOperator::Assign => AssignmentOperator::Assign,
            oxc::AssignmentOperator::Addition => AssignmentOperator::AddAssign,
            oxc::AssignmentOperator::Subtraction => AssignmentOperator::SubAssign,
            oxc::AssignmentOperator::Multiplication => AssignmentOperator::MulAssign,
            oxc::AssignmentOperator::Division => AssignmentOperator::DivAssign,
            oxc::AssignmentOperator::Remainder => AssignmentOperator::RemAssign,
            oxc::AssignmentOperator::ShiftLeft => AssignmentOperator::ShlAssign,
            oxc::AssignmentOperator::ShiftRight => AssignmentOperator::ShrAssign,
            oxc::AssignmentOperator::ShiftRightZeroFill => AssignmentOperator::UShrAssign,
            oxc::AssignmentOperator::BitwiseOR => AssignmentOperator::BitOrAssign,
            oxc::AssignmentOperator::BitwiseXOR => AssignmentOperator::BitXorAssign,
            oxc::AssignmentOperator::BitwiseAnd => AssignmentOperator::BitAndAssign,
            oxc::AssignmentOperator::LogicalAnd => AssignmentOperator::AndAssign,
            oxc::AssignmentOperator::LogicalOr => AssignmentOperator::OrAssign,
            oxc::AssignmentOperator::LogicalNullish => AssignmentOperator::NullishAssign,
            oxc::AssignmentOperator::Exponential => AssignmentOperator::ExpAssign,
        }
    }

    fn convert_assignment_target(&self, target: &oxc::AssignmentTarget) -> PatternLike {
        match target {
            oxc::AssignmentTarget::AssignmentTargetIdentifier(id) => {
                PatternLike::Identifier(Identifier {
                    base: self.make_base_node(id.span),
                    name: id.name.to_string(),
                    type_annotation: None,
                    optional: None,
                    decorators: None,
                })
            }
            oxc::AssignmentTarget::ComputedMemberExpression(m) => {
                let expr = Expression::MemberExpression(MemberExpression {
                    base: self.make_base_node(m.span),
                    object: Box::new(self.convert_expression(&m.object)),
                    property: Box::new(self.convert_expression(&m.expression)),
                    computed: true,
                });
                if let Expression::MemberExpression(mem) = expr {
                    PatternLike::MemberExpression(mem)
                } else {
                    unreachable!()
                }
            }
            oxc::AssignmentTarget::StaticMemberExpression(m) => {
                let expr = Expression::MemberExpression(MemberExpression {
                    base: self.make_base_node(m.span),
                    object: Box::new(self.convert_expression(&m.object)),
                    property: Box::new(Expression::Identifier(self.convert_identifier_name(
                        &m.property,
                    ))),
                    computed: false,
                });
                if let Expression::MemberExpression(mem) = expr {
                    PatternLike::MemberExpression(mem)
                } else {
                    unreachable!()
                }
            }
            oxc::AssignmentTarget::PrivateFieldExpression(p) => {
                let expr = Expression::MemberExpression(MemberExpression {
                    base: self.make_base_node(p.span),
                    object: Box::new(self.convert_expression(&p.object)),
                    property: Box::new(Expression::PrivateName(PrivateName {
                        base: self.make_base_node(p.field.span),
                        id: Identifier {
                            base: self.make_base_node(p.field.span),
                            name: p.field.name.to_string(),
                            type_annotation: None,
                            optional: None,
                            decorators: None,
                        },
                    })),
                    computed: false,
                });
                if let Expression::MemberExpression(mem) = expr {
                    PatternLike::MemberExpression(mem)
                } else {
                    unreachable!()
                }
            }
            oxc::AssignmentTarget::ArrayAssignmentTarget(a) => {
                self.convert_array_assignment_target(a)
            }
            oxc::AssignmentTarget::ObjectAssignmentTarget(o) => {
                self.convert_object_assignment_target(o)
            }
            oxc::AssignmentTarget::TSAsExpression(_)
            | oxc::AssignmentTarget::TSSatisfiesExpression(_)
            | oxc::AssignmentTarget::TSNonNullExpression(_)
            | oxc::AssignmentTarget::TSTypeAssertion(_)
            | oxc::AssignmentTarget::TSInstantiationExpression(_) => {
                todo!("TypeScript expression in assignment target")
            }
        }
    }

    fn convert_array_assignment_target(&self, arr: &oxc::ArrayAssignmentTarget) -> PatternLike {
        PatternLike::ArrayPattern(ArrayPattern {
            base: self.make_base_node(arr.span),
            elements: arr
                .elements
                .iter()
                .map(|e| match e {
                    Some(oxc::AssignmentTargetMaybeDefault::AssignmentTargetWithDefault(d)) => {
                        Some(PatternLike::AssignmentPattern(AssignmentPattern {
                            base: self.make_base_node(d.span),
                            left: Box::new(self.convert_assignment_target(&d.binding)),
                            right: Box::new(self.convert_expression(&d.init)),
                            type_annotation: None,
                            decorators: None,
                        }))
                    }
                    Some(
                        oxc::AssignmentTargetMaybeDefault::AssignmentTargetIdentifier(t)
                        | oxc::AssignmentTargetMaybeDefault::ComputedMemberExpression(t)
                        | oxc::AssignmentTargetMaybeDefault::StaticMemberExpression(t)
                        | oxc::AssignmentTargetMaybeDefault::PrivateFieldExpression(t)
                        | oxc::AssignmentTargetMaybeDefault::ArrayAssignmentTarget(t)
                        | oxc::AssignmentTargetMaybeDefault::ObjectAssignmentTarget(t)
                        | oxc::AssignmentTargetMaybeDefault::TSAsExpression(t)
                        | oxc::AssignmentTargetMaybeDefault::TSSatisfiesExpression(t)
                        | oxc::AssignmentTargetMaybeDefault::TSNonNullExpression(t)
                        | oxc::AssignmentTargetMaybeDefault::TSTypeAssertion(t)
                        | oxc::AssignmentTargetMaybeDefault::TSInstantiationExpression(t),
                    ) => Some(self.convert_assignment_target(t)),
                    None => None,
                })
                .collect(),
            type_annotation: None,
            decorators: None,
        })
    }

    fn convert_object_assignment_target(&self, obj: &oxc::ObjectAssignmentTarget) -> PatternLike {
        PatternLike::ObjectPattern(ObjectPattern {
            base: self.make_base_node(obj.span),
            properties: obj
                .properties
                .iter()
                .map(|p| match p {
                    oxc::AssignmentTargetProperty::AssignmentTargetPropertyIdentifier(id) => {
                        let ident = PatternLike::Identifier(Identifier {
                            base: self.make_base_node(id.binding.span),
                            name: id.binding.name.to_string(),
                            type_annotation: None,
                            optional: None,
                            decorators: None,
                        });
                        let value = if let Some(init) = &id.init {
                            Box::new(PatternLike::AssignmentPattern(AssignmentPattern {
                                base: self.make_base_node(id.span),
                                left: Box::new(ident),
                                right: Box::new(self.convert_expression(init)),
                                type_annotation: None,
                                decorators: None,
                            }))
                        } else {
                            Box::new(ident)
                        };
                        ObjectPatternProperty::ObjectProperty(ObjectPatternProp {
                            base: self.make_base_node(id.span),
                            key: Box::new(Expression::Identifier(Identifier {
                                base: self.make_base_node(id.binding.span),
                                name: id.binding.name.to_string(),
                                type_annotation: None,
                                optional: None,
                                decorators: None,
                            })),
                            value,
                            computed: false,
                            shorthand: true,
                            decorators: None,
                            method: None,
                        })
                    }
                    oxc::AssignmentTargetProperty::AssignmentTargetPropertyProperty(prop) => {
                        let value = match &prop.binding {
                            oxc::AssignmentTargetMaybeDefault::AssignmentTargetWithDefault(d) => {
                                Box::new(PatternLike::AssignmentPattern(AssignmentPattern {
                                    base: self.make_base_node(d.span),
                                    left: Box::new(self.convert_assignment_target(&d.binding)),
                                    right: Box::new(self.convert_expression(&d.init)),
                                    type_annotation: None,
                                    decorators: None,
                                }))
                            }
                            _ => Box::new(self.convert_assignment_target(&prop.binding)),
                        };
                        ObjectPatternProperty::ObjectProperty(ObjectPatternProp {
                            base: self.make_base_node(prop.span),
                            key: Box::new(self.convert_property_key(&prop.name)),
                            value,
                            computed: matches!(prop.name, oxc::PropertyKey::PrivateIdentifier(_) | oxc::PropertyKey::BooleanLiteral(_) | oxc::PropertyKey::NullLiteral(_) | oxc::PropertyKey::NumericLiteral(_) | oxc::PropertyKey::BigIntLiteral(_) | oxc::PropertyKey::RegExpLiteral(_) | oxc::PropertyKey::StringLiteral(_) | oxc::PropertyKey::TemplateLiteral(_) | oxc::PropertyKey::Identifier(_) | oxc::PropertyKey::MetaProperty(_) | oxc::PropertyKey::Super(_) | oxc::PropertyKey::ArrayExpression(_) | oxc::PropertyKey::ArrowFunctionExpression(_) | oxc::PropertyKey::AssignmentExpression(_) | oxc::PropertyKey::AwaitExpression(_) | oxc::PropertyKey::BinaryExpression(_) | oxc::PropertyKey::CallExpression(_) | oxc::PropertyKey::ChainExpression(_) | oxc::PropertyKey::ClassExpression(_) | oxc::PropertyKey::ConditionalExpression(_) | oxc::PropertyKey::FunctionExpression(_) | oxc::PropertyKey::ImportExpression(_) | oxc::PropertyKey::LogicalExpression(_) | oxc::PropertyKey::NewExpression(_) | oxc::PropertyKey::ObjectExpression(_) | oxc::PropertyKey::ParenthesizedExpression(_) | oxc::PropertyKey::SequenceExpression(_) | oxc::PropertyKey::TaggedTemplateExpression(_) | oxc::PropertyKey::ThisExpression(_) | oxc::PropertyKey::UnaryExpression(_) | oxc::PropertyKey::UpdateExpression(_) | oxc::PropertyKey::YieldExpression(_) | oxc::PropertyKey::PrivateInExpression(_) | oxc::PropertyKey::JSXElement(_) | oxc::PropertyKey::JSXFragment(_) | oxc::PropertyKey::TSAsExpression(_) | oxc::PropertyKey::TSSatisfiesExpression(_) | oxc::PropertyKey::TSTypeAssertion(_) | oxc::PropertyKey::TSNonNullExpression(_) | oxc::PropertyKey::TSInstantiationExpression(_) | oxc::PropertyKey::ComputedMemberExpression(_) | oxc::PropertyKey::StaticMemberExpression(_) | oxc::PropertyKey::PrivateFieldExpression(_)),
                            shorthand: false,
                            decorators: None,
                            method: None,
                        })
                    }
                    oxc::AssignmentTargetProperty::AssignmentTargetRest(rest) => {
                        ObjectPatternProperty::RestElement(RestElement {
                            base: self.make_base_node(rest.span),
                            argument: Box::new(self.convert_assignment_target(&rest.target)),
                            type_annotation: None,
                            decorators: None,
                        })
                    }
                })
                .collect(),
            type_annotation: None,
            decorators: None,
        })
    }

    fn convert_await_expression(&self, await_expr: &oxc::AwaitExpression) -> AwaitExpression {
        AwaitExpression {
            base: self.make_base_node(await_expr.span),
            argument: Box::new(self.convert_expression(&await_expr.argument)),
        }
    }

    fn convert_binary_expression(&self, binary: &oxc::BinaryExpression) -> BinaryExpression {
        BinaryExpression {
            base: self.make_base_node(binary.span),
            operator: self.convert_binary_operator(binary.operator),
            left: Box::new(self.convert_expression(&binary.left)),
            right: Box::new(self.convert_expression(&binary.right)),
        }
    }

    fn convert_binary_operator(&self, op: oxc::BinaryOperator) -> BinaryOperator {
        match op {
            oxc::BinaryOperator::Equality => BinaryOperator::Eq,
            oxc::BinaryOperator::Inequality => BinaryOperator::Neq,
            oxc::BinaryOperator::StrictEquality => BinaryOperator::StrictEq,
            oxc::BinaryOperator::StrictInequality => BinaryOperator::StrictNeq,
            oxc::BinaryOperator::LessThan => BinaryOperator::Lt,
            oxc::BinaryOperator::LessEqualThan => BinaryOperator::Lte,
            oxc::BinaryOperator::GreaterThan => BinaryOperator::Gt,
            oxc::BinaryOperator::GreaterEqualThan => BinaryOperator::Gte,
            oxc::BinaryOperator::ShiftLeft => BinaryOperator::Shl,
            oxc::BinaryOperator::ShiftRight => BinaryOperator::Shr,
            oxc::BinaryOperator::ShiftRightZeroFill => BinaryOperator::UShr,
            oxc::BinaryOperator::Addition => BinaryOperator::Add,
            oxc::BinaryOperator::Subtraction => BinaryOperator::Sub,
            oxc::BinaryOperator::Multiplication => BinaryOperator::Mul,
            oxc::BinaryOperator::Division => BinaryOperator::Div,
            oxc::BinaryOperator::Remainder => BinaryOperator::Rem,
            oxc::BinaryOperator::BitwiseOR => BinaryOperator::BitOr,
            oxc::BinaryOperator::BitwiseXOR => BinaryOperator::BitXor,
            oxc::BinaryOperator::BitwiseAnd => BinaryOperator::BitAnd,
            oxc::BinaryOperator::In => BinaryOperator::In,
            oxc::BinaryOperator::Instanceof => BinaryOperator::Instanceof,
            oxc::BinaryOperator::Exponential => BinaryOperator::Exp,
        }
    }

    fn convert_call_expression(&self, call: &oxc::CallExpression) -> CallExpression {
        CallExpression {
            base: self.make_base_node(call.span),
            callee: Box::new(self.convert_expression(&call.callee)),
            arguments: call
                .arguments
                .iter()
                .map(|a| self.convert_argument(a))
                .collect(),
            type_parameters: call.type_parameters.as_ref().map(|t| {
                Box::new(serde_json::to_value(t).unwrap_or(serde_json::Value::Null))
            }),
            type_arguments: None,
            optional: if call.optional { Some(true) } else { None },
        }
    }

    fn convert_argument(&self, arg: &oxc::Argument) -> Expression {
        match arg {
            oxc::Argument::SpreadElement(s) => Expression::SpreadElement(SpreadElement {
                base: self.make_base_node(s.span),
                argument: Box::new(self.convert_expression(&s.argument)),
            }),
            oxc::Argument::BooleanLiteral(e)
            | oxc::Argument::NullLiteral(e)
            | oxc::Argument::NumericLiteral(e)
            | oxc::Argument::BigIntLiteral(e)
            | oxc::Argument::RegExpLiteral(e)
            | oxc::Argument::StringLiteral(e)
            | oxc::Argument::TemplateLiteral(e)
            | oxc::Argument::Identifier(e)
            | oxc::Argument::MetaProperty(e)
            | oxc::Argument::Super(e)
            | oxc::Argument::ArrayExpression(e)
            | oxc::Argument::ArrowFunctionExpression(e)
            | oxc::Argument::AssignmentExpression(e)
            | oxc::Argument::AwaitExpression(e)
            | oxc::Argument::BinaryExpression(e)
            | oxc::Argument::CallExpression(e)
            | oxc::Argument::ChainExpression(e)
            | oxc::Argument::ClassExpression(e)
            | oxc::Argument::ConditionalExpression(e)
            | oxc::Argument::FunctionExpression(e)
            | oxc::Argument::ImportExpression(e)
            | oxc::Argument::LogicalExpression(e)
            | oxc::Argument::NewExpression(e)
            | oxc::Argument::ObjectExpression(e)
            | oxc::Argument::ParenthesizedExpression(e)
            | oxc::Argument::SequenceExpression(e)
            | oxc::Argument::TaggedTemplateExpression(e)
            | oxc::Argument::ThisExpression(e)
            | oxc::Argument::UnaryExpression(e)
            | oxc::Argument::UpdateExpression(e)
            | oxc::Argument::YieldExpression(e)
            | oxc::Argument::PrivateInExpression(e)
            | oxc::Argument::JSXElement(e)
            | oxc::Argument::JSXFragment(e)
            | oxc::Argument::TSAsExpression(e)
            | oxc::Argument::TSSatisfiesExpression(e)
            | oxc::Argument::TSTypeAssertion(e)
            | oxc::Argument::TSNonNullExpression(e)
            | oxc::Argument::TSInstantiationExpression(e)
            | oxc::Argument::ComputedMemberExpression(e)
            | oxc::Argument::StaticMemberExpression(e)
            | oxc::Argument::PrivateFieldExpression(e) => self.convert_expression(e),
        }
    }

    fn convert_chain_expression(&self, chain: &oxc::ChainExpression) -> Expression {
        // ChainExpression wraps optional call/member expressions in Babel
        match &chain.expression {
            oxc::ChainElement::CallExpression(c) => {
                Expression::OptionalCallExpression(OptionalCallExpression {
                    base: self.make_base_node(c.span),
                    callee: Box::new(self.convert_expression(&c.callee)),
                    arguments: c
                        .arguments
                        .iter()
                        .map(|a| self.convert_argument(a))
                        .collect(),
                    optional: c.optional,
                    type_parameters: c.type_parameters.as_ref().map(|t| {
                        Box::new(serde_json::to_value(t).unwrap_or(serde_json::Value::Null))
                    }),
                    type_arguments: None,
                })
            }
            oxc::ChainElement::ComputedMemberExpression(m) => {
                Expression::OptionalMemberExpression(OptionalMemberExpression {
                    base: self.make_base_node(m.span),
                    object: Box::new(self.convert_expression(&m.object)),
                    property: Box::new(self.convert_expression(&m.expression)),
                    computed: true,
                    optional: m.optional,
                })
            }
            oxc::ChainElement::StaticMemberExpression(m) => {
                Expression::OptionalMemberExpression(OptionalMemberExpression {
                    base: self.make_base_node(m.span),
                    object: Box::new(self.convert_expression(&m.object)),
                    property: Box::new(Expression::Identifier(self.convert_identifier_name(
                        &m.property,
                    ))),
                    computed: false,
                    optional: m.optional,
                })
            }
            oxc::ChainElement::PrivateFieldExpression(p) => {
                Expression::OptionalMemberExpression(OptionalMemberExpression {
                    base: self.make_base_node(p.span),
                    object: Box::new(self.convert_expression(&p.object)),
                    property: Box::new(Expression::PrivateName(PrivateName {
                        base: self.make_base_node(p.field.span),
                        id: Identifier {
                            base: self.make_base_node(p.field.span),
                            name: p.field.name.to_string(),
                            type_annotation: None,
                            optional: None,
                            decorators: None,
                        },
                    })),
                    computed: false,
                    optional: p.optional,
                })
            }
        }
    }

    fn convert_class_expression(&self, class: &oxc::Class) -> ClassExpression {
        ClassExpression {
            base: self.make_base_node(class.span),
            id: class.id.as_ref().map(|id| self.convert_binding_identifier(id)),
            super_class: class
                .super_class
                .as_ref()
                .map(|s| Box::new(self.convert_expression(s))),
            body: ClassBody {
                base: self.make_base_node(class.body.span),
                body: class
                    .body
                    .body
                    .iter()
                    .map(|item| serde_json::to_value(item).unwrap_or(serde_json::Value::Null))
                    .collect(),
            },
            decorators: if class.decorators.is_empty() {
                None
            } else {
                Some(
                    class
                        .decorators
                        .iter()
                        .map(|d| serde_json::to_value(d).unwrap_or(serde_json::Value::Null))
                        .collect(),
                )
            },
            implements: if class.implements.is_some() && !class.implements.as_ref().unwrap().is_empty() {
                Some(
                    class
                        .implements
                        .as_ref()
                        .unwrap()
                        .iter()
                        .map(|i| serde_json::to_value(i).unwrap_or(serde_json::Value::Null))
                        .collect(),
                )
            } else {
                None
            },
            super_type_parameters: class.super_type_parameters.as_ref().map(|t| {
                Box::new(serde_json::to_value(t).unwrap_or(serde_json::Value::Null))
            }),
            type_parameters: class.type_parameters.as_ref().map(|t| {
                Box::new(serde_json::to_value(t).unwrap_or(serde_json::Value::Null))
            }),
        }
    }

    fn convert_conditional_expression(
        &self,
        cond: &oxc::ConditionalExpression,
    ) -> ConditionalExpression {
        ConditionalExpression {
            base: self.make_base_node(cond.span),
            test: Box::new(self.convert_expression(&cond.test)),
            consequent: Box::new(self.convert_expression(&cond.consequent)),
            alternate: Box::new(self.convert_expression(&cond.alternate)),
        }
    }

    fn convert_function_expression(&self, func: &oxc::Function) -> FunctionExpression {
        FunctionExpression {
            base: self.make_base_node(func.span),
            id: func.id.as_ref().map(|id| self.convert_binding_identifier(id)),
            params: func
                .params
                .items
                .iter()
                .map(|p| self.convert_formal_parameter(p))
                .collect(),
            body: self.convert_function_body(func.body.as_ref().unwrap()),
            generator: func.generator,
            is_async: func.r#async,
            return_type: func.return_type.as_ref().map(|t| {
                Box::new(serde_json::to_value(t).unwrap_or(serde_json::Value::Null))
            }),
            type_parameters: func.type_parameters.as_ref().map(|t| {
                Box::new(serde_json::to_value(t).unwrap_or(serde_json::Value::Null))
            }),
        }
    }

    fn convert_logical_expression(&self, logical: &oxc::LogicalExpression) -> LogicalExpression {
        LogicalExpression {
            base: self.make_base_node(logical.span),
            operator: self.convert_logical_operator(logical.operator),
            left: Box::new(self.convert_expression(&logical.left)),
            right: Box::new(self.convert_expression(&logical.right)),
        }
    }

    fn convert_logical_operator(&self, op: oxc::LogicalOperator) -> LogicalOperator {
        match op {
            oxc::LogicalOperator::Or => LogicalOperator::Or,
            oxc::LogicalOperator::And => LogicalOperator::And,
            oxc::LogicalOperator::Coalesce => LogicalOperator::NullishCoalescing,
        }
    }

    fn convert_new_expression(&self, new: &oxc::NewExpression) -> NewExpression {
        NewExpression {
            base: self.make_base_node(new.span),
            callee: Box::new(self.convert_expression(&new.callee)),
            arguments: new
                .arguments
                .iter()
                .map(|a| self.convert_argument(a))
                .collect(),
            type_parameters: new.type_parameters.as_ref().map(|t| {
                Box::new(serde_json::to_value(t).unwrap_or(serde_json::Value::Null))
            }),
            type_arguments: None,
        }
    }

    fn convert_object_expression(&self, obj: &oxc::ObjectExpression) -> ObjectExpression {
        ObjectExpression {
            base: self.make_base_node(obj.span),
            properties: obj
                .properties
                .iter()
                .map(|p| self.convert_object_property_kind(p))
                .collect(),
        }
    }

    fn convert_object_property_kind(&self, prop: &oxc::ObjectPropertyKind) -> ObjectExpressionProperty {
        match prop {
            oxc::ObjectPropertyKind::ObjectProperty(p) => {
                ObjectExpressionProperty::ObjectProperty(self.convert_object_property(p))
            }
            oxc::ObjectPropertyKind::SpreadProperty(s) => {
                ObjectExpressionProperty::SpreadElement(SpreadElement {
                    base: self.make_base_node(s.span),
                    argument: Box::new(self.convert_expression(&s.argument)),
                })
            }
        }
    }

    fn convert_object_property(&self, prop: &oxc::ObjectProperty) -> ObjectProperty {
        ObjectProperty {
            base: self.make_base_node(prop.span),
            key: Box::new(self.convert_property_key(&prop.key)),
            value: Box::new(self.convert_expression(&prop.value)),
            computed: prop.computed,
            shorthand: prop.shorthand,
            decorators: None,
            method: if prop.method { Some(true) } else { None },
        }
    }

    fn convert_property_key(&self, key: &oxc::PropertyKey) -> Expression {
        match key {
            oxc::PropertyKey::StaticIdentifier(id) => {
                Expression::Identifier(self.convert_identifier_name(id))
            }
            oxc::PropertyKey::PrivateIdentifier(id) => {
                Expression::PrivateName(PrivateName {
                    base: self.make_base_node(id.span),
                    id: Identifier {
                        base: self.make_base_node(id.span),
                        name: id.name.to_string(),
                        type_annotation: None,
                        optional: None,
                        decorators: None,
                    },
                })
            }
            oxc::PropertyKey::BooleanLiteral(e)
            | oxc::PropertyKey::NullLiteral(e)
            | oxc::PropertyKey::NumericLiteral(e)
            | oxc::PropertyKey::BigIntLiteral(e)
            | oxc::PropertyKey::RegExpLiteral(e)
            | oxc::PropertyKey::StringLiteral(e)
            | oxc::PropertyKey::TemplateLiteral(e)
            | oxc::PropertyKey::Identifier(e)
            | oxc::PropertyKey::MetaProperty(e)
            | oxc::PropertyKey::Super(e)
            | oxc::PropertyKey::ArrayExpression(e)
            | oxc::PropertyKey::ArrowFunctionExpression(e)
            | oxc::PropertyKey::AssignmentExpression(e)
            | oxc::PropertyKey::AwaitExpression(e)
            | oxc::PropertyKey::BinaryExpression(e)
            | oxc::PropertyKey::CallExpression(e)
            | oxc::PropertyKey::ChainExpression(e)
            | oxc::PropertyKey::ClassExpression(e)
            | oxc::PropertyKey::ConditionalExpression(e)
            | oxc::PropertyKey::FunctionExpression(e)
            | oxc::PropertyKey::ImportExpression(e)
            | oxc::PropertyKey::LogicalExpression(e)
            | oxc::PropertyKey::NewExpression(e)
            | oxc::PropertyKey::ObjectExpression(e)
            | oxc::PropertyKey::ParenthesizedExpression(e)
            | oxc::PropertyKey::SequenceExpression(e)
            | oxc::PropertyKey::TaggedTemplateExpression(e)
            | oxc::PropertyKey::ThisExpression(e)
            | oxc::PropertyKey::UnaryExpression(e)
            | oxc::PropertyKey::UpdateExpression(e)
            | oxc::PropertyKey::YieldExpression(e)
            | oxc::PropertyKey::PrivateInExpression(e)
            | oxc::PropertyKey::JSXElement(e)
            | oxc::PropertyKey::JSXFragment(e)
            | oxc::PropertyKey::TSAsExpression(e)
            | oxc::PropertyKey::TSSatisfiesExpression(e)
            | oxc::PropertyKey::TSTypeAssertion(e)
            | oxc::PropertyKey::TSNonNullExpression(e)
            | oxc::PropertyKey::TSInstantiationExpression(e)
            | oxc::PropertyKey::ComputedMemberExpression(e)
            | oxc::PropertyKey::StaticMemberExpression(e)
            | oxc::PropertyKey::PrivateFieldExpression(e) => self.convert_expression(e),
        }
    }

    fn convert_parenthesized_expression(
        &self,
        paren: &oxc::ParenthesizedExpression,
    ) -> ParenthesizedExpression {
        ParenthesizedExpression {
            base: self.make_base_node(paren.span),
            expression: Box::new(self.convert_expression(&paren.expression)),
        }
    }

    fn convert_sequence_expression(&self, seq: &oxc::SequenceExpression) -> SequenceExpression {
        SequenceExpression {
            base: self.make_base_node(seq.span),
            expressions: seq
                .expressions
                .iter()
                .map(|e| self.convert_expression(e))
                .collect(),
        }
    }

    fn convert_tagged_template_expression(
        &self,
        tagged: &oxc::TaggedTemplateExpression,
    ) -> TaggedTemplateExpression {
        TaggedTemplateExpression {
            base: self.make_base_node(tagged.span),
            tag: Box::new(self.convert_expression(&tagged.tag)),
            quasi: self.convert_template_literal(&tagged.quasi),
            type_parameters: tagged.type_parameters.as_ref().map(|t| {
                Box::new(serde_json::to_value(t).unwrap_or(serde_json::Value::Null))
            }),
        }
    }

    fn convert_unary_expression(&self, unary: &oxc::UnaryExpression) -> UnaryExpression {
        UnaryExpression {
            base: self.make_base_node(unary.span),
            operator: self.convert_unary_operator(unary.operator),
            prefix: true,
            argument: Box::new(self.convert_expression(&unary.argument)),
        }
    }

    fn convert_unary_operator(&self, op: oxc::UnaryOperator) -> UnaryOperator {
        match op {
            oxc::UnaryOperator::UnaryNegation => UnaryOperator::Neg,
            oxc::UnaryOperator::UnaryPlus => UnaryOperator::Plus,
            oxc::UnaryOperator::LogicalNot => UnaryOperator::Not,
            oxc::UnaryOperator::BitwiseNot => UnaryOperator::BitNot,
            oxc::UnaryOperator::Typeof => UnaryOperator::TypeOf,
            oxc::UnaryOperator::Void => UnaryOperator::Void,
            oxc::UnaryOperator::Delete => UnaryOperator::Delete,
        }
    }

    fn convert_update_expression(&self, update: &oxc::UpdateExpression) -> UpdateExpression {
        UpdateExpression {
            base: self.make_base_node(update.span),
            operator: self.convert_update_operator(update.operator),
            argument: Box::new(self.convert_expression(&update.argument)),
            prefix: update.prefix,
        }
    }

    fn convert_update_operator(&self, op: oxc::UpdateOperator) -> UpdateOperator {
        match op {
            oxc::UpdateOperator::Increment => UpdateOperator::Increment,
            oxc::UpdateOperator::Decrement => UpdateOperator::Decrement,
        }
    }

    fn convert_yield_expression(&self, yield_expr: &oxc::YieldExpression) -> YieldExpression {
        YieldExpression {
            base: self.make_base_node(yield_expr.span),
            argument: yield_expr
                .argument
                .as_ref()
                .map(|a| Box::new(self.convert_expression(a))),
            delegate: yield_expr.delegate,
        }
    }

    fn convert_ts_as_expression(&self, ts_as: &oxc::TSAsExpression) -> TSAsExpression {
        TSAsExpression {
            base: self.make_base_node(ts_as.span),
            expression: Box::new(self.convert_expression(&ts_as.expression)),
            type_annotation: Box::new(
                serde_json::to_value(&ts_as.type_annotation).unwrap_or(serde_json::Value::Null),
            ),
        }
    }

    fn convert_ts_satisfies_expression(
        &self,
        ts_sat: &oxc::TSSatisfiesExpression,
    ) -> TSSatisfiesExpression {
        TSSatisfiesExpression {
            base: self.make_base_node(ts_sat.span),
            expression: Box::new(self.convert_expression(&ts_sat.expression)),
            type_annotation: Box::new(
                serde_json::to_value(&ts_sat.type_annotation).unwrap_or(serde_json::Value::Null),
            ),
        }
    }

    fn convert_ts_type_assertion(&self, ts_assert: &oxc::TSTypeAssertion) -> TSTypeAssertion {
        TSTypeAssertion {
            base: self.make_base_node(ts_assert.span),
            expression: Box::new(self.convert_expression(&ts_assert.expression)),
            type_annotation: Box::new(
                serde_json::to_value(&ts_assert.type_annotation)
                    .unwrap_or(serde_json::Value::Null),
            ),
        }
    }

    fn convert_ts_non_null_expression(
        &self,
        ts_non_null: &oxc::TSNonNullExpression,
    ) -> TSNonNullExpression {
        TSNonNullExpression {
            base: self.make_base_node(ts_non_null.span),
            expression: Box::new(self.convert_expression(&ts_non_null.expression)),
        }
    }

    fn convert_ts_instantiation_expression(
        &self,
        ts_inst: &oxc::TSInstantiationExpression,
    ) -> TSInstantiationExpression {
        TSInstantiationExpression {
            base: self.make_base_node(ts_inst.span),
            expression: Box::new(self.convert_expression(&ts_inst.expression)),
            type_parameters: Box::new(
                serde_json::to_value(&ts_inst.type_parameters)
                    .unwrap_or(serde_json::Value::Null),
            ),
        }
    }

    fn convert_jsx_element(&self, jsx: &oxc::JSXElement) -> JSXElement {
        JSXElement {
            base: self.make_base_node(jsx.span),
            opening_element: self.convert_jsx_opening_element(&jsx.opening_element),
            closing_element: jsx
                .closing_element
                .as_ref()
                .map(|c| self.convert_jsx_closing_element(c)),
            children: jsx
                .children
                .iter()
                .map(|c| self.convert_jsx_child(c))
                .collect(),
            self_closing: None,
        }
    }

    fn convert_jsx_fragment(&self, jsx: &oxc::JSXFragment) -> JSXFragment {
        JSXFragment {
            base: self.make_base_node(jsx.span),
            opening_fragment: JSXOpeningFragment {
                base: self.make_base_node(jsx.opening_fragment.span),
            },
            closing_fragment: JSXClosingFragment {
                base: self.make_base_node(jsx.closing_fragment.span),
            },
            children: jsx
                .children
                .iter()
                .map(|c| self.convert_jsx_child(c))
                .collect(),
        }
    }

    fn convert_jsx_opening_element(&self, opening: &oxc::JSXOpeningElement) -> JSXOpeningElement {
        JSXOpeningElement {
            base: self.make_base_node(opening.span),
            name: self.convert_jsx_element_name(&opening.name),
            attributes: opening
                .attributes
                .iter()
                .map(|a| self.convert_jsx_attribute_item(a))
                .collect(),
            self_closing: opening.self_closing,
            type_parameters: opening.type_parameters.as_ref().map(|t| {
                Box::new(serde_json::to_value(t).unwrap_or(serde_json::Value::Null))
            }),
        }
    }

    fn convert_jsx_closing_element(&self, closing: &oxc::JSXClosingElement) -> JSXClosingElement {
        JSXClosingElement {
            base: self.make_base_node(closing.span),
            name: self.convert_jsx_element_name(&closing.name),
        }
    }

    fn convert_jsx_element_name(&self, name: &oxc::JSXElementName) -> JSXElementName {
        match name {
            oxc::JSXElementName::Identifier(id) => {
                JSXElementName::JSXIdentifier(JSXIdentifier {
                    base: self.make_base_node(id.span),
                    name: id.name.to_string(),
                })
            }
            oxc::JSXElementName::NamespacedName(ns) => {
                JSXElementName::JSXNamespacedName(JSXNamespacedName {
                    base: self.make_base_node(ns.span),
                    namespace: JSXIdentifier {
                        base: self.make_base_node(ns.namespace.span),
                        name: ns.namespace.name.to_string(),
                    },
                    name: JSXIdentifier {
                        base: self.make_base_node(ns.property.span),
                        name: ns.property.name.to_string(),
                    },
                })
            }
            oxc::JSXElementName::MemberExpression(mem) => {
                JSXElementName::JSXMemberExpression(self.convert_jsx_member_expression(mem))
            }
        }
    }

    fn convert_jsx_member_expression(&self, mem: &oxc::JSXMemberExpression) -> JSXMemberExpression {
        JSXMemberExpression {
            base: self.make_base_node(mem.span),
            object: Box::new(self.convert_jsx_member_expression_object(&mem.object)),
            property: JSXIdentifier {
                base: self.make_base_node(mem.property.span),
                name: mem.property.name.to_string(),
            },
        }
    }

    fn convert_jsx_member_expression_object(
        &self,
        obj: &oxc::JSXMemberExpressionObject,
    ) -> JSXMemberExprObject {
        match obj {
            oxc::JSXMemberExpressionObject::Identifier(id) => {
                JSXMemberExprObject::JSXIdentifier(JSXIdentifier {
                    base: self.make_base_node(id.span),
                    name: id.name.to_string(),
                })
            }
            oxc::JSXMemberExpressionObject::MemberExpression(mem) => {
                JSXMemberExprObject::JSXMemberExpression(Box::new(
                    self.convert_jsx_member_expression(mem),
                ))
            }
        }
    }

    fn convert_jsx_attribute_item(&self, attr: &oxc::JSXAttributeItem) -> JSXAttributeItem {
        match attr {
            oxc::JSXAttributeItem::Attribute(a) => {
                JSXAttributeItem::JSXAttribute(self.convert_jsx_attribute(a))
            }
            oxc::JSXAttributeItem::SpreadAttribute(s) => {
                JSXAttributeItem::JSXSpreadAttribute(JSXSpreadAttribute {
                    base: self.make_base_node(s.span),
                    argument: Box::new(self.convert_expression(&s.argument)),
                })
            }
        }
    }

    fn convert_jsx_attribute(&self, attr: &oxc::JSXAttribute) -> JSXAttribute {
        JSXAttribute {
            base: self.make_base_node(attr.span),
            name: self.convert_jsx_attribute_name(&attr.name),
            value: attr
                .value
                .as_ref()
                .map(|v| self.convert_jsx_attribute_value(v)),
        }
    }

    fn convert_jsx_attribute_name(&self, name: &oxc::JSXAttributeName) -> JSXAttributeName {
        match name {
            oxc::JSXAttributeName::Identifier(id) => {
                JSXAttributeName::JSXIdentifier(JSXIdentifier {
                    base: self.make_base_node(id.span),
                    name: id.name.to_string(),
                })
            }
            oxc::JSXAttributeName::NamespacedName(ns) => {
                JSXAttributeName::JSXNamespacedName(JSXNamespacedName {
                    base: self.make_base_node(ns.span),
                    namespace: JSXIdentifier {
                        base: self.make_base_node(ns.namespace.span),
                        name: ns.namespace.name.to_string(),
                    },
                    name: JSXIdentifier {
                        base: self.make_base_node(ns.property.span),
                        name: ns.property.name.to_string(),
                    },
                })
            }
        }
    }

    fn convert_jsx_attribute_value(&self, value: &oxc::JSXAttributeValue) -> JSXAttributeValue {
        match value {
            oxc::JSXAttributeValue::StringLiteral(s) => {
                JSXAttributeValue::StringLiteral(StringLiteral {
                    base: self.make_base_node(s.span),
                    value: s.value.to_string(),
                })
            }
            oxc::JSXAttributeValue::ExpressionContainer(e) => {
                JSXAttributeValue::JSXExpressionContainer(self.convert_jsx_expression_container(e))
            }
            oxc::JSXAttributeValue::Element(e) => {
                JSXAttributeValue::JSXElement(Box::new(self.convert_jsx_element(e)))
            }
            oxc::JSXAttributeValue::Fragment(f) => {
                JSXAttributeValue::JSXFragment(self.convert_jsx_fragment(f))
            }
        }
    }

    fn convert_jsx_expression_container(
        &self,
        container: &oxc::JSXExpressionContainer,
    ) -> JSXExpressionContainer {
        JSXExpressionContainer {
            base: self.make_base_node(container.span),
            expression: match &container.expression {
                oxc::JSXExpression::EmptyExpression(e) => {
                    JSXExpressionContainerExpr::JSXEmptyExpression(JSXEmptyExpression {
                        base: self.make_base_node(e.span),
                    })
                }
                oxc::JSXExpression::BooleanLiteral(e)
                | oxc::JSXExpression::NullLiteral(e)
                | oxc::JSXExpression::NumericLiteral(e)
                | oxc::JSXExpression::BigIntLiteral(e)
                | oxc::JSXExpression::RegExpLiteral(e)
                | oxc::JSXExpression::StringLiteral(e)
                | oxc::JSXExpression::TemplateLiteral(e)
                | oxc::JSXExpression::Identifier(e)
                | oxc::JSXExpression::MetaProperty(e)
                | oxc::JSXExpression::Super(e)
                | oxc::JSXExpression::ArrayExpression(e)
                | oxc::JSXExpression::ArrowFunctionExpression(e)
                | oxc::JSXExpression::AssignmentExpression(e)
                | oxc::JSXExpression::AwaitExpression(e)
                | oxc::JSXExpression::BinaryExpression(e)
                | oxc::JSXExpression::CallExpression(e)
                | oxc::JSXExpression::ChainExpression(e)
                | oxc::JSXExpression::ClassExpression(e)
                | oxc::JSXExpression::ConditionalExpression(e)
                | oxc::JSXExpression::FunctionExpression(e)
                | oxc::JSXExpression::ImportExpression(e)
                | oxc::JSXExpression::LogicalExpression(e)
                | oxc::JSXExpression::NewExpression(e)
                | oxc::JSXExpression::ObjectExpression(e)
                | oxc::JSXExpression::ParenthesizedExpression(e)
                | oxc::JSXExpression::SequenceExpression(e)
                | oxc::JSXExpression::TaggedTemplateExpression(e)
                | oxc::JSXExpression::ThisExpression(e)
                | oxc::JSXExpression::UnaryExpression(e)
                | oxc::JSXExpression::UpdateExpression(e)
                | oxc::JSXExpression::YieldExpression(e)
                | oxc::JSXExpression::PrivateInExpression(e)
                | oxc::JSXExpression::JSXElement(e)
                | oxc::JSXExpression::JSXFragment(e)
                | oxc::JSXExpression::TSAsExpression(e)
                | oxc::JSXExpression::TSSatisfiesExpression(e)
                | oxc::JSXExpression::TSTypeAssertion(e)
                | oxc::JSXExpression::TSNonNullExpression(e)
                | oxc::JSXExpression::TSInstantiationExpression(e)
                | oxc::JSXExpression::ComputedMemberExpression(e)
                | oxc::JSXExpression::StaticMemberExpression(e)
                | oxc::JSXExpression::PrivateFieldExpression(e) => {
                    JSXExpressionContainerExpr::Expression(Box::new(self.convert_expression(e)))
                }
            },
        }
    }

    fn convert_jsx_child(&self, child: &oxc::JSXChild) -> JSXChild {
        match child {
            oxc::JSXChild::Element(e) => JSXChild::JSXElement(Box::new(self.convert_jsx_element(e))),
            oxc::JSXChild::Fragment(f) => JSXChild::JSXFragment(self.convert_jsx_fragment(f)),
            oxc::JSXChild::ExpressionContainer(e) => {
                JSXChild::JSXExpressionContainer(self.convert_jsx_expression_container(e))
            }
            oxc::JSXChild::Spread(s) => JSXChild::JSXSpreadChild(JSXSpreadChild {
                base: self.make_base_node(s.span),
                expression: Box::new(self.convert_expression(&s.expression)),
            }),
            oxc::JSXChild::Text(t) => JSXChild::JSXText(JSXText {
                base: self.make_base_node(t.span),
                value: t.value.to_string(),
            }),
        }
    }

    fn convert_binding_pattern(&self, pattern: &oxc::BindingPattern) -> PatternLike {
        match &pattern.kind {
            oxc::BindingPatternKind::BindingIdentifier(id) => {
                PatternLike::Identifier(self.convert_binding_identifier(id))
            }
            oxc::BindingPatternKind::ObjectPattern(obj) => {
                PatternLike::ObjectPattern(self.convert_object_pattern(obj))
            }
            oxc::BindingPatternKind::ArrayPattern(arr) => {
                PatternLike::ArrayPattern(self.convert_array_pattern(arr))
            }
            oxc::BindingPatternKind::AssignmentPattern(assign) => {
                PatternLike::AssignmentPattern(self.convert_assignment_pattern(assign))
            }
        }
    }

    fn convert_binding_identifier(&self, id: &oxc::BindingIdentifier) -> Identifier {
        Identifier {
            base: self.make_base_node(id.span),
            name: id.name.to_string(),
            type_annotation: None,
            optional: None,
            decorators: None,
        }
    }

    fn convert_identifier_name(&self, id: &oxc::IdentifierName) -> Identifier {
        Identifier {
            base: self.make_base_node(id.span),
            name: id.name.to_string(),
            type_annotation: None,
            optional: None,
            decorators: None,
        }
    }

    fn convert_identifier_reference(&self, id: &oxc::IdentifierReference) -> Identifier {
        Identifier {
            base: self.make_base_node(id.span),
            name: id.name.to_string(),
            type_annotation: None,
            optional: None,
            decorators: None,
        }
    }

    fn convert_object_pattern(&self, obj: &oxc::ObjectPattern) -> ObjectPattern {
        ObjectPattern {
            base: self.make_base_node(obj.span),
            properties: obj
                .properties
                .iter()
                .map(|p| self.convert_binding_property(p))
                .collect(),
            type_annotation: obj.type_annotation.as_ref().map(|t| {
                Box::new(serde_json::to_value(t).unwrap_or(serde_json::Value::Null))
            }),
            decorators: None,
        }
    }

    fn convert_binding_property(&self, prop: &oxc::BindingProperty) -> ObjectPatternProperty {
        match prop {
            oxc::BindingProperty::BindingProperty(p) => {
                ObjectPatternProperty::ObjectProperty(ObjectPatternProp {
                    base: self.make_base_node(p.span),
                    key: Box::new(self.convert_property_key(&p.key)),
                    value: Box::new(self.convert_binding_pattern(&p.value)),
                    computed: p.computed,
                    shorthand: p.shorthand,
                    decorators: None,
                    method: None,
                })
            }
            oxc::BindingProperty::BindingRestElement(r) => {
                ObjectPatternProperty::RestElement(self.convert_binding_rest_element(r))
            }
        }
    }

    fn convert_array_pattern(&self, arr: &oxc::ArrayPattern) -> ArrayPattern {
        ArrayPattern {
            base: self.make_base_node(arr.span),
            elements: arr
                .elements
                .iter()
                .map(|e| e.as_ref().map(|p| self.convert_binding_pattern(p)))
                .collect(),
            type_annotation: arr.type_annotation.as_ref().map(|t| {
                Box::new(serde_json::to_value(t).unwrap_or(serde_json::Value::Null))
            }),
            decorators: None,
        }
    }

    fn convert_assignment_pattern(&self, assign: &oxc::AssignmentPattern) -> AssignmentPattern {
        AssignmentPattern {
            base: self.make_base_node(assign.span),
            left: Box::new(self.convert_binding_pattern(&assign.left)),
            right: Box::new(self.convert_expression(&assign.right)),
            type_annotation: None,
            decorators: None,
        }
    }

    fn convert_binding_rest_element(&self, rest: &oxc::BindingRestElement) -> RestElement {
        RestElement {
            base: self.make_base_node(rest.span),
            argument: Box::new(self.convert_binding_pattern(&rest.argument)),
            type_annotation: None,
            decorators: None,
        }
    }

    fn convert_formal_parameter(&self, param: &oxc::FormalParameter) -> PatternLike {
        let mut pattern = self.convert_binding_pattern(&param.pattern);

        // Add type annotation if present
        if let Some(type_annotation) = &param.pattern.type_annotation {
            let type_json = Box::new(
                serde_json::to_value(type_annotation).unwrap_or(serde_json::Value::Null),
            );
            match &mut pattern {
                PatternLike::Identifier(id) => {
                    id.type_annotation = Some(type_json);
                }
                PatternLike::ObjectPattern(obj) => {
                    obj.type_annotation = Some(type_json);
                }
                PatternLike::ArrayPattern(arr) => {
                    arr.type_annotation = Some(type_json);
                }
                PatternLike::AssignmentPattern(assign) => {
                    assign.type_annotation = Some(type_json);
                }
                PatternLike::RestElement(rest) => {
                    rest.type_annotation = Some(type_json);
                }
                PatternLike::MemberExpression(_) => {}
            }
        }

        pattern
    }

    fn convert_function_body(&self, body: &oxc::FunctionBody) -> BlockStatement {
        BlockStatement {
            base: self.make_base_node(body.span),
            body: body
                .statements
                .iter()
                .map(|s| self.convert_statement(s))
                .collect(),
            directives: body
                .directives
                .iter()
                .map(|d| self.convert_directive(d))
                .collect(),
        }
    }
}
