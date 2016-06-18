library scroll_item;

import 'package:angular/angular.dart';
import 'common.dart';

@Component(
    selector: 'scroll-item',
    templateUrl: 'scroll_item.html',
    map: const {'offering': '=>offering',})
class ScrollItemComponent implements ShadowRootAware {
  Offering offering;

  // Init empty maps and populate later. There seems to be a bug in Angular
  // that makes it choke on pre-populated style maps.
  Map itemStyle = {};

  @override
  void onShadowRoot(_) {
    itemStyle.addAll({
      'height': '${ITEM_HEIGHT}px',
      'line-height': '${ITEM_HEIGHT}px',
      'font-size': '18px',
      'display': 'flex',
      'justify-content': 'space-between',
    });
  }

  get companyNameWidth => '${COMPANY_NAME_WIDTH}px';
  get opportunityNameWidth => '${OPPORTUNITY_NAME_WIDTH}px';
  get offeringNameWidth => '${OFFERING_NAME_WIDTH}px';
  get accountCellWidth => '${ACCOUNT_CELL_WIDTH}px';
  get basePointsWidth => '${BASE_POINTS_WIDTH}px';
  get kickerPointsWidth => '${KICKER_POINTS_WIDTH}px';
  get stageButtonsWidth => '${STAGE_BUTTONS_WIDTH}px';
  get bundlesWidth => '${BUNDLES_WIDTH}px';
  get dueDateWidth => '${DUE_DATE_WIDTH}px';
  get endDateWidth => '${END_DATE_WIDTH}px';
  get aatStatusWidth => '${AAT_STATUS_WIDTH}px';
}
