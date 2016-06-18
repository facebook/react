export 'dart:html' show FileReader;

import 'dart:typed_data';

class Uint8ArrayWrapper {
  static Uint8ClampedList create(ByteBuffer buffer) {
    return new Uint8ClampedList.view(buffer);
  }
}
