// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Workaround for an upstream swc_ecma_codegen bug: `TsNamespaceExportDecl`
//! prints as the `TsExportAssignment` shape.
//!
//! In swc_ecma_codegen v24 (`crates/swc_ecma_codegen/src/typescript.rs`),
//! `TsNamespaceExportDecl::emit` writes `export`, `=`, then the identifier —
//! producing `export = Foo` instead of `export as namespace Foo`. The bug is
//! also present on swc master as of June 2026; no upstream issue has been
//! filed yet.
//!
//! Removal criterion: delete this module and its call site in
//! `emit_module_to_string` when [`tests::upstream_bug_guard`] fails after an
//! swc upgrade (a failure means swc now prints `export as namespace`).
//!
//! # How the rewrite is anchored
//!
//! A genuine `export = Foo` assignment prints the exact same text as the
//! broken namespace-export print, so the affected lines cannot be identified
//! from the output text alone. Instead the emit path records a source map
//! (`Vec<(BytePos, LineCol)>` via `JsWriter`), which attributes output
//! positions to input spans, and the fixup resolves each top-level
//! `TsNamespaceExportDecl` to its output line through it.
//!
//! Empirically (pinned by [`tests::srcmap_records_id_position_within_span`]),
//! the v24 emitter records no entry for the declaration's own `span.lo` —
//! the only position recorded while emitting the node is the identifier's
//! `span.lo`, which lies inside `[span.lo, span.hi)` and maps to the broken
//! line. Candidate entries are therefore collected over that whole span
//! range (exact `span.lo` matches first, then ascending position) and the
//! first candidate line whose content verifies as `export = {id}` (optional
//! trailing `;` / whitespace) is rewritten.
//!
//! Content verification acts as a candidate *filter*, not a post-hoc
//! assertion: compiler-generated items receive synthetic spans starting at
//! `BytePos(1)` (see `transform`), so when the namespace export is the first
//! source statement its `span.lo` collides with a synthetic span and the
//! exact-match candidate points at the generated import's line. The id-span
//! candidate still verifies, so the scan settles on the correct line.
//!
//! If no candidate verifies — or the declaration has a dummy span, so the
//! emitter recorded nothing for it — the fixup panics. A silent fallback
//! would emit `export = Foo`, which has different semantics (an export
//! assignment), and this is exactly the silently-wrong path the previous
//! text-pairing implementation could take when its line matching drifted.

use swc_common::BytePos;
use swc_common::LineCol;
use swc_ecma_ast::ModuleDecl;
use swc_ecma_ast::ModuleItem;
use swc_ecma_ast::TsNamespaceExportDecl;

/// Rewrite the output lines of top-level `TsNamespaceExportDecl` items from
/// the broken `export = {id}` print to `export as namespace {id};`.
///
/// `code` must be the raw emitter output (before any other post-emit text
/// fixups) and `srcmap` the source map recorded while emitting it; line
/// numbers in the source map index directly into `code`'s lines.
pub(crate) fn fix_ts_namespace_export_decls(
    body: &[ModuleItem],
    code: &str,
    srcmap: &[(BytePos, LineCol)],
) -> String {
    let decls: Vec<&TsNamespaceExportDecl> = body
        .iter()
        .filter_map(|item| match item {
            ModuleItem::ModuleDecl(ModuleDecl::TsNamespaceExport(d)) => Some(d),
            _ => None,
        })
        .collect();

    if decls.is_empty() {
        return code.to_string();
    }

    let mut lines: Vec<String> = code.lines().map(str::to_string).collect();
    for decl in decls {
        let id = decl.id.sym.to_string();
        let line_idx = locate_broken_line(decl, &id, &lines, srcmap);
        lines[line_idx] = format!("export as namespace {id};");
    }

    let mut output = lines.join("\n");
    if code.ends_with('\n') {
        output.push('\n');
    }
    output
}

/// Find the output line holding the broken `export = {id}` print of `decl`.
///
/// Candidates are the source-map entries within `[span.lo, span.hi)`,
/// ordered exact-`span.lo` matches first and then by ascending position
/// (stable, so emission order breaks ties). The first candidate line whose
/// content verifies is returned. Panics — deliberately, see the module docs
/// — when the declaration cannot be located.
fn locate_broken_line(
    decl: &TsNamespaceExportDecl,
    id: &str,
    lines: &[String],
    srcmap: &[(BytePos, LineCol)],
) -> usize {
    if decl.span.lo.is_dummy() {
        panic!(
            "[react-compiler] internal error: cannot rewrite `export as namespace {id}`: \
             the declaration has a dummy span, so the emitter recorded no source-map \
             positions for it"
        );
    }

    let mut candidates: Vec<(BytePos, LineCol)> = srcmap
        .iter()
        .filter(|(pos, _)| decl.span.lo <= *pos && *pos < decl.span.hi)
        .copied()
        .collect();
    candidates.sort_by_key(|(pos, _)| (*pos != decl.span.lo, *pos));

    let mut seen_lines: Vec<usize> = Vec::new();
    for (_, loc) in &candidates {
        let line_idx = loc.line as usize;
        if seen_lines.contains(&line_idx) {
            continue;
        }
        seen_lines.push(line_idx);
        if let Some(line) = lines.get(line_idx) {
            if is_broken_namespace_export_line(line, id) {
                return line_idx;
            }
        }
    }

    let candidate_lines: Vec<&str> = seen_lines
        .iter()
        .filter_map(|&idx| lines.get(idx).map(String::as_str))
        .collect();
    panic!(
        "[react-compiler] internal error: cannot rewrite `export as namespace {id}`: no \
         source-map position within its span ({}..{}) maps to an `export = {id}` output \
         line (candidate lines: {candidate_lines:?})",
        decl.span.lo.0, decl.span.hi.0
    );
}

