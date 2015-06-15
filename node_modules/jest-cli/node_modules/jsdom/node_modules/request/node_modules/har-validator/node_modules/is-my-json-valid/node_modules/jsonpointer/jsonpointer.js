var console = require("console");

var untilde = function(str) {
  return str.replace(/~./g, function(m) {
    switch (m) {
      case "~0":
        return "~";
      case "~1":
        return "/";
    }
    throw("Invalid tilde escape: " + m);
  });
}

var traverse = function(obj, pointer, value) {
  // assert(isArray(pointer))
  var part = untilde(pointer.shift());
  if(typeof obj[part] === "undefined") {
    throw("Value for pointer '" + pointer + "' not found.");
    return;
  }
  if(pointer.length !== 0) { // keep traversin!
    return traverse(obj[part], pointer, value);
  }
  // we're done
  if(typeof value === "undefined") {
    // just reading
    return obj[part];
  }
  // set new value, return old value
  var old_value = obj[part];
  if(value === null) {
    delete obj[part];
  } else {
    obj[part] = value;
  }
  return old_value;
}

var validate_input = function(obj, pointer) {
  if(typeof obj !== "object") {
    throw("Invalid input object.");
  }

  if(pointer === "") {
    return [];
  }

  if(!pointer) {
    throw("Invalid JSON pointer.");
  }

  pointer = pointer.split("/");
  var first = pointer.shift();
  if (first !== "") {
    throw("Invalid JSON pointer.");
  }

  return pointer;
}

var get = function(obj, pointer) {
  pointer = validate_input(obj, pointer);
  if (pointer.length === 0) {
    return obj;
  }
  return traverse(obj, pointer);
}

var set = function(obj, pointer, value) {
  pointer = validate_input(obj, pointer);
  if (pointer.length === 0) {
    throw("Invalid JSON pointer for set.")
  }
  return traverse(obj, pointer, value);
}

exports.get = get
exports.set = set
