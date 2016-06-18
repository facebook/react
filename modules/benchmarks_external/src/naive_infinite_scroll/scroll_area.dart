library scroll_area;

import 'dart:html';
import 'dart:math' as math;
import 'package:angular/angular.dart';
import 'common.dart';
import 'random_data.dart';

@Component(
    selector: 'scroll-area',
    templateUrl: 'scroll_area.html',
    map: const {'scroll-top': '=>scrollTop',})
class ScrollAreaComponent implements ShadowRootAware {
  Element scrollDiv;
  List<Offering> _fullList;
  List<Offering> visibleItems = [];

  // Init empty maps and populate later. There seems to be a bug in Angular
  // that makes it choke on pre-populated style maps.
  final Map paddingStyle = {};
  final Map innerStyle = {};
  final Map scrollDivStyle = {};

  ScrollAreaComponent() {
    _fullList = generateOfferings(ITEMS);
  }

  @override
  void onShadowRoot(ShadowRoot shadowRoot) {
    scrollDiv = shadowRoot.querySelector('#scrollDiv');
    onScroll();
    scrollDivStyle.addAll({
      'height': '${VIEW_PORT_HEIGHT}px',
      'width': '1000px',
      'border': '1px solid #000',
      'overflow': 'scroll',
    });
    innerStyle['width'] = '${ROW_WIDTH}px';
  }

  set scrollTop(int value) {
    if (value == null || scrollDiv == null) return;
    scrollDiv.scrollTop = value;
  }

  void onScroll() {
    int scrollY = scrollDiv.scrollTop;
    int iStart = scrollY == 0 ? 0 : (scrollY / ITEM_HEIGHT).floor();
    int iEnd = math.min(iStart + VISIBLE_ITEMS + 1, _fullList.length);
    int padding = iStart * ITEM_HEIGHT;
    innerStyle['height'] = '${HEIGHT - padding}px';
    paddingStyle['height'] = '${padding}px';
    visibleItems
      ..clear()
      ..addAll(_fullList.getRange(iStart, iEnd));
  }
}
