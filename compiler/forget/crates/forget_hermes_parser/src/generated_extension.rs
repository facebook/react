use std::num::NonZeroU32;

use forget_estree::{
    ArrowFunctionExpression, AssignmentProperty, Class, ClassBody, ClassDeclaration,
    ClassExpression, Expression, ExpressionOrSpread, Function, FunctionBody, FunctionDeclaration,
    FunctionExpression, Identifier, Number, Pattern, SourceRange, TemplateElement,
    TemplateElementValue,
};
use hermes::parser::{
    hermes_get_ArrowFunctionExpression_async, hermes_get_ArrowFunctionExpression_body,
    hermes_get_ArrowFunctionExpression_expression, hermes_get_ArrowFunctionExpression_id,
    hermes_get_ArrowFunctionExpression_params, hermes_get_ClassDeclaration_body,
    hermes_get_ClassDeclaration_id, hermes_get_ClassDeclaration_superClass,
    hermes_get_ClassExpression_body, hermes_get_ClassExpression_id,
    hermes_get_ClassExpression_superClass, hermes_get_FunctionDeclaration_async,
    hermes_get_FunctionDeclaration_body, hermes_get_FunctionDeclaration_generator,
    hermes_get_FunctionDeclaration_id, hermes_get_FunctionDeclaration_params,
    hermes_get_FunctionExpression_async, hermes_get_FunctionExpression_body,
    hermes_get_FunctionExpression_generator, hermes_get_FunctionExpression_id,
    hermes_get_FunctionExpression_params, hermes_get_Property_key, hermes_get_Property_kind,
    hermes_get_Property_method, hermes_get_Property_value, NodeKind, NodeLabel, NodeLabelOpt,
    NodeListRef, NodePtr, NodePtrOpt, NodeString, NodeStringOpt, SMRange,
};
use hermes::utf::utf8_with_surrogates_to_string;

pub struct Context;

impl Context {
    pub fn new() -> Self {
        Self
    }
}

pub trait FromHermes {
    fn convert(cx: &mut Context, node: NodePtr) -> Self;
}
pub trait FromHermesLabel {
    fn convert(cx: &mut Context, label: NodeLabel) -> Self;
}

pub fn convert_option<F, T>(node: NodePtrOpt, mut f: F) -> Option<T>
where
    F: FnMut(NodePtr) -> T,
{
    node.as_node_ptr().map(|node| f(node))
}

pub fn convert_vec<F, T>(node: NodeListRef, mut f: F) -> Vec<T>
where
    F: FnMut(NodePtr) -> T,
{
    node.iter().map(|node| f(NodePtr::new(node))).collect()
}

pub fn convert_vec_of_option<F, T>(node: NodeListRef, mut f: F) -> Vec<Option<T>>
where
    F: FnMut(NodePtr) -> T,
{
    node.iter()
        .map(|node| {
            let node = NodePtr::new(node);
            let node_ref = node.as_ref();
            match node_ref.kind {
                NodeKind::Empty => None,
                _ => Some(f(node)),
            }
        })
        .collect()
}

pub fn convert_range(node: NodePtr) -> SourceRange {
    let _range = node.as_ref().source_range;
    SourceRange {
        start: 0,
        end: NonZeroU32::new(1).unwrap(),
    }
}

#[allow(dead_code)]
pub fn convert_smrange(_range: SMRange) -> SourceRange {
    todo!()
}

pub fn convert_string(_cx: &mut Context, label: NodeLabel) -> String {
    utf8_with_surrogates_to_string(label.as_slice()).unwrap()
}

#[allow(dead_code)]
pub fn convert_option_string(cx: &mut Context, label: NodeLabelOpt) -> Option<String> {
    label.as_node_label().map(|label| convert_string(cx, label))
}

pub fn convert_string_value(_cx: &mut Context, label: NodeString) -> String {
    utf8_with_surrogates_to_string(label.as_slice()).unwrap()
}

pub fn convert_option_string_value(_cx: &mut Context, label: NodeStringOpt) -> Option<String> {
    label
        .as_node_string()
        .map(|label| utf8_with_surrogates_to_string(label.as_slice()).unwrap())
}

pub fn convert_number(value: f64) -> Number {
    value.into()
}

pub fn convert_array_expression_elements(
    cx: &mut Context,
    node: NodeListRef,
) -> Vec<Option<ExpressionOrSpread>> {
    convert_vec_of_option(node, |node| ExpressionOrSpread::convert(cx, node))
}

impl FromHermes for TemplateElement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let range = convert_range(node);
        let tail = unsafe { hermes::parser::hermes_get_TemplateElement_tail(node) };
        let value = TemplateElementValue {
            cooked: convert_option_string_value(cx, unsafe {
                hermes::parser::hermes_get_TemplateElement_cooked(node)
            }),
            raw: convert_string(cx, unsafe {
                hermes::parser::hermes_get_TemplateElement_raw(node)
            }),
        };
        Self {
            tail,
            value,
            loc: None,
            range: Some(range),
        }
    }
}

