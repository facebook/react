library naive_infinite_scroll;

import 'package:angular/angular.dart';
import 'package:angular/application_factory.dart';
import 'app.dart';
import 'scroll_area.dart';
import 'scroll_item.dart';
import 'cells.dart';

class MyAppModule extends Module {
  MyAppModule() {
    bind(ResourceResolverConfig,
        toValue: new ResourceResolverConfig.resolveRelativeUrls(false));
    bind(App);
    bind(ScrollAreaComponent);
    bind(ScrollItemComponent);
    bind(CompanyNameComponent);
    bind(OpportunityNameComponent);
    bind(OfferingNameComponent);
    bind(AccountCellComponent);
    bind(StageButtonsComponent);
    bind(FormattedCellComponent);
  }
}

void main() {
  applicationFactory().addModule(new MyAppModule()).run();
}
