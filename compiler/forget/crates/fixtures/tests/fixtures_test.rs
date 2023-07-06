use build_hir::build;
use bumpalo::Bump;
use estree::{ModuleItem, Statement};
use estree_swc::parse;
use hir::{Environment, Registry};
use insta::{assert_snapshot, glob};

#[test]
fn fixtures() {
    glob!("fixtures/**.js", |path| {
        let input = std::fs::read_to_string(path).unwrap();
        let ast = parse(&input, path.to_str().unwrap()).unwrap();

        let mut output = Vec::new();

        for item in ast.body {
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
                    let hir = build(&environment, *fun).unwrap();
                    output.push(format!("{hir:#?}"));
                }
            }
        }

        let joined = output.join("\n\n");
        assert_snapshot!(format!("Input:\n{input}\n\nOutput:\n{joined}"));
    });
}
