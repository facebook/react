use std::fs;
use std::process;
use react_compiler::pipeline::run_pipeline;

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() != 4 {
        eprintln!("Usage: test-rust-port <pass> <ast.json> <scope.json>");
        process::exit(1);
    }
    let pass = &args[1];
    let ast_json = fs::read_to_string(&args[2]).unwrap_or_else(|e| {
        eprintln!("Failed to read AST JSON: {e}");
        process::exit(1);
    });
    let scope_json = fs::read_to_string(&args[3]).unwrap_or_else(|e| {
        eprintln!("Failed to read scope JSON: {e}");
        process::exit(1);
    });

    let ast: react_compiler_ast::File = serde_json::from_str(&ast_json).unwrap_or_else(|e| {
        eprintln!("Failed to parse AST JSON: {e}");
        process::exit(1);
    });
    let scope: react_compiler_ast::scope::ScopeInfo = serde_json::from_str(&scope_json).unwrap_or_else(|e| {
        eprintln!("Failed to parse scope JSON: {e}");
        process::exit(1);
    });

    match run_pipeline(pass, ast, scope) {
        Ok(output) => print!("{}", output),
        Err(e) => {
            eprintln!("{}", e);
            process::exit(1);
        }
    }
}
