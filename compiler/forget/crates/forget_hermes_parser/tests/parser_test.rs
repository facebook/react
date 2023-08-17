use std::env;

use forget_estree::SourceType;
use forget_hermes_parser::parse;
use insta::{assert_snapshot, glob};

#[test]
fn fixtures() {
    glob!("fixtures/**.js", |path| {
        println!("fixture {}", path.to_str().unwrap());
        let input = std::fs::read_to_string(path).unwrap();
        let mut ast = parse(&input, path.to_str().unwrap()).unwrap();
        // TODO: hack to prevent changing lots of fixtures all at once
        ast.source_type = SourceType::Script;
        let output = serde_json::to_string_pretty(&ast).unwrap();
        let output = output.trim();
        assert_snapshot!(format!("Input:\n{input}\n\nOutput:\n{output}"));
    });
}