/// Whether `line` is the broken namespace-export print for `id`: exactly
/// `export = {id}`, allowing an optional trailing `;` and trailing
/// whitespace. (The v24 emitter writes no semicolon after this node, but a
/// future swc may add one before fixing the print itself.)
fn is_broken_namespace_export_line(line: &str, id: &str) -> bool {
    let line = line.trim_end();
    let line = line.strip_suffix(';').unwrap_or(line);
    match line.strip_prefix("export = ") {
        Some(rest) => rest == id,
        None => false,
    }
}

#[cfg(test)]
mod tests {
    use swc_common::BytePos;
    use swc_common::FileName;
    use swc_common::LineCol;
    use swc_common::SourceMap;
    use swc_common::Spanned;
    use swc_common::comments::SingleThreadedComments;
    use swc_common::sync::Lrc;
    use swc_ecma_ast::EsVersion;
    use swc_ecma_parser::Syntax;
    use swc_ecma_parser::parse_file_as_module;

    fn parse(source: &str) -> swc_ecma_ast::Module {
        parse_with_comments(source, None)
    }

    fn parse_with_comments(
        source: &str,
        comments: Option<&SingleThreadedComments>,
    ) -> swc_ecma_ast::Module {
        let cm = Lrc::new(SourceMap::default());
        let fm = cm.new_source_file(Lrc::new(FileName::Anon), source.to_string());
        let mut errors = vec![];
        parse_file_as_module(
            &fm,
            Syntax::Typescript(swc_ecma_parser::TsSyntax {
                tsx: true,
                ..Default::default()
            }),
            EsVersion::latest(),
            comments.map(|c| c as &dyn swc_common::comments::Comments),
            &mut errors,
        )
        .expect("Failed to parse")
    }

    /// Plain swc_ecma_codegen emit, WITHOUT the fixup, collecting the
    /// source map.
    fn raw_emit_with_srcmap(module: &swc_ecma_ast::Module) -> (String, Vec<(BytePos, LineCol)>) {
        let cm = Lrc::new(SourceMap::default());
        let mut buf = vec![];
        let mut srcmap: Vec<(BytePos, LineCol)> = Vec::new();
        {
            let wr = swc_ecma_codegen::text_writer::JsWriter::new(
                cm.clone(),
                "\n",
                &mut buf,
                Some(&mut srcmap),
            );
            let mut emitter = swc_ecma_codegen::Emitter {
                cfg: swc_ecma_codegen::Config::default().with_minify(false),
                cm,
                comments: None,
                wr: Box::new(wr),
            };
            swc_ecma_codegen::Node::emit_with(module, &mut emitter).unwrap();
        }
        (String::from_utf8(buf).unwrap(), srcmap)
    }

    /// Emit through the crate's fixed emit path (fixup applied).
    fn fixed_emit(source: &str) -> String {
        let module = parse(source);
        crate::emit_module_to_string(&module, None)
    }

    /// Guard test for the upstream bug. When this test FAILS, swc has fixed
    /// `TsNamespaceExportDecl::emit`: delete this module and its call site
    /// in `emit_module_to_string`.
    #[test]
    fn upstream_bug_guard() {
        let module = parse("export as namespace Foo;\n");
        let (code, _) = raw_emit_with_srcmap(&module);
        assert!(
            code.contains("export = "),
            "expected the upstream TsNamespaceExportDecl bug (`export = `): {code:?}"
        );
        assert!(
            !code.contains("export as namespace"),
            "swc now prints `export as namespace`: the upstream bug is fixed, delete this \
             module: {code:?}"
        );
    }

