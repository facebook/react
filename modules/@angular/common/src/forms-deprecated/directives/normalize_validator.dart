library angular2.core.forms.normalize_validators;

import 'package:angular2/src/common/forms/directives/validators.dart' show Validator;

Function normalizeValidator(dynamic validator){
  if (validator is Validator) {
    return (c) => validator.validate(c);
  } else {
    return validator;
  }
}


Function normalizeAsyncValidator(dynamic validator){
  if (validator is Validator) {
    return (c) => validator.validate(c);
  } else {
    return validator;
  }
}
