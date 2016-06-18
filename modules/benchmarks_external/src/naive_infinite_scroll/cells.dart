library cells;

import 'package:angular/angular.dart';
import 'common.dart';

@Component(
    selector: 'company-name',
    template: '''
    <div style="width: {{width}}">{{company.name}}</div>
    ''',
    map: const {'company': '=>company', 'cell-width': '=>width',})
class CompanyNameComponent {
  String width;
  Company company;
}

@Component(
    selector: 'opportunity-name',
    template: '''
    <div style="width: {{width}}">{{opportunity.name}}</div>
    ''',
    map: const {'opportunity': '=>opportunity', 'cell-width': '=>width',})
class OpportunityNameComponent {
  String width;
  Opportunity opportunity;
}

@Component(
    selector: 'offering-name',
    template: '''
    <div style="width: {{width}}">{{offering.name}}</div>
    ''',
    map: const {'offering': '=>offering', 'cell-width': '=>width',})
class OfferingNameComponent {
  String width;
  Offering offering;
}

class Stage {
  String name;
  bool isDisabled;
  Map style;
  Function apply;

  String get styleString => style != null
      ? style.keys.map((prop) => '$prop: ${style[prop]}').join(';')
      : '';
}

@Component(
    selector: 'stage-buttons',
    template: '''
    <div style="width: {{width}}">
        <button ng-repeat="stage in stages"
                ng-disabled="stage.isDisabled"
                style="{{stage.styleString}}"
                ng-click="setStage(stage)">
          {{stage.name}}
        </button>
    </div>
    ''',
    map: const {'offering': '=>offering', 'cell-width': '=>width',})
class StageButtonsComponent {
  Offering _offering;
  List<Stage> stages;
  String width;

  Offering get offering => _offering;
  set offering(Offering offering) {
    _offering = offering;
    _computeStageButtons();
  }

  setStage(Stage stage) {
    _offering.status = stage.name;
    _computeStageButtons();
  }

  _computeStageButtons() {
    bool disabled = true;
    stages = STATUS_LIST.map((String status) {
      bool isCurrent = offering.status == status;
      var stage = new Stage();
      stage
        ..name = status
        ..isDisabled = disabled
        ..style = {
          'background-color': disabled ? '#DDD' : isCurrent ? '#DDF' : '#FDD'
        };
      if (isCurrent) {
        disabled = false;
      }
      return stage;
    }).toList();
  }
}

@Component(
    selector: 'account-cell',
    template: '''
    <div style="width: {{width}}">
      <a href="/account/{{account.accountId}}">
        {{account.accountId}}
      </a>
    </div>
    ''',
    map: const {'account': '=>account', 'cell-width': '=>width',})
class AccountCellComponent {
  Account account;
  String width;
}

@Component(
    selector: 'formatted-cell',
    template: '''<div style="width: {{width}}">{{formattedValue}}</div>''',
    map: const {'value': '=>value', 'cell-width': '=>width',})
class FormattedCellComponent {
  String formattedValue;
  String width;

  set value(dynamic value) {
    if (value is DateTime) {
      formattedValue = '${value.month}/${value.day}/${value.year}';
    } else {
      formattedValue = value.toString();
    }
  }
}
