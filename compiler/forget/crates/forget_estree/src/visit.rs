use crate::{
    AssignmentTarget, Class, Declaration, ExportAllDeclaration, ExportDefaultDeclaration,
    ExportNamedDeclaration, Expression, ExpressionOrSpread, ExpressionOrSuper, ForInInit, ForInit,
    Function, FunctionBody, Identifier, ImportDeclaration, ImportDeclarationSpecifier,
    ImportOrExportDeclaration, Literal, MethodDefinition, ModuleItem, Pattern, Program, Statement,
    SwitchCase, VariableDeclarator,
};

/// Trait for visiting an estree
pub trait Visitor<'ast> {
    fn visit_lvalue<F>(&mut self, f: F)
    where
        F: FnOnce(&mut Self) -> (),
    {
        f(self);
    }

    fn visit_program(&mut self, program: &'ast Program) {
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
                visitor.visit_import_declaration_specifier(specifier, &declaration.source)
            }
        });
        self.visit_import_source(&declaration.source);
    }

    fn visit_export_all_declaration(&mut self, declaration: &'ast ExportAllDeclaration) {
        self.visit_export_source(&declaration.source);
    }

    fn visit_export_default_declaration(&mut self, declaration: &'ast ExportDefaultDeclaration) {
        self.visit_declaration(&declaration.declaration);
    }

    fn visit_export_named_declaration(&mut self, declaration: &'ast ExportNamedDeclaration) {
        if let Some(declaration) = &declaration.declaration {
            self.visit_declaration(declaration)
        }
        if let Some(source) = &declaration.source {
            self.visit_export_source(source);
        }
    }

    fn visit_import_declaration_specifier(
        &mut self,
        specifier: &'ast ImportDeclarationSpecifier,
        _source: &'ast Literal,
    ) {
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
                self.visit_function(&declaration.function);
            }
            Declaration::VariableDeclaration(declaration) => {
                for declarator in &declaration.declarations {
                    self.visit_variable_declarator(declarator)
                }
            }
        }
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
                self.visit_function(&stmt.function);
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
                    self.visit_lvalue(|visitor| visitor.visit_pattern(&handler.param));
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
        }
    }

    fn visit_class(&mut self, class: &'ast Class) {
        if let Some(id) = &class.id {
            self.visit_identifier(id)
        }
        if let Some(super_class) = &class.super_class {
            self.visit_expression(super_class);
        }
        for method in &class.body.body {
            self.visit_method_definition(class, method)
        }
    }

    fn visit_method_definition(&mut self, class: &'ast Class, method: &'ast MethodDefinition) {
        self.default_visit_method_definition(class, method);
    }

    fn default_visit_method_definition(
        &mut self,
        _class: &'ast Class,
        method: &'ast MethodDefinition,
    ) {
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
                    self.visit_pattern(&property.value);
                }
            }
            Pattern::RestElement(pattern) => self.visit_pattern(&pattern.argument),
            Pattern::AssignmentPattern(pattern) => {
                self.visit_expression(&pattern.right);
                self.visit_pattern(&pattern.left);
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
                    ExpressionOrSuper::Super(_object) => {
                        // todo
                    }
                    ExpressionOrSuper::Expression(object) => self.visit_expression(object),
                };
                if !expr.computed {
                    self.visit_expression(&expr.property)
                }
            }
            _ => {
                todo!("more expression types")
            }
        }
    }

    fn visit_identifier(&mut self, _identifier: &'ast Identifier) {
        // nothing to do unless overridden
    }

    fn visit_import_source(&mut self, literal: &'ast Literal) {
        self.visit_literal(literal);
    }

    fn visit_export_source(&mut self, literal: &'ast Literal) {
        self.visit_literal(literal);
    }

    fn visit_literal(&mut self, _literal: &'ast Literal) {
        // nothing to do unless overridden
    }
}
