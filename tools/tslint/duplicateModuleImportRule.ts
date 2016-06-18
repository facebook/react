import {RuleWalker} from 'tslint/lib/language/walker';
import {RuleFailure} from 'tslint/lib/lint';
import {AbstractRule} from 'tslint/lib/rules';
import * as ts from 'typescript';

export class Rule extends AbstractRule {
  public static FAILURE_STRING = 'duplicate module import';

  public apply(sourceFile: ts.SourceFile): RuleFailure[] {
    const typedefWalker = new ModuleImportWalker(sourceFile, this.getOptions());
    return this.applyWithWalker(typedefWalker);
  }
}

class ModuleImportWalker extends RuleWalker {
  importModulesSeen: string[] = [];

  protected visitImportDeclaration(node: ts.ImportDeclaration): void {
    this.visitModuleSpecifier(node.moduleSpecifier);
    super.visitImportDeclaration(node);
  }

  protected visitImportEqualsDeclaration(node: ts.ImportEqualsDeclaration): void {
    this.visitModuleSpecifier(node.moduleReference);
    super.visitImportEqualsDeclaration(node);
  }

  private checkTypeAnnotation(location: number, typeAnnotation: ts.TypeNode, name?: ts.Node) {
    if (typeAnnotation == null) {
      let ns = '<name missing>';
      if (name != null && name.kind === ts.SyntaxKind.Identifier) {
        ns = (<ts.Identifier>name).text;
      }
      if (ns.charAt(0) === '_') return;
      let failure = this.createFailure(location, 1, 'expected parameter ' + ns + ' to have a type');
      this.addFailure(failure);
    }
  }

  private visitModuleSpecifier(moduleSpecifier: ts.Node) {
    var text = moduleSpecifier.getText();
    if (this.importModulesSeen.indexOf(text) >= 0) {
      let failure =
          this.createFailure(moduleSpecifier.getEnd(), 1, 'Duplicate imports from module ' + text);
      this.addFailure(failure);
    }
    this.importModulesSeen.push(text);
  }
}
