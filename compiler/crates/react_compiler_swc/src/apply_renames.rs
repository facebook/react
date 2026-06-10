// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

use std::collections::HashMap;

use react_compiler::entrypoint::compile_result::BindingRenameInfo;
use react_compiler_ast::scope::BindingId;
use swc_atoms::Atom;
use swc_ecma_ast::*;
use swc_ecma_visit::{VisitMut, VisitMutWith};

use crate::convert_scope::build_scope_info;

pub fn apply_renames(module: &mut Module, renames: &[BindingRenameInfo]) {
    if renames.is_empty() {
        return;
    }

    let scope_info = build_scope_info(module);
    let renames_by_declaration: HashMap<u32, &BindingRenameInfo> = renames
        .iter()
        .map(|rename| (rename.declaration_start, rename))
        .collect();
    let mut renamed_bindings: HashMap<BindingId, String> = HashMap::new();

    for binding in &scope_info.bindings {
        let Some(rename) = binding
            .declaration_start
            .and_then(|start| renames_by_declaration.get(&start))
        else {
            continue;
        };
        if binding.name == rename.original {
            renamed_bindings.insert(binding.id, rename.renamed.clone());
        }
    }

    if renamed_bindings.is_empty() {
        return;
    }

    let rewrite_plan: HashMap<u32, String> = scope_info
        .reference_to_binding
        .iter()
        .filter_map(|(&position, binding_id)| {
            renamed_bindings
                .get(binding_id)
                .map(|renamed| (position, renamed.clone()))
        })
        .collect();

    module.visit_mut_with(&mut RenameApplyVisitor { rewrite_plan });
}

struct RenameApplyVisitor {
    rewrite_plan: HashMap<u32, String>,
}

impl RenameApplyVisitor {
    fn renamed_at(&self, position: u32) -> Option<String> {
        self.rewrite_plan.get(&position).cloned()
    }
}

impl VisitMut for RenameApplyVisitor {
    fn visit_mut_ident(&mut self, ident: &mut Ident) {
        if let Some(renamed) = self.renamed_at(ident.span.lo.0) {
            ident.sym = Atom::from(renamed);
        }
    }

    fn visit_mut_member_expr(&mut self, member: &mut MemberExpr) {
        member.obj.visit_mut_with(self);
        if let MemberProp::Computed(computed) = &mut member.prop {
            computed.visit_mut_with(self);
        }
    }

    fn visit_mut_prop(&mut self, prop: &mut Prop) {
        match prop {
            Prop::Shorthand(ident) => {
                if let Some(renamed) = self.renamed_at(ident.span.lo.0) {
                    let mut value = ident.clone();
                    value.sym = Atom::from(renamed);
                    // Shorthand `{ref}` must become `{ref: ref_0}` to preserve property semantics.
                    *prop = Prop::KeyValue(KeyValueProp {
                        key: PropName::Ident(IdentName {
                            span: ident.span,
                            sym: ident.sym.clone(),
                        }),
                        value: Box::new(Expr::Ident(value)),
                    });
                }
            }
            Prop::Assign(assign) => {
                assign.value.visit_mut_with(self);
            }
            _ => prop.visit_mut_children_with(self),
        }
    }

    fn visit_mut_object_pat_prop(&mut self, prop: &mut ObjectPatProp) {
        match prop {
            ObjectPatProp::Assign(assign) => {
                if let Some(value) = &mut assign.value {
                    value.visit_mut_with(self);
                }

                if let Some(renamed) = self.renamed_at(assign.key.id.span.lo.0) {
                    let mut binding = assign.key.clone();
                    binding.id.sym = Atom::from(renamed);
                    let value = match assign.value.take() {
                        Some(default_value) => Pat::Assign(AssignPat {
                            span: assign.span,
                            left: Box::new(Pat::Ident(binding)),
                            right: default_value,
                        }),
                        None => Pat::Ident(binding),
                    };

                    *prop = ObjectPatProp::KeyValue(KeyValuePatProp {
                        key: PropName::Ident(IdentName {
                            span: assign.key.id.span,
                            sym: assign.key.id.sym.clone(),
                        }),
                        value: Box::new(value),
                    });
                }
            }
            _ => prop.visit_mut_children_with(self),
        }
    }
}
