library angular2.transform.reflection_remover.rewriter;

import 'package:analyzer/src/generated/ast.dart';
import 'package:path/path.dart' as path;

import 'package:angular2/src/transform/common/logging.dart';
import 'package:angular2/src/transform/common/mirror_matcher.dart';
import 'package:angular2/src/transform/common/mirror_mode.dart';
import 'package:angular2/src/transform/common/names.dart';

import 'codegen.dart';
import 'entrypoint_matcher.dart';

class Rewriter {
  final String _code;
  final Codegen _codegen;
  final EntrypointMatcher _entrypointMatcher;
  final MirrorMatcher _mirrorMatcher;
  final MirrorMode _mirrorMode;
  final bool _writeStaticInit;

  Rewriter(this._code, this._codegen, this._entrypointMatcher,
      {MirrorMatcher mirrorMatcher,
      MirrorMode mirrorMode: MirrorMode.none,
      bool writeStaticInit: true})
      : _mirrorMode = mirrorMode,
        _writeStaticInit = writeStaticInit,
        _mirrorMatcher =
            mirrorMatcher == null ? const MirrorMatcher() : mirrorMatcher {
    if (_codegen == null) {
      throw new ArgumentError.notNull('Codegen');
    }
    if (_entrypointMatcher == null) {
      throw new ArgumentError.notNull('EntrypointMatcher');
    }
  }

  /// Rewrites the provided code to remove dart:mirrors.
  ///
  /// Specifically, removes imports of the
  /// {@link ReflectionCapabilities} library and instantiations of
  /// {@link ReflectionCapabilities}, as detected by the (potentially) provided
  /// {@link MirrorMatcher}.
  ///
  /// To the extent possible, this method does not change line numbers or
  /// offsets in the provided code to facilitate debugging via source maps.
  String rewrite(CompilationUnit node) {
    if (node == null) throw new ArgumentError.notNull('node');

    var visitor = new _RewriterVisitor(this);

    node.accept(visitor);

    return visitor.outputRewrittenCode();
  }
}

/// Visitor responsible for rewriting the Angular 2 code which instantiates
/// {@link ReflectionCapabilities} and removing its associated import.
///
/// This breaks our dependency on dart:mirrors, which enables smaller code
/// size and better performance.
class _RewriterVisitor extends Object with RecursiveAstVisitor<Object> {
  final Rewriter _rewriter;
  final buf = new StringBuffer();
  final reflectionCapabilityAssignments = <AssignmentExpression>[];

  int _currentIndex = 0;
  bool _setupAdded = false;
  bool _importAdded = false;

  /// Whether we imported static bootstrap by e.g. rewriting a non-static
  /// bootstrap import.
  bool _hasStaticBootstrapImport = false;

  _RewriterVisitor(this._rewriter);

  @override
  Object visitImportDirective(ImportDirective node) {
    buf.write(_rewriter._code.substring(_currentIndex, node.offset));
    _currentIndex = node.offset;
    if (_rewriter._mirrorMatcher.hasReflectionCapabilitiesUri(node)) {
      _rewriteReflectionCapabilitiesImport(node);
    } else if (_rewriter._mirrorMatcher.hasBootstrapUri(node)) {
      _rewriteBootstrapImportToStatic(node);
    }
    if (!_importAdded && _rewriter._writeStaticInit) {
      // Add imports for ng_deps (once)
      buf.write(_rewriter._codegen.codegenImport());
      _importAdded = true;
    }
    return null;
  }

  @override
  Object visitAssignmentExpression(AssignmentExpression node) {
    if (node.rightHandSide is InstanceCreationExpression &&
        _rewriter._mirrorMatcher
            .isNewReflectionCapabilities(node.rightHandSide)) {
      reflectionCapabilityAssignments.add(node);
      _rewriteReflectionCapabilitiesAssignment(node);
    }
    return super.visitAssignmentExpression(node);
  }

  @override
  Object visitInstanceCreationExpression(InstanceCreationExpression node) {
    if (_rewriter._mirrorMatcher.isNewReflectionCapabilities(node) &&
        !reflectionCapabilityAssignments.contains(node.parent)) {
      log.error('Unexpected format in creation of '
          '${REFLECTION_CAPABILITIES_NAME}');
    }
    return super.visitInstanceCreationExpression(node);
  }

