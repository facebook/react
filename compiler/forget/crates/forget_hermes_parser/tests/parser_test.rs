use std::env;

use forget_hermes_parser::parse;
use insta::{assert_snapshot, glob};
use serde_json;

#[test]
fn fixtures() {
    glob!("fixtures/**.js", |path| {
        println!("fixture {}", path.to_str().unwrap());
        let input = std::fs::read_to_string(path).unwrap();
        let ast = parse(&input, path.to_str().unwrap()).unwrap();
        let output = serde_json::to_string_pretty(&ast).unwrap();
        let output = output.trim();
        assert_snapshot!(format!("Input:\n{input}\n\nOutput:\n{output}"));
    });
}
