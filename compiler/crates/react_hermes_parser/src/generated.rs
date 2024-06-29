/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @generated
#![cfg_attr(rustfmt, rustfmt_skip)]
#![allow(dead_code)]
#![allow(unused_variables)]
#![allow(clippy::enum_variant_names)]
use react_estree::*;
use hermes::parser::{NodePtr, NodeKind, NodeLabel};
use hermes::utf::utf8_with_surrogates_to_string;
use crate::generated_extension::*;
impl FromHermes for Identifier {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::Identifier);
        let range = convert_range(cx, node);
        let name = convert_string(
            cx,
            unsafe { hermes::parser::hermes_get_Identifier_name(node) },
        );
        let binding = Default::default();
        let type_annotation = Default::default();
        Self {
            name,
            binding,
            type_annotation,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for NumericLiteral {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::NumericLiteral);
        let range = convert_range(cx, node);
        let value = convert_number(unsafe {
            hermes::parser::hermes_get_NumericLiteral_value(node)
        });
        Self {
            value,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for BooleanLiteral {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::BooleanLiteral);
        let range = convert_range(cx, node);
        let value = unsafe { hermes::parser::hermes_get_BooleanLiteral_value(node) };
        Self {
            value,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for NullLiteral {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::NullLiteral);
        let range = convert_range(cx, node);
        Self {
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for StringLiteral {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::StringLiteral);
        let range = convert_range(cx, node);
        let value = convert_string_value(
            cx,
            unsafe { hermes::parser::hermes_get_StringLiteral_value(node) },
        );
        Self {
            value,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for RegExpLiteral {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::RegExpLiteral);
        let range = convert_range(cx, node);
        let pattern = convert_string(
            cx,
            unsafe { hermes::parser::hermes_get_RegExpLiteral_pattern(node) },
        );
        let flags = convert_string(
            cx,
            unsafe { hermes::parser::hermes_get_RegExpLiteral_flags(node) },
        );
        Self {
            pattern,
            flags,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for Program {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::Program);
        let range = convert_range(cx, node);
        let body = convert_vec(
            unsafe { hermes::parser::hermes_get_Program_body(node) },
            |node| ModuleItem::convert(cx, node),
        );
        let source_type = Default::default();
        Self {
            body,
            source_type,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ExpressionStatement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ExpressionStatement);
        let range = convert_range(cx, node);
        let expression = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_ExpressionStatement_expression(node) },
        );
        let directive = Default::default();
        Self {
            expression,
            directive,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for BlockStatement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::BlockStatement);
        let range = convert_range(cx, node);
        let body = convert_vec(
            unsafe { hermes::parser::hermes_get_BlockStatement_body(node) },
            |node| Statement::convert(cx, node),
        );
        Self {
            body,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for EmptyStatement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::EmptyStatement);
        let range = convert_range(cx, node);
        Self {
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for DebuggerStatement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::DebuggerStatement);
        let range = convert_range(cx, node);
        Self {
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for WithStatement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::WithStatement);
        let range = convert_range(cx, node);
        let object = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_WithStatement_object(node) },
        );
        let body = Statement::convert(
            cx,
            unsafe { hermes::parser::hermes_get_WithStatement_body(node) },
        );
        Self {
            object,
            body,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ReturnStatement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ReturnStatement);
        let range = convert_range(cx, node);
        let argument = convert_option(
            unsafe { hermes::parser::hermes_get_ReturnStatement_argument(node) },
            |node| Expression::convert(cx, node),
        );
        Self {
            argument,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for LabeledStatement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::LabeledStatement);
        let range = convert_range(cx, node);
        let label = Identifier::convert(
            cx,
            unsafe { hermes::parser::hermes_get_LabeledStatement_label(node) },
        );
        let body = Statement::convert(
            cx,
            unsafe { hermes::parser::hermes_get_LabeledStatement_body(node) },
        );
        Self {
            label,
            body,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for BreakStatement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::BreakStatement);
        let range = convert_range(cx, node);
        let label = convert_option(
            unsafe { hermes::parser::hermes_get_BreakStatement_label(node) },
            |node| Identifier::convert(cx, node),
        );
        Self {
            label,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ContinueStatement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ContinueStatement);
        let range = convert_range(cx, node);
        let label = convert_option(
            unsafe { hermes::parser::hermes_get_ContinueStatement_label(node) },
            |node| Identifier::convert(cx, node),
        );
        Self {
            label,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for IfStatement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::IfStatement);
        let range = convert_range(cx, node);
        let test = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_IfStatement_test(node) },
        );
        let consequent = Statement::convert(
            cx,
            unsafe { hermes::parser::hermes_get_IfStatement_consequent(node) },
        );
        let alternate = convert_option(
            unsafe { hermes::parser::hermes_get_IfStatement_alternate(node) },
            |node| Statement::convert(cx, node),
        );
        Self {
            test,
            consequent,
            alternate,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for SwitchStatement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::SwitchStatement);
        let range = convert_range(cx, node);
        let discriminant = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_SwitchStatement_discriminant(node) },
        );
        let cases = convert_vec(
            unsafe { hermes::parser::hermes_get_SwitchStatement_cases(node) },
            |node| SwitchCase::convert(cx, node),
        );
        Self {
            discriminant,
            cases,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for SwitchCase {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::SwitchCase);
        let range = convert_range(cx, node);
        let test = convert_option(
            unsafe { hermes::parser::hermes_get_SwitchCase_test(node) },
            |node| Expression::convert(cx, node),
        );
        let consequent = convert_vec(
            unsafe { hermes::parser::hermes_get_SwitchCase_consequent(node) },
            |node| Statement::convert(cx, node),
        );
        Self {
            test,
            consequent,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ThrowStatement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ThrowStatement);
        let range = convert_range(cx, node);
        let argument = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_ThrowStatement_argument(node) },
        );
        Self {
            argument,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for TryStatement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::TryStatement);
        let range = convert_range(cx, node);
        let block = BlockStatement::convert(
            cx,
            unsafe { hermes::parser::hermes_get_TryStatement_block(node) },
        );
        let handler = convert_option(
            unsafe { hermes::parser::hermes_get_TryStatement_handler(node) },
            |node| CatchClause::convert(cx, node),
        );
        let finalizer = convert_option(
            unsafe { hermes::parser::hermes_get_TryStatement_finalizer(node) },
            |node| BlockStatement::convert(cx, node),
        );
        Self {
            block,
            handler,
            finalizer,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for CatchClause {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::CatchClause);
        let range = convert_range(cx, node);
        let param = convert_option(
            unsafe { hermes::parser::hermes_get_CatchClause_param(node) },
            |node| Pattern::convert(cx, node),
        );
        let body = BlockStatement::convert(
            cx,
            unsafe { hermes::parser::hermes_get_CatchClause_body(node) },
        );
        Self {
            param,
            body,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for WhileStatement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::WhileStatement);
        let range = convert_range(cx, node);
        let test = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_WhileStatement_test(node) },
        );
        let body = Statement::convert(
            cx,
            unsafe { hermes::parser::hermes_get_WhileStatement_body(node) },
        );
        Self {
            test,
            body,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for DoWhileStatement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::DoWhileStatement);
        let range = convert_range(cx, node);
        let body = Statement::convert(
            cx,
            unsafe { hermes::parser::hermes_get_DoWhileStatement_body(node) },
        );
        let test = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_DoWhileStatement_test(node) },
        );
        Self {
            body,
            test,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ForStatement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ForStatement);
        let range = convert_range(cx, node);
        let init = convert_option(
            unsafe { hermes::parser::hermes_get_ForStatement_init(node) },
            |node| ForInit::convert(cx, node),
        );
        let test = convert_option(
            unsafe { hermes::parser::hermes_get_ForStatement_test(node) },
            |node| Expression::convert(cx, node),
        );
        let update = convert_option(
            unsafe { hermes::parser::hermes_get_ForStatement_update(node) },
            |node| Expression::convert(cx, node),
        );
        let body = Statement::convert(
            cx,
            unsafe { hermes::parser::hermes_get_ForStatement_body(node) },
        );
        Self {
            init,
            test,
            update,
            body,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ForInStatement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ForInStatement);
        let range = convert_range(cx, node);
        let left = ForInInit::convert(
            cx,
            unsafe { hermes::parser::hermes_get_ForInStatement_left(node) },
        );
        let right = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_ForInStatement_right(node) },
        );
        let body = Statement::convert(
            cx,
            unsafe { hermes::parser::hermes_get_ForInStatement_body(node) },
        );
        Self {
            left,
            right,
            body,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ForOfStatement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ForOfStatement);
        let range = convert_range(cx, node);
        let is_await = unsafe { hermes::parser::hermes_get_ForOfStatement_await(node) };
        let left = ForInInit::convert(
            cx,
            unsafe { hermes::parser::hermes_get_ForOfStatement_left(node) },
        );
        let right = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_ForOfStatement_right(node) },
        );
        let body = Statement::convert(
            cx,
            unsafe { hermes::parser::hermes_get_ForOfStatement_body(node) },
        );
        Self {
            is_await,
            left,
            right,
            body,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ClassBody {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ClassBody);
        let range = convert_range(cx, node);
        let body = convert_vec(
            unsafe { hermes::parser::hermes_get_ClassBody_body(node) },
            |node| ClassItem::convert(cx, node),
        );
        Self {
            body,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for MethodDefinition {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::MethodDefinition);
        let range = convert_range(cx, node);
        let key = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_MethodDefinition_key(node) },
        );
        let value = FunctionExpression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_MethodDefinition_value(node) },
        );
        let kind = MethodKind::convert(
            cx,
            unsafe { hermes::parser::hermes_get_MethodDefinition_kind(node) },
        );
        let is_computed = unsafe {
            hermes::parser::hermes_get_MethodDefinition_computed(node)
        };
        let is_static = unsafe {
            hermes::parser::hermes_get_MethodDefinition_static(node)
        };
        Self {
            key,
            value,
            kind,
            is_computed,
            is_static,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for VariableDeclaration {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::VariableDeclaration);
        let range = convert_range(cx, node);
        let kind = VariableDeclarationKind::convert(
            cx,
            unsafe { hermes::parser::hermes_get_VariableDeclaration_kind(node) },
        );
        let declarations = convert_vec(
            unsafe { hermes::parser::hermes_get_VariableDeclaration_declarations(node) },
            |node| VariableDeclarator::convert(cx, node),
        );
        Self {
            kind,
            declarations,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for VariableDeclarator {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::VariableDeclarator);
        let range = convert_range(cx, node);
        let id = Pattern::convert(
            cx,
            unsafe { hermes::parser::hermes_get_VariableDeclarator_id(node) },
        );
        let init = convert_option(
            unsafe { hermes::parser::hermes_get_VariableDeclarator_init(node) },
            |node| Expression::convert(cx, node),
        );
        Self {
            id,
            init,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ThisExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ThisExpression);
        let range = convert_range(cx, node);
        Self {
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ArrayExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ArrayExpression);
        let range = convert_range(cx, node);
        let elements = convert_array_expression_elements(
            cx,
            unsafe { hermes::parser::hermes_get_ArrayExpression_elements(node) },
        );
        Self {
            elements,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ObjectExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ObjectExpression);
        let range = convert_range(cx, node);
        let properties = convert_vec(
            unsafe { hermes::parser::hermes_get_ObjectExpression_properties(node) },
            |node| PropertyOrSpreadElement::convert(cx, node),
        );
        Self {
            properties,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for Property {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::Property);
        let range = convert_range(cx, node);
        let key = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_Property_key(node) },
        );
        let value = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_Property_value(node) },
        );
        let kind = PropertyKind::convert(
            cx,
            unsafe { hermes::parser::hermes_get_Property_kind(node) },
        );
        let is_method = unsafe { hermes::parser::hermes_get_Property_method(node) };
        let is_shorthand = unsafe {
            hermes::parser::hermes_get_Property_shorthand(node)
        };
        let is_computed = unsafe { hermes::parser::hermes_get_Property_computed(node) };
        Self {
            key,
            value,
            kind,
            is_method,
            is_shorthand,
            is_computed,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for UnaryExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::UnaryExpression);
        let range = convert_range(cx, node);
        let operator = UnaryOperator::convert(
            cx,
            unsafe { hermes::parser::hermes_get_UnaryExpression_operator(node) },
        );
        let prefix = unsafe { hermes::parser::hermes_get_UnaryExpression_prefix(node) };
        let argument = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_UnaryExpression_argument(node) },
        );
        Self {
            operator,
            prefix,
            argument,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for UpdateExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::UpdateExpression);
        let range = convert_range(cx, node);
        let operator = UpdateOperator::convert(
            cx,
            unsafe { hermes::parser::hermes_get_UpdateExpression_operator(node) },
        );
        let argument = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_UpdateExpression_argument(node) },
        );
        let prefix = unsafe { hermes::parser::hermes_get_UpdateExpression_prefix(node) };
        Self {
            operator,
            argument,
            prefix,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for BinaryExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::BinaryExpression);
        let range = convert_range(cx, node);
        let left = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_BinaryExpression_left(node) },
        );
        let operator = BinaryOperator::convert(
            cx,
            unsafe { hermes::parser::hermes_get_BinaryExpression_operator(node) },
        );
        let right = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_BinaryExpression_right(node) },
        );
        Self {
            left,
            operator,
            right,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for AssignmentExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::AssignmentExpression);
        let range = convert_range(cx, node);
        let operator = AssignmentOperator::convert(
            cx,
            unsafe { hermes::parser::hermes_get_AssignmentExpression_operator(node) },
        );
        let left = AssignmentTarget::convert(
            cx,
            unsafe { hermes::parser::hermes_get_AssignmentExpression_left(node) },
        );
        let right = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_AssignmentExpression_right(node) },
        );
        Self {
            operator,
            left,
            right,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for LogicalExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::LogicalExpression);
        let range = convert_range(cx, node);
        let operator = LogicalOperator::convert(
            cx,
            unsafe { hermes::parser::hermes_get_LogicalExpression_operator(node) },
        );
        let left = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_LogicalExpression_left(node) },
        );
        let right = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_LogicalExpression_right(node) },
        );
        Self {
            operator,
            left,
            right,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for MemberExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::MemberExpression);
        let range = convert_range(cx, node);
        let object = ExpressionOrSuper::convert(
            cx,
            unsafe { hermes::parser::hermes_get_MemberExpression_object(node) },
        );
        let property = ExpressionOrPrivateIdentifier::convert(
            cx,
            unsafe { hermes::parser::hermes_get_MemberExpression_property(node) },
        );
        let is_computed = unsafe {
            hermes::parser::hermes_get_MemberExpression_computed(node)
        };
        Self {
            object,
            property,
            is_computed,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ConditionalExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ConditionalExpression);
        let range = convert_range(cx, node);
        let test = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_ConditionalExpression_test(node) },
        );
        let alternate = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_ConditionalExpression_alternate(node) },
        );
        let consequent = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_ConditionalExpression_consequent(node) },
        );
        Self {
            test,
            alternate,
            consequent,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for CallExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::CallExpression);
        let range = convert_range(cx, node);
        let callee = ExpressionOrSuper::convert(
            cx,
            unsafe { hermes::parser::hermes_get_CallExpression_callee(node) },
        );
        let arguments = convert_vec(
            unsafe { hermes::parser::hermes_get_CallExpression_arguments(node) },
            |node| ExpressionOrSpread::convert(cx, node),
        );
        Self {
            callee,
            arguments,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for NewExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::NewExpression);
        let range = convert_range(cx, node);
        let callee = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_NewExpression_callee(node) },
        );
        let arguments = convert_vec(
            unsafe { hermes::parser::hermes_get_NewExpression_arguments(node) },
            |node| ExpressionOrSpread::convert(cx, node),
        );
        Self {
            callee,
            arguments,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for SequenceExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::SequenceExpression);
        let range = convert_range(cx, node);
        let expressions = convert_vec(
            unsafe { hermes::parser::hermes_get_SequenceExpression_expressions(node) },
            |node| Expression::convert(cx, node),
        );
        Self {
            expressions,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for Super {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::Super);
        let range = convert_range(cx, node);
        Self {
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for SpreadElement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::SpreadElement);
        let range = convert_range(cx, node);
        let argument = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_SpreadElement_argument(node) },
        );
        Self {
            argument,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for YieldExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::YieldExpression);
        let range = convert_range(cx, node);
        let argument = convert_option(
            unsafe { hermes::parser::hermes_get_YieldExpression_argument(node) },
            |node| Expression::convert(cx, node),
        );
        let is_delegate = unsafe {
            hermes::parser::hermes_get_YieldExpression_delegate(node)
        };
        Self {
            argument,
            is_delegate,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ImportDeclaration {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ImportDeclaration);
        let range = convert_range(cx, node);
        let specifiers = convert_vec(
            unsafe { hermes::parser::hermes_get_ImportDeclaration_specifiers(node) },
            |node| ImportDeclarationSpecifier::convert(cx, node),
        );
        let source = _Literal::convert(
            cx,
            unsafe { hermes::parser::hermes_get_ImportDeclaration_source(node) },
        );
        Self {
            specifiers,
            source,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ImportSpecifier {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ImportSpecifier);
        let range = convert_range(cx, node);
        let imported = Identifier::convert(
            cx,
            unsafe { hermes::parser::hermes_get_ImportSpecifier_imported(node) },
        );
        let local = Identifier::convert(
            cx,
            unsafe { hermes::parser::hermes_get_ImportSpecifier_local(node) },
        );
        Self {
            imported,
            local,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ImportDefaultSpecifier {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ImportDefaultSpecifier);
        let range = convert_range(cx, node);
        let local = Identifier::convert(
            cx,
            unsafe { hermes::parser::hermes_get_ImportDefaultSpecifier_local(node) },
        );
        Self {
            local,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ImportNamespaceSpecifier {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ImportNamespaceSpecifier);
        let range = convert_range(cx, node);
        let local = Identifier::convert(
            cx,
            unsafe { hermes::parser::hermes_get_ImportNamespaceSpecifier_local(node) },
        );
        Self {
            local,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ExportNamedDeclaration {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ExportNamedDeclaration);
        let range = convert_range(cx, node);
        let declaration = convert_option(
            unsafe {
                hermes::parser::hermes_get_ExportNamedDeclaration_declaration(node)
            },
            |node| Declaration::convert(cx, node),
        );
        let specifiers = convert_vec(
            unsafe {
                hermes::parser::hermes_get_ExportNamedDeclaration_specifiers(node)
            },
            |node| ExportSpecifier::convert(cx, node),
        );
        let source = convert_option(
            unsafe { hermes::parser::hermes_get_ExportNamedDeclaration_source(node) },
            |node| _Literal::convert(cx, node),
        );
        Self {
            declaration,
            specifiers,
            source,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ExportSpecifier {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ExportSpecifier);
        let range = convert_range(cx, node);
        let exported = Identifier::convert(
            cx,
            unsafe { hermes::parser::hermes_get_ExportSpecifier_exported(node) },
        );
        Self {
            exported,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ExportDefaultDeclaration {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ExportDefaultDeclaration);
        let range = convert_range(cx, node);
        let declaration = DeclarationOrExpression::convert(
            cx,
            unsafe {
                hermes::parser::hermes_get_ExportDefaultDeclaration_declaration(node)
            },
        );
        Self {
            declaration,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ExportAllDeclaration {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ExportAllDeclaration);
        let range = convert_range(cx, node);
        let source = _Literal::convert(
            cx,
            unsafe { hermes::parser::hermes_get_ExportAllDeclaration_source(node) },
        );
        let exported = Default::default();
        Self {
            source,
            exported,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for JSXIdentifier {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::JSXIdentifier);
        let range = convert_range(cx, node);
        let name = convert_string(
            cx,
            unsafe { hermes::parser::hermes_get_JSXIdentifier_name(node) },
        );
        let binding = Default::default();
        Self {
            name,
            binding,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for JSXNamespacedName {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::JSXNamespacedName);
        let range = convert_range(cx, node);
        let namespace = JSXIdentifier::convert(
            cx,
            unsafe { hermes::parser::hermes_get_JSXNamespacedName_namespace(node) },
        );
        let name = JSXIdentifier::convert(
            cx,
            unsafe { hermes::parser::hermes_get_JSXNamespacedName_name(node) },
        );
        Self {
            namespace,
            name,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for JSXMemberExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::JSXMemberExpression);
        let range = convert_range(cx, node);
        let object = JSXMemberExpressionOrIdentifier::convert(
            cx,
            unsafe { hermes::parser::hermes_get_JSXMemberExpression_object(node) },
        );
        let property = JSXIdentifier::convert(
            cx,
            unsafe { hermes::parser::hermes_get_JSXMemberExpression_property(node) },
        );
        Self {
            object,
            property,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for JSXEmptyExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::JSXEmptyExpression);
        let range = convert_range(cx, node);
        Self {
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for JSXExpressionContainer {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::JSXExpressionContainer);
        let range = convert_range(cx, node);
        let expression = JSXExpressionOrEmpty::convert(
            cx,
            unsafe { hermes::parser::hermes_get_JSXExpressionContainer_expression(node) },
        );
        Self {
            expression,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for JSXSpreadChild {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::JSXSpreadChild);
        let range = convert_range(cx, node);
        let expression = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_JSXSpreadChild_expression(node) },
        );
        Self {
            expression,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for JSXOpeningElement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::JSXOpeningElement);
        let range = convert_range(cx, node);
        let name = JSXElementName::convert(
            cx,
            unsafe { hermes::parser::hermes_get_JSXOpeningElement_name(node) },
        );
        let attributes = convert_vec(
            unsafe { hermes::parser::hermes_get_JSXOpeningElement_attributes(node) },
            |node| JSXAttributeOrSpread::convert(cx, node),
        );
        let self_closing = unsafe {
            hermes::parser::hermes_get_JSXOpeningElement_selfClosing(node)
        };
        Self {
            name,
            attributes,
            self_closing,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for JSXClosingElement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::JSXClosingElement);
        let range = convert_range(cx, node);
        let name = JSXElementName::convert(
            cx,
            unsafe { hermes::parser::hermes_get_JSXClosingElement_name(node) },
        );
        Self {
            name,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for JSXAttribute {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::JSXAttribute);
        let range = convert_range(cx, node);
        let name = JSXIdentifierOrNamespacedName::convert(
            cx,
            unsafe { hermes::parser::hermes_get_JSXAttribute_name(node) },
        );
        let value = convert_option(
            unsafe { hermes::parser::hermes_get_JSXAttribute_value(node) },
            |node| JSXAttributeValue::convert(cx, node),
        );
        Self {
            name,
            value,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for JSXSpreadAttribute {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::JSXSpreadAttribute);
        let range = convert_range(cx, node);
        let argument = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_JSXSpreadAttribute_argument(node) },
        );
        Self {
            argument,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for JSXText {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::JSXText);
        let range = convert_range(cx, node);
        let value = convert_string_value(
            cx,
            unsafe { hermes::parser::hermes_get_JSXText_value(node) },
        );
        let raw = convert_string(
            cx,
            unsafe { hermes::parser::hermes_get_JSXText_raw(node) },
        );
        Self {
            value,
            raw,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for JSXStringLiteral {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::JSXStringLiteral);
        let range = convert_range(cx, node);
        let value = convert_string_value(
            cx,
            unsafe { hermes::parser::hermes_get_JSXStringLiteral_value(node) },
        );
        let raw = convert_string(
            cx,
            unsafe { hermes::parser::hermes_get_JSXStringLiteral_raw(node) },
        );
        Self {
            value,
            raw,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for JSXElement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::JSXElement);
        let range = convert_range(cx, node);
        let opening_element = JSXOpeningElement::convert(
            cx,
            unsafe { hermes::parser::hermes_get_JSXElement_openingElement(node) },
        );
        let children = convert_vec(
            unsafe { hermes::parser::hermes_get_JSXElement_children(node) },
            |node| JSXChildItem::convert(cx, node),
        );
        let closing_element = convert_option(
            unsafe { hermes::parser::hermes_get_JSXElement_closingElement(node) },
            |node| JSXClosingElement::convert(cx, node),
        );
        Self {
            opening_element,
            children,
            closing_element,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for JSXFragment {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::JSXFragment);
        let range = convert_range(cx, node);
        let opening_fragment = JSXOpeningFragment::convert(
            cx,
            unsafe { hermes::parser::hermes_get_JSXFragment_openingFragment(node) },
        );
        let children = convert_vec(
            unsafe { hermes::parser::hermes_get_JSXFragment_children(node) },
            |node| JSXChildItem::convert(cx, node),
        );
        let closing_fragment = JSXClosingFragment::convert(
            cx,
            unsafe { hermes::parser::hermes_get_JSXFragment_closingFragment(node) },
        );
        Self {
            opening_fragment,
            children,
            closing_fragment,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for JSXOpeningFragment {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::JSXOpeningFragment);
        let range = convert_range(cx, node);
        Self {
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for JSXClosingFragment {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::JSXClosingFragment);
        let range = convert_range(cx, node);
        Self {
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ArrayPattern {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ArrayPattern);
        let range = convert_range(cx, node);
        let elements = convert_vec_of_option(
            unsafe { hermes::parser::hermes_get_ArrayPattern_elements(node) },
            |node| Pattern::convert(cx, node),
        );
        Self {
            elements,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ObjectPattern {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ObjectPattern);
        let range = convert_range(cx, node);
        let properties = convert_vec(
            unsafe { hermes::parser::hermes_get_ObjectPattern_properties(node) },
            |node| AssignmentPropertyOrRestElement::convert(cx, node),
        );
        Self {
            properties,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for RestElement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::RestElement);
        let range = convert_range(cx, node);
        let argument = Pattern::convert(
            cx,
            unsafe { hermes::parser::hermes_get_RestElement_argument(node) },
        );
        Self {
            argument,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for AssignmentPattern {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::AssignmentPattern);
        let range = convert_range(cx, node);
        let left = Pattern::convert(
            cx,
            unsafe { hermes::parser::hermes_get_AssignmentPattern_left(node) },
        );
        let right = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_AssignmentPattern_right(node) },
        );
        Self {
            left,
            right,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for TemplateLiteral {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::TemplateLiteral);
        let range = convert_range(cx, node);
        let quasis = convert_vec(
            unsafe { hermes::parser::hermes_get_TemplateLiteral_quasis(node) },
            |node| TemplateElement::convert(cx, node),
        );
        let expressions = convert_vec(
            unsafe { hermes::parser::hermes_get_TemplateLiteral_expressions(node) },
            |node| Expression::convert(cx, node),
        );
        Self {
            quasis,
            expressions,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for TaggedTemplateExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::TaggedTemplateExpression);
        let range = convert_range(cx, node);
        let tag = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_TaggedTemplateExpression_tag(node) },
        );
        let quasi = TemplateLiteral::convert(
            cx,
            unsafe { hermes::parser::hermes_get_TaggedTemplateExpression_quasi(node) },
        );
        Self {
            tag,
            quasi,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for MetaProperty {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::MetaProperty);
        let range = convert_range(cx, node);
        let meta = Identifier::convert(
            cx,
            unsafe { hermes::parser::hermes_get_MetaProperty_meta(node) },
        );
        let property = Identifier::convert(
            cx,
            unsafe { hermes::parser::hermes_get_MetaProperty_property(node) },
        );
        Self {
            meta,
            property,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for AwaitExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::AwaitExpression);
        let range = convert_range(cx, node);
        let argument = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_AwaitExpression_argument(node) },
        );
        Self {
            argument,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for OptionalMemberExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::OptionalMemberExpression);
        let range = convert_range(cx, node);
        let object = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_OptionalMemberExpression_object(node) },
        );
        let property = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_OptionalMemberExpression_property(node) },
        );
        let is_computed = unsafe {
            hermes::parser::hermes_get_OptionalMemberExpression_computed(node)
        };
        let is_optional = unsafe {
            hermes::parser::hermes_get_OptionalMemberExpression_optional(node)
        };
        Self {
            object,
            property,
            is_computed,
            is_optional,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for OptionalCallExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::OptionalCallExpression);
        let range = convert_range(cx, node);
        let callee = ExpressionOrSuper::convert(
            cx,
            unsafe { hermes::parser::hermes_get_OptionalCallExpression_callee(node) },
        );
        let arguments = convert_vec(
            unsafe { hermes::parser::hermes_get_OptionalCallExpression_arguments(node) },
            |node| ExpressionOrSpread::convert(cx, node),
        );
        let is_optional = unsafe {
            hermes::parser::hermes_get_OptionalCallExpression_optional(node)
        };
        Self {
            callee,
            arguments,
            is_optional,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ImportExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ImportExpression);
        let range = convert_range(cx, node);
        let source = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_ImportExpression_source(node) },
        );
        Self {
            source,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ClassProperty {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ClassProperty);
        let range = convert_range(cx, node);
        let key = Expression::convert(
            cx,
            unsafe { hermes::parser::hermes_get_ClassProperty_key(node) },
        );
        let value = convert_option(
            unsafe { hermes::parser::hermes_get_ClassProperty_value(node) },
            |node| Expression::convert(cx, node),
        );
        let is_computed = unsafe {
            hermes::parser::hermes_get_ClassProperty_computed(node)
        };
        let is_static = unsafe { hermes::parser::hermes_get_ClassProperty_static(node) };
        Self {
            key,
            value,
            is_computed,
            is_static,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for ClassPrivateProperty {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::ClassPrivateProperty);
        let range = convert_range(cx, node);
        let key = ExpressionOrPrivateIdentifier::convert(
            cx,
            unsafe { hermes::parser::hermes_get_ClassPrivateProperty_key(node) },
        );
        let value = convert_option(
            unsafe { hermes::parser::hermes_get_ClassPrivateProperty_value(node) },
            |node| Expression::convert(cx, node),
        );
        let is_static = unsafe {
            hermes::parser::hermes_get_ClassPrivateProperty_static(node)
        };
        Self {
            key,
            value,
            is_static,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for PrivateName {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::PrivateName);
        let range = convert_range(cx, node);
        let id = Identifier::convert(
            cx,
            unsafe { hermes::parser::hermes_get_PrivateName_id(node) },
        );
        Self {
            id,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for CoverTypedIdentifier {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::CoverTypedIdentifier);
        let range = convert_range(cx, node);
        let left = Identifier::convert(
            cx,
            unsafe { hermes::parser::hermes_get_CoverTypedIdentifier_left(node) },
        );
        let right = convert_option(
            unsafe { hermes::parser::hermes_get_CoverTypedIdentifier_right(node) },
            |node| TypeAnnotation::convert(cx, node),
        );
        Self {
            left,
            right,
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for TSTypeAnnotation {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::TSTypeAnnotation);
        let range = convert_range(cx, node);
        Self {
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for TSTypeAliasDeclaration {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        assert_eq!(node_ref.kind, NodeKind::TSTypeAliasDeclaration);
        let range = convert_range(cx, node);
        Self {
            loc: None,
            range: Some(range),
        }
    }
}
impl FromHermes for Statement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::BlockStatement => {
                let node = BlockStatement::convert(cx, node);
                Statement::BlockStatement(Box::new(node))
            }
            NodeKind::BreakStatement => {
                let node = BreakStatement::convert(cx, node);
                Statement::BreakStatement(Box::new(node))
            }
            NodeKind::ClassDeclaration => {
                let node = ClassDeclaration::convert(cx, node);
                Statement::ClassDeclaration(Box::new(node))
            }
            NodeKind::ContinueStatement => {
                let node = ContinueStatement::convert(cx, node);
                Statement::ContinueStatement(Box::new(node))
            }
            NodeKind::DebuggerStatement => {
                let node = DebuggerStatement::convert(cx, node);
                Statement::DebuggerStatement(Box::new(node))
            }
            NodeKind::DoWhileStatement => {
                let node = DoWhileStatement::convert(cx, node);
                Statement::DoWhileStatement(Box::new(node))
            }
            NodeKind::EmptyStatement => {
                let node = EmptyStatement::convert(cx, node);
                Statement::EmptyStatement(Box::new(node))
            }
            NodeKind::ExpressionStatement => {
                let node = ExpressionStatement::convert(cx, node);
                Statement::ExpressionStatement(Box::new(node))
            }
            NodeKind::ForInStatement => {
                let node = ForInStatement::convert(cx, node);
                Statement::ForInStatement(Box::new(node))
            }
            NodeKind::ForOfStatement => {
                let node = ForOfStatement::convert(cx, node);
                Statement::ForOfStatement(Box::new(node))
            }
            NodeKind::ForStatement => {
                let node = ForStatement::convert(cx, node);
                Statement::ForStatement(Box::new(node))
            }
            NodeKind::FunctionDeclaration => {
                let node = FunctionDeclaration::convert(cx, node);
                Statement::FunctionDeclaration(Box::new(node))
            }
            NodeKind::IfStatement => {
                let node = IfStatement::convert(cx, node);
                Statement::IfStatement(Box::new(node))
            }
            NodeKind::LabeledStatement => {
                let node = LabeledStatement::convert(cx, node);
                Statement::LabeledStatement(Box::new(node))
            }
            NodeKind::ReturnStatement => {
                let node = ReturnStatement::convert(cx, node);
                Statement::ReturnStatement(Box::new(node))
            }
            NodeKind::SwitchStatement => {
                let node = SwitchStatement::convert(cx, node);
                Statement::SwitchStatement(Box::new(node))
            }
            NodeKind::ThrowStatement => {
                let node = ThrowStatement::convert(cx, node);
                Statement::ThrowStatement(Box::new(node))
            }
            NodeKind::TryStatement => {
                let node = TryStatement::convert(cx, node);
                Statement::TryStatement(Box::new(node))
            }
            NodeKind::TSTypeAliasDeclaration => {
                let node = TSTypeAliasDeclaration::convert(cx, node);
                Statement::TSTypeAliasDeclaration(Box::new(node))
            }
            NodeKind::VariableDeclaration => {
                let node = VariableDeclaration::convert(cx, node);
                Statement::VariableDeclaration(Box::new(node))
            }
            NodeKind::WhileStatement => {
                let node = WhileStatement::convert(cx, node);
                Statement::WhileStatement(Box::new(node))
            }
            NodeKind::WithStatement => {
                let node = WithStatement::convert(cx, node);
                Statement::WithStatement(Box::new(node))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind, "Statement"
                )
            }
        }
    }
}
impl FromHermes for Expression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::ArrayExpression => {
                let node = ArrayExpression::convert(cx, node);
                Expression::ArrayExpression(Box::new(node))
            }
            NodeKind::ArrowFunctionExpression => {
                let node = ArrowFunctionExpression::convert(cx, node);
                Expression::ArrowFunctionExpression(Box::new(node))
            }
            NodeKind::AssignmentExpression => {
                let node = AssignmentExpression::convert(cx, node);
                Expression::AssignmentExpression(Box::new(node))
            }
            NodeKind::AwaitExpression => {
                let node = AwaitExpression::convert(cx, node);
                Expression::AwaitExpression(Box::new(node))
            }
            NodeKind::BinaryExpression => {
                let node = BinaryExpression::convert(cx, node);
                Expression::BinaryExpression(Box::new(node))
            }
            NodeKind::BooleanLiteral => {
                let node = BooleanLiteral::convert(cx, node);
                Expression::BooleanLiteral(Box::new(node))
            }
            NodeKind::CallExpression => {
                let node = CallExpression::convert(cx, node);
                Expression::CallExpression(Box::new(node))
            }
            NodeKind::ClassExpression => {
                let node = ClassExpression::convert(cx, node);
                Expression::ClassExpression(Box::new(node))
            }
            NodeKind::ConditionalExpression => {
                let node = ConditionalExpression::convert(cx, node);
                Expression::ConditionalExpression(Box::new(node))
            }
            NodeKind::CoverTypedIdentifier => {
                let node = CoverTypedIdentifier::convert(cx, node);
                Expression::CoverTypedIdentifier(Box::new(node))
            }
            NodeKind::FunctionExpression => {
                let node = FunctionExpression::convert(cx, node);
                Expression::FunctionExpression(Box::new(node))
            }
            NodeKind::Identifier => {
                let node = Identifier::convert(cx, node);
                Expression::Identifier(Box::new(node))
            }
            NodeKind::ImportExpression => {
                let node = ImportExpression::convert(cx, node);
                Expression::ImportExpression(Box::new(node))
            }
            NodeKind::JSXElement => {
                let node = JSXElement::convert(cx, node);
                Expression::JSXElement(Box::new(node))
            }
            NodeKind::JSXFragment => {
                let node = JSXFragment::convert(cx, node);
                Expression::JSXFragment(Box::new(node))
            }
            NodeKind::LogicalExpression => {
                let node = LogicalExpression::convert(cx, node);
                Expression::LogicalExpression(Box::new(node))
            }
            NodeKind::MemberExpression => {
                let node = MemberExpression::convert(cx, node);
                Expression::MemberExpression(Box::new(node))
            }
            NodeKind::MetaProperty => {
                let node = MetaProperty::convert(cx, node);
                Expression::MetaProperty(Box::new(node))
            }
            NodeKind::NewExpression => {
                let node = NewExpression::convert(cx, node);
                Expression::NewExpression(Box::new(node))
            }
            NodeKind::NullLiteral => {
                let node = NullLiteral::convert(cx, node);
                Expression::NullLiteral(Box::new(node))
            }
            NodeKind::NumericLiteral => {
                let node = NumericLiteral::convert(cx, node);
                Expression::NumericLiteral(Box::new(node))
            }
            NodeKind::ObjectExpression => {
                let node = ObjectExpression::convert(cx, node);
                Expression::ObjectExpression(Box::new(node))
            }
            NodeKind::OptionalCallExpression => {
                let node = OptionalCallExpression::convert(cx, node);
                Expression::OptionalCallExpression(Box::new(node))
            }
            NodeKind::OptionalMemberExpression => {
                let node = OptionalMemberExpression::convert(cx, node);
                Expression::OptionalMemberExpression(Box::new(node))
            }
            NodeKind::RegExpLiteral => {
                let node = RegExpLiteral::convert(cx, node);
                Expression::RegExpLiteral(Box::new(node))
            }
            NodeKind::SequenceExpression => {
                let node = SequenceExpression::convert(cx, node);
                Expression::SequenceExpression(Box::new(node))
            }
            NodeKind::StringLiteral => {
                let node = StringLiteral::convert(cx, node);
                Expression::StringLiteral(Box::new(node))
            }
            NodeKind::TaggedTemplateExpression => {
                let node = TaggedTemplateExpression::convert(cx, node);
                Expression::TaggedTemplateExpression(Box::new(node))
            }
            NodeKind::TemplateLiteral => {
                let node = TemplateLiteral::convert(cx, node);
                Expression::TemplateLiteral(Box::new(node))
            }
            NodeKind::ThisExpression => {
                let node = ThisExpression::convert(cx, node);
                Expression::ThisExpression(Box::new(node))
            }
            NodeKind::UnaryExpression => {
                let node = UnaryExpression::convert(cx, node);
                Expression::UnaryExpression(Box::new(node))
            }
            NodeKind::UpdateExpression => {
                let node = UpdateExpression::convert(cx, node);
                Expression::UpdateExpression(Box::new(node))
            }
            NodeKind::YieldExpression => {
                let node = YieldExpression::convert(cx, node);
                Expression::YieldExpression(Box::new(node))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind, "Expression"
                )
            }
        }
    }
}
impl FromHermes for _Literal {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::BooleanLiteral => {
                let node = BooleanLiteral::convert(cx, node);
                _Literal::BooleanLiteral(Box::new(node))
            }
            NodeKind::NullLiteral => {
                let node = NullLiteral::convert(cx, node);
                _Literal::NullLiteral(Box::new(node))
            }
            NodeKind::StringLiteral => {
                let node = StringLiteral::convert(cx, node);
                _Literal::StringLiteral(Box::new(node))
            }
            NodeKind::NumericLiteral => {
                let node = NumericLiteral::convert(cx, node);
                _Literal::NumericLiteral(Box::new(node))
            }
            _ => {
                panic!("Unexpected node kind `{:?}` for `{}`", node_ref.kind, "_Literal")
            }
        }
    }
}
impl FromHermes for Declaration {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::ClassDeclaration => {
                let node = ClassDeclaration::convert(cx, node);
                Declaration::ClassDeclaration(Box::new(node))
            }
            NodeKind::FunctionDeclaration => {
                let node = FunctionDeclaration::convert(cx, node);
                Declaration::FunctionDeclaration(Box::new(node))
            }
            NodeKind::VariableDeclaration => {
                let node = VariableDeclaration::convert(cx, node);
                Declaration::VariableDeclaration(Box::new(node))
            }
            NodeKind::TSTypeAliasDeclaration => {
                let node = TSTypeAliasDeclaration::convert(cx, node);
                Declaration::TSTypeAliasDeclaration(Box::new(node))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind, "Declaration"
                )
            }
        }
    }
}
impl FromHermes for ImportDeclarationSpecifier {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::ImportSpecifier => {
                let node = ImportSpecifier::convert(cx, node);
                ImportDeclarationSpecifier::ImportSpecifier(Box::new(node))
            }
            NodeKind::ImportDefaultSpecifier => {
                let node = ImportDefaultSpecifier::convert(cx, node);
                ImportDeclarationSpecifier::ImportDefaultSpecifier(Box::new(node))
            }
            NodeKind::ImportNamespaceSpecifier => {
                let node = ImportNamespaceSpecifier::convert(cx, node);
                ImportDeclarationSpecifier::ImportNamespaceSpecifier(Box::new(node))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind,
                    "ImportDeclarationSpecifier"
                )
            }
        }
    }
}
impl FromHermes for ModuleItem {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::ImportDeclaration => {
                let node = ImportDeclaration::convert(cx, node);
                ModuleItem::ImportOrExportDeclaration(
                    ImportOrExportDeclaration::ImportDeclaration(Box::new(node)),
                )
            }
            NodeKind::ExportNamedDeclaration => {
                let node = ExportNamedDeclaration::convert(cx, node);
                ModuleItem::ImportOrExportDeclaration(
                    ImportOrExportDeclaration::ExportNamedDeclaration(Box::new(node)),
                )
            }
            NodeKind::ExportDefaultDeclaration => {
                let node = ExportDefaultDeclaration::convert(cx, node);
                ModuleItem::ImportOrExportDeclaration(
                    ImportOrExportDeclaration::ExportDefaultDeclaration(Box::new(node)),
                )
            }
            NodeKind::ExportAllDeclaration => {
                let node = ExportAllDeclaration::convert(cx, node);
                ModuleItem::ImportOrExportDeclaration(
                    ImportOrExportDeclaration::ExportAllDeclaration(Box::new(node)),
                )
            }
            NodeKind::BlockStatement => {
                let node = BlockStatement::convert(cx, node);
                ModuleItem::Statement(Statement::BlockStatement(Box::new(node)))
            }
            NodeKind::BreakStatement => {
                let node = BreakStatement::convert(cx, node);
                ModuleItem::Statement(Statement::BreakStatement(Box::new(node)))
            }
            NodeKind::ClassDeclaration => {
                let node = ClassDeclaration::convert(cx, node);
                ModuleItem::Statement(Statement::ClassDeclaration(Box::new(node)))
            }
            NodeKind::ContinueStatement => {
                let node = ContinueStatement::convert(cx, node);
                ModuleItem::Statement(Statement::ContinueStatement(Box::new(node)))
            }
            NodeKind::DebuggerStatement => {
                let node = DebuggerStatement::convert(cx, node);
                ModuleItem::Statement(Statement::DebuggerStatement(Box::new(node)))
            }
            NodeKind::DoWhileStatement => {
                let node = DoWhileStatement::convert(cx, node);
                ModuleItem::Statement(Statement::DoWhileStatement(Box::new(node)))
            }
            NodeKind::EmptyStatement => {
                let node = EmptyStatement::convert(cx, node);
                ModuleItem::Statement(Statement::EmptyStatement(Box::new(node)))
            }
            NodeKind::ExpressionStatement => {
                let node = ExpressionStatement::convert(cx, node);
                ModuleItem::Statement(Statement::ExpressionStatement(Box::new(node)))
            }
            NodeKind::ForInStatement => {
                let node = ForInStatement::convert(cx, node);
                ModuleItem::Statement(Statement::ForInStatement(Box::new(node)))
            }
            NodeKind::ForOfStatement => {
                let node = ForOfStatement::convert(cx, node);
                ModuleItem::Statement(Statement::ForOfStatement(Box::new(node)))
            }
            NodeKind::ForStatement => {
                let node = ForStatement::convert(cx, node);
                ModuleItem::Statement(Statement::ForStatement(Box::new(node)))
            }
            NodeKind::FunctionDeclaration => {
                let node = FunctionDeclaration::convert(cx, node);
                ModuleItem::Statement(Statement::FunctionDeclaration(Box::new(node)))
            }
            NodeKind::IfStatement => {
                let node = IfStatement::convert(cx, node);
                ModuleItem::Statement(Statement::IfStatement(Box::new(node)))
            }
            NodeKind::LabeledStatement => {
                let node = LabeledStatement::convert(cx, node);
                ModuleItem::Statement(Statement::LabeledStatement(Box::new(node)))
            }
            NodeKind::ReturnStatement => {
                let node = ReturnStatement::convert(cx, node);
                ModuleItem::Statement(Statement::ReturnStatement(Box::new(node)))
            }
            NodeKind::SwitchStatement => {
                let node = SwitchStatement::convert(cx, node);
                ModuleItem::Statement(Statement::SwitchStatement(Box::new(node)))
            }
            NodeKind::ThrowStatement => {
                let node = ThrowStatement::convert(cx, node);
                ModuleItem::Statement(Statement::ThrowStatement(Box::new(node)))
            }
            NodeKind::TryStatement => {
                let node = TryStatement::convert(cx, node);
                ModuleItem::Statement(Statement::TryStatement(Box::new(node)))
            }
            NodeKind::TSTypeAliasDeclaration => {
                let node = TSTypeAliasDeclaration::convert(cx, node);
                ModuleItem::Statement(Statement::TSTypeAliasDeclaration(Box::new(node)))
            }
            NodeKind::VariableDeclaration => {
                let node = VariableDeclaration::convert(cx, node);
                ModuleItem::Statement(Statement::VariableDeclaration(Box::new(node)))
            }
            NodeKind::WhileStatement => {
                let node = WhileStatement::convert(cx, node);
                ModuleItem::Statement(Statement::WhileStatement(Box::new(node)))
            }
            NodeKind::WithStatement => {
                let node = WithStatement::convert(cx, node);
                ModuleItem::Statement(Statement::WithStatement(Box::new(node)))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind, "ModuleItem"
                )
            }
        }
    }
}
impl FromHermes for ImportOrExportDeclaration {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::ImportDeclaration => {
                let node = ImportDeclaration::convert(cx, node);
                ImportOrExportDeclaration::ImportDeclaration(Box::new(node))
            }
            NodeKind::ExportNamedDeclaration => {
                let node = ExportNamedDeclaration::convert(cx, node);
                ImportOrExportDeclaration::ExportNamedDeclaration(Box::new(node))
            }
            NodeKind::ExportDefaultDeclaration => {
                let node = ExportDefaultDeclaration::convert(cx, node);
                ImportOrExportDeclaration::ExportDefaultDeclaration(Box::new(node))
            }
            NodeKind::ExportAllDeclaration => {
                let node = ExportAllDeclaration::convert(cx, node);
                ImportOrExportDeclaration::ExportAllDeclaration(Box::new(node))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind,
                    "ImportOrExportDeclaration"
                )
            }
        }
    }
}
impl FromHermes for ExpressionOrSuper {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::ArrayExpression => {
                let node = ArrayExpression::convert(cx, node);
                ExpressionOrSuper::Expression(
                    Expression::ArrayExpression(Box::new(node)),
                )
            }
            NodeKind::ArrowFunctionExpression => {
                let node = ArrowFunctionExpression::convert(cx, node);
                ExpressionOrSuper::Expression(
                    Expression::ArrowFunctionExpression(Box::new(node)),
                )
            }
            NodeKind::AssignmentExpression => {
                let node = AssignmentExpression::convert(cx, node);
                ExpressionOrSuper::Expression(
                    Expression::AssignmentExpression(Box::new(node)),
                )
            }
            NodeKind::AwaitExpression => {
                let node = AwaitExpression::convert(cx, node);
                ExpressionOrSuper::Expression(
                    Expression::AwaitExpression(Box::new(node)),
                )
            }
            NodeKind::BinaryExpression => {
                let node = BinaryExpression::convert(cx, node);
                ExpressionOrSuper::Expression(
                    Expression::BinaryExpression(Box::new(node)),
                )
            }
            NodeKind::BooleanLiteral => {
                let node = BooleanLiteral::convert(cx, node);
                ExpressionOrSuper::Expression(Expression::BooleanLiteral(Box::new(node)))
            }
            NodeKind::CallExpression => {
                let node = CallExpression::convert(cx, node);
                ExpressionOrSuper::Expression(Expression::CallExpression(Box::new(node)))
            }
            NodeKind::ClassExpression => {
                let node = ClassExpression::convert(cx, node);
                ExpressionOrSuper::Expression(
                    Expression::ClassExpression(Box::new(node)),
                )
            }
            NodeKind::ConditionalExpression => {
                let node = ConditionalExpression::convert(cx, node);
                ExpressionOrSuper::Expression(
                    Expression::ConditionalExpression(Box::new(node)),
                )
            }
            NodeKind::CoverTypedIdentifier => {
                let node = CoverTypedIdentifier::convert(cx, node);
                ExpressionOrSuper::Expression(
                    Expression::CoverTypedIdentifier(Box::new(node)),
                )
            }
            NodeKind::FunctionExpression => {
                let node = FunctionExpression::convert(cx, node);
                ExpressionOrSuper::Expression(
                    Expression::FunctionExpression(Box::new(node)),
                )
            }
            NodeKind::Identifier => {
                let node = Identifier::convert(cx, node);
                ExpressionOrSuper::Expression(Expression::Identifier(Box::new(node)))
            }
            NodeKind::ImportExpression => {
                let node = ImportExpression::convert(cx, node);
                ExpressionOrSuper::Expression(
                    Expression::ImportExpression(Box::new(node)),
                )
            }
            NodeKind::JSXElement => {
                let node = JSXElement::convert(cx, node);
                ExpressionOrSuper::Expression(Expression::JSXElement(Box::new(node)))
            }
            NodeKind::JSXFragment => {
                let node = JSXFragment::convert(cx, node);
                ExpressionOrSuper::Expression(Expression::JSXFragment(Box::new(node)))
            }
            NodeKind::LogicalExpression => {
                let node = LogicalExpression::convert(cx, node);
                ExpressionOrSuper::Expression(
                    Expression::LogicalExpression(Box::new(node)),
                )
            }
            NodeKind::MemberExpression => {
                let node = MemberExpression::convert(cx, node);
                ExpressionOrSuper::Expression(
                    Expression::MemberExpression(Box::new(node)),
                )
            }
            NodeKind::MetaProperty => {
                let node = MetaProperty::convert(cx, node);
                ExpressionOrSuper::Expression(Expression::MetaProperty(Box::new(node)))
            }
            NodeKind::NewExpression => {
                let node = NewExpression::convert(cx, node);
                ExpressionOrSuper::Expression(Expression::NewExpression(Box::new(node)))
            }
            NodeKind::NullLiteral => {
                let node = NullLiteral::convert(cx, node);
                ExpressionOrSuper::Expression(Expression::NullLiteral(Box::new(node)))
            }
            NodeKind::NumericLiteral => {
                let node = NumericLiteral::convert(cx, node);
                ExpressionOrSuper::Expression(Expression::NumericLiteral(Box::new(node)))
            }
            NodeKind::ObjectExpression => {
                let node = ObjectExpression::convert(cx, node);
                ExpressionOrSuper::Expression(
                    Expression::ObjectExpression(Box::new(node)),
                )
            }
            NodeKind::OptionalCallExpression => {
                let node = OptionalCallExpression::convert(cx, node);
                ExpressionOrSuper::Expression(
                    Expression::OptionalCallExpression(Box::new(node)),
                )
            }
            NodeKind::OptionalMemberExpression => {
                let node = OptionalMemberExpression::convert(cx, node);
                ExpressionOrSuper::Expression(
                    Expression::OptionalMemberExpression(Box::new(node)),
                )
            }
            NodeKind::RegExpLiteral => {
                let node = RegExpLiteral::convert(cx, node);
                ExpressionOrSuper::Expression(Expression::RegExpLiteral(Box::new(node)))
            }
            NodeKind::SequenceExpression => {
                let node = SequenceExpression::convert(cx, node);
                ExpressionOrSuper::Expression(
                    Expression::SequenceExpression(Box::new(node)),
                )
            }
            NodeKind::StringLiteral => {
                let node = StringLiteral::convert(cx, node);
                ExpressionOrSuper::Expression(Expression::StringLiteral(Box::new(node)))
            }
            NodeKind::TaggedTemplateExpression => {
                let node = TaggedTemplateExpression::convert(cx, node);
                ExpressionOrSuper::Expression(
                    Expression::TaggedTemplateExpression(Box::new(node)),
                )
            }
            NodeKind::TemplateLiteral => {
                let node = TemplateLiteral::convert(cx, node);
                ExpressionOrSuper::Expression(
                    Expression::TemplateLiteral(Box::new(node)),
                )
            }
            NodeKind::ThisExpression => {
                let node = ThisExpression::convert(cx, node);
                ExpressionOrSuper::Expression(Expression::ThisExpression(Box::new(node)))
            }
            NodeKind::UnaryExpression => {
                let node = UnaryExpression::convert(cx, node);
                ExpressionOrSuper::Expression(
                    Expression::UnaryExpression(Box::new(node)),
                )
            }
            NodeKind::UpdateExpression => {
                let node = UpdateExpression::convert(cx, node);
                ExpressionOrSuper::Expression(
                    Expression::UpdateExpression(Box::new(node)),
                )
            }
            NodeKind::YieldExpression => {
                let node = YieldExpression::convert(cx, node);
                ExpressionOrSuper::Expression(
                    Expression::YieldExpression(Box::new(node)),
                )
            }
            NodeKind::Super => {
                let node = Super::convert(cx, node);
                ExpressionOrSuper::Super(Box::new(node))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind,
                    "ExpressionOrSuper"
                )
            }
        }
    }
}
impl FromHermes for ExpressionOrSpread {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::ArrayExpression => {
                let node = ArrayExpression::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::ArrayExpression(Box::new(node)),
                )
            }
            NodeKind::ArrowFunctionExpression => {
                let node = ArrowFunctionExpression::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::ArrowFunctionExpression(Box::new(node)),
                )
            }
            NodeKind::AssignmentExpression => {
                let node = AssignmentExpression::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::AssignmentExpression(Box::new(node)),
                )
            }
            NodeKind::AwaitExpression => {
                let node = AwaitExpression::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::AwaitExpression(Box::new(node)),
                )
            }
            NodeKind::BinaryExpression => {
                let node = BinaryExpression::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::BinaryExpression(Box::new(node)),
                )
            }
            NodeKind::BooleanLiteral => {
                let node = BooleanLiteral::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::BooleanLiteral(Box::new(node)),
                )
            }
            NodeKind::CallExpression => {
                let node = CallExpression::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::CallExpression(Box::new(node)),
                )
            }
            NodeKind::ClassExpression => {
                let node = ClassExpression::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::ClassExpression(Box::new(node)),
                )
            }
            NodeKind::ConditionalExpression => {
                let node = ConditionalExpression::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::ConditionalExpression(Box::new(node)),
                )
            }
            NodeKind::CoverTypedIdentifier => {
                let node = CoverTypedIdentifier::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::CoverTypedIdentifier(Box::new(node)),
                )
            }
            NodeKind::FunctionExpression => {
                let node = FunctionExpression::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::FunctionExpression(Box::new(node)),
                )
            }
            NodeKind::Identifier => {
                let node = Identifier::convert(cx, node);
                ExpressionOrSpread::Expression(Expression::Identifier(Box::new(node)))
            }
            NodeKind::ImportExpression => {
                let node = ImportExpression::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::ImportExpression(Box::new(node)),
                )
            }
            NodeKind::JSXElement => {
                let node = JSXElement::convert(cx, node);
                ExpressionOrSpread::Expression(Expression::JSXElement(Box::new(node)))
            }
            NodeKind::JSXFragment => {
                let node = JSXFragment::convert(cx, node);
                ExpressionOrSpread::Expression(Expression::JSXFragment(Box::new(node)))
            }
            NodeKind::LogicalExpression => {
                let node = LogicalExpression::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::LogicalExpression(Box::new(node)),
                )
            }
            NodeKind::MemberExpression => {
                let node = MemberExpression::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::MemberExpression(Box::new(node)),
                )
            }
            NodeKind::MetaProperty => {
                let node = MetaProperty::convert(cx, node);
                ExpressionOrSpread::Expression(Expression::MetaProperty(Box::new(node)))
            }
            NodeKind::NewExpression => {
                let node = NewExpression::convert(cx, node);
                ExpressionOrSpread::Expression(Expression::NewExpression(Box::new(node)))
            }
            NodeKind::NullLiteral => {
                let node = NullLiteral::convert(cx, node);
                ExpressionOrSpread::Expression(Expression::NullLiteral(Box::new(node)))
            }
            NodeKind::NumericLiteral => {
                let node = NumericLiteral::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::NumericLiteral(Box::new(node)),
                )
            }
            NodeKind::ObjectExpression => {
                let node = ObjectExpression::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::ObjectExpression(Box::new(node)),
                )
            }
            NodeKind::OptionalCallExpression => {
                let node = OptionalCallExpression::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::OptionalCallExpression(Box::new(node)),
                )
            }
            NodeKind::OptionalMemberExpression => {
                let node = OptionalMemberExpression::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::OptionalMemberExpression(Box::new(node)),
                )
            }
            NodeKind::RegExpLiteral => {
                let node = RegExpLiteral::convert(cx, node);
                ExpressionOrSpread::Expression(Expression::RegExpLiteral(Box::new(node)))
            }
            NodeKind::SequenceExpression => {
                let node = SequenceExpression::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::SequenceExpression(Box::new(node)),
                )
            }
            NodeKind::StringLiteral => {
                let node = StringLiteral::convert(cx, node);
                ExpressionOrSpread::Expression(Expression::StringLiteral(Box::new(node)))
            }
            NodeKind::TaggedTemplateExpression => {
                let node = TaggedTemplateExpression::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::TaggedTemplateExpression(Box::new(node)),
                )
            }
            NodeKind::TemplateLiteral => {
                let node = TemplateLiteral::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::TemplateLiteral(Box::new(node)),
                )
            }
            NodeKind::ThisExpression => {
                let node = ThisExpression::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::ThisExpression(Box::new(node)),
                )
            }
            NodeKind::UnaryExpression => {
                let node = UnaryExpression::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::UnaryExpression(Box::new(node)),
                )
            }
            NodeKind::UpdateExpression => {
                let node = UpdateExpression::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::UpdateExpression(Box::new(node)),
                )
            }
            NodeKind::YieldExpression => {
                let node = YieldExpression::convert(cx, node);
                ExpressionOrSpread::Expression(
                    Expression::YieldExpression(Box::new(node)),
                )
            }
            NodeKind::SpreadElement => {
                let node = SpreadElement::convert(cx, node);
                ExpressionOrSpread::SpreadElement(Box::new(node))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind,
                    "ExpressionOrSpread"
                )
            }
        }
    }
}
impl FromHermes for FunctionBody {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::BlockStatement => {
                let node = BlockStatement::convert(cx, node);
                FunctionBody::BlockStatement(Box::new(node))
            }
            NodeKind::ArrayExpression => {
                let node = ArrayExpression::convert(cx, node);
                FunctionBody::Expression(Expression::ArrayExpression(Box::new(node)))
            }
            NodeKind::ArrowFunctionExpression => {
                let node = ArrowFunctionExpression::convert(cx, node);
                FunctionBody::Expression(
                    Expression::ArrowFunctionExpression(Box::new(node)),
                )
            }
            NodeKind::AssignmentExpression => {
                let node = AssignmentExpression::convert(cx, node);
                FunctionBody::Expression(
                    Expression::AssignmentExpression(Box::new(node)),
                )
            }
            NodeKind::AwaitExpression => {
                let node = AwaitExpression::convert(cx, node);
                FunctionBody::Expression(Expression::AwaitExpression(Box::new(node)))
            }
            NodeKind::BinaryExpression => {
                let node = BinaryExpression::convert(cx, node);
                FunctionBody::Expression(Expression::BinaryExpression(Box::new(node)))
            }
            NodeKind::BooleanLiteral => {
                let node = BooleanLiteral::convert(cx, node);
                FunctionBody::Expression(Expression::BooleanLiteral(Box::new(node)))
            }
            NodeKind::CallExpression => {
                let node = CallExpression::convert(cx, node);
                FunctionBody::Expression(Expression::CallExpression(Box::new(node)))
            }
            NodeKind::ClassExpression => {
                let node = ClassExpression::convert(cx, node);
                FunctionBody::Expression(Expression::ClassExpression(Box::new(node)))
            }
            NodeKind::ConditionalExpression => {
                let node = ConditionalExpression::convert(cx, node);
                FunctionBody::Expression(
                    Expression::ConditionalExpression(Box::new(node)),
                )
            }
            NodeKind::CoverTypedIdentifier => {
                let node = CoverTypedIdentifier::convert(cx, node);
                FunctionBody::Expression(
                    Expression::CoverTypedIdentifier(Box::new(node)),
                )
            }
            NodeKind::FunctionExpression => {
                let node = FunctionExpression::convert(cx, node);
                FunctionBody::Expression(Expression::FunctionExpression(Box::new(node)))
            }
            NodeKind::Identifier => {
                let node = Identifier::convert(cx, node);
                FunctionBody::Expression(Expression::Identifier(Box::new(node)))
            }
            NodeKind::ImportExpression => {
                let node = ImportExpression::convert(cx, node);
                FunctionBody::Expression(Expression::ImportExpression(Box::new(node)))
            }
            NodeKind::JSXElement => {
                let node = JSXElement::convert(cx, node);
                FunctionBody::Expression(Expression::JSXElement(Box::new(node)))
            }
            NodeKind::JSXFragment => {
                let node = JSXFragment::convert(cx, node);
                FunctionBody::Expression(Expression::JSXFragment(Box::new(node)))
            }
            NodeKind::LogicalExpression => {
                let node = LogicalExpression::convert(cx, node);
                FunctionBody::Expression(Expression::LogicalExpression(Box::new(node)))
            }
            NodeKind::MemberExpression => {
                let node = MemberExpression::convert(cx, node);
                FunctionBody::Expression(Expression::MemberExpression(Box::new(node)))
            }
            NodeKind::MetaProperty => {
                let node = MetaProperty::convert(cx, node);
                FunctionBody::Expression(Expression::MetaProperty(Box::new(node)))
            }
            NodeKind::NewExpression => {
                let node = NewExpression::convert(cx, node);
                FunctionBody::Expression(Expression::NewExpression(Box::new(node)))
            }
            NodeKind::NullLiteral => {
                let node = NullLiteral::convert(cx, node);
                FunctionBody::Expression(Expression::NullLiteral(Box::new(node)))
            }
            NodeKind::NumericLiteral => {
                let node = NumericLiteral::convert(cx, node);
                FunctionBody::Expression(Expression::NumericLiteral(Box::new(node)))
            }
            NodeKind::ObjectExpression => {
                let node = ObjectExpression::convert(cx, node);
                FunctionBody::Expression(Expression::ObjectExpression(Box::new(node)))
            }
            NodeKind::OptionalCallExpression => {
                let node = OptionalCallExpression::convert(cx, node);
                FunctionBody::Expression(
                    Expression::OptionalCallExpression(Box::new(node)),
                )
            }
            NodeKind::OptionalMemberExpression => {
                let node = OptionalMemberExpression::convert(cx, node);
                FunctionBody::Expression(
                    Expression::OptionalMemberExpression(Box::new(node)),
                )
            }
            NodeKind::RegExpLiteral => {
                let node = RegExpLiteral::convert(cx, node);
                FunctionBody::Expression(Expression::RegExpLiteral(Box::new(node)))
            }
            NodeKind::SequenceExpression => {
                let node = SequenceExpression::convert(cx, node);
                FunctionBody::Expression(Expression::SequenceExpression(Box::new(node)))
            }
            NodeKind::StringLiteral => {
                let node = StringLiteral::convert(cx, node);
                FunctionBody::Expression(Expression::StringLiteral(Box::new(node)))
            }
            NodeKind::TaggedTemplateExpression => {
                let node = TaggedTemplateExpression::convert(cx, node);
                FunctionBody::Expression(
                    Expression::TaggedTemplateExpression(Box::new(node)),
                )
            }
            NodeKind::TemplateLiteral => {
                let node = TemplateLiteral::convert(cx, node);
                FunctionBody::Expression(Expression::TemplateLiteral(Box::new(node)))
            }
            NodeKind::ThisExpression => {
                let node = ThisExpression::convert(cx, node);
                FunctionBody::Expression(Expression::ThisExpression(Box::new(node)))
            }
            NodeKind::UnaryExpression => {
                let node = UnaryExpression::convert(cx, node);
                FunctionBody::Expression(Expression::UnaryExpression(Box::new(node)))
            }
            NodeKind::UpdateExpression => {
                let node = UpdateExpression::convert(cx, node);
                FunctionBody::Expression(Expression::UpdateExpression(Box::new(node)))
            }
            NodeKind::YieldExpression => {
                let node = YieldExpression::convert(cx, node);
                FunctionBody::Expression(Expression::YieldExpression(Box::new(node)))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind, "FunctionBody"
                )
            }
        }
    }
}
impl FromHermes for Pattern {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::Identifier => {
                let node = Identifier::convert(cx, node);
                Pattern::Identifier(Box::new(node))
            }
            NodeKind::ArrayPattern => {
                let node = ArrayPattern::convert(cx, node);
                Pattern::ArrayPattern(Box::new(node))
            }
            NodeKind::ObjectPattern => {
                let node = ObjectPattern::convert(cx, node);
                Pattern::ObjectPattern(Box::new(node))
            }
            NodeKind::RestElement => {
                let node = RestElement::convert(cx, node);
                Pattern::RestElement(Box::new(node))
            }
            NodeKind::AssignmentPattern => {
                let node = AssignmentPattern::convert(cx, node);
                Pattern::AssignmentPattern(Box::new(node))
            }
            _ => panic!("Unexpected node kind `{:?}` for `{}`", node_ref.kind, "Pattern"),
        }
    }
}
impl FromHermes for ForInit {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::ArrayExpression => {
                let node = ArrayExpression::convert(cx, node);
                ForInit::Expression(Expression::ArrayExpression(Box::new(node)))
            }
            NodeKind::ArrowFunctionExpression => {
                let node = ArrowFunctionExpression::convert(cx, node);
                ForInit::Expression(Expression::ArrowFunctionExpression(Box::new(node)))
            }
            NodeKind::AssignmentExpression => {
                let node = AssignmentExpression::convert(cx, node);
                ForInit::Expression(Expression::AssignmentExpression(Box::new(node)))
            }
            NodeKind::AwaitExpression => {
                let node = AwaitExpression::convert(cx, node);
                ForInit::Expression(Expression::AwaitExpression(Box::new(node)))
            }
            NodeKind::BinaryExpression => {
                let node = BinaryExpression::convert(cx, node);
                ForInit::Expression(Expression::BinaryExpression(Box::new(node)))
            }
            NodeKind::BooleanLiteral => {
                let node = BooleanLiteral::convert(cx, node);
                ForInit::Expression(Expression::BooleanLiteral(Box::new(node)))
            }
            NodeKind::CallExpression => {
                let node = CallExpression::convert(cx, node);
                ForInit::Expression(Expression::CallExpression(Box::new(node)))
            }
            NodeKind::ClassExpression => {
                let node = ClassExpression::convert(cx, node);
                ForInit::Expression(Expression::ClassExpression(Box::new(node)))
            }
            NodeKind::ConditionalExpression => {
                let node = ConditionalExpression::convert(cx, node);
                ForInit::Expression(Expression::ConditionalExpression(Box::new(node)))
            }
            NodeKind::CoverTypedIdentifier => {
                let node = CoverTypedIdentifier::convert(cx, node);
                ForInit::Expression(Expression::CoverTypedIdentifier(Box::new(node)))
            }
            NodeKind::FunctionExpression => {
                let node = FunctionExpression::convert(cx, node);
                ForInit::Expression(Expression::FunctionExpression(Box::new(node)))
            }
            NodeKind::Identifier => {
                let node = Identifier::convert(cx, node);
                ForInit::Expression(Expression::Identifier(Box::new(node)))
            }
            NodeKind::ImportExpression => {
                let node = ImportExpression::convert(cx, node);
                ForInit::Expression(Expression::ImportExpression(Box::new(node)))
            }
            NodeKind::JSXElement => {
                let node = JSXElement::convert(cx, node);
                ForInit::Expression(Expression::JSXElement(Box::new(node)))
            }
            NodeKind::JSXFragment => {
                let node = JSXFragment::convert(cx, node);
                ForInit::Expression(Expression::JSXFragment(Box::new(node)))
            }
            NodeKind::LogicalExpression => {
                let node = LogicalExpression::convert(cx, node);
                ForInit::Expression(Expression::LogicalExpression(Box::new(node)))
            }
            NodeKind::MemberExpression => {
                let node = MemberExpression::convert(cx, node);
                ForInit::Expression(Expression::MemberExpression(Box::new(node)))
            }
            NodeKind::MetaProperty => {
                let node = MetaProperty::convert(cx, node);
                ForInit::Expression(Expression::MetaProperty(Box::new(node)))
            }
            NodeKind::NewExpression => {
                let node = NewExpression::convert(cx, node);
                ForInit::Expression(Expression::NewExpression(Box::new(node)))
            }
            NodeKind::NullLiteral => {
                let node = NullLiteral::convert(cx, node);
                ForInit::Expression(Expression::NullLiteral(Box::new(node)))
            }
            NodeKind::NumericLiteral => {
                let node = NumericLiteral::convert(cx, node);
                ForInit::Expression(Expression::NumericLiteral(Box::new(node)))
            }
            NodeKind::ObjectExpression => {
                let node = ObjectExpression::convert(cx, node);
                ForInit::Expression(Expression::ObjectExpression(Box::new(node)))
            }
            NodeKind::OptionalCallExpression => {
                let node = OptionalCallExpression::convert(cx, node);
                ForInit::Expression(Expression::OptionalCallExpression(Box::new(node)))
            }
            NodeKind::OptionalMemberExpression => {
                let node = OptionalMemberExpression::convert(cx, node);
                ForInit::Expression(Expression::OptionalMemberExpression(Box::new(node)))
            }
            NodeKind::RegExpLiteral => {
                let node = RegExpLiteral::convert(cx, node);
                ForInit::Expression(Expression::RegExpLiteral(Box::new(node)))
            }
            NodeKind::SequenceExpression => {
                let node = SequenceExpression::convert(cx, node);
                ForInit::Expression(Expression::SequenceExpression(Box::new(node)))
            }
            NodeKind::StringLiteral => {
                let node = StringLiteral::convert(cx, node);
                ForInit::Expression(Expression::StringLiteral(Box::new(node)))
            }
            NodeKind::TaggedTemplateExpression => {
                let node = TaggedTemplateExpression::convert(cx, node);
                ForInit::Expression(Expression::TaggedTemplateExpression(Box::new(node)))
            }
            NodeKind::TemplateLiteral => {
                let node = TemplateLiteral::convert(cx, node);
                ForInit::Expression(Expression::TemplateLiteral(Box::new(node)))
            }
            NodeKind::ThisExpression => {
                let node = ThisExpression::convert(cx, node);
                ForInit::Expression(Expression::ThisExpression(Box::new(node)))
            }
            NodeKind::UnaryExpression => {
                let node = UnaryExpression::convert(cx, node);
                ForInit::Expression(Expression::UnaryExpression(Box::new(node)))
            }
            NodeKind::UpdateExpression => {
                let node = UpdateExpression::convert(cx, node);
                ForInit::Expression(Expression::UpdateExpression(Box::new(node)))
            }
            NodeKind::YieldExpression => {
                let node = YieldExpression::convert(cx, node);
                ForInit::Expression(Expression::YieldExpression(Box::new(node)))
            }
            NodeKind::VariableDeclaration => {
                let node = VariableDeclaration::convert(cx, node);
                ForInit::VariableDeclaration(Box::new(node))
            }
            _ => panic!("Unexpected node kind `{:?}` for `{}`", node_ref.kind, "ForInit"),
        }
    }
}
impl FromHermes for ForInInit {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::Identifier => {
                let node = Identifier::convert(cx, node);
                ForInInit::Pattern(Pattern::Identifier(Box::new(node)))
            }
            NodeKind::ArrayPattern => {
                let node = ArrayPattern::convert(cx, node);
                ForInInit::Pattern(Pattern::ArrayPattern(Box::new(node)))
            }
            NodeKind::ObjectPattern => {
                let node = ObjectPattern::convert(cx, node);
                ForInInit::Pattern(Pattern::ObjectPattern(Box::new(node)))
            }
            NodeKind::RestElement => {
                let node = RestElement::convert(cx, node);
                ForInInit::Pattern(Pattern::RestElement(Box::new(node)))
            }
            NodeKind::AssignmentPattern => {
                let node = AssignmentPattern::convert(cx, node);
                ForInInit::Pattern(Pattern::AssignmentPattern(Box::new(node)))
            }
            NodeKind::VariableDeclaration => {
                let node = VariableDeclaration::convert(cx, node);
                ForInInit::VariableDeclaration(Box::new(node))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind, "ForInInit"
                )
            }
        }
    }
}
impl FromHermes for PropertyOrSpreadElement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::Property => {
                let node = Property::convert(cx, node);
                PropertyOrSpreadElement::Property(Box::new(node))
            }
            NodeKind::SpreadElement => {
                let node = SpreadElement::convert(cx, node);
                PropertyOrSpreadElement::SpreadElement(Box::new(node))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind,
                    "PropertyOrSpreadElement"
                )
            }
        }
    }
}
impl FromHermes for AssignmentPropertyOrRestElement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::Property => {
                let node = AssignmentProperty::convert(cx, node);
                AssignmentPropertyOrRestElement::AssignmentProperty(Box::new(node))
            }
            NodeKind::RestElement => {
                let node = RestElement::convert(cx, node);
                AssignmentPropertyOrRestElement::RestElement(Box::new(node))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind,
                    "AssignmentPropertyOrRestElement"
                )
            }
        }
    }
}
impl FromHermes for AssignmentTarget {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::Identifier => {
                let node = Identifier::convert(cx, node);
                AssignmentTarget::Pattern(Pattern::Identifier(Box::new(node)))
            }
            NodeKind::ArrayPattern => {
                let node = ArrayPattern::convert(cx, node);
                AssignmentTarget::Pattern(Pattern::ArrayPattern(Box::new(node)))
            }
            NodeKind::ObjectPattern => {
                let node = ObjectPattern::convert(cx, node);
                AssignmentTarget::Pattern(Pattern::ObjectPattern(Box::new(node)))
            }
            NodeKind::RestElement => {
                let node = RestElement::convert(cx, node);
                AssignmentTarget::Pattern(Pattern::RestElement(Box::new(node)))
            }
            NodeKind::AssignmentPattern => {
                let node = AssignmentPattern::convert(cx, node);
                AssignmentTarget::Pattern(Pattern::AssignmentPattern(Box::new(node)))
            }
            NodeKind::ArrayExpression => {
                let node = ArrayExpression::convert(cx, node);
                AssignmentTarget::Expression(Expression::ArrayExpression(Box::new(node)))
            }
            NodeKind::ArrowFunctionExpression => {
                let node = ArrowFunctionExpression::convert(cx, node);
                AssignmentTarget::Expression(
                    Expression::ArrowFunctionExpression(Box::new(node)),
                )
            }
            NodeKind::AssignmentExpression => {
                let node = AssignmentExpression::convert(cx, node);
                AssignmentTarget::Expression(
                    Expression::AssignmentExpression(Box::new(node)),
                )
            }
            NodeKind::AwaitExpression => {
                let node = AwaitExpression::convert(cx, node);
                AssignmentTarget::Expression(Expression::AwaitExpression(Box::new(node)))
            }
            NodeKind::BinaryExpression => {
                let node = BinaryExpression::convert(cx, node);
                AssignmentTarget::Expression(
                    Expression::BinaryExpression(Box::new(node)),
                )
            }
            NodeKind::BooleanLiteral => {
                let node = BooleanLiteral::convert(cx, node);
                AssignmentTarget::Expression(Expression::BooleanLiteral(Box::new(node)))
            }
            NodeKind::CallExpression => {
                let node = CallExpression::convert(cx, node);
                AssignmentTarget::Expression(Expression::CallExpression(Box::new(node)))
            }
            NodeKind::ClassExpression => {
                let node = ClassExpression::convert(cx, node);
                AssignmentTarget::Expression(Expression::ClassExpression(Box::new(node)))
            }
            NodeKind::ConditionalExpression => {
                let node = ConditionalExpression::convert(cx, node);
                AssignmentTarget::Expression(
                    Expression::ConditionalExpression(Box::new(node)),
                )
            }
            NodeKind::CoverTypedIdentifier => {
                let node = CoverTypedIdentifier::convert(cx, node);
                AssignmentTarget::Expression(
                    Expression::CoverTypedIdentifier(Box::new(node)),
                )
            }
            NodeKind::FunctionExpression => {
                let node = FunctionExpression::convert(cx, node);
                AssignmentTarget::Expression(
                    Expression::FunctionExpression(Box::new(node)),
                )
            }
            NodeKind::ImportExpression => {
                let node = ImportExpression::convert(cx, node);
                AssignmentTarget::Expression(
                    Expression::ImportExpression(Box::new(node)),
                )
            }
            NodeKind::JSXElement => {
                let node = JSXElement::convert(cx, node);
                AssignmentTarget::Expression(Expression::JSXElement(Box::new(node)))
            }
            NodeKind::JSXFragment => {
                let node = JSXFragment::convert(cx, node);
                AssignmentTarget::Expression(Expression::JSXFragment(Box::new(node)))
            }
            NodeKind::LogicalExpression => {
                let node = LogicalExpression::convert(cx, node);
                AssignmentTarget::Expression(
                    Expression::LogicalExpression(Box::new(node)),
                )
            }
            NodeKind::MemberExpression => {
                let node = MemberExpression::convert(cx, node);
                AssignmentTarget::Expression(
                    Expression::MemberExpression(Box::new(node)),
                )
            }
            NodeKind::MetaProperty => {
                let node = MetaProperty::convert(cx, node);
                AssignmentTarget::Expression(Expression::MetaProperty(Box::new(node)))
            }
            NodeKind::NewExpression => {
                let node = NewExpression::convert(cx, node);
                AssignmentTarget::Expression(Expression::NewExpression(Box::new(node)))
            }
            NodeKind::NullLiteral => {
                let node = NullLiteral::convert(cx, node);
                AssignmentTarget::Expression(Expression::NullLiteral(Box::new(node)))
            }
            NodeKind::NumericLiteral => {
                let node = NumericLiteral::convert(cx, node);
                AssignmentTarget::Expression(Expression::NumericLiteral(Box::new(node)))
            }
            NodeKind::ObjectExpression => {
                let node = ObjectExpression::convert(cx, node);
                AssignmentTarget::Expression(
                    Expression::ObjectExpression(Box::new(node)),
                )
            }
            NodeKind::OptionalCallExpression => {
                let node = OptionalCallExpression::convert(cx, node);
                AssignmentTarget::Expression(
                    Expression::OptionalCallExpression(Box::new(node)),
                )
            }
            NodeKind::OptionalMemberExpression => {
                let node = OptionalMemberExpression::convert(cx, node);
                AssignmentTarget::Expression(
                    Expression::OptionalMemberExpression(Box::new(node)),
                )
            }
            NodeKind::RegExpLiteral => {
                let node = RegExpLiteral::convert(cx, node);
                AssignmentTarget::Expression(Expression::RegExpLiteral(Box::new(node)))
            }
            NodeKind::SequenceExpression => {
                let node = SequenceExpression::convert(cx, node);
                AssignmentTarget::Expression(
                    Expression::SequenceExpression(Box::new(node)),
                )
            }
            NodeKind::StringLiteral => {
                let node = StringLiteral::convert(cx, node);
                AssignmentTarget::Expression(Expression::StringLiteral(Box::new(node)))
            }
            NodeKind::TaggedTemplateExpression => {
                let node = TaggedTemplateExpression::convert(cx, node);
                AssignmentTarget::Expression(
                    Expression::TaggedTemplateExpression(Box::new(node)),
                )
            }
            NodeKind::TemplateLiteral => {
                let node = TemplateLiteral::convert(cx, node);
                AssignmentTarget::Expression(Expression::TemplateLiteral(Box::new(node)))
            }
            NodeKind::ThisExpression => {
                let node = ThisExpression::convert(cx, node);
                AssignmentTarget::Expression(Expression::ThisExpression(Box::new(node)))
            }
            NodeKind::UnaryExpression => {
                let node = UnaryExpression::convert(cx, node);
                AssignmentTarget::Expression(Expression::UnaryExpression(Box::new(node)))
            }
            NodeKind::UpdateExpression => {
                let node = UpdateExpression::convert(cx, node);
                AssignmentTarget::Expression(
                    Expression::UpdateExpression(Box::new(node)),
                )
            }
            NodeKind::YieldExpression => {
                let node = YieldExpression::convert(cx, node);
                AssignmentTarget::Expression(Expression::YieldExpression(Box::new(node)))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind,
                    "AssignmentTarget"
                )
            }
        }
    }
}
impl FromHermes for ChainElement {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::CallExpression => {
                let node = CallExpression::convert(cx, node);
                ChainElement::CallExpression(Box::new(node))
            }
            NodeKind::MemberExpression => {
                let node = MemberExpression::convert(cx, node);
                ChainElement::MemberExpression(Box::new(node))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind, "ChainElement"
                )
            }
        }
    }
}
impl FromHermes for JSXMemberExpressionOrIdentifier {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::JSXMemberExpression => {
                let node = JSXMemberExpression::convert(cx, node);
                JSXMemberExpressionOrIdentifier::JSXMemberExpression(Box::new(node))
            }
            NodeKind::JSXIdentifier => {
                let node = JSXIdentifier::convert(cx, node);
                JSXMemberExpressionOrIdentifier::JSXIdentifier(Box::new(node))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind,
                    "JSXMemberExpressionOrIdentifier"
                )
            }
        }
    }
}
impl FromHermes for JSXExpressionOrEmpty {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::ArrayExpression => {
                let node = ArrayExpression::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::ArrayExpression(Box::new(node)),
                )
            }
            NodeKind::ArrowFunctionExpression => {
                let node = ArrowFunctionExpression::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::ArrowFunctionExpression(Box::new(node)),
                )
            }
            NodeKind::AssignmentExpression => {
                let node = AssignmentExpression::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::AssignmentExpression(Box::new(node)),
                )
            }
            NodeKind::AwaitExpression => {
                let node = AwaitExpression::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::AwaitExpression(Box::new(node)),
                )
            }
            NodeKind::BinaryExpression => {
                let node = BinaryExpression::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::BinaryExpression(Box::new(node)),
                )
            }
            NodeKind::BooleanLiteral => {
                let node = BooleanLiteral::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::BooleanLiteral(Box::new(node)),
                )
            }
            NodeKind::CallExpression => {
                let node = CallExpression::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::CallExpression(Box::new(node)),
                )
            }
            NodeKind::ClassExpression => {
                let node = ClassExpression::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::ClassExpression(Box::new(node)),
                )
            }
            NodeKind::ConditionalExpression => {
                let node = ConditionalExpression::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::ConditionalExpression(Box::new(node)),
                )
            }
            NodeKind::CoverTypedIdentifier => {
                let node = CoverTypedIdentifier::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::CoverTypedIdentifier(Box::new(node)),
                )
            }
            NodeKind::FunctionExpression => {
                let node = FunctionExpression::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::FunctionExpression(Box::new(node)),
                )
            }
            NodeKind::Identifier => {
                let node = Identifier::convert(cx, node);
                JSXExpressionOrEmpty::Expression(Expression::Identifier(Box::new(node)))
            }
            NodeKind::ImportExpression => {
                let node = ImportExpression::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::ImportExpression(Box::new(node)),
                )
            }
            NodeKind::JSXElement => {
                let node = JSXElement::convert(cx, node);
                JSXExpressionOrEmpty::Expression(Expression::JSXElement(Box::new(node)))
            }
            NodeKind::JSXFragment => {
                let node = JSXFragment::convert(cx, node);
                JSXExpressionOrEmpty::Expression(Expression::JSXFragment(Box::new(node)))
            }
            NodeKind::LogicalExpression => {
                let node = LogicalExpression::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::LogicalExpression(Box::new(node)),
                )
            }
            NodeKind::MemberExpression => {
                let node = MemberExpression::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::MemberExpression(Box::new(node)),
                )
            }
            NodeKind::MetaProperty => {
                let node = MetaProperty::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::MetaProperty(Box::new(node)),
                )
            }
            NodeKind::NewExpression => {
                let node = NewExpression::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::NewExpression(Box::new(node)),
                )
            }
            NodeKind::NullLiteral => {
                let node = NullLiteral::convert(cx, node);
                JSXExpressionOrEmpty::Expression(Expression::NullLiteral(Box::new(node)))
            }
            NodeKind::NumericLiteral => {
                let node = NumericLiteral::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::NumericLiteral(Box::new(node)),
                )
            }
            NodeKind::ObjectExpression => {
                let node = ObjectExpression::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::ObjectExpression(Box::new(node)),
                )
            }
            NodeKind::OptionalCallExpression => {
                let node = OptionalCallExpression::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::OptionalCallExpression(Box::new(node)),
                )
            }
            NodeKind::OptionalMemberExpression => {
                let node = OptionalMemberExpression::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::OptionalMemberExpression(Box::new(node)),
                )
            }
            NodeKind::RegExpLiteral => {
                let node = RegExpLiteral::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::RegExpLiteral(Box::new(node)),
                )
            }
            NodeKind::SequenceExpression => {
                let node = SequenceExpression::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::SequenceExpression(Box::new(node)),
                )
            }
            NodeKind::StringLiteral => {
                let node = StringLiteral::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::StringLiteral(Box::new(node)),
                )
            }
            NodeKind::TaggedTemplateExpression => {
                let node = TaggedTemplateExpression::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::TaggedTemplateExpression(Box::new(node)),
                )
            }
            NodeKind::TemplateLiteral => {
                let node = TemplateLiteral::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::TemplateLiteral(Box::new(node)),
                )
            }
            NodeKind::ThisExpression => {
                let node = ThisExpression::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::ThisExpression(Box::new(node)),
                )
            }
            NodeKind::UnaryExpression => {
                let node = UnaryExpression::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::UnaryExpression(Box::new(node)),
                )
            }
            NodeKind::UpdateExpression => {
                let node = UpdateExpression::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::UpdateExpression(Box::new(node)),
                )
            }
            NodeKind::YieldExpression => {
                let node = YieldExpression::convert(cx, node);
                JSXExpressionOrEmpty::Expression(
                    Expression::YieldExpression(Box::new(node)),
                )
            }
            NodeKind::JSXEmptyExpression => {
                let node = JSXEmptyExpression::convert(cx, node);
                JSXExpressionOrEmpty::JSXEmptyExpression(Box::new(node))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind,
                    "JSXExpressionOrEmpty"
                )
            }
        }
    }
}
impl FromHermes for JSXAttributeOrSpread {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::JSXAttribute => {
                let node = JSXAttribute::convert(cx, node);
                JSXAttributeOrSpread::JSXAttribute(Box::new(node))
            }
            NodeKind::JSXSpreadAttribute => {
                let node = JSXSpreadAttribute::convert(cx, node);
                JSXAttributeOrSpread::JSXSpreadAttribute(Box::new(node))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind,
                    "JSXAttributeOrSpread"
                )
            }
        }
    }
}
impl FromHermes for JSXAttributeValue {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::JSXExpressionContainer => {
                let node = JSXExpressionContainer::convert(cx, node);
                JSXAttributeValue::JSXExpressionContainer(Box::new(node))
            }
            NodeKind::JSXElement => {
                let node = JSXElement::convert(cx, node);
                JSXAttributeValue::JSXElement(Box::new(node))
            }
            NodeKind::JSXFragment => {
                let node = JSXFragment::convert(cx, node);
                JSXAttributeValue::JSXFragment(Box::new(node))
            }
            NodeKind::JSXStringLiteral => {
                let node = JSXStringLiteral::convert(cx, node);
                JSXAttributeValue::JSXStringLiteral(Box::new(node))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind,
                    "JSXAttributeValue"
                )
            }
        }
    }
}
impl FromHermes for JSXElementName {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::JSXIdentifier => {
                let node = JSXIdentifier::convert(cx, node);
                JSXElementName::JSXIdentifier(Box::new(node))
            }
            NodeKind::JSXMemberExpression => {
                let node = JSXMemberExpression::convert(cx, node);
                JSXElementName::JSXMemberExpression(Box::new(node))
            }
            NodeKind::JSXNamespacedName => {
                let node = JSXNamespacedName::convert(cx, node);
                JSXElementName::JSXNamespacedName(Box::new(node))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind,
                    "JSXElementName"
                )
            }
        }
    }
}
impl FromHermes for JSXIdentifierOrNamespacedName {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::JSXIdentifier => {
                let node = JSXIdentifier::convert(cx, node);
                JSXIdentifierOrNamespacedName::JSXIdentifier(Box::new(node))
            }
            NodeKind::JSXNamespacedName => {
                let node = JSXNamespacedName::convert(cx, node);
                JSXIdentifierOrNamespacedName::JSXNamespacedName(Box::new(node))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind,
                    "JSXIdentifierOrNamespacedName"
                )
            }
        }
    }
}
impl FromHermes for JSXChildItem {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::JSXText => {
                let node = JSXText::convert(cx, node);
                JSXChildItem::JSXText(Box::new(node))
            }
            NodeKind::JSXStringLiteral => {
                let node = JSXStringLiteral::convert(cx, node);
                JSXChildItem::JSXStringLiteral(Box::new(node))
            }
            NodeKind::JSXExpressionContainer => {
                let node = JSXExpressionContainer::convert(cx, node);
                JSXChildItem::JSXExpressionContainer(Box::new(node))
            }
            NodeKind::JSXSpreadChild => {
                let node = JSXSpreadChild::convert(cx, node);
                JSXChildItem::JSXSpreadChild(Box::new(node))
            }
            NodeKind::JSXElement => {
                let node = JSXElement::convert(cx, node);
                JSXChildItem::JSXElement(Box::new(node))
            }
            NodeKind::JSXFragment => {
                let node = JSXFragment::convert(cx, node);
                JSXChildItem::JSXFragment(Box::new(node))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind, "JSXChildItem"
                )
            }
        }
    }
}
impl FromHermes for DeclarationOrExpression {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::ClassDeclaration => {
                let node = ClassDeclaration::convert(cx, node);
                DeclarationOrExpression::Declaration(
                    Declaration::ClassDeclaration(Box::new(node)),
                )
            }
            NodeKind::FunctionDeclaration => {
                let node = FunctionDeclaration::convert(cx, node);
                DeclarationOrExpression::Declaration(
                    Declaration::FunctionDeclaration(Box::new(node)),
                )
            }
            NodeKind::VariableDeclaration => {
                let node = VariableDeclaration::convert(cx, node);
                DeclarationOrExpression::Declaration(
                    Declaration::VariableDeclaration(Box::new(node)),
                )
            }
            NodeKind::TSTypeAliasDeclaration => {
                let node = TSTypeAliasDeclaration::convert(cx, node);
                DeclarationOrExpression::Declaration(
                    Declaration::TSTypeAliasDeclaration(Box::new(node)),
                )
            }
            NodeKind::ArrayExpression => {
                let node = ArrayExpression::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::ArrayExpression(Box::new(node)),
                )
            }
            NodeKind::ArrowFunctionExpression => {
                let node = ArrowFunctionExpression::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::ArrowFunctionExpression(Box::new(node)),
                )
            }
            NodeKind::AssignmentExpression => {
                let node = AssignmentExpression::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::AssignmentExpression(Box::new(node)),
                )
            }
            NodeKind::AwaitExpression => {
                let node = AwaitExpression::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::AwaitExpression(Box::new(node)),
                )
            }
            NodeKind::BinaryExpression => {
                let node = BinaryExpression::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::BinaryExpression(Box::new(node)),
                )
            }
            NodeKind::BooleanLiteral => {
                let node = BooleanLiteral::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::BooleanLiteral(Box::new(node)),
                )
            }
            NodeKind::CallExpression => {
                let node = CallExpression::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::CallExpression(Box::new(node)),
                )
            }
            NodeKind::ClassExpression => {
                let node = ClassExpression::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::ClassExpression(Box::new(node)),
                )
            }
            NodeKind::ConditionalExpression => {
                let node = ConditionalExpression::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::ConditionalExpression(Box::new(node)),
                )
            }
            NodeKind::CoverTypedIdentifier => {
                let node = CoverTypedIdentifier::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::CoverTypedIdentifier(Box::new(node)),
                )
            }
            NodeKind::FunctionExpression => {
                let node = FunctionExpression::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::FunctionExpression(Box::new(node)),
                )
            }
            NodeKind::Identifier => {
                let node = Identifier::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::Identifier(Box::new(node)),
                )
            }
            NodeKind::ImportExpression => {
                let node = ImportExpression::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::ImportExpression(Box::new(node)),
                )
            }
            NodeKind::JSXElement => {
                let node = JSXElement::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::JSXElement(Box::new(node)),
                )
            }
            NodeKind::JSXFragment => {
                let node = JSXFragment::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::JSXFragment(Box::new(node)),
                )
            }
            NodeKind::LogicalExpression => {
                let node = LogicalExpression::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::LogicalExpression(Box::new(node)),
                )
            }
            NodeKind::MemberExpression => {
                let node = MemberExpression::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::MemberExpression(Box::new(node)),
                )
            }
            NodeKind::MetaProperty => {
                let node = MetaProperty::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::MetaProperty(Box::new(node)),
                )
            }
            NodeKind::NewExpression => {
                let node = NewExpression::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::NewExpression(Box::new(node)),
                )
            }
            NodeKind::NullLiteral => {
                let node = NullLiteral::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::NullLiteral(Box::new(node)),
                )
            }
            NodeKind::NumericLiteral => {
                let node = NumericLiteral::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::NumericLiteral(Box::new(node)),
                )
            }
            NodeKind::ObjectExpression => {
                let node = ObjectExpression::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::ObjectExpression(Box::new(node)),
                )
            }
            NodeKind::OptionalCallExpression => {
                let node = OptionalCallExpression::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::OptionalCallExpression(Box::new(node)),
                )
            }
            NodeKind::OptionalMemberExpression => {
                let node = OptionalMemberExpression::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::OptionalMemberExpression(Box::new(node)),
                )
            }
            NodeKind::RegExpLiteral => {
                let node = RegExpLiteral::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::RegExpLiteral(Box::new(node)),
                )
            }
            NodeKind::SequenceExpression => {
                let node = SequenceExpression::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::SequenceExpression(Box::new(node)),
                )
            }
            NodeKind::StringLiteral => {
                let node = StringLiteral::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::StringLiteral(Box::new(node)),
                )
            }
            NodeKind::TaggedTemplateExpression => {
                let node = TaggedTemplateExpression::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::TaggedTemplateExpression(Box::new(node)),
                )
            }
            NodeKind::TemplateLiteral => {
                let node = TemplateLiteral::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::TemplateLiteral(Box::new(node)),
                )
            }
            NodeKind::ThisExpression => {
                let node = ThisExpression::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::ThisExpression(Box::new(node)),
                )
            }
            NodeKind::UnaryExpression => {
                let node = UnaryExpression::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::UnaryExpression(Box::new(node)),
                )
            }
            NodeKind::UpdateExpression => {
                let node = UpdateExpression::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::UpdateExpression(Box::new(node)),
                )
            }
            NodeKind::YieldExpression => {
                let node = YieldExpression::convert(cx, node);
                DeclarationOrExpression::Expression(
                    Expression::YieldExpression(Box::new(node)),
                )
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind,
                    "DeclarationOrExpression"
                )
            }
        }
    }
}
impl FromHermes for ClassItem {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::MethodDefinition => {
                let node = MethodDefinition::convert(cx, node);
                ClassItem::MethodDefinition(Box::new(node))
            }
            NodeKind::ClassProperty => {
                let node = ClassProperty::convert(cx, node);
                ClassItem::ClassProperty(Box::new(node))
            }
            NodeKind::ClassPrivateProperty => {
                let node = ClassPrivateProperty::convert(cx, node);
                ClassItem::ClassPrivateProperty(Box::new(node))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind, "ClassItem"
                )
            }
        }
    }
}
impl FromHermes for ExpressionOrPrivateIdentifier {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::ArrayExpression => {
                let node = ArrayExpression::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::ArrayExpression(Box::new(node)),
                )
            }
            NodeKind::ArrowFunctionExpression => {
                let node = ArrowFunctionExpression::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::ArrowFunctionExpression(Box::new(node)),
                )
            }
            NodeKind::AssignmentExpression => {
                let node = AssignmentExpression::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::AssignmentExpression(Box::new(node)),
                )
            }
            NodeKind::AwaitExpression => {
                let node = AwaitExpression::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::AwaitExpression(Box::new(node)),
                )
            }
            NodeKind::BinaryExpression => {
                let node = BinaryExpression::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::BinaryExpression(Box::new(node)),
                )
            }
            NodeKind::BooleanLiteral => {
                let node = BooleanLiteral::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::BooleanLiteral(Box::new(node)),
                )
            }
            NodeKind::CallExpression => {
                let node = CallExpression::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::CallExpression(Box::new(node)),
                )
            }
            NodeKind::ClassExpression => {
                let node = ClassExpression::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::ClassExpression(Box::new(node)),
                )
            }
            NodeKind::ConditionalExpression => {
                let node = ConditionalExpression::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::ConditionalExpression(Box::new(node)),
                )
            }
            NodeKind::CoverTypedIdentifier => {
                let node = CoverTypedIdentifier::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::CoverTypedIdentifier(Box::new(node)),
                )
            }
            NodeKind::FunctionExpression => {
                let node = FunctionExpression::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::FunctionExpression(Box::new(node)),
                )
            }
            NodeKind::Identifier => {
                let node = Identifier::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::Identifier(Box::new(node)),
                )
            }
            NodeKind::ImportExpression => {
                let node = ImportExpression::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::ImportExpression(Box::new(node)),
                )
            }
            NodeKind::JSXElement => {
                let node = JSXElement::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::JSXElement(Box::new(node)),
                )
            }
            NodeKind::JSXFragment => {
                let node = JSXFragment::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::JSXFragment(Box::new(node)),
                )
            }
            NodeKind::LogicalExpression => {
                let node = LogicalExpression::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::LogicalExpression(Box::new(node)),
                )
            }
            NodeKind::MemberExpression => {
                let node = MemberExpression::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::MemberExpression(Box::new(node)),
                )
            }
            NodeKind::MetaProperty => {
                let node = MetaProperty::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::MetaProperty(Box::new(node)),
                )
            }
            NodeKind::NewExpression => {
                let node = NewExpression::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::NewExpression(Box::new(node)),
                )
            }
            NodeKind::NullLiteral => {
                let node = NullLiteral::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::NullLiteral(Box::new(node)),
                )
            }
            NodeKind::NumericLiteral => {
                let node = NumericLiteral::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::NumericLiteral(Box::new(node)),
                )
            }
            NodeKind::ObjectExpression => {
                let node = ObjectExpression::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::ObjectExpression(Box::new(node)),
                )
            }
            NodeKind::OptionalCallExpression => {
                let node = OptionalCallExpression::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::OptionalCallExpression(Box::new(node)),
                )
            }
            NodeKind::OptionalMemberExpression => {
                let node = OptionalMemberExpression::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::OptionalMemberExpression(Box::new(node)),
                )
            }
            NodeKind::RegExpLiteral => {
                let node = RegExpLiteral::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::RegExpLiteral(Box::new(node)),
                )
            }
            NodeKind::SequenceExpression => {
                let node = SequenceExpression::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::SequenceExpression(Box::new(node)),
                )
            }
            NodeKind::StringLiteral => {
                let node = StringLiteral::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::StringLiteral(Box::new(node)),
                )
            }
            NodeKind::TaggedTemplateExpression => {
                let node = TaggedTemplateExpression::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::TaggedTemplateExpression(Box::new(node)),
                )
            }
            NodeKind::TemplateLiteral => {
                let node = TemplateLiteral::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::TemplateLiteral(Box::new(node)),
                )
            }
            NodeKind::ThisExpression => {
                let node = ThisExpression::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::ThisExpression(Box::new(node)),
                )
            }
            NodeKind::UnaryExpression => {
                let node = UnaryExpression::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::UnaryExpression(Box::new(node)),
                )
            }
            NodeKind::UpdateExpression => {
                let node = UpdateExpression::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::UpdateExpression(Box::new(node)),
                )
            }
            NodeKind::YieldExpression => {
                let node = YieldExpression::convert(cx, node);
                ExpressionOrPrivateIdentifier::Expression(
                    Expression::YieldExpression(Box::new(node)),
                )
            }
            NodeKind::PrivateName => {
                let node = PrivateName::convert(cx, node);
                ExpressionOrPrivateIdentifier::PrivateName(Box::new(node))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind,
                    "ExpressionOrPrivateIdentifier"
                )
            }
        }
    }
}
impl FromHermes for TypeAnnotation {
    fn convert(cx: &mut Context, node: NodePtr) -> Self {
        let node_ref = node.as_ref();
        match node_ref.kind {
            NodeKind::TSTypeAnnotation => {
                let node = TSTypeAnnotation::convert(cx, node);
                TypeAnnotation::TSTypeAnnotation(Box::new(node))
            }
            _ => {
                panic!(
                    "Unexpected node kind `{:?}` for `{}`", node_ref.kind,
                    "TypeAnnotation"
                )
            }
        }
    }
}
impl FromHermesLabel for VariableDeclarationKind {
    fn convert(cx: &mut Context, label: NodeLabel) -> Self {
        let utf_str = utf8_with_surrogates_to_string(label.as_slice()).unwrap();
        utf_str.parse().unwrap()
    }
}
impl FromHermesLabel for PropertyKind {
    fn convert(cx: &mut Context, label: NodeLabel) -> Self {
        let utf_str = utf8_with_surrogates_to_string(label.as_slice()).unwrap();
        utf_str.parse().unwrap()
    }
}
impl FromHermesLabel for UnaryOperator {
    fn convert(cx: &mut Context, label: NodeLabel) -> Self {
        let utf_str = utf8_with_surrogates_to_string(label.as_slice()).unwrap();
        utf_str.parse().unwrap()
    }
}
impl FromHermesLabel for UpdateOperator {
    fn convert(cx: &mut Context, label: NodeLabel) -> Self {
        let utf_str = utf8_with_surrogates_to_string(label.as_slice()).unwrap();
        utf_str.parse().unwrap()
    }
}
impl FromHermesLabel for BinaryOperator {
    fn convert(cx: &mut Context, label: NodeLabel) -> Self {
        let utf_str = utf8_with_surrogates_to_string(label.as_slice()).unwrap();
        utf_str.parse().unwrap()
    }
}
impl FromHermesLabel for AssignmentOperator {
    fn convert(cx: &mut Context, label: NodeLabel) -> Self {
        let utf_str = utf8_with_surrogates_to_string(label.as_slice()).unwrap();
        utf_str.parse().unwrap()
    }
}
impl FromHermesLabel for LogicalOperator {
    fn convert(cx: &mut Context, label: NodeLabel) -> Self {
        let utf_str = utf8_with_surrogates_to_string(label.as_slice()).unwrap();
        utf_str.parse().unwrap()
    }
}
impl FromHermesLabel for SourceType {
    fn convert(cx: &mut Context, label: NodeLabel) -> Self {
        let utf_str = utf8_with_surrogates_to_string(label.as_slice()).unwrap();
        utf_str.parse().unwrap()
    }
}
impl FromHermesLabel for MethodKind {
    fn convert(cx: &mut Context, label: NodeLabel) -> Self {
        let utf_str = utf8_with_surrogates_to_string(label.as_slice()).unwrap();
        utf_str.parse().unwrap()
    }
}
