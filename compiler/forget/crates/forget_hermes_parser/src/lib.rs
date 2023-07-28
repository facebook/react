use forget_diagnostics::Diagnostic;
use hermes::parser::{
    hermes_get_BlockStatement_body, hermes_get_DeclareFunction_id,
    hermes_get_FunctionDeclaration_async, hermes_get_FunctionDeclaration_body,
    hermes_get_FunctionDeclaration_generator, hermes_get_Program_body, HermesParser, NodeKind,
    NodePtr, ParserDialect, ParserFlags,
};
use juno_support::source_manager::SourceRange;
use juno_support::NullTerminatedBuf;

pub fn parse(source: &str, file: &str) -> Result<forget_estree::Program, Vec<Diagnostic>> {
    let buf = NullTerminatedBuf::from_str_check(source);
    let result = HermesParser::parse(
        ParserFlags {
            dialect: ParserDialect::TypeScript,
            enable_jsx: true,
            store_doc_block: true,
            strict_mode: true,
        },
        &buf,
    );
    if result.has_errors() {
        let error_messages = result.messages();
        return Err(todo!("construct diagnostics"));
    }

    Ok(unsafe { convert_program(result.root().unwrap()) })
}

unsafe fn convert_program(node: NodePtr) -> forget_estree::Program {
    let node_ref = node.as_ref();
    let body = hermes_get_Program_body(node);
    let body: Vec<_> = body
        .iter()
        .map(|node| convert_module_item(NodePtr::new(node)))
        .collect();
    forget_estree::Program {
        body,
        source_type: forget_estree::SourceType::Module,
        loc: None,
        range: None,
    }
}

unsafe fn convert_module_item(node: NodePtr) -> forget_estree::ModuleItem {
    let node_ref = node.as_ref();
    match node_ref.kind {
        NodeKind::FunctionDeclaration => {
            forget_estree::ModuleItem::Statement(forget_estree::Statement::FunctionDeclaration(
                Box::new(convert_function_declaration(node)),
            ))
        }
        _ => todo!(),
    }
}

unsafe fn convert_function_declaration(node: NodePtr) -> forget_estree::FunctionDeclaration {
    let id = None; //hermes_get_DeclareFunction_id(node);
    let params = Vec::new();
    let body = forget_estree::FunctionBody::BlockStatement(Box::new(convert_block_statement(
        hermes_get_FunctionDeclaration_body(node),
    )));
    let is_generator = hermes_get_FunctionDeclaration_generator(node);
    let is_async = hermes_get_FunctionDeclaration_async(node);
    forget_estree::FunctionDeclaration {
        function: forget_estree::Function {
            id,
            params,
            body: Some(body),
            is_generator,
            is_async,
            loc: None,
            range: None,
        },
        loc: None,
        range: None,
    }
}

unsafe fn convert_block_statement(node: NodePtr) -> forget_estree::BlockStatement {
    let body = hermes_get_BlockStatement_body(node);
    let body: Vec<_> = body
        .iter()
        .map(|node| convert_statement(NodePtr::new(node)))
        .collect();
    forget_estree::BlockStatement {
        body,
        loc: None,
        range: None,
    }
}

unsafe fn convert_statement(node: NodePtr) -> forget_estree::Statement {
    let node_ref = node.as_ref();
    match node_ref.kind {
        NodeKind::ReturnStatement => {
            forget_estree::Statement::ReturnStatement(Box::new(forget_estree::ReturnStatement {
                argument: None,
                loc: None,
                range: None,
            }))
        }
        _ => todo!(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fixtures() {
        let res = parse("function foo() { return }", "hello.js");
        println!("{:#?}", res);
    }
}
