var a = 5 || (c = 5);

exports.something = function(a) {
  if(a > 0) {
    b = 1;
    c = 2;
    d = 3;
  } else {
    b = 1;
    c = function() {
      return 5;
    };
    d = function() { return 6; 
      a = 5;};
    f = 11; 
    if (1) f = 1; if (0) f = 2;
    return [a + 1, a + 2, c(), d()];
    return a - 1;
  }
};

a = function() {
  return true;
}

b = function() {
  aa = 5;
  return true;
}

c = function() {
  bb = 6;
  return false;
}

if (a() || b() && c()) {
  c = 5;
}

b = function() {
  if (a < 0) return;
  
  a = 1;
  b = 2;
  c = 3;  
}

b2 = function() {
  a2 = 1;
  b2 = 2;
  c2 = 3;  
}

d = 3;
e = (function() { return 6; })()

f = d || (g = 3);

var cond = function() {
  return true ? a() : b();
}

cond();

var g = 1;
g++;

/*c = 1;
d = function() {
  return 1;
}

e = (function() {
  if (1) {
    return 2;
  }
})();

f = 1;*/