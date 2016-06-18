import * as ts from 'typescript';

import {MetadataError, MetadataGlobalReferenceExpression, MetadataImportedSymbolReferenceExpression, MetadataSymbolicCallExpression, MetadataSymbolicReferenceExpression, MetadataValue, isMetadataError, isMetadataGlobalReferenceExpression, isMetadataImportedSymbolReferenceExpression, isMetadataModuleReferenceExpression, isMetadataSymbolicReferenceExpression, isMetadataSymbolicSpreadExpression} from './schema';
import {Symbols} from './symbols';

function isMethodCallOf(callExpression: ts.CallExpression, memberName: string): boolean {
  const expression = callExpression.expression;
  if (expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
    const propertyAccessExpression = <ts.PropertyAccessExpression>expression;
    const name = propertyAccessExpression.name;
    if (name.kind == ts.SyntaxKind.Identifier) {
      return name.text === memberName;
    }
  }
  return false;
}

function isCallOf(callExpression: ts.CallExpression, ident: string): boolean {
  const expression = callExpression.expression;
  if (expression.kind === ts.SyntaxKind.Identifier) {
    const identifier = <ts.Identifier>expression;
    return identifier.text === ident;
  }
  return false;
}

/**
 * ts.forEachChild stops iterating children when the callback return a truthy value.
 * This method inverts this to implement an `every` style iterator. It will return
 * true if every call to `cb` returns `true`.
 */
function everyNodeChild(node: ts.Node, cb: (node: ts.Node) => boolean) {
  return !ts.forEachChild(node, node => !cb(node));
}

export function isPrimitive(value: any): boolean {
  return Object(value) !== value;
}

function isDefined(obj: any): boolean {
  return obj !== undefined;
}

// import {propertyName as name} from 'place'
// import {name} from 'place'
export interface ImportSpecifierMetadata {
  name: string;
  propertyName?: string;
}
export interface ImportMetadata {
  defaultName?: string;                      // import d from 'place'
  namespace?: string;                        // import * as d from 'place'
  namedImports?: ImportSpecifierMetadata[];  // import {a} from 'place'
  from: string;                              // from 'place'
}


function getSourceFileOfNode(node: ts.Node): ts.SourceFile {
  while (node && node.kind != ts.SyntaxKind.SourceFile) {
    node = node.parent
  }
  return <ts.SourceFile>node;
}

/* @internal */
export function errorSymbol(
    message: string, node?: ts.Node, context?: {[name: string]: string},
    sourceFile?: ts.SourceFile): MetadataError {
  let result: MetadataError;
  if (node) {
    sourceFile = sourceFile || getSourceFileOfNode(node);
    if (sourceFile) {
      let {line, character} = ts.getLineAndCharacterOfPosition(sourceFile, node.pos);
      result = {__symbolic: 'error', message, line, character};
    };
  }
  if (!result) {
    result = {__symbolic: 'error', message};
  }
  if (context) {
    result.context = context;
  }
  return result;
}

/**
 * Produce a symbolic representation of an expression folding values into their final value when
 * possible.
 */
export class Evaluator {
  constructor(private symbols: Symbols) {}

  nameOf(node: ts.Node): string|MetadataError {
    if (node.kind == ts.SyntaxKind.Identifier) {
      return (<ts.Identifier>node).text;
    }
    const result = this.evaluateNode(node);
    if (isMetadataError(result) || typeof result === 'string') {
      return result;
    } else {
      return errorSymbol('Name expected', node, {received: node.getText()});
    }
  }

  /**
   * Returns true if the expression represented by `node` can be folded into a literal expression.
   *
   * For example, a literal is always foldable. This means that literal expressions such as `1.2`
   * `"Some value"` `true` `false` are foldable.
   *
   * - An object literal is foldable if all the properties in the literal are foldable.
   * - An array literal is foldable if all the elements are foldable.
   * - A call is foldable if it is a call to a Array.prototype.concat or a call to CONST_EXPR.
   * - A property access is foldable if the object is foldable.
   * - A array index is foldable if index expression is foldable and the array is foldable.
   * - Binary operator expressions are foldable if the left and right expressions are foldable and
   *   it is one of '+', '-', '*', '/', '%', '||', and '&&'.
   * - An identifier is foldable if a value can be found for its symbol in the evaluator symbol
   *   table.
   */
  public isFoldable(node: ts.Node): boolean {
    return this.isFoldableWorker(node, new Map<ts.Node, boolean>());
  }

