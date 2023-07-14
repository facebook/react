use std::env;
use std::fmt::Write;

use bumpalo::Bump;
use forget_build_hir::build;
use forget_estree::{ModuleItem, Statement};
use forget_estree_swc::parse;
use forget_hir::{Environment, Features, Print, Registry};
use forget_optimization::constant_propagation;
use forget_ssa::{eliminate_redundant_phis, enter_ssa};
use insta::{assert_snapshot, glob};
use miette::{NamedSource, Report};

#[test]
fn fixtures() {
    glob!("fixtures/**.js", |path| {
        println!("fixture {}", path.to_str().unwrap());
        let input = std::fs::read_to_string(path).unwrap();
        let ast = parse(&input, path.to_str().unwrap()).unwrap();
        println!("ok parse");

        let mut output = String::new();

        for (ix, item) in ast.body.into_iter().enumerate() {
            if let ModuleItem::Statement(stmt) = item {
                if let Statement::FunctionDeclaration(fun) = stmt {
                    let allocator = Bump::new();
                    let environment = allocator.alloc(Environment::new(
                        &allocator,
                        Features {
                            validate_frozen_lambdas: true,
                        },
                        Registry,
                    ));
                    if ix != 0 {
                        output.push_str("\n\n");
                    }
                    match build(&environment, fun.function) {
                        Ok(mut fun) => {
                            // println!("{fun:#?}");
                            // let mut out = String::new();
                            // fun.print(&fun.body, &mut out).unwrap();
                            // println!("{out}");
                            println!("ok build");
                            enter_ssa(&environment, &mut fun).unwrap();
                            println!("ok enter_ssa");
                            eliminate_redundant_phis(&environment, &mut fun);
                            println!("ok eliminate_redundant_phis");
                            constant_propagation(&environment, &mut fun);
                            println!("ok constant_propagation");
                            fun.print(&fun.body, &mut output).unwrap();
                            println!("ok print");
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

        let output = output.trim();
        assert_snapshot!(format!("Input:\n{input}\n\nOutput:\n{output}"));
    });
}
