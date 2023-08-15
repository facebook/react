use std::fmt::Write;

use forget_hermes_parser::parse;
use forget_semantic_analysis::analyze;
use insta::{assert_snapshot, glob};
use miette::{NamedSource, Report};

#[test]
fn fixtures() {
    glob!("fixtures/**.js", |path| {
        println!("fixture {}", path.to_str().unwrap());
        let input = std::fs::read_to_string(path).unwrap();
        let ast = parse(&input, path.to_str().unwrap()).unwrap();
        let mut analysis = analyze(&ast);

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