  private isFoldableWorker(node: ts.Node, folding: Map<ts.Node, boolean>): boolean {
    if (node) {
      switch (node.kind) {
        case ts.SyntaxKind.ObjectLiteralExpression:
          return everyNodeChild(node, child => {
            if (child.kind === ts.SyntaxKind.PropertyAssignment) {
              const propertyAssignment = <ts.PropertyAssignment>child;
              return this.isFoldableWorker(propertyAssignment.initializer, folding);
            }
            return false;
          });
        case ts.SyntaxKind.ArrayLiteralExpression:
          return everyNodeChild(node, child => this.isFoldableWorker(child, folding));
        case ts.SyntaxKind.CallExpression:
          const callExpression = <ts.CallExpression>node;
          // We can fold a <array>.concat(<v>).
          if (isMethodCallOf(callExpression, 'concat') && callExpression.arguments.length === 1) {
            const arrayNode = (<ts.PropertyAccessExpression>callExpression.expression).expression;
            if (this.isFoldableWorker(arrayNode, folding) &&
                this.isFoldableWorker(callExpression.arguments[0], folding)) {
              // It needs to be an array.
              const arrayValue = this.evaluateNode(arrayNode);
              if (arrayValue && Array.isArray(arrayValue)) {
                return true;
              }
            }
          }

          // We can fold a call to CONST_EXPR
          if (isCallOf(callExpression, 'CONST_EXPR') && callExpression.arguments.length === 1)
            return this.isFoldableWorker(callExpression.arguments[0], folding);
          return false;
        case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
        case ts.SyntaxKind.StringLiteral:
        case ts.SyntaxKind.NumericLiteral:
        case ts.SyntaxKind.NullKeyword:
        case ts.SyntaxKind.TrueKeyword:
        case ts.SyntaxKind.FalseKeyword:
          return true;
        case ts.SyntaxKind.ParenthesizedExpression:
          const parenthesizedExpression = <ts.ParenthesizedExpression>node;
          return this.isFoldableWorker(parenthesizedExpression.expression, folding);
        case ts.SyntaxKind.BinaryExpression:
          const binaryExpression = <ts.BinaryExpression>node;
          switch (binaryExpression.operatorToken.kind) {
            case ts.SyntaxKind.PlusToken:
            case ts.SyntaxKind.MinusToken:
            case ts.SyntaxKind.AsteriskToken:
            case ts.SyntaxKind.SlashToken:
            case ts.SyntaxKind.PercentToken:
            case ts.SyntaxKind.AmpersandAmpersandToken:
            case ts.SyntaxKind.BarBarToken:
              return this.isFoldableWorker(binaryExpression.left, folding) &&
                  this.isFoldableWorker(binaryExpression.right, folding);
          }
        case ts.SyntaxKind.PropertyAccessExpression:
          const propertyAccessExpression = <ts.PropertyAccessExpression>node;
          return this.isFoldableWorker(propertyAccessExpression.expression, folding);
        case ts.SyntaxKind.ElementAccessExpression:
          const elementAccessExpression = <ts.ElementAccessExpression>node;
          return this.isFoldableWorker(elementAccessExpression.expression, folding) &&
              this.isFoldableWorker(elementAccessExpression.argumentExpression, folding);
        case ts.SyntaxKind.Identifier:
          let identifier = <ts.Identifier>node;
          let reference = this.symbols.resolve(identifier.text);
          if (reference !== undefined && isPrimitive(reference)) {
            return true;
          }
          break;
      }
    }
    return false;
  }

