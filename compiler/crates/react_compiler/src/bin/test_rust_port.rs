use std::fs;
use std::process;
use react_compiler::pipeline::run_pipeline;
use react_compiler_hir::environment::Environment;

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

    // TODO: Add config matching TS binary:
    //   compilationMode: "all"
    //   assertValidMutableRanges: true
    //   enableReanimatedCheck: false
    //   target: "19"
    let mut env = Environment::new();

    match run_pipeline(pass, &ast, &scope, &mut env) {
        Ok(output) => print!("{}", output),
        Err(e) => {
            // Compiler errors go to stdout for diffing
            print!("{}", react_compiler::debug_print::format_errors(&e));
        }
    }
}
