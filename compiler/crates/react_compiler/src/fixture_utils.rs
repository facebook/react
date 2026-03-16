use react_compiler_ast::File;
use react_compiler_ast::declarations::{Declaration, ExportDefaultDecl};
use react_compiler_ast::expressions::Expression;
use react_compiler_ast::statements::Statement;

/// Count the number of top-level functions in an AST file.
///
/// "Top-level" means:
/// - FunctionDeclaration at program body level
/// - FunctionExpression/ArrowFunctionExpression in a VariableDeclarator at program body level
/// - FunctionDeclaration inside ExportNamedDeclaration
/// - FunctionDeclaration/FunctionExpression/ArrowFunctionExpression inside ExportDefaultDeclaration
/// - VariableDeclaration with function expressions inside ExportNamedDeclaration
///
/// This matches the TS test binary's traversal behavior.
pub fn count_top_level_functions(ast: &File) -> usize {
    let mut count = 0;
    for stmt in &ast.program.body {
        count += count_functions_in_statement(stmt);
    }
    count
}

fn count_functions_in_statement(stmt: &Statement) -> usize {
    match stmt {
        Statement::FunctionDeclaration(_) => 1,
        Statement::VariableDeclaration(var_decl) => {
            let mut count = 0;
            for declarator in &var_decl.declarations {
                if let Some(init) = &declarator.init {
                    if is_function_expression(init) {
                        count += 1;
                    }
                }
            }
            count
        }
        Statement::ExportNamedDeclaration(export) => {
            if let Some(decl) = &export.declaration {
                match decl.as_ref() {
                    Declaration::FunctionDeclaration(_) => 1,
                    Declaration::VariableDeclaration(var_decl) => {
                        let mut count = 0;
                        for declarator in &var_decl.declarations {
                            if let Some(init) = &declarator.init {
                                if is_function_expression(init) {
                                    count += 1;
                                }
                            }
                        }
                        count
                    }
                    _ => 0,
                }
            } else {
                0
            }
        }
        Statement::ExportDefaultDeclaration(export) => {
            match export.declaration.as_ref() {
                ExportDefaultDecl::FunctionDeclaration(_) => 1,
                ExportDefaultDecl::Expression(expr) => {
                    if is_function_expression(expr) { 1 } else { 0 }
                }
                _ => 0,
            }
        }
        // Expression statements with function expressions (uncommon but possible)
        Statement::ExpressionStatement(expr_stmt) => {
            if is_function_expression(&expr_stmt.expression) { 1 } else { 0 }
        }
        _ => 0,
    }
}

fn is_function_expression(expr: &Expression) -> bool {
    matches!(
        expr,
        Expression::FunctionExpression(_) | Expression::ArrowFunctionExpression(_)
    )
}
