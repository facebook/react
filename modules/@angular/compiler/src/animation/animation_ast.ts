export abstract class AnimationAst {
  public startTime: number = 0;
  public playTime: number = 0;
  abstract visit(visitor: AnimationAstVisitor, context: any): any;
}

export abstract class AnimationStateAst extends AnimationAst {
  abstract visit(visitor: AnimationAstVisitor, context: any): any;
}

export interface AnimationAstVisitor {
  visitAnimationEntry(ast: AnimationEntryAst, context: any): any;
  visitAnimationStateDeclaration(ast: AnimationStateDeclarationAst, context: any): any;
  visitAnimationStateTransition(ast: AnimationStateTransitionAst, context: any): any;
  visitAnimationStep(ast: AnimationStepAst, context: any): any;
  visitAnimationSequence(ast: AnimationSequenceAst, context: any): any;
  visitAnimationGroup(ast: AnimationGroupAst, context: any): any;
  visitAnimationKeyframe(ast: AnimationKeyframeAst, context: any): any;
  visitAnimationStyles(ast: AnimationStylesAst, context: any): any;
}

export class AnimationEntryAst extends AnimationAst {
  constructor(
      public name: string, public stateDeclarations: AnimationStateDeclarationAst[],
      public stateTransitions: AnimationStateTransitionAst[]) {
    super();
  }
  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationEntry(this, context);
  }
}

export class AnimationStateDeclarationAst extends AnimationStateAst {
  constructor(public stateName: string, public styles: AnimationStylesAst) { super(); }
  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationStateDeclaration(this, context);
  }
}

export class AnimationStateTransitionExpression {
  constructor(public fromState: string, public toState: string) {}
}

export class AnimationStateTransitionAst extends AnimationStateAst {
  constructor(
      public stateChanges: AnimationStateTransitionExpression[],
      public animation: AnimationSequenceAst) {
    super();
  }
  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationStateTransition(this, context);
  }
}

export class AnimationStepAst extends AnimationAst {
  constructor(
      public startingStyles: AnimationStylesAst, public keyframes: AnimationKeyframeAst[],
      public duration: number, public delay: number, public easing: string) {
    super();
  }
  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationStep(this, context);
  }
}

export class AnimationStylesAst extends AnimationAst {
  constructor(public styles: Array<{[key: string]: string | number}>) { super(); }
  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationStyles(this, context);
  }
}

export class AnimationKeyframeAst extends AnimationAst {
  constructor(public offset: number, public styles: AnimationStylesAst) { super(); }
  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationKeyframe(this, context);
  }
}

export abstract class AnimationWithStepsAst extends AnimationAst {
  constructor(public steps: AnimationAst[]) { super(); }
}

export class AnimationGroupAst extends AnimationWithStepsAst {
  constructor(steps: AnimationAst[]) { super(steps); }
  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationGroup(this, context);
  }
}

export class AnimationSequenceAst extends AnimationWithStepsAst {
  constructor(steps: AnimationAst[]) { super(steps); }
  visit(visitor: AnimationAstVisitor, context: any): any {
    return visitor.visitAnimationSequence(this, context);
  }
}
