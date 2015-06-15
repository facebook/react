module.exports = balanced;
function balanced(a, b, str) {
  var bal = 0;
  var m = {};
  var ended = false;

  for (var i = 0; i < str.length; i++) {
    if (a == str.substr(i, a.length)) {
      if (!('start' in m)) m.start = i;
      bal++;
    }
    else if (b == str.substr(i, b.length) && 'start' in m) {
      ended = true;
      bal--;
      if (!bal) {
        m.end = i;
        m.pre = str.substr(0, m.start);
        m.body = (m.end - m.start > 1)
          ? str.substring(m.start + a.length, m.end)
          : '';
        m.post = str.slice(m.end + b.length);
        return m;
      }
    }
  }

  // if we opened more than we closed, find the one we closed
  if (bal && ended) {
    var start = m.start + a.length;
    m = balanced(a, b, str.substr(start));
    if (m) {
      m.start += start;
      m.end += start;
      m.pre = str.slice(0, start) + m.pre;
    }
    return m;
  }
}
