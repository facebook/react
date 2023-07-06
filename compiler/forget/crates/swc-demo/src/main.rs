use swc_common::sync::Lrc;
use swc_common::Mark;
use swc_common::{
    errors::{ColorConfig, Handler},
    FileName, SourceMap,
};
use swc_ecma_parser::{lexer::Lexer, Parser, StringInput, Syntax};
use swc_ecma_transforms_base::resolver;
use swc_ecma_visit::swc_ecma_ast::Program;
use swc_ecma_visit::VisitMutWith;

fn main() {
    let cm: Lrc<SourceMap> = Default::default();
    let handler = Handler::with_tty_emitter(ColorConfig::Auto, true, false, Some(cm.clone()));

    // Real usage
    // let fm = cm
    //     .load_file(Path::new("test.js"))
    //     .expect("failed to load test.js");
    let fm = cm.new_source_file(
        FileName::Custom("test.js".into()),
        "function foo(x: number, y: number): number { return x + y}".into(),
    );
    let lexer = Lexer::new(
        // We want to parse ecmascript
        Syntax::Typescript(swc_ecma_parser::TsConfig {
            tsx: true,
            decorators: true,
            ..Default::default()
        }),
        // EsVersion defaults to es5
        Default::default(),
        StringInput::from(&*fm),
        None,
    );

    let mut parser = Parser::new_from(lexer);

    for e in parser.take_errors() {
        e.into_diagnostic(&handler).emit();
    }

    let module = parser
        .parse_module()
        .map_err(|e| {
            // Unrecoverable fatal error occurred
            e.into_diagnostic(&handler).emit()
        })
        .expect("failed to parser module");

    let mut module = Program::Module(module);

    let _result = swc_common::GLOBALS.set(&swc_common::Globals::new(), || {
        let mut resolved = resolver(Mark::new(), Mark::new(), true);
        module.visit_mut_with(&mut resolved)
    });

    println!("{:#?}", module);
}
