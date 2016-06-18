class ClassDecorator {
  final dynamic value;

  const ClassDecorator(this.value);
}

class ParamDecorator {
  final dynamic value;

  const ParamDecorator(this.value);
}

class PropDecorator {
  final dynamic value;

  const PropDecorator(this.value);
}

ClassDecorator classDecorator(value) {
  return new ClassDecorator(value);
}

ParamDecorator paramDecorator(value) {
  return new ParamDecorator(value);
}

PropDecorator propDecorator(value) {
  return new PropDecorator(value);
}

class HasGetterAndSetterDecorators {
  @PropDecorator("get") get a {}
  @PropDecorator("set") set a(v) {}
}
