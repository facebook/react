export default function (program) {

    const checker = program.getTypeChecker();

    return (context) => {

        return (sourceFile) => {

            const visitor = (node) => {

                let factory = ts.factory;
                if (ts.isVariableDeclaration(node) && node.name.escapedText.startsWith("$$")) {
                    return factory.createVariableDeclaration(
                        factory.createArrayBindingPattern([
                            factory.createBindingElement(
                                undefined,
                                undefined,
                                factory.createIdentifier(node.name.escapedText + 'Value'),
                                undefined
                            ),
                            factory.createBindingElement(
                                undefined,
                                undefined,
                                factory.createIdentifier("$$set" + node.name.escapedText.slice(2).replace(/^[\w]/, m => m.toUpperCase()) + 'Value'),
                                undefined
                            )
                        ]),
                        undefined,
                        undefined,
                        factory.createCallExpression(
                            factory.createIdentifier("useState"),
                            undefined,
                            [node.initializer]
                        )
                    );
                }

                if (ts.isPostfixUnaryExpression(node) && node.operand.escapedText.startsWith("$$") && node.kind === 212) {
                    return (
                        factory.createCallExpression(
                            factory.createIdentifier("$$set" + node.operand.escapedText.slice(2).replace(/^[\w]/, m => m.toUpperCase()) + 'Value'),
                            undefined,
                            [factory.createArrowFunction(
                                undefined,
                                undefined,
                                [],
                                undefined,
                                factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                                factory.createBinaryExpression(
                                    factory.createIdentifier(node.operand.escapedText + 'Value'),
                                    factory.createToken(ts.SyntaxKind.PlusToken),
                                    factory.createNumericLiteral("1")
                                )
                            )]
                        )
                    )
                    return resultNode;
                }

                if (ts.isPostfixUnaryExpression(node) && node.operand.escapedText.startsWith("$$") && node.kind === 212) {
                    window.plusEqualNode = node;

                    let resultNode = factory.createCallExpression(
                        factory.createElementAccessExpression(
                            node.operand,
                            factory.createNumericLiteral("0")),
                        undefined,
                        [
                            factory.createArrowFunction(
                                undefined,
                                undefined,
                                [],
                                undefined,
                                factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                                factory.createBinaryExpression(
                                    factory.createElementAccessExpression(node.operand, factory.createNumericLiteral("1")),
                                    factory.createToken(node.operator === 46 ? ts.SyntaxKind.MinusToken : ts.SyntaxKind.PlusToken),
                                    factory.createNumericLiteral("1")
                                )
                            )
                        ]
                    );
                }
                if (ts.isIdentifier(node) && node.text.startsWith("$$") && ts.isJsxExpression(node.parent)) {
                    return factory.createIdentifier(node.escapedText + 'Value');
                }
                return ts.visitEachChild(node, visitor, context);
            };
            return ts.visitNode(sourceFile, visitor);
        };
    }
}