  @override
  Object visitMethodInvocation(MethodInvocation node) {
    if (_hasStaticBootstrapImport &&
        node.methodName.toString() == BOOTSTRAP_NAME) {
      _rewriteBootstrapCallToStatic(node);
    }
    return super.visitMethodInvocation(node);
  }

  @override
  Object visitMethodDeclaration(MethodDeclaration node) {
    if (_rewriter._entrypointMatcher.isEntrypoint(node)) {
      if (_rewriter._writeStaticInit) {
        _rewriteEntrypointFunctionBody(node.body);
      }
    }
    return super.visitMethodDeclaration(node);
  }

  @override
  Object visitFunctionDeclaration(FunctionDeclaration node) {
    if (_rewriter._entrypointMatcher.isEntrypoint(node)) {
      if (_rewriter._writeStaticInit) {
        _rewriteEntrypointFunctionBody(node.functionExpression.body);
      }
    }
    return super.visitFunctionDeclaration(node);
  }

  void _rewriteEntrypointFunctionBody(FunctionBody node) {
    if (node is BlockFunctionBody) {
      final insertOffset = node.block.leftBracket.end;
      buf.write(_rewriter._code.substring(_currentIndex, insertOffset));
      buf.write(_getStaticReflectorInitBlock());
      _currentIndex = insertOffset;
      _setupAdded = true;
    } else if (node is ExpressionFunctionBody) {
      // TODO(kegluneq): Add support, see issue #5474.
      throw new ArgumentError(
          'Arrow syntax is not currently supported as `@AngularEntrypoint`s');
    } else if (node is NativeFunctionBody) {
      throw new ArgumentError('Native functions and methods are not supported '
          'as `@AngularEntrypoint`s');
    } else if (node is EmptyFunctionBody) {
      throw new ArgumentError('Empty functions and methods are not supported '
          'as `@AngularEntrypoint`s');
    }
  }

  String outputRewrittenCode() {
    if (_currentIndex < _rewriter._code.length) {
      buf.write(_rewriter._code.substring(_currentIndex));
    }
    return '$buf';
  }

  _rewriteBootstrapImportToStatic(ImportDirective node) {
    if (_rewriter._writeStaticInit) {
      // rewrite bootstrap import to its static version.
      buf.write(_rewriter._code.substring(_currentIndex, node.offset));
      buf.write("import '$BOOTSTRAP_STATIC_URI'");

      // The index of the last character we've processed.
      var lastIdx = node.uri.end;

      // Maintain the import prefix, if present.
      if (node.prefix != null) {
        buf.write(_rewriter._code.substring(lastIdx, node.prefix.end));
        lastIdx = node.prefix.end;
      }

      // Handle combinators ("show" and "hide" on an "import" directive).
      // 1. A combinator like "show $BOOTSTRAP_NAME" no longer makes sense, so
      //    we need to rewrite it.
      // 2. It's possible we'll need to call the setup method
      //    (SETUP_METHOD_NAME), so make sure it is visible.
      if (node.combinators != null) {
        for (var combinator in node.combinators) {
          buf.write(_rewriter._code
              .substring(lastIdx, combinator.end)
              .replaceAll(BOOTSTRAP_NAME, BOOTSTRAP_STATIC_NAME));
          lastIdx = combinator.end;
          if (combinator is ShowCombinator) {
            buf.write(', $SETUP_METHOD_NAME');
          } else if (combinator is HideCombinator) {
            // Ensure the user is not explicitly hiding SETUP_METHOD_NAME.
            // I don't know why anyone would do this, but it would result in
            // some confusing behavior, so throw an explicit error.
            combinator.hiddenNames.forEach((id) {
              if (id.toString() == SETUP_METHOD_NAME) {
                throw new FormatException(
                    'Import statement explicitly hides initialization function '
                    '$SETUP_METHOD_NAME. Please do not do this: "$node"');
              }
            });
          }
        }
      }

      // Write anything after the combinators.
      buf.write(_rewriter._code.substring(lastIdx, node.end));
      _hasStaticBootstrapImport = true;
    } else {
      // leave it as is
      buf.write(_rewriter._code.substring(_currentIndex, node.end));
    }
    _currentIndex = node.end;
  }

