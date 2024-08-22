/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import generate from '@babel/generator';
import {printReactiveFunction} from '..';
import {CompilerError} from '../CompilerError';
import {printReactiveScopeSummary} from '../ReactiveScopes/PrintReactiveFunction';
import DisjointSet from '../Utils/DisjointSet';
import {assertExhaustive} from '../Utils/utils';
import type {
  FunctionExpression,
  HIR,
  HIRFunction,
  Identifier,
  IdentifierName,
  Instruction,
  InstructionValue,
  LValue,
  ManualMemoDependency,
  MutableRange,
  ObjectMethod,
  ObjectPropertyKey,
  Pattern,
  Phi,
  Place,
  ReactiveInstruction,
  ReactiveScope,
  ReactiveValue,
  SourceLocation,
  SpreadPattern,
  Terminal,
  Type,
} from './HIR';
import {GotoVariant, InstructionKind} from './HIR';

export type Options = {
  indent: number;
};

export function printFunctionWithOutlined(fn: HIRFunction): string {
  const output = [printFunction(fn)];
  for (const outlined of fn.env.getOutlinedFunctions()) {
    output.push(`\nfunction ${outlined.fn.id}:\n${printHIR(outlined.fn.body)}`);
  }
  return output.join('\n');
}

export function printFunction(fn: HIRFunction): string {
  const output = [];
  let definition = '';
  if (fn.id !== null) {
    definition += fn.id;
  }
  if (fn.params.length !== 0) {
    definition +=
      '(' +
      fn.params
        .map(param => {
          if (param.kind === 'Identifier') {
            return printPlace(param);
          } else {
            return `...${printPlace(param.place)}`;
          }
        })
        .join(', ') +
      ')';
  }
  if (definition.length !== 0) {
    output.push(definition);
  }
  output.push(printType(fn.returnType));
  output.push(printHIR(fn.body));
  output.push(...fn.directives);
  return output.join('\n');
}

export function printHIR(ir: HIR, options: Options | null = null): string {
  let output = [];
  let indent = ' '.repeat(options?.indent ?? 0);
  const push = (text: string, indent: string = '  '): void => {
    output.push(`${indent}${text}`);
  };
  for (const [blockId, block] of ir.blocks) {
    output.push(`bb${blockId} (${block.kind}):`);
    if (block.preds.size > 0) {
      const preds = ['predecessor blocks:'];
      for (const pred of block.preds) {
        preds.push(`bb${pred}`);
      }
      push(preds.join(' '));
    }
    for (const phi of block.phis) {
      push(printPhi(phi));
    }
    for (const instr of block.instructions) {
      push(printInstruction(instr));
    }
    const terminal = printTerminal(block.terminal);
    if (Array.isArray(terminal)) {
      terminal.forEach(line => push(line));
    } else {
      push(terminal);
    }
  }
  return output.map(line => indent + line).join('\n');
}

export function printMixedHIR(
  value: Instruction | InstructionValue | Terminal,
): string {
  if (!('kind' in value)) {
    return printInstruction(value);
  }
  switch (value.kind) {
    case 'try':
    case 'maybe-throw':
    case 'sequence':
    case 'label':
    case 'optional':
    case 'branch':
    case 'if':
    case 'logical':
    case 'ternary':
    case 'return':
    case 'switch':
    case 'throw':
    case 'while':
    case 'for':
    case 'unreachable':
    case 'unsupported':
    case 'goto':
    case 'do-while':
    case 'for-in':
    case 'for-of':
    case 'scope':
    case 'pruned-scope': {
      const terminal = printTerminal(value);
      if (Array.isArray(terminal)) {
        return terminal.join('; ');
      }
      return terminal;
    }
    default: {
      return printInstructionValue(value);
    }
  }
}

export function printInstruction(instr: ReactiveInstruction): string {
  const id = `[${instr.id}]`;
  const value = printInstructionValue(instr.value);

  if (instr.lvalue !== null) {
    return `${id} ${printPlace(instr.lvalue)} = ${value}`;
  } else {
    return `${id} ${value}`;
  }
}

export function printPhi(phi: Phi): string {
  const items = [];
  items.push(printIdentifier(phi.id));
  items.push(printMutableRange(phi.id));
  items.push(printType(phi.type));
  items.push(': phi(');
  const phis = [];
  for (const [blockId, id] of phi.operands) {
    phis.push(`bb${blockId}: ${printIdentifier(id)}`);
  }

  items.push(phis.join(', '));
  items.push(')');
  return items.join('');
}

export function printTerminal(terminal: Terminal): Array<string> | string {
  let value;
  switch (terminal.kind) {
    case 'if': {
      value = `[${terminal.id}] If (${printPlace(terminal.test)}) then:bb${
        terminal.consequent
      } else:bb${terminal.alternate}${
        terminal.fallthrough ? ` fallthrough=bb${terminal.fallthrough}` : ''
      }`;
      break;
    }
    case 'branch': {
      value = `[${terminal.id}] Branch (${printPlace(terminal.test)}) then:bb${
        terminal.consequent
      } else:bb${terminal.alternate}`;
      break;
    }
    case 'logical': {
      value = `[${terminal.id}] Logical ${terminal.operator} test:bb${terminal.test} fallthrough=bb${terminal.fallthrough}`;
      break;
    }
    case 'ternary': {
      value = `[${terminal.id}] Ternary test:bb${terminal.test} fallthrough=bb${terminal.fallthrough}`;
      break;
    }
    case 'optional': {
      value = `[${terminal.id}] Optional (optional=${terminal.optional}) test:bb${terminal.test} fallthrough=bb${terminal.fallthrough}`;
      break;
    }
    case 'throw': {
      value = `[${terminal.id}] Throw ${printPlace(terminal.value)}`;
      break;
    }
    case 'return': {
      value = `[${terminal.id}] Return${
        terminal.value != null ? ' ' + printPlace(terminal.value) : ''
      }`;
      break;
    }
    case 'goto': {
      value = `[${terminal.id}] Goto${
        terminal.variant === GotoVariant.Continue ? '(Continue)' : ''
      } bb${terminal.block}`;
      break;
    }
    case 'switch': {
      const output = [];
      output.push(`[${terminal.id}] Switch (${printPlace(terminal.test)})`);
      terminal.cases.forEach(case_ => {
        if (case_.test !== null) {
          output.push(`  Case ${printPlace(case_.test)}: bb${case_.block}`);
        } else {
          output.push(`  Default: bb${case_.block}`);
        }
      });
      if (terminal.fallthrough) {
        output.push(`  Fallthrough: bb${terminal.fallthrough}`);
      }
      value = output;
      break;
    }
    case 'do-while': {
      value = `[${terminal.id}] DoWhile loop=${`bb${terminal.loop}`} test=bb${
        terminal.test
      } fallthrough=${`bb${terminal.fallthrough}`}`;
      break;
    }
    case 'while': {
      value = `[${terminal.id}] While test=bb${terminal.test} loop=${
        terminal.loop !== null ? `bb${terminal.loop}` : ''
      } fallthrough=${terminal.fallthrough ? `bb${terminal.fallthrough}` : ''}`;
      break;
    }
    case 'for': {
      value = `[${terminal.id}] For init=bb${terminal.init} test=bb${terminal.test} loop=bb${terminal.loop} update=bb${terminal.update} fallthrough=bb${terminal.fallthrough}`;
      break;
    }
    case 'for-of': {
      value = `[${terminal.id}] ForOf init=bb${terminal.init} test=bb${terminal.test} loop=bb${terminal.loop} fallthrough=bb${terminal.fallthrough}`;
      break;
    }
    case 'for-in': {
      value = `[${terminal.id}] ForIn init=bb${terminal.init} loop=bb${terminal.loop} fallthrough=bb${terminal.fallthrough}`;
      break;
    }
    case 'label': {
      value = `[${terminal.id}] Label block=bb${terminal.block} fallthrough=${
        terminal.fallthrough ? `bb${terminal.fallthrough}` : ''
      }`;
      break;
    }
    case 'sequence': {
      value = `[${terminal.id}] Sequence block=bb${terminal.block} fallthrough=bb${terminal.fallthrough}`;
      break;
    }
    case 'unreachable': {
      value = `[${terminal.id}] Unreachable`;
      break;
    }
    case 'unsupported': {
      value = `[${terminal.id}] Unsupported`;
      break;
    }
    case 'maybe-throw': {
      value = `[${terminal.id}] MaybeThrow continuation=bb${terminal.continuation} handler=bb${terminal.handler}`;
      break;
    }
    case 'scope': {
      value = `[${terminal.id}] Scope ${printReactiveScopeSummary(
        terminal.scope,
      )} block=bb${terminal.block} fallthrough=bb${terminal.fallthrough}`;
      break;
    }
    case 'pruned-scope': {
      value = `[${terminal.id}] <pruned> Scope ${printReactiveScopeSummary(
        terminal.scope,
      )} block=bb${terminal.block} fallthrough=bb${terminal.fallthrough}`;
      break;
    }
    case 'try': {
      value = `[${terminal.id}] Try block=bb${terminal.block} handler=bb${
        terminal.handler
      }${
        terminal.handlerBinding !== null
          ? ` handlerBinding=(${printPlace(terminal.handlerBinding)})`
          : ''
      } fallthrough=${
        terminal.fallthrough != null ? `bb${terminal.fallthrough}` : ''
      }`;
      break;
    }
    default: {
      assertExhaustive(
        terminal,
        `Unexpected terminal kind \`${terminal as any as Terminal}\``,
      );
    }
  }
  return value;
}

function printHole(): string {
  return '<hole>';
}

function printObjectPropertyKey(key: ObjectPropertyKey): string {
  switch (key.kind) {
    case 'identifier':
      return key.name;
    case 'string':
      return `"${key.name}"`;
    case 'computed': {
      return `[${printPlace(key.name)}]`;
    }
  }
}

export function printInstructionValue(instrValue: ReactiveValue): string {
  let value = '';
  switch (instrValue.kind) {
    case 'ArrayExpression': {
      value = `Array [${instrValue.elements
        .map(element => {
          if (element.kind === 'Identifier') {
            return printPlace(element);
          } else if (element.kind === 'Hole') {
            return printHole();
          } else {
            return `...${printPlace(element.place)}`;
          }
        })
        .join(', ')}]`;
      break;
    }
    case 'ObjectExpression': {
      const properties = [];
      if (instrValue.properties !== null) {
        for (const property of instrValue.properties) {
          if (property.kind === 'ObjectProperty') {
            properties.push(
              `${printObjectPropertyKey(property.key)}: ${printPlace(
                property.place,
              )}`,
            );
          } else {
            properties.push(`...${printPlace(property.place)}`);
          }
        }
      }
      value = `Object { ${properties.join(', ')} }`;
      break;
    }
    case 'UnaryExpression': {
      value = `Unary ${printPlace(instrValue.value)}`;
      break;
    }
    case 'BinaryExpression': {
      value = `Binary ${printPlace(instrValue.left)} ${
        instrValue.operator
      } ${printPlace(instrValue.right)}`;
      break;
    }
    case 'NewExpression': {
      value = `New ${printPlace(instrValue.callee)}(${instrValue.args
        .map(arg => printPattern(arg))
        .join(', ')})`;
      break;
    }
    case 'CallExpression': {
      value = `Call ${printPlace(instrValue.callee)}(${instrValue.args
        .map(arg => printPattern(arg))
        .join(', ')})`;
      break;
    }
    case 'MethodCall': {
      value = `MethodCall ${printPlace(instrValue.receiver)}.${printPlace(
        instrValue.property,
      )}(${instrValue.args.map(arg => printPattern(arg)).join(', ')})`;
      break;
    }
    case 'JSXText': {
      value = `JSXText ${JSON.stringify(instrValue.value)}`;
      break;
    }
    case 'Primitive': {
      if (instrValue.value === undefined) {
        value = '<undefined>';
      } else {
        value = JSON.stringify(instrValue.value);
      }
      break;
    }
    case 'TypeCastExpression': {
      value = `TypeCast ${printPlace(instrValue.value)}: ${printType(
        instrValue.type,
      )}`;
      break;
    }
    case 'JsxExpression': {
      const propItems = [];
      for (const attribute of instrValue.props) {
        if (attribute.kind === 'JsxAttribute') {
          propItems.push(
            `${attribute.name}={${
              attribute.place !== null ? printPlace(attribute.place) : '<empty>'
            }}`,
          );
        } else {
          propItems.push(`...${printPlace(attribute.argument)}`);
        }
      }
      const tag =
        instrValue.tag.kind === 'Identifier'
          ? printPlace(instrValue.tag)
          : instrValue.tag.name;
      const props = propItems.length !== 0 ? ' ' + propItems.join(' ') : '';
      if (instrValue.children !== null) {
        const children = instrValue.children.map(child => {
          return `{${printPlace(child)}}`;
        });
        value = `JSX <${tag}${props}${
          props.length > 0 ? ' ' : ''
        }>${children.join('')}</${tag}>`;
      } else {
        value = `JSX <${tag}${props}${props.length > 0 ? ' ' : ''}/>`;
      }
      break;
    }
    case 'JsxFragment': {
      value = `JsxFragment [${instrValue.children
        .map(child => printPlace(child))
        .join(', ')}]`;
      break;
    }
    case 'UnsupportedNode': {
      value = `UnsupportedNode(${generate(instrValue.node).code})`;
      break;
    }
    case 'LoadLocal': {
      value = `LoadLocal ${printPlace(instrValue.place)}`;
      break;
    }
    case 'DeclareLocal': {
      value = `DeclareLocal ${instrValue.lvalue.kind} ${printPlace(
        instrValue.lvalue.place,
      )}`;
      break;
    }
    case 'DeclareContext': {
      value = `DeclareContext ${instrValue.lvalue.kind} ${printPlace(
        instrValue.lvalue.place,
      )}`;
      break;
    }
    case 'StoreLocal': {
      value = `StoreLocal ${instrValue.lvalue.kind} ${printPlace(
        instrValue.lvalue.place,
      )} = ${printPlace(instrValue.value)}`;
      break;
    }
    case 'LoadContext': {
      value = `LoadContext ${printPlace(instrValue.place)}`;
      break;
    }
    case 'StoreContext': {
      value = `StoreContext ${instrValue.lvalue.kind} ${printPlace(
        instrValue.lvalue.place,
      )} = ${printPlace(instrValue.value)}`;
      break;
    }
    case 'Destructure': {
      value = `Destructure ${instrValue.lvalue.kind} ${printPattern(
        instrValue.lvalue.pattern,
      )} = ${printPlace(instrValue.value)}`;
      break;
    }
    case 'PropertyLoad': {
      value = `PropertyLoad ${printPlace(instrValue.object)}.${
        instrValue.property
      }`;
      break;
    }
    case 'PropertyStore': {
      value = `PropertyStore ${printPlace(instrValue.object)}.${
        instrValue.property
      } = ${printPlace(instrValue.value)}`;
      break;
    }
    case 'PropertyDelete': {
      value = `PropertyDelete ${printPlace(instrValue.object)}.${
        instrValue.property
      }`;
      break;
    }
    case 'ComputedLoad': {
      value = `ComputedLoad ${printPlace(instrValue.object)}[${printPlace(
        instrValue.property,
      )}]`;
      break;
    }
    case 'ComputedStore': {
      value = `ComputedStore ${printPlace(instrValue.object)}[${printPlace(
        instrValue.property,
      )}] = ${printPlace(instrValue.value)}`;
      break;
    }
    case 'ComputedDelete': {
      value = `ComputedDelete ${printPlace(instrValue.object)}[${printPlace(
        instrValue.property,
      )}]`;
      break;
    }
    case 'ObjectMethod':
    case 'FunctionExpression': {
      const kind =
        instrValue.kind === 'FunctionExpression' ? 'Function' : 'ObjectMethod';
      const name = getFunctionName(instrValue, '');
      const fn = printFunction(instrValue.loweredFunc.func)
        .split('\n')
        .map(line => `      ${line}`)
        .join('\n');
      const deps = instrValue.loweredFunc.dependencies
        .map(dep => printPlace(dep))
        .join(',');
      const context = instrValue.loweredFunc.func.context
        .map(dep => printPlace(dep))
        .join(',');
      const effects =
        instrValue.loweredFunc.func.effects
          ?.map(effect => {
            if (effect.kind === 'ContextMutation') {
              return `ContextMutation places=[${[...effect.places]
                .map(place => printPlace(place))
                .join(', ')}] effect=${effect.effect}`;
            } else {
              return `GlobalMutation`;
            }
          })
          .join(', ') ?? '';
      const type = printType(instrValue.loweredFunc.func.returnType).trim();
      value = `${kind} ${name} @deps[${deps}] @context[${context}] @effects[${effects}]${type !== '' ? ` return${type}` : ''}:\n${fn}`;
      break;
    }
    case 'TaggedTemplateExpression': {
      value = `${printPlace(instrValue.tag)}\`${instrValue.value.raw}\``;
      break;
    }
    case 'LogicalExpression': {
      value = `Logical ${printInstructionValue(instrValue.left)} ${
        instrValue.operator
      } ${printInstructionValue(instrValue.right)}`;
      break;
    }
    case 'SequenceExpression': {
      value = [
        `Sequence`,
        ...instrValue.instructions.map(
          instr => `    ${printInstruction(instr)}`,
        ),
        `    ${printInstructionValue(instrValue.value)}`,
      ].join('\n');
      break;
    }
    case 'ConditionalExpression': {
      value = `Ternary ${printInstructionValue(
        instrValue.test,
      )} ? ${printInstructionValue(
        instrValue.consequent,
      )} : ${printInstructionValue(instrValue.alternate)}`;
      break;
    }
    case 'TemplateLiteral': {
      value = '`';
      CompilerError.invariant(
        instrValue.subexprs.length === instrValue.quasis.length - 1,
        {
          reason: 'Bad assumption about quasi length.',
          description: null,
          loc: instrValue.loc,
          suggestions: null,
        },
      );
      for (let i = 0; i < instrValue.subexprs.length; i++) {
        value += instrValue.quasis[i].raw;
        value += `\${${printPlace(instrValue.subexprs[i])}}`;
      }
      value += instrValue.quasis.at(-1)!.raw + '`';
      break;
    }
    case 'LoadGlobal': {
      switch (instrValue.binding.kind) {
        case 'Global': {
          value = `LoadGlobal(global) ${instrValue.binding.name}`;
          break;
        }
        case 'ModuleLocal': {
          value = `LoadGlobal(module) ${instrValue.binding.name}`;
          break;
        }
        case 'ImportDefault': {
          value = `LoadGlobal import ${instrValue.binding.name} from '${instrValue.binding.module}'`;
          break;
        }
        case 'ImportNamespace': {
          value = `LoadGlobal import * as ${instrValue.binding.name} from '${instrValue.binding.module}'`;
          break;
        }
        case 'ImportSpecifier': {
          if (instrValue.binding.imported !== instrValue.binding.name) {
            value = `LoadGlobal import { ${instrValue.binding.imported} as ${instrValue.binding.name} } from '${instrValue.binding.module}'`;
          } else {
            value = `LoadGlobal import { ${instrValue.binding.name} } from '${instrValue.binding.module}'`;
          }
          break;
        }
        default: {
          assertExhaustive(
            instrValue.binding,
            `Unexpected binding kind \`${(instrValue.binding as any).kind}\``,
          );
        }
      }
      break;
    }
    case 'StoreGlobal': {
      value = `StoreGlobal ${instrValue.name} = ${printPlace(
        instrValue.value,
      )}`;
      break;
    }
    case 'OptionalExpression': {
      value = `OptionalExpression ${printInstructionValue(instrValue.value)}`;
      break;
    }
    case 'RegExpLiteral': {
      value = `RegExp /${instrValue.pattern}/${instrValue.flags}`;
      break;
    }
    case 'MetaProperty': {
      value = `MetaProperty ${instrValue.meta}.${instrValue.property}`;
      break;
    }
    case 'Await': {
      value = `Await ${printPlace(instrValue.value)}`;
      break;
    }
    case 'GetIterator': {
      value = `GetIterator collection=${printPlace(instrValue.collection)}`;
      break;
    }
    case 'IteratorNext': {
      value = `IteratorNext iterator=${printPlace(
        instrValue.iterator,
      )} collection=${printPlace(instrValue.collection)}`;
      break;
    }
    case 'NextPropertyOf': {
      value = `NextPropertyOf ${printPlace(instrValue.value)}`;
      break;
    }
    case 'Debugger': {
      value = `Debugger`;
      break;
    }
    case 'PostfixUpdate': {
      value = `PostfixUpdate ${printPlace(instrValue.lvalue)} = ${printPlace(
        instrValue.value,
      )} ${instrValue.operation}`;
      break;
    }
    case 'PrefixUpdate': {
      value = `PrefixUpdate ${printPlace(instrValue.lvalue)} = ${
        instrValue.operation
      } ${printPlace(instrValue.value)}`;
      break;
    }
    case 'StartMemoize': {
      value = `StartMemoize deps=${
        instrValue.deps?.map(dep => printManualMemoDependency(dep, false)) ??
        '(none)'
      }`;
      break;
    }
    case 'FinishMemoize': {
      value = `FinishMemoize decl=${printPlace(instrValue.decl)}`;
      break;
    }
    case 'ReactiveFunctionValue': {
      value = `FunctionValue ${printReactiveFunction(instrValue.fn)}`;
      break;
    }
    default: {
      assertExhaustive(
        instrValue,
        `Unexpected instruction kind '${
          (instrValue as any as InstructionValue).kind
        }'`,
      );
    }
  }
  return value;
}

function isMutable(range: MutableRange): boolean {
  return range.end > range.start + 1;
}

const DEBUG_MUTABLE_RANGES = false;
function printMutableRange(identifier: Identifier): string {
  if (DEBUG_MUTABLE_RANGES) {
    // if debugging, print both the identifier and scope range if they differ
    const range = identifier.mutableRange;
    const scopeRange = identifier.scope?.range;
    if (
      scopeRange != null &&
      (scopeRange.start !== range.start || scopeRange.end !== range.end)
    ) {
      return `[${range.start}:${range.end}] scope=[${scopeRange.start}:${scopeRange.end}]`;
    }
    return isMutable(range) ? `[${range.start}:${range.end}]` : '';
  }
  // in non-debug mode, prefer the scope range if it exists
  const range = identifier.scope?.range ?? identifier.mutableRange;
  return isMutable(range) ? `[${range.start}:${range.end}]` : '';
}

export function printLValue(lval: LValue): string {
  let lvalue = `${printPlace(lval.place)}`;

  switch (lval.kind) {
    case InstructionKind.Let: {
      return `Let ${lvalue}`;
    }
    case InstructionKind.Const: {
      return `Const ${lvalue}$`;
    }
    case InstructionKind.Reassign: {
      return `Reassign ${lvalue}`;
    }
    case InstructionKind.Catch: {
      return `Catch ${lvalue}`;
    }
    case InstructionKind.HoistedConst: {
      return `HoistedConst ${lvalue}$`;
    }
    case InstructionKind.HoistedLet: {
      return `HoistedLet ${lvalue}$`;
    }
    default: {
      assertExhaustive(lval.kind, `Unexpected lvalue kind \`${lval.kind}\``);
    }
  }
}

export function printPattern(pattern: Pattern | Place | SpreadPattern): string {
  switch (pattern.kind) {
    case 'ArrayPattern': {
      return (
        '[ ' +
        pattern.items
          .map(item => {
            if (item.kind === 'Hole') {
              return '<hole>';
            }
            return printPattern(item);
          })
          .join(', ') +
        ' ]'
      );
    }
    case 'ObjectPattern': {
      return (
        '{ ' +
        pattern.properties
          .map(item => {
            switch (item.kind) {
              case 'ObjectProperty': {
                return `${printObjectPropertyKey(item.key)}: ${printPattern(
                  item.place,
                )}`;
              }
              case 'Spread': {
                return printPattern(item);
              }
              default: {
                assertExhaustive(item, 'Unexpected object property kind');
              }
            }
          })
          .join(', ') +
        ' }'
      );
    }
    case 'Spread': {
      return `...${printPlace(pattern.place)}`;
    }
    case 'Identifier': {
      return printPlace(pattern);
    }
    default: {
      assertExhaustive(
        pattern,
        `Unexpected pattern kind \`${(pattern as any).kind}\``,
      );
    }
  }
}

export function printPlace(place: Place): string {
  const items = [
    place.effect,
    ' ',
    printIdentifier(place.identifier),
    printMutableRange(place.identifier),
    printType(place.identifier.type),
    place.reactive ? '{reactive}' : null,
  ];
  return items.filter(x => x != null).join('');
}

