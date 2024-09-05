/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use crate::{
    AssignmentPropertyOrRestElement, AssignmentTarget, Class, ClassItem, ClassPrivateProperty,
    ClassProperty, Declaration, DeclarationOrExpression, ExportAllDeclaration,
    ExportDefaultDeclaration, ExportNamedDeclaration, Expression, ExpressionOrPrivateIdentifier,
    ExpressionOrSpread, ExpressionOrSuper, ForInInit, ForInit, Function, FunctionBody,
    FunctionDeclaration, Identifier, ImportDeclaration, ImportDeclarationSpecifier,
    ImportOrExportDeclaration, Literal, MethodDefinition, ModuleItem, Pattern, PrivateIdentifier,
    PrivateName, Program, Statement, StaticBlock, Super, SwitchCase, VariableDeclarator, _Literal,
};

/// Trait for visiting an estree
#[allow(non_camel_case_types)]
#[deprecated]
pub trait Visitor_DEPRECATED<'ast> {
    fn visit_lvalue<F>(&mut self, f: F)
    where
        F: FnOnce(&mut Self),
    {
        f(self);
    }

    fn visit_rvalue<F>(&mut self, f: F)
    where
        F: FnOnce(&mut Self),
    {
        f(self);
    }

    fn visit_program(&mut self, program: &'ast Program) {
        self.default_visit_program(program)
    }

    fn default_visit_program(&mut self, program: &'ast Program) {
        for item in &program.body {
            self.visit_module_item(item);
        }
    }

    fn visit_function(&mut self, function: &'ast Function) {
        self.default_visit_function(function);
    }

    fn default_visit_function(&mut self, function: &'ast Function) {
        self.visit_lvalue(|visitor| {
            for param in &function.params {
                visitor.visit_pattern(param);
            }
        });
        match &function.body {
            Some(FunctionBody::BlockStatement(body)) => {
                for stmt in &body.body {
                    self.visit_statement(stmt)
                }
            }
            Some(FunctionBody::Expression(body)) => self.visit_expression(body),
            None => {}
        }
    }

    fn visit_module_item(&mut self, item: &'ast ModuleItem) {
        match item {
            ModuleItem::Statement(item) => self.visit_statement(item),
            ModuleItem::ImportOrExportDeclaration(item) => {
                self.visit_import_or_export_declaration(item)
            }
        }
    }

    fn visit_import_or_export_declaration(&mut self, declaration: &'ast ImportOrExportDeclaration) {
        match declaration {
            ImportOrExportDeclaration::ImportDeclaration(declaration) => {
                self.visit_import_declaration(declaration);
            }
            ImportOrExportDeclaration::ExportAllDeclaration(declaration) => {
                self.visit_export_all_declaration(declaration);
            }
            ImportOrExportDeclaration::ExportDefaultDeclaration(declaration) => {
                self.visit_export_default_declaration(declaration);
            }
            ImportOrExportDeclaration::ExportNamedDeclaration(declaration) => {
                self.visit_export_named_declaration(declaration);
            }
        }
    }

    fn visit_import_declaration(&mut self, declaration: &'ast ImportDeclaration) {
        self.visit_lvalue(|visitor| {
            for specifier in &declaration.specifiers {
                visitor.visit_import_declaration_specifier(specifier);
            }
        });
        self.visit_import_source(&declaration.source);
    }

    fn visit_export_all_declaration(&mut self, declaration: &'ast ExportAllDeclaration) {
        self.visit_export_source(&declaration.source);
    }

    fn visit_export_default_declaration(&mut self, declaration: &'ast ExportDefaultDeclaration) {
        match &declaration.declaration {
            DeclarationOrExpression::Declaration(declaration) => {
                self.visit_declaration(declaration)
            }
            DeclarationOrExpression::Expression(declaration) => self.visit_expression(declaration),
        }
    }

    fn visit_export_named_declaration(&mut self, declaration: &'ast ExportNamedDeclaration) {
        if let Some(declaration) = &declaration.declaration {
            self.visit_declaration(declaration)
        }
        if let Some(source) = &declaration.source {
            self.visit_export_source(source);
        }
    }

    fn visit_import_declaration_specifier(&mut self, specifier: &'ast ImportDeclarationSpecifier) {
        match specifier {
            ImportDeclarationSpecifier::ImportSpecifier(specifier) => {
                self.visit_identifier(&specifier.local);
            }
            ImportDeclarationSpecifier::ImportDefaultSpecifier(specifier) => {
                self.visit_identifier(&specifier.local);
            }
            ImportDeclarationSpecifier::ImportNamespaceSpecifier(specifier) => {
                self.visit_identifier(&specifier.local);
            }
        }
    }

    fn visit_declaration(&mut self, declaration: &'ast Declaration) {
        self.default_visit_declaration(declaration);
    }

    fn default_visit_declaration(&mut self, declaration: &'ast Declaration) {
        match declaration {
            Declaration::ClassDeclaration(declaration) => {
                self.visit_class(&declaration.class);
            }
            Declaration::FunctionDeclaration(declaration) => {
                self.visit_function_declaration(declaration);
            }
            Declaration::VariableDeclaration(declaration) => {
                for declarator in &declaration.declarations {
                    self.visit_variable_declarator(declarator)
                }
            }
            Declaration::TSTypeAliasDeclaration(_declaration) => {
                todo!("visit TSTypeAliasDeclaration")
            }
        }
    }

    fn visit_function_declaration(&mut self, declaration: &'ast FunctionDeclaration) {
        self.visit_function(&declaration.function);
    }

    fn visit_statement(&mut self, stmt: &'ast Statement) {
        self.default_visit_statement(stmt);
    }

    fn default_visit_statement(&mut self, stmt: &'ast Statement) {
        match stmt {
            Statement::BlockStatement(stmt) => {
                for stmt in &stmt.body {
                    self.visit_statement(stmt)
                }
            }
            Statement::BreakStatement(_stmt) => {
                // todo
            }
            Statement::ContinueStatement(_stmt) => {
                // todo
            }
            Statement::DebuggerStatement(_stmt) => {
                // todo
            }
            Statement::ClassDeclaration(stmt) => {
                self.visit_class(&stmt.class);
            }
            Statement::DoWhileStatement(stmt) => {
                self.visit_statement(&stmt.body);
                self.visit_expression(&stmt.test);
            }
            Statement::EmptyStatement(_stmt) => {
                // nothing to do
            }
            Statement::ExpressionStatement(stmt) => {
                self.visit_expression(&stmt.expression);
            }
            Statement::ForInStatement(stmt) => {
                self.visit_for_in_init(&stmt.left);
                self.visit_expression(&stmt.right);
                self.visit_statement(&stmt.body);
            }
            Statement::ForOfStatement(stmt) => {
                self.visit_for_in_init(&stmt.left);
                self.visit_expression(&stmt.right);
                self.visit_statement(&stmt.body);
            }
            Statement::ForStatement(stmt) => {
                if let Some(init) = &stmt.init {
                    self.visit_for_init(init);
                }
                if let Some(test) = &stmt.test {
                    self.visit_expression(test);
                }
                if let Some(update) = &stmt.update {
                    self.visit_expression(update);
                }
                self.visit_statement(&stmt.body);
            }
            Statement::FunctionDeclaration(stmt) => {
                self.visit_function_declaration(stmt);
            }
            Statement::IfStatement(stmt) => {
                self.visit_expression(&stmt.test);
                self.visit_statement(&stmt.consequent);
                if let Some(alternate) = &stmt.alternate {
                    self.visit_statement(alternate);
                }
            }
            Statement::LabeledStatement(stmt) => {
                self.visit_statement(&stmt.body);
            }
            Statement::ReturnStatement(stmt) => {
                if let Some(argument) = &stmt.argument {
                    self.visit_expression(argument);
                }
            }
            Statement::SwitchStatement(stmt) => {
                self.visit_expression(&stmt.discriminant);
                for case_ in &stmt.cases {
                    self.visit_case(case_);
                }
            }
            Statement::ThrowStatement(stmt) => {
                self.visit_expression(&stmt.argument);
            }
            Statement::TryStatement(stmt) => {
                for item in &stmt.block.body {
                    self.visit_statement(item);
                }
                if let Some(handler) = &stmt.handler {
                    if let Some(param) = &handler.param {
                        self.visit_lvalue(|visitor| visitor.visit_pattern(param));
                    }
                    for item in &handler.body.body {
                        self.visit_statement(item);
                    }
                }
                if let Some(finalizer) = &stmt.finalizer {
                    for item in &finalizer.body {
                        self.visit_statement(item);
                    }
                }
            }
            Statement::VariableDeclaration(stmt) => {
                for decl in &stmt.declarations {
                    self.visit_variable_declarator(decl);
                }
            }
            Statement::WhileStatement(stmt) => {
                self.visit_expression(&stmt.test);
                self.visit_statement(&stmt.body);
            }
            Statement::WithStatement(stmt) => {
                self.visit_expression(&stmt.object);
                self.visit_statement(&stmt.body);
            }
            Statement::TSTypeAliasDeclaration(_stmt) => {
                todo!("visit TSTypeAliasDeclaration")
            }
        }
    }

    fn visit_class(&mut self, class: &'ast Class) {
        if let Some(id) = &class.id {
            self.visit_identifier(id)
        }
        if let Some(super_class) = &class.super_class {
            self.visit_expression(super_class);
        }
        for item in &class.body.body {
            match item {
                ClassItem::MethodDefinition(item) => self.visit_method_definition(item),
                ClassItem::ClassProperty(item) => {
                    self.visit_class_property(item);
                }
                ClassItem::ClassPrivateProperty(item) => {
                    self.visit_class_private_property(item);
                }
                ClassItem::StaticBlock(item) => {
                    self.visit_static_block(item);
                }
            }
        }
    }

    fn visit_class_property(&mut self, property: &'ast ClassProperty) {
        self.visit_expression(&property.key);
        if let Some(value) = &property.value {
            self.visit_expression(value)
        }
    }

    fn visit_class_private_property(&mut self, property: &'ast ClassPrivateProperty) {
        match &property.key {
            ExpressionOrPrivateIdentifier::Expression(key) => self.visit_expression(key),
            ExpressionOrPrivateIdentifier::PrivateIdentifier(key) => {
                self.visit_private_identifier(key)
            }
            ExpressionOrPrivateIdentifier::PrivateName(key) => self.visit_private_name(key),
        }
        if let Some(value) = &property.value {
            self.visit_expression(value)
        }
    }

    fn visit_static_block(&mut self, property: &'ast StaticBlock) {
        for stmt in &property.body {
            self.visit_statement(stmt)
        }
    }

    fn visit_method_definition(&mut self, method: &'ast MethodDefinition) {
        self.default_visit_method_definition(method);
    }

    fn default_visit_method_definition(&mut self, method: &'ast MethodDefinition) {
        self.visit_expression(&method.key);
        self.visit_function(&method.value.function);
    }

    fn visit_case(&mut self, case_: &'ast SwitchCase) {
        if let Some(test) = &case_.test {
            self.visit_expression(test);
        }
        for stmt in &case_.consequent {
            self.visit_statement(stmt)
        }
    }

    fn visit_for_init(&mut self, init: &'ast ForInit) {
        match init {
            ForInit::Expression(init) => {
                self.visit_expression(init);
            }
            ForInit::VariableDeclaration(init) => {
                for decl in &init.declarations {
                    self.visit_variable_declarator(decl);
                }
            }
        }
    }

    fn visit_for_in_init(&mut self, init: &'ast ForInInit) {
        match init {
            ForInInit::Pattern(init) => {
                self.visit_pattern(init);
            }
            ForInInit::VariableDeclaration(init) => {
                for decl in &init.declarations {
                    self.visit_variable_declarator(decl);
                }
            }
        }
    }

    fn visit_pattern(&mut self, pattern: &'ast Pattern) {
        match pattern {
            Pattern::Identifier(pattern) => self.visit_identifier(pattern),
            Pattern::ArrayPattern(pattern) => {
                for element in &pattern.elements {
                    if let Some(element) = element {
                        self.visit_pattern(element);
                    }
                }
            }
            Pattern::ObjectPattern(pattern) => {
                for property in &pattern.properties {
                    match property {
                        AssignmentPropertyOrRestElement::AssignmentProperty(property) => {
                            self.visit_pattern(&property.value);
                        }
                        AssignmentPropertyOrRestElement::RestElement(property) => {
                            self.visit_pattern(&property.argument);
                        }
                    }
                }
            }
            Pattern::RestElement(pattern) => self.visit_pattern(&pattern.argument),
            Pattern::AssignmentPattern(pattern) => {
                self.visit_pattern(&pattern.left);
                self.visit_rvalue(|visitor| {
                    visitor.visit_expression(&pattern.right);
                });
            }
        }
    }

    fn visit_variable_declarator(&mut self, decl: &'ast VariableDeclarator) {
        self.visit_lvalue(|visitor| {
            visitor.visit_pattern(&decl.id);
        });
        if let Some(init) = &decl.init {
            self.visit_expression(init);
        }
    }

    fn visit_assignment_target(&mut self, target: &'ast AssignmentTarget) {
        match target {
            AssignmentTarget::Expression(target) => {
                self.visit_expression(target);
            }
            AssignmentTarget::Pattern(target) => self.visit_pattern(target),
        }
    }

    fn visit_expression(&mut self, expr: &'ast Expression) {
        self.default_visit_expression(expr);
    }

    fn default_visit_expression(&mut self, expr: &'ast Expression) {
        match expr {
            Expression::ArrayExpression(expr) => {
                for item in &expr.elements {
                    match item {
                        Some(ExpressionOrSpread::SpreadElement(item)) => {
                            self.visit_expression(&item.argument)
                        }
                        Some(ExpressionOrSpread::Expression(item)) => self.visit_expression(item),
                        _ => {}
                    }
                }
            }
            Expression::AssignmentExpression(expr) => {
                self.visit_lvalue(|visitor| visitor.visit_assignment_target(&expr.left));
                self.visit_expression(&expr.right);
            }
            Expression::BinaryExpression(expr) => {
                self.visit_expression(&expr.left);
                self.visit_expression(&expr.right);
            }
            Expression::Identifier(expr) => {
                self.visit_identifier(expr);
            }
            Expression::Literal(expr) => self.visit_literal(expr),
            Expression::FunctionExpression(expr) => self.visit_function(&expr.function),
            Expression::ArrowFunctionExpression(expr) => self.visit_function(&expr.function),
            Expression::MemberExpression(expr) => {
                match &expr.object {
                    ExpressionOrSuper::Super(object) => self.visit_super(object),
                    ExpressionOrSuper::Expression(object) => self.visit_expression(object),
                };
                if !expr.is_computed {
                    match &expr.property {
                        ExpressionOrPrivateIdentifier::Expression(property) => {
                            self.visit_expression(property)
                        }
                        ExpressionOrPrivateIdentifier::PrivateIdentifier(property) => {
                            self.visit_private_identifier(property);
                        }
                        ExpressionOrPrivateIdentifier::PrivateName(property) => {
                            self.visit_private_name(property);
                        }
                    }
                }
            }
            Expression::CallExpression(expr) => {
                match &expr.callee {
                    ExpressionOrSuper::Expression(callee) => self.visit_expression(callee),
                    ExpressionOrSuper::Super(callee) => self.visit_super(callee),
                }
                for arg in &expr.arguments {
                    match arg {
                        ExpressionOrSpread::Expression(arg) => self.visit_expression(arg),
                        ExpressionOrSpread::SpreadElement(arg) => {
                            self.visit_expression(&arg.argument)
                        }
                    }
                }
            }
            Expression::UpdateExpression(expr) => {
                self.visit_expression(&expr.argument);
            }
            Expression::BooleanLiteral(_)
            | Expression::NullLiteral(_)
            | Expression::StringLiteral(_)
            | Expression::NumericLiteral(_) => {
                // no-op
            }
            _ => {
                todo!("{:#?}", expr)
            }
        }
    }

    fn visit_super(&mut self, _super: &'ast Super) {
        todo!("Implement visit_super")
    }

    fn visit_private_identifier(&mut self, _identifier: &'ast PrivateIdentifier) {
        todo!("Implement visit_private_identifier()")
    }

    fn visit_private_name(&mut self, _identifier: &'ast PrivateName) {
        todo!("Implement visit_private_name()")
    }

    fn visit_identifier(&mut self, _identifier: &'ast Identifier) {
        todo!("Implement visit_identifier()")
    }

    fn visit_import_source(&mut self, literal: &'ast _Literal) {
        self.visit_any_literal(literal);
    }

    fn visit_export_source(&mut self, literal: &'ast _Literal) {
        self.visit_any_literal(literal);
    }

    fn visit_any_literal(&mut self, _literal: &'ast _Literal) {
        todo!("Implement visit_any_literal()")
    }

    fn visit_literal(&mut self, _literal: &'ast Literal) {
        todo!("Implement visit_literal()")
    }
}
