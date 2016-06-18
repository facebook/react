import * as ts from 'typescript';

import {Evaluator, errorSymbol, isPrimitive} from './evaluator';
import {ClassMetadata, ConstructorMetadata, MemberMetadata, MetadataError, MetadataMap, MetadataSymbolicExpression, MetadataSymbolicReferenceExpression, MetadataValue, MethodMetadata, ModuleMetadata, VERSION, isMetadataError, isMetadataSymbolicReferenceExpression} from './schema';
import {Symbols} from './symbols';


/**
 * Collect decorator metadata from a TypeScript module.
 */
export class MetadataCollector {
  constructor() {}

  /**
   * Returns a JSON.stringify friendly form describing the decorators of the exported classes from
   * the source file that is expected to correspond to a module.
   */
  public getMetadata(sourceFile: ts.SourceFile): ModuleMetadata {
    const locals = new Symbols(sourceFile);
    const evaluator = new Evaluator(locals);
    let metadata: {[name: string]: MetadataValue | ClassMetadata}|undefined;

    function objFromDecorator(decoratorNode: ts.Decorator): MetadataSymbolicExpression {
      return <MetadataSymbolicExpression>evaluator.evaluateNode(decoratorNode.expression);
    }

    function errorSym(
        message: string, node?: ts.Node, context?: {[name: string]: string}): MetadataError {
      return errorSymbol(message, node, context, sourceFile);
    }

    function classMetadataOf(classDeclaration: ts.ClassDeclaration): ClassMetadata {
      let result: ClassMetadata = {__symbolic: 'class'};

      function getDecorators(decorators: ts.Decorator[]): MetadataSymbolicExpression[] {
        if (decorators && decorators.length)
          return decorators.map(decorator => objFromDecorator(decorator));
        return undefined;
      }

      function referenceFrom(node: ts.Node): MetadataSymbolicReferenceExpression|MetadataError {
        const result = evaluator.evaluateNode(node);
        if (isMetadataError(result) || isMetadataSymbolicReferenceExpression(result)) {
          return result;
        } else {
          return errorSym('Symbol reference expected', node);
        }
      }

      // Add class decorators
      if (classDeclaration.decorators) {
        result.decorators = getDecorators(classDeclaration.decorators);
      }

      // member decorators
      let members: MetadataMap = null;
      function recordMember(name: string, metadata: MemberMetadata) {
        if (!members) members = {};
        let data = members.hasOwnProperty(name) ? members[name] : [];
        data.push(metadata);
        members[name] = data;
      }
      for (const member of classDeclaration.members) {
        let isConstructor = false;
        switch (member.kind) {
          case ts.SyntaxKind.Constructor:
            isConstructor = true;
          // fallthrough
          case ts.SyntaxKind.MethodDeclaration:
            const method = <ts.MethodDeclaration|ts.ConstructorDeclaration>member;
            const methodDecorators = getDecorators(method.decorators);
            const parameters = method.parameters;
            const parameterDecoratorData: (MetadataSymbolicExpression | MetadataError)[][] = [];
            const parametersData: (MetadataSymbolicReferenceExpression | MetadataError | null)[] =
                [];
            let hasDecoratorData: boolean = false;
            let hasParameterData: boolean = false;
            for (const parameter of parameters) {
              const parameterData = getDecorators(parameter.decorators);
              parameterDecoratorData.push(parameterData);
              hasDecoratorData = hasDecoratorData || !!parameterData;
              if (isConstructor) {
                if (parameter.type) {
                  parametersData.push(referenceFrom(parameter.type));
                } else {
                  parametersData.push(null);
                }
                hasParameterData = true;
              }
            }
            const data: MethodMetadata = {__symbolic: isConstructor ? 'constructor' : 'method'};
            const name = isConstructor ? '__ctor__' : evaluator.nameOf(member.name);
            if (methodDecorators) {
              data.decorators = methodDecorators;
            }
            if (hasDecoratorData) {
              data.parameterDecorators = parameterDecoratorData;
            }
            if (hasParameterData) {
              (<ConstructorMetadata>data).parameters = parametersData;
            }
            if (!isMetadataError(name)) {
              recordMember(name, data);
            }
            break;
          case ts.SyntaxKind.PropertyDeclaration:
          case ts.SyntaxKind.GetAccessor:
          case ts.SyntaxKind.SetAccessor:
            const property = <ts.PropertyDeclaration>member;
            const propertyDecorators = getDecorators(property.decorators);
            if (propertyDecorators) {
              let name = evaluator.nameOf(property.name);
              if (!isMetadataError(name)) {
                recordMember(name, {__symbolic: 'property', decorators: propertyDecorators});
              }
            }
            break;
        }
      }
      if (members) {
        result.members = members;
      }

      return result.decorators || members ? result : undefined;
    }

    // Predeclare classes
    ts.forEachChild(sourceFile, node => {
      switch (node.kind) {
        case ts.SyntaxKind.ClassDeclaration:
          const classDeclaration = <ts.ClassDeclaration>node;
          const className = classDeclaration.name.text;
          if (node.flags & ts.NodeFlags.Export) {
            locals.define(className, {__symbolic: 'reference', name: className});
          } else {
            locals.define(
                className, errorSym('Reference to non-exported class', node, {className}));
          }
          break;
      }
    });
    ts.forEachChild(sourceFile, node => {
      switch (node.kind) {
        case ts.SyntaxKind.ClassDeclaration:
          const classDeclaration = <ts.ClassDeclaration>node;
          const className = classDeclaration.name.text;
          if (node.flags & ts.NodeFlags.Export) {
            if (classDeclaration.decorators) {
              if (!metadata) metadata = {};
              metadata[className] = classMetadataOf(classDeclaration);
            }
          }
          // Otherwise don't record metadata for the class.
          break;
        case ts.SyntaxKind.FunctionDeclaration:
          // Record functions that return a single value. Record the parameter
          // names substitution will be performed by the StaticReflector.
          if (node.flags & ts.NodeFlags.Export) {
            const functionDeclaration = <ts.FunctionDeclaration>node;
            const functionName = functionDeclaration.name.text;
            const functionBody = functionDeclaration.body;
            if (functionBody && functionBody.statements.length == 1) {
              const statement = functionBody.statements[0];
              if (statement.kind === ts.SyntaxKind.ReturnStatement) {
                const returnStatement = <ts.ReturnStatement>statement;
                if (returnStatement.expression) {
                  if (!metadata) metadata = {};
                  metadata[functionName] = {
                    __symbolic: 'function',
                    parameters: namesOf(functionDeclaration.parameters),
                    value: evaluator.evaluateNode(returnStatement.expression)
                  };
                }
              }
            }
          }
          // Otherwise don't record the function.
          break;
        case ts.SyntaxKind.VariableStatement:
          const variableStatement = <ts.VariableStatement>node;
          for (let variableDeclaration of variableStatement.declarationList.declarations) {
            if (variableDeclaration.name.kind == ts.SyntaxKind.Identifier) {
              let nameNode = <ts.Identifier>variableDeclaration.name;
              let varValue: MetadataValue;
              if (variableDeclaration.initializer) {
                varValue = evaluator.evaluateNode(variableDeclaration.initializer);
              } else {
                varValue = errorSym('Variable not initialized', nameNode);
              }
              if (variableStatement.flags & ts.NodeFlags.Export ||
                  variableDeclaration.flags & ts.NodeFlags.Export) {
                if (!metadata) metadata = {};
                metadata[nameNode.text] = varValue;
              }
              if (isPrimitive(varValue)) {
                locals.define(nameNode.text, varValue);
              }
            } else {
              // Destructuring (or binding) declarations are not supported,
              // var {<identifier>[, <identifer>]+} = <expression>;
              //   or
              // var [<identifier>[, <identifier}+] = <expression>;
              // are not supported.
              const report = (nameNode: ts.Node) => {
                switch (nameNode.kind) {
                  case ts.SyntaxKind.Identifier:
                    const name = <ts.Identifier>nameNode;
                    const varValue = errorSym('Destructuring not supported', nameNode);
                    locals.define(name.text, varValue);
                    if (node.flags & ts.NodeFlags.Export) {
                      if (!metadata) metadata = {};
                      metadata[name.text] = varValue;
                    }
                    break;
                  case ts.SyntaxKind.BindingElement:
                    const bindingElement = <ts.BindingElement>nameNode;
                    report(bindingElement.name);
                    break;
                  case ts.SyntaxKind.ObjectBindingPattern:
                  case ts.SyntaxKind.ArrayBindingPattern:
                    const bindings = <ts.BindingPattern>nameNode;
                    bindings.elements.forEach(report);
                    break;
                }
              };
              report(variableDeclaration.name);
            }
          }
          break;
      }
    });

    return metadata && {__symbolic: 'module', version: VERSION, metadata};
  }
}

// Collect parameter names from a function.
function namesOf(parameters: ts.NodeArray<ts.ParameterDeclaration>): string[] {
  let result: string[] = [];

  function addNamesOf(name: ts.Identifier | ts.BindingPattern) {
    if (name.kind == ts.SyntaxKind.Identifier) {
      const identifier = <ts.Identifier>name;
      result.push(identifier.text);
    } else {
      const bindingPattern = <ts.BindingPattern>name;
      for (let element of bindingPattern.elements) {
        addNamesOf(element.name);
      }
    }
  }

  for (let parameter of parameters) {
    addNamesOf(parameter.name);
  }

  return result;
}