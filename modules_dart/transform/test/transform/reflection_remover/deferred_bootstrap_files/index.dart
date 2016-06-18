import 'package:angular2/platform/browser.dart' deferred as ng;

void main() {
  ng.loadLibrary().then((_) {
    ng.bootstrap(MyComponent);
  });
}