impl FromHermes for AssignmentProperty {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let key = FromHermes::convert(cx, unsafe { hermes_get_Property_key(node) });
        let value = FromHermes::convert(cx, unsafe { hermes_get_Property_value(node) });
        let kind = FromHermesLabel::convert(cx, unsafe { hermes_get_Property_kind(node) });
        let method = unsafe { hermes_get_Property_method(node) };
        let loc = None;
        let range = convert_range(node);
        AssignmentProperty {
            key,
            value,
            kind,
            method,
            loc,
            range: Some(range),
        }
    }
}

impl FromHermes for FunctionDeclaration {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let id = convert_option(unsafe { hermes_get_FunctionDeclaration_id(node) }, |node| {
            Identifier::convert(cx, node)
        });
        let params = convert_vec(
            unsafe { hermes_get_FunctionDeclaration_params(node) },
            |node| Pattern::convert(cx, node),
        );
        let body = FunctionBody::convert(cx, unsafe { hermes_get_FunctionDeclaration_body(node) });
        let is_generator = unsafe { hermes_get_FunctionDeclaration_generator(node) };
        let is_async = unsafe { hermes_get_FunctionDeclaration_async(node) };
        let loc = None;
        let range = convert_range(node);
        FunctionDeclaration {
            function: Function {
                id,
                params,
                body: Some(body),
                is_generator,
                is_async,
                loc: loc.clone(),
                range: Some(range),
            },
            loc,
            range: Some(range),
        }
    }
}

impl FromHermes for FunctionExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let id = convert_option(unsafe { hermes_get_FunctionExpression_id(node) }, |node| {
            Identifier::convert(cx, node)
        });
        let params = convert_vec(
            unsafe { hermes_get_FunctionExpression_params(node) },
            |node| Pattern::convert(cx, node),
        );
        let body = FunctionBody::convert(cx, unsafe { hermes_get_FunctionExpression_body(node) });
        let is_generator = unsafe { hermes_get_FunctionExpression_generator(node) };
        let is_async = unsafe { hermes_get_FunctionExpression_async(node) };
        let loc = None;
        let range = convert_range(node);
        FunctionExpression {
            function: Function {
                id,
                params,
                body: Some(body),
                is_generator,
                is_async,
                loc: loc.clone(),
                range: Some(range),
            },
            loc,
            range: Some(range),
        }
    }
}

impl FromHermes for ArrowFunctionExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let id = convert_option(
            unsafe { hermes_get_ArrowFunctionExpression_id(node) },
            |node| Identifier::convert(cx, node),
        );
        let params = convert_vec(
            unsafe { hermes_get_ArrowFunctionExpression_params(node) },
            |node| Pattern::convert(cx, node),
        );
        let body =
            FunctionBody::convert(cx, unsafe { hermes_get_ArrowFunctionExpression_body(node) });
        let is_generator = unsafe { hermes_get_FunctionExpression_generator(node) };
        let is_async = unsafe { hermes_get_ArrowFunctionExpression_async(node) };
        let is_expression = unsafe { hermes_get_ArrowFunctionExpression_expression(node) };
        let loc = None;
        let range = convert_range(node);
        ArrowFunctionExpression {
            function: Function {
                id,
                params,
                body: Some(body),
                is_generator,
                is_async,
                loc: loc.clone(),
                range: Some(range),
            },
            is_expression,
            loc,
            range: Some(range),
        }
    }
}

impl FromHermes for ClassDeclaration {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let id = convert_option(unsafe { hermes_get_ClassDeclaration_id(node) }, |node| {
            Identifier::convert(cx, node)
        });
        let super_class = convert_option(
            unsafe { hermes_get_ClassDeclaration_superClass(node) },
            |node| Expression::convert(cx, node),
        );
        let body = ClassBody::convert(cx, unsafe { hermes_get_ClassDeclaration_body(node) });
        let loc = None;
        let range = convert_range(node);
        ClassDeclaration {
            class: Class {
                id,
                super_class,
                body,
            },
            loc,
            range: Some(range),
        }
    }
}
impl FromHermes for ClassExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let id = convert_option(unsafe { hermes_get_ClassExpression_id(node) }, |node| {
            Identifier::convert(cx, node)
        });
        let super_class = convert_option(
            unsafe { hermes_get_ClassExpression_superClass(node) },
            |node| Expression::convert(cx, node),
        );
        let body = ClassBody::convert(cx, unsafe { hermes_get_ClassExpression_body(node) });
        let loc = None;
        let range = convert_range(node);
        ClassExpression {
            class: Class {
                id,
                super_class,
                body,
            },
            loc,
            range: Some(range),
        }
    }
}