  _rewriteBootstrapCallToStatic(MethodInvocation node) {
    if (_rewriter._writeStaticInit) {
      buf.write(_rewriter._code.substring(_currentIndex, node.offset));

      var args = node.argumentList.arguments;
      int numArgs = node.argumentList.arguments.length;
      if (numArgs < 1 || numArgs > 2) {
        log.warning('`bootstrap` does not support $numArgs arguments. '
            'Found bootstrap${node.argumentList}. Transform may not succeed.');
      }

      var reflectorInit =
          _setupAdded ? '' : ', () { ${_getStaticReflectorInitBlock()} }';

      // rewrite `bootstrap(...)` to `bootstrapStatic(...)`
      if (node.target != null && node.target is SimpleIdentifier) {
        // `bootstrap` imported with a prefix, maintain this.
        buf.write('${node.target}.');
      }
      buf.write('$BOOTSTRAP_STATIC_NAME(${args[0]}');
      if (numArgs == 1) {
        // bootstrap args are positional, so before we pass reflectorInit code
        // we need to pass `null` for DI bindings.
        if (reflectorInit.isNotEmpty) {
          buf.write(', null');
        }
      } else {
        // pass DI bindings
        buf.write(', ${args[1]}');
      }
      buf.write(reflectorInit);
      buf.write(')');
      _setupAdded = true;
    } else {
      // leave it as is
      buf.write(_rewriter._code.substring(_currentIndex, node.end));
    }
    _currentIndex = node.end;
  }

  String _getStaticReflectorInitBlock() {
    return _rewriter._codegen.codegenSetupReflectionCall();
  }

  _rewriteReflectionCapabilitiesImport(ImportDirective node) {
    buf.write(_rewriter._code.substring(_currentIndex, node.offset));
    if ('${node.prefix}' == _rewriter._codegen.prefix) {
      log.warning(
          'Found import prefix "${_rewriter._codegen.prefix}" in source file.'
          ' Transform may not succeed.');
    }
    if (_rewriter._mirrorMode != MirrorMode.none) {
      buf.write(_importDebugReflectionCapabilities(node));
    } else {
      buf.write(_commentedNode(node));
    }
    _currentIndex = node.end;
  }

  _rewriteReflectionCapabilitiesAssignment(AssignmentExpression assignNode) {
    var node = assignNode;
    while (node.parent is ExpressionStatement) {
      node = node.parent;
    }
    buf.write(_rewriter._code.substring(_currentIndex, node.offset));
    if (_rewriter._writeStaticInit && !_setupAdded) {
      buf.write(_getStaticReflectorInitBlock());
      _setupAdded = true;
    }
    switch (_rewriter._mirrorMode) {
      case MirrorMode.debug:
        buf.write(node);
        break;
      case MirrorMode.verbose:
        buf.write(_instantiateVerboseReflectionCapabilities(assignNode));
        break;
      case MirrorMode.none:
      default:
        buf.write(_commentedNode(node));
        break;
    }
    _currentIndex = node.end;
  }

  String _commentedNode(AstNode node) {
    return '/*${_rewriter._code.substring(node.offset, node.end)}*/';
  }
}

String _importDebugReflectionCapabilities(ImportDirective node) {
  var uri = '${node.uri}';
  uri = path
      .join(path.dirname(uri), 'debug_${path.basename(uri)}')
      .replaceAll('\\', '/');
  var asClause = node.prefix != null ? ' as ${node.prefix}' : '';
  return 'import $uri$asClause;';
}

String _instantiateVerboseReflectionCapabilities(
    AssignmentExpression assignNode) {
  if (assignNode.rightHandSide is! InstanceCreationExpression) {
    return '$assignNode;';
  }
  var rhs = (assignNode.rightHandSide as InstanceCreationExpression);
  return '${assignNode.leftHandSide} ${assignNode.operator} '
      'new ${rhs.constructorName}(verbose: true);';
}
