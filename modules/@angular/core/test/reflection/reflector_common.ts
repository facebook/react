import {makeDecorator, makeParamDecorator, makePropDecorator} from '@angular/core/src/util/decorators';

export class ClassDecoratorMeta {
  constructor(public value: any /** TODO #9100 */) {}
}

export class ParamDecoratorMeta {
  constructor(public value: any /** TODO #9100 */) {}
}

export class PropDecoratorMeta {
  constructor(public value: any /** TODO #9100 */) {}
}

export function classDecorator(value: any /** TODO #9100 */) {
  return new ClassDecoratorMeta(value);
}

export function paramDecorator(value: any /** TODO #9100 */) {
  return new ParamDecoratorMeta(value);
}

export function propDecorator(value: any /** TODO #9100 */) {
  return new PropDecoratorMeta(value);
}

/** @Annotation */ export var ClassDecorator = makeDecorator(ClassDecoratorMeta);
/** @Annotation */ export var ParamDecorator = makeParamDecorator(ParamDecoratorMeta);
/** @Annotation */ export var PropDecorator = makePropDecorator(PropDecoratorMeta);

// used only in Dart
export class HasGetterAndSetterDecorators {}
