library web_foo;

import 'bar.dart' deferred as bar;

void main() {
  bar.loadLibrary().then((_) {
    bar.execImmediate();
  });
}
