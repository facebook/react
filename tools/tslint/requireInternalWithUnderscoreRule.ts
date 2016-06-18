import {RuleWalker} from 'tslint/lib/language/walker';
import {RuleFailure} from 'tslint/lib/lint';
import {AbstractRule} from 'tslint/lib/rules';
import * as ts from 'typescript';

export class Rule extends AbstractRule {
  public apply(sourceFile: ts.SourceFile): RuleFailure[] {
    const typedefWalker = new TypedefWalker(sourceFile, this.getOptions());
    return this.applyWithWalker(typedefWalker);
  }
}

class TypedefWalker extends RuleWalker {
  protected visitPropertyDeclaration(node: ts.PropertyDeclaration): void {
    this.assertInternalAnnotationPresent(node);
    super.visitPropertyDeclaration(node);
  }

  public visitMethodDeclaration(node: ts.MethodDeclaration): void {
    this.assertInternalAnnotationPresent(node);
    super.visitMethodDeclaration(node);
  }

  private hasInternalAnnotation(range: ts.CommentRange): boolean {
    let text = this.getSourceFile().text;
    let comment = text.substring(range.pos, range.end);
    return comment.indexOf('@internal') >= 0;
  }

  private assertInternalAnnotationPresent(node: ts.Declaration) {
    if (node.name.getText().charAt(0) !== '_') return;
    if (node.modifiers && node.modifiers.flags & ts.NodeFlags.Private) return;

    const ranges = ts.getLeadingCommentRanges(this.getSourceFile().text, node.pos);
    if (ranges) {
      for (let i = 0; i < ranges.length; i++) {
        if (this.hasInternalAnnotation(ranges[i])) return;
      }
    }
    this.addFailure(this.createFailure(
        node.getStart(), node.getWidth(),
        `module-private member ${node.name.getText()} must be annotated @internal`));
  }
}