    /// Pins the source-map invariant the fixup depends on: emitting a
    /// `TsNamespaceExportDecl` records at least one position within the
    /// declaration's span, and that position maps to the broken output
    /// line. Empirically in v24 the recorded position is the identifier's
    /// `span.lo` (the declaration's own `span.lo` is never recorded).
    #[test]
    fn srcmap_records_id_position_within_span() {
        let source = "const x = 1;\nexport as namespace Foo;\n";
        let module = parse(source);
        let decl_span = module.body[1].span();
        let id_span = match &module.body[1] {
            swc_ecma_ast::ModuleItem::ModuleDecl(swc_ecma_ast::ModuleDecl::TsNamespaceExport(
                d,
            )) => d.id.span,
            other => panic!("expected TsNamespaceExport, got {other:?}"),
        };

        let (code, srcmap) = raw_emit_with_srcmap(&module);
        let in_range: Vec<&(BytePos, LineCol)> = srcmap
            .iter()
            .filter(|(pos, _)| decl_span.lo <= *pos && *pos < decl_span.hi)
            .collect();

        assert!(
            !in_range.is_empty(),
            "no srcmap position recorded within the decl span; the srcmap-anchored fixup \
             design no longer works: {srcmap:?}"
        );
        // The identifier's lo is the recorded anchor...
        assert_eq!(in_range[0].0, id_span.lo);
        // ...and it maps to the broken `export = Foo` line.
        let line = code.lines().nth(in_range[0].1.line as usize).unwrap();
        assert_eq!(line, "export = Foo");
        // The declaration's own span.lo is not recorded by the v24 emitter.
        assert!(
            !srcmap.iter().any(|(pos, _)| *pos == decl_span.lo),
            "v24 unexpectedly records the decl's span.lo; revisit candidate ordering: \
             {srcmap:?}"
        );
    }

    /// The emitter prints the genuine assignment as `export = lib` (its
    /// pending semicolon is dropped before the newline), byte-identical in
    /// shape to the broken namespace print, so only the srcmap tells them
    /// apart.
    #[test]
    fn umd_pair_rewrites_only_the_namespace_export() {
        assert_eq!(
            fixed_emit("export = lib;\nexport as namespace Foo;\n"),
            "export = lib\nexport as namespace Foo;\n"
        );
    }

    #[test]
    fn two_namespace_exports() {
        assert_eq!(
            fixed_emit("export as namespace A;\nexport as namespace B;\n"),
            "export as namespace A;\nexport as namespace B;\n"
        );
    }

    /// The decoy's span lies outside the declaration's span, so it is never
    /// a rewrite candidate.
    #[test]
    fn template_literal_decoy_is_not_rewritten() {
        let source = "const s = `\nexport = Foo\n`;\nexport as namespace Foo;\n";
        assert_eq!(
            fixed_emit(source),
            "const s = `\nexport = Foo\n`;\nexport as namespace Foo;\n"
        );
    }

    /// The expected output keeps `*/ const x = 1;` on one line: the raw
    /// emitter glues code after a block comment, and the later
    /// `fix_block_comment_newlines` pass (not under test here) splits it.
    #[test]
    fn block_comment_decoy_is_not_rewritten() {
        let source = "/*\nexport = Foo\n*/\nconst x = 1;\nexport as namespace Foo;\n";
        let comments = SingleThreadedComments::default();
        let module = parse_with_comments(source, Some(&comments));
        let code = crate::emit_module_to_string(&module, Some(&comments));
        assert_eq!(
            code,
            "/*\nexport = Foo\n*/ const x = 1;\nexport as namespace Foo;\n"
        );
    }

    #[test]
    fn parenthesized_export_assignment_is_untouched() {
        assert_eq!(
            fixed_emit("export = (Foo);\nexport as namespace Foo;\n"),
            "export = (Foo)\nexport as namespace Foo;\n"
        );
    }

    /// The real-pipeline collision shape: the namespace export is the first
    /// source statement (span.lo == BytePos(1)) and a compiler-generated
    /// import carries the synthetic span BytePos(1) (see `transform`). The
    /// exact-`span.lo` candidate points at the import's line; content
    /// verification filters it out and the id-span candidate wins.
    #[test]
    fn synthetic_span_collision_resolves_to_the_real_line() {
        let source = "export as namespace Foo;\nfunction f() {}\n";
        let mut module = parse(source);
        let synthetic_span = swc_common::Span::new(BytePos(1), BytePos(1));
        module.body.insert(
            0,
            swc_ecma_ast::ModuleItem::ModuleDecl(swc_ecma_ast::ModuleDecl::Import(
                swc_ecma_ast::ImportDecl {
                    span: synthetic_span,
                    specifiers: vec![],
                    src: Box::new(swc_ecma_ast::Str {
                        span: swc_common::DUMMY_SP,
                        value: "react/compiler-runtime".into(),
                        raw: None,
                    }),
                    type_only: false,
                    with: None,
                    phase: Default::default(),
                },
            )),
        );

        let code = crate::emit_module_to_string(&module, None);
        assert_eq!(
            code,
            "import \"react/compiler-runtime\";\nexport as namespace Foo;\nfunction f() {}\n"
        );
    }

    #[test]
    #[should_panic(expected = "[react-compiler] internal error")]
    fn dummy_span_panics_loudly() {
        let module = swc_ecma_ast::Module {
            span: swc_common::DUMMY_SP,
            body: vec![swc_ecma_ast::ModuleItem::ModuleDecl(
                swc_ecma_ast::ModuleDecl::TsNamespaceExport(swc_ecma_ast::TsNamespaceExportDecl {
                    span: swc_common::DUMMY_SP,
                    id: swc_ecma_ast::Ident::new_no_ctxt("Foo".into(), swc_common::DUMMY_SP),
                }),
            )],
            shebang: None,
        };
        crate::emit_module_to_string(&module, None);
    }
}
