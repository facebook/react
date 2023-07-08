use std::fmt::Write;

use build_hir::build;
use bumpalo::Bump;
use estree::{ModuleItem, Statement};
use estree_swc::parse;
use hir::{Environment, Print, Registry};
use insta::{assert_snapshot, glob};
use miette::{NamedSource, Report};

#[test]
fn fixtures() {
    glob!("fixtures/**.js", |path| {
        let input = std::fs::read_to_string(path).unwrap();
        let ast = parse(&input, path.to_str().unwrap()).unwrap();

        let mut output = String::new();

        for (ix, item) in ast.body.into_iter().enumerate() {
            if let ModuleItem::Statement(stmt) = item {
                if let Statement::FunctionDeclaration(fun) = *stmt {
                    let allocator = Bump::new();
                    let environment = allocator.alloc(Environment::new(
                        &allocator,
                        hir::Features {
                            validate_frozen_lambdas: true,
                        },
                        Registry,
                    ));
                    if ix != 0 {
                        output.push_str("\n\n");
                    }
                    match build(&environment, *fun) {
                        Ok(hir) => {
                            hir.print(&mut output).unwrap();
                        }
                        Err(error) => {
                            write!(&mut output, "{}", error,).unwrap();
                            eprintln!(
                                "{:?}",
                                Report::new(error).with_source_code(NamedSource::new(
                                    path.to_string_lossy(),
                                    input.clone(),
                                ))
                            );
                            continue;
                        }
                    };
                }
            }
        }

        assert_snapshot!(format!("Input:\n{input}\n\nOutput:\n{output}"));
    });
}
