library scroll_app;

import 'dart:async';
import 'dart:html';
import 'package:angular/angular.dart';
import 'package:angular2/src/testing/benchmark_util.dart';

@Component(
    selector: 'scroll-app',
    template: '''
    <div>
        <div style="display: flex">
          <scroll-area scroll-top="scrollTop"></scroll-area>
        </div>
        <div ng-if="scrollAreas.length > 0">
          <p>Following tables are only here to add weight to the UI:</p>
          <scroll-area ng-repeat="scrollArea in scrollAreas"></scroll-area>
        </div>
    </div>
    ''')
class App implements ShadowRootAware {
  final VmTurnZone ngZone;
  List<int> scrollAreas;
  int scrollTop = 0;
  int iterationCount;
  int scrollIncrement;

  App(this.ngZone) {
    int appSize = getIntParameter('appSize');
    iterationCount = getIntParameter('iterationCount');
    scrollIncrement = getIntParameter('scrollIncrement');
    appSize = appSize > 1 ? appSize - 1 : 0; // draw at least one table
    scrollAreas = new List.generate(appSize, (i) => i);
  }

  @override
  void onShadowRoot(ShadowRoot shadowRoot) {
    bindAction('#run-btn', () {
      runBenchmark();
    });
    bindAction('#reset-btn', () {
      scrollTop = 0;
    });
  }

  void runBenchmark() {
    int n = iterationCount;
    scheduleScroll() {
      new Future(() {
        scrollTop += scrollIncrement;
        n--;
        if (n > 0) {
          scheduleScroll();
        }
      });
    }
    scheduleScroll();
  }
}
