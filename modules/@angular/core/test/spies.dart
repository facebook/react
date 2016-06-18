library core.spies;

import 'package:angular2/core.dart';
import 'package:angular2/src/core/change_detection/change_detection.dart';
import 'package:angular2/src/platform/dom/dom_adapter.dart';
import 'package:@angular/core/testing/testing_internal.dart';

@proxy
class SpyChangeDetectorRef extends SpyObject implements ChangeDetectorRef {}

@proxy
class SpyIterableDifferFactory extends SpyObject
    implements IterableDifferFactory {}

@proxy
class SpyElementRef extends SpyObject implements ElementRef {}

@proxy
class SpyDomAdapter extends SpyObject implements DomAdapter {}