  /**
   * Produce a JSON serialiable object representing `node`. The foldable values in the expression
   * tree are folded. For example, a node representing `1 + 2` is folded into `3`.
   */
  public evaluateNode(node: ts.Node): MetadataValue {
    let error: MetadataError|undefined;
    switch (node.kind) {
      case ts.SyntaxKind.ObjectLiteralExpression:
        let obj: {[name: string]: any} = {};
        ts.forEachChild(node, child => {
          switch (child.kind) {
            case ts.SyntaxKind.ShorthandPropertyAssignment:
            case ts.SyntaxKind.PropertyAssignment:
              const assignment = <ts.PropertyAssignment|ts.ShorthandPropertyAssignment>child;
              const propertyName = this.nameOf(assignment.name);
              if (isMetadataError(propertyName)) {
                error = propertyName;
                return true;
              }
              const propertyValue = isPropertyAssignment(assignment) ?
                  this.evaluateNode(assignment.initializer) :
                  {__symbolic: 'reference', name: propertyName};
              if (isMetadataError(propertyValue)) {
                error = propertyValue;
                return true;  // Stop the forEachChild.
              } else {
                obj[<string>propertyName] = propertyValue;
              }
          }
        });
        if (error) return error;
        return obj;
      case ts.SyntaxKind.ArrayLiteralExpression:
        let arr: MetadataValue[] = [];
        ts.forEachChild(node, child => {
          const value = this.evaluateNode(child);

          // Check for error
          if (isMetadataError(value)) {
            error = value;
            return true;  // Stop the forEachChild.
          }

          // Handle spread expressions
          if (isMetadataSymbolicSpreadExpression(value)) {
            if (Array.isArray(value.expression)) {
              for (let spreadValue of value.expression) {
                arr.push(spreadValue);
              }
              return;
            }
          }

          arr.push(value);
        });
        if (error) return error;
        return arr;
      case ts.SyntaxKind.SpreadElementExpression:
        let spread = <ts.SpreadElementExpression>node;
        let spreadExpression = this.evaluateNode(spread.expression);
        return {__symbolic: 'spread', expression: spreadExpression};
      case ts.SyntaxKind.CallExpression:
        const callExpression = <ts.CallExpression>node;
        if (isCallOf(callExpression, 'forwardRef') && callExpression.arguments.length === 1) {
          const firstArgument = callExpression.arguments[0];
          if (firstArgument.kind == ts.SyntaxKind.ArrowFunction) {
            const arrowFunction = <ts.ArrowFunction>firstArgument;
            return this.evaluateNode(arrowFunction.body);
          }
        }
        const args = callExpression.arguments.map(arg => this.evaluateNode(arg));
        if (args.some(isMetadataError)) {
          return args.find(isMetadataError);
        }
        if (this.isFoldable(callExpression)) {
          if (isMethodCallOf(callExpression, 'concat')) {
            const arrayValue = <MetadataValue[]>this.evaluateNode(
                (<ts.PropertyAccessExpression>callExpression.expression).expression);
            if (isMetadataError(arrayValue)) return arrayValue;
            return arrayValue.concat(args[0]);
          }
        }
        // Always fold a CONST_EXPR even if the argument is not foldable.
        if (isCallOf(callExpression, 'CONST_EXPR') && callExpression.arguments.length === 1) {
          return args[0];
        }
        const expression = this.evaluateNode(callExpression.expression);
        if (isMetadataError(expression)) {
          return expression;
        }
        let result: MetadataSymbolicCallExpression = {__symbolic: 'call', expression: expression};
        if (args && args.length) {
          result.arguments = args;
        }
        return result;
      case ts.SyntaxKind.NewExpression:
        const newExpression = <ts.NewExpression>node;
        const newArgs = newExpression.arguments.map(arg => this.evaluateNode(arg));
        if (newArgs.some(isMetadataError)) {
          return newArgs.find(isMetadataError);
        }
        const newTarget = this.evaluateNode(newExpression.expression);
        if (isMetadataError(newTarget)) {
          return newTarget;
        }
        const call: MetadataSymbolicCallExpression = {__symbolic: 'new', expression: newTarget};
        if (newArgs.length) {
          call.arguments = newArgs;
        }
        return call;
      case ts.SyntaxKind.PropertyAccessExpression: {
        const propertyAccessExpression = <ts.PropertyAccessExpression>node;
        const expression = this.evaluateNode(propertyAccessExpression.expression);
        if (isMetadataError(expression)) {
          return expression;
        }
        const member = this.nameOf(propertyAccessExpression.name);
        if (isMetadataError(member)) {
          return member;
        }
        if (expression && this.isFoldable(propertyAccessExpression.expression))
          return (<any>expression)[<string>member];
        if (isMetadataModuleReferenceExpression(expression)) {
          // A select into a module refrence and be converted into a reference to the symbol
          // in the module
          return {__symbolic: 'reference', module: expression.module, name: member};
        }
        return {__symbolic: 'select', expression, member};
      }
      case ts.SyntaxKind.ElementAccessExpression: {
        const elementAccessExpression = <ts.ElementAccessExpression>node;
        const expression = this.evaluateNode(elementAccessExpression.expression);
        if (isMetadataError(expression)) {
          return expression;
        }
        const index = this.evaluateNode(elementAccessExpression.argumentExpression);
        if (isMetadataError(expression)) {
          return expression;
        }
        if (this.isFoldable(elementAccessExpression.expression) &&
            this.isFoldable(elementAccessExpression.argumentExpression))
          return (<any>expression)[<string|number>index];
        return {__symbolic: 'index', expression, index};
      }
      case ts.SyntaxKind.Identifier:
        const identifier = <ts.Identifier>node;
        const name = identifier.text;
        const reference = this.symbols.resolve(name);
        if (reference === undefined) {
          // Encode as a global reference. StaticReflector will check the reference.
          return { __symbolic: 'reference', name }
        }
        return reference;
      case ts.SyntaxKind.TypeReference:
        const typeReferenceNode = <ts.TypeReferenceNode>node;
        const typeNameNode = typeReferenceNode.typeName;
        const getReference: (typeNameNode: ts.Identifier | ts.QualifiedName) =>
            MetadataSymbolicReferenceExpression | MetadataError = node => {
              if (typeNameNode.kind === ts.SyntaxKind.QualifiedName) {
                const qualifiedName = <ts.QualifiedName>node;
                const left = this.evaluateNode(qualifiedName.left);
                if (isMetadataModuleReferenceExpression(left)) {
                  return <MetadataImportedSymbolReferenceExpression> {
                    __symbolic: 'reference', module: left.module, name: qualifiedName.right.text
                  }
                }
                return errorSymbol('Qualified type names not supported', node);
              } else {
                const identifier = <ts.Identifier>typeNameNode;
                let symbol = this.symbols.resolve(identifier.text);
                if (isMetadataError(symbol) || isMetadataSymbolicReferenceExpression(symbol)) {
                  return symbol;
                }
                return errorSymbol('Could not resolve type', node, {typeName: identifier.text});
              }
            };
        const typeReference = getReference(typeNameNode);
        if (isMetadataError(typeReference)) {
          return typeReference;
        }
        if (!isMetadataModuleReferenceExpression(typeReference) &&
            typeReferenceNode.typeArguments && typeReferenceNode.typeArguments.length) {
          const args = typeReferenceNode.typeArguments.map(element => this.evaluateNode(element));
          // TODO: Remove typecast when upgraded to 2.0 as it will be corretly inferred.
          // Some versions of 1.9 do not infer this correctly.
          (<MetadataImportedSymbolReferenceExpression>typeReference).arguments = args;
        }
        return typeReference;
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
        return (<ts.LiteralExpression>node).text;
      case ts.SyntaxKind.StringLiteral:
        return (<ts.StringLiteral>node).text;
      case ts.SyntaxKind.NumericLiteral:
        return parseFloat((<ts.LiteralExpression>node).text);
      case ts.SyntaxKind.AnyKeyword:
        return {__symbolic: 'reference', name: 'any'};
      case ts.SyntaxKind.StringKeyword:
        return {__symbolic: 'reference', name: 'string'};
      case ts.SyntaxKind.NumberKeyword:
        return {__symbolic: 'reference', name: 'number'};
      case ts.SyntaxKind.BooleanKeyword:
        return {__symbolic: 'reference', name: 'boolean'};
      case ts.SyntaxKind.ArrayType:
        const arrayTypeNode = <ts.ArrayTypeNode>node;
        return {
          __symbolic: 'reference',
          name: 'Array',
          arguments: [this.evaluateNode(arrayTypeNode.elementType)]
        };
      case ts.SyntaxKind.NullKeyword:
        return null;
      case ts.SyntaxKind.TrueKeyword:
        return true;
      case ts.SyntaxKind.FalseKeyword:
        return false;
      case ts.SyntaxKind.ParenthesizedExpression:
        const parenthesizedExpression = <ts.ParenthesizedExpression>node;
        return this.evaluateNode(parenthesizedExpression.expression);
      case ts.SyntaxKind.TypeAssertionExpression:
        const typeAssertion = <ts.TypeAssertion>node;
        return this.evaluateNode(typeAssertion.expression);
      case ts.SyntaxKind.PrefixUnaryExpression:
        const prefixUnaryExpression = <ts.PrefixUnaryExpression>node;
        const operand = this.evaluateNode(prefixUnaryExpression.operand);
        if (isDefined(operand) && isPrimitive(operand)) {
          switch (prefixUnaryExpression.operator) {
            case ts.SyntaxKind.PlusToken:
              return +operand;
            case ts.SyntaxKind.MinusToken:
              return -operand;
            case ts.SyntaxKind.TildeToken:
              return ~operand;
            case ts.SyntaxKind.ExclamationToken:
              return !operand;
          }
        }
        let operatorText: string;
        switch (prefixUnaryExpression.operator) {
          case ts.SyntaxKind.PlusToken:
            operatorText = '+';
            break;
          case ts.SyntaxKind.MinusToken:
            operatorText = '-';
            break;
          case ts.SyntaxKind.TildeToken:
            operatorText = '~';
            break;
          case ts.SyntaxKind.ExclamationToken:
            operatorText = '!';
            break;
          default:
            return undefined;
        }
        return {__symbolic: 'pre', operator: operatorText, operand: operand};
      case ts.SyntaxKind.BinaryExpression:
        const binaryExpression = <ts.BinaryExpression>node;
        const left = this.evaluateNode(binaryExpression.left);
        const right = this.evaluateNode(binaryExpression.right);
        if (isDefined(left) && isDefined(right)) {
          if (isPrimitive(left) && isPrimitive(right))
            switch (binaryExpression.operatorToken.kind) {
              case ts.SyntaxKind.BarBarToken:
                return <any>left || <any>right;
              case ts.SyntaxKind.AmpersandAmpersandToken:
                return <any>left && <any>right;
              case ts.SyntaxKind.AmpersandToken:
                return <any>left & <any>right;
              case ts.SyntaxKind.BarToken:
                return <any>left | <any>right;
              case ts.SyntaxKind.CaretToken:
                return <any>left ^ <any>right;
              case ts.SyntaxKind.EqualsEqualsToken:
                return <any>left == <any>right;
              case ts.SyntaxKind.ExclamationEqualsToken:
                return <any>left != <any>right;
              case ts.SyntaxKind.EqualsEqualsEqualsToken:
                return <any>left === <any>right;
              case ts.SyntaxKind.ExclamationEqualsEqualsToken:
                return <any>left !== <any>right;
              case ts.SyntaxKind.LessThanToken:
                return <any>left < <any>right;
              case ts.SyntaxKind.GreaterThanToken:
                return <any>left > <any>right;
              case ts.SyntaxKind.LessThanEqualsToken:
                return <any>left <= <any>right;
              case ts.SyntaxKind.GreaterThanEqualsToken:
                return <any>left >= <any>right;
              case ts.SyntaxKind.LessThanLessThanToken:
                return (<any>left) << (<any>right);
              case ts.SyntaxKind.GreaterThanGreaterThanToken:
                return <any>left >> <any>right;
              case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
                return <any>left >>> <any>right;
              case ts.SyntaxKind.PlusToken:
                return <any>left + <any>right;
              case ts.SyntaxKind.MinusToken:
                return <any>left - <any>right;
              case ts.SyntaxKind.AsteriskToken:
                return <any>left * <any>right;
              case ts.SyntaxKind.SlashToken:
                return <any>left / <any>right;
              case ts.SyntaxKind.PercentToken:
                return <any>left % <any>right;
            }
          return {
            __symbolic: 'binop',
            operator: binaryExpression.operatorToken.getText(),
            left: left,
            right: right
          };
        }
        break;
      case ts.SyntaxKind.FunctionExpression:
      case ts.SyntaxKind.ArrowFunction:
        return errorSymbol('Function call not supported', node);
    }
    return errorSymbol('Expression form not supported', node);
  }
}

function isPropertyAssignment(node: ts.Node): node is ts.PropertyAssignment {
  return node.kind == ts.SyntaxKind.PropertyAssignment;
}