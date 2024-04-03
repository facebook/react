/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use std::fmt::Write;

use insta::{assert_snapshot, glob};
use miette::{NamedSource, Report};
use react_hermes_parser::parse;
use react_semantic_analysis::{analyze, AnalyzeOptions};

#[test]
fn fixtures() {
    glob!("fixtures/**.js", |path| {
        println!("fixture {}", path.to_str().unwrap());
        let input = std::fs::read_to_string(path).unwrap();
        let ast = parse(&input, path.to_str().unwrap()).unwrap();
        let mut analysis = analyze(
            &ast,
            AnalyzeOptions {
                globals: vec![
                    "Array".to_string(),
                    "Boolean".to_string(),
                    "console".to_string(),
                    "global".to_string(),
                    "Math".to_string(),
                    "Number".to_string(),
                    "setInterval".to_string(),
                    "setTimeout".to_string(),
                    "String".to_string(),
                ],
            },
        );

        let mut output = String::new();
        writeln!(&mut output, "{:#?}", analysis.debug()).unwrap();
        let diagnostics = analysis.diagnostics();
        for diagnostic in diagnostics {
            writeln!(&mut output, "{:#?}", diagnostic).unwrap();
            println!(
                "{:?}",
                Report::new(diagnostic)
                    .with_source_code(NamedSource::new(path.to_string_lossy(), input.clone()))
            );
        }
        assert_snapshot!(format!("Input:\n{input}\n\nAnalysis:\n{output}"));
    });
}
