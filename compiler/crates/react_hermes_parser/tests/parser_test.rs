/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use std::env;

use insta::{assert_snapshot, glob};
use react_estree::SourceType;
use react_hermes_parser::parse;

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