export function printIdentifier(id: Identifier): string {
  return `${printName(id.name)}\$${id.id}${printScope(id.scope)}`;
}

function printName(name: IdentifierName | null): string {
  if (name === null) {
    return '';
  }
  return name.value;
}

function printScope(scope: ReactiveScope | null): string {
  return `${scope !== null ? `_@${scope.id}` : ''}`;
}

export function printManualMemoDependency(
  val: ManualMemoDependency,
  nameOnly: boolean,
): string {
  let rootStr;
  if (val.root.kind === 'Global') {
    rootStr = val.root.identifierName;
  } else {
    CompilerError.invariant(val.root.value.identifier.name?.kind === 'named', {
      reason: 'DepsValidation: expected named local variable in depslist',
      suggestions: null,
      loc: val.root.value.loc,
    });
    rootStr = nameOnly
      ? val.root.value.identifier.name.value
      : printIdentifier(val.root.value.identifier);
  }
  return `${rootStr}${val.path.length > 0 ? '.' : ''}${val.path.join('.')}`;
}
export function printType(type: Type): string {
  if (type.kind === 'Type') return '';
  // TODO(mofeiZ): add debugName for generated ids
  if (type.kind === 'Object' && type.shapeId != null) {
    return `:T${type.kind}<${type.shapeId}>`;
  } else if (type.kind === 'Function' && type.shapeId != null) {
    return `:T${type.kind}<${type.shapeId}>`;
  } else {
    return `:T${type.kind}`;
  }
}

export function printSourceLocation(loc: SourceLocation): string {
  if (typeof loc === 'symbol') {
    return 'generated';
  } else {
    return `${loc.start.line}:${loc.start.column}:${loc.end.line}:${loc.end.column}`;
  }
}

export function printAliases(aliases: DisjointSet<Identifier>): string {
  const aliasSets = aliases.buildSets();

  const items = [];
  for (const aliasSet of aliasSets) {
    items.push([...aliasSet].map(id => printIdentifier(id)).join(','));
  }

  return items.join('\n');
}

function getFunctionName(
  instrValue: ObjectMethod | FunctionExpression,
  defaultValue: string,
): string {
  switch (instrValue.kind) {
    case 'FunctionExpression':
      return instrValue.name ?? defaultValue;
    case 'ObjectMethod':
      return defaultValue;
  }
}
