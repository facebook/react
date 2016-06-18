library common.stuff;

import 'dart:async';
import 'dart:collection';
import 'package:observe/observe.dart';

const ITEMS = 1000;
const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 17;

const HEIGHT = ITEMS * ITEM_HEIGHT;
const VIEW_PORT_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const COMPANY_NAME_WIDTH = 100;
const OPPORTUNITY_NAME_WIDTH = 100;
const OFFERING_NAME_WIDTH = 100;
const ACCOUNT_CELL_WIDTH = 50;
const BASE_POINTS_WIDTH = 50;
const KICKER_POINTS_WIDTH = 50;
const STAGE_BUTTONS_WIDTH = 220;
const BUNDLES_WIDTH = 120;
const DUE_DATE_WIDTH = 100;
const END_DATE_WIDTH = 100;
const AAT_STATUS_WIDTH = 100;
const ROW_WIDTH = COMPANY_NAME_WIDTH +
    OPPORTUNITY_NAME_WIDTH +
    OFFERING_NAME_WIDTH +
    ACCOUNT_CELL_WIDTH +
    BASE_POINTS_WIDTH +
    KICKER_POINTS_WIDTH +
    STAGE_BUTTONS_WIDTH +
    BUNDLES_WIDTH +
    DUE_DATE_WIDTH +
    END_DATE_WIDTH +
    AAT_STATUS_WIDTH;

const STATUS_LIST = const ['Planned', 'Pitched', 'Won', 'Lost'];

const AAT_STATUS_LIST = const ['Active', 'Passive', 'Abandoned'];

// Imitate Streamy entities.

class RawEntity extends Object
    with MapMixin<String, dynamic>
    implements ObservableMap<String, dynamic> {
  ObservableMap _data = new ObservableMap();

  @override
  Iterable<String> get keys => _data.keys;

  @override
  void clear() {
    _data.clear();
  }

  @override
  operator [](String key) {
    if (!key.contains('.')) {
      return _data[key];
    }
    var pieces = key.split('.');
    var last = pieces.removeLast();
    var target = _resolve(pieces, this);
    if (target == null) {
      return null;
    }
    return target[last];
  }

  @override
  operator []=(String key, value) {
    if (!key.contains('.')) {
      _data[key] = value;
      return;
    }
    var pieces = key.split('.');
    var last = pieces.removeLast();
    var target = _resolve(pieces, this);
    target[last] = value;
  }

  @override
  remove(String key) {
    if (!key.contains('.')) {
      return _data.remove(key);
    }
    var pieces = key.split('.');
    var last = pieces.removeLast();
    var target = _resolve(pieces, this);
    return target.remove(last);
  }

  _resolve(List<String> pieces, start) {
    var cur = start;
    for (var i = 0; i < pieces.length; i++) {
      cur = cur[pieces[i]];
      if (cur == null) {
        return null;
      }
    }
    return cur;
  }

  @override
  Stream<List<ChangeRecord>> get changes => _data.changes;
  @override
  bool get hasObservers => _data.hasObservers;
  @override
  bool deliverChanges() => _data.deliverChanges();
  @override
  notifyPropertyChange(Symbol field, Object oldValue, Object newValue) =>
      _data.notifyPropertyChange(field, oldValue, newValue);
  @override
  void notifyChange(ChangeRecord record) {
    _data.notifyChange(record);
  }

  @override
  void observed() {
    _data.observed();
  }

  @override
  void unobserved() {
    _data.observed();
  }
}

class Company extends RawEntity {
  String get name => this['name'];
  set name(String val) {
    this['name'] = val;
  }
}

class Offering extends RawEntity {
  String get name => this['name'];
  set name(String val) {
    this['name'] = val;
  }

  Company get company => this['company'];
  set company(Company val) {
    this['company'] = val;
  }

  Opportunity get opportunity => this['opportunity'];
  set opportunity(Opportunity val) {
    this['opportunity'] = val;
  }

  Account get account => this['account'];
  set account(Account val) {
    this['account'] = val;
  }

  int get basePoints => this['basePoints'];
  set basePoints(int val) {
    this['basePoints'] = val;
  }

  int get kickerPoints => this['kickerPoints'];
  set kickerPoints(int val) {
    this['kickerPoints'] = val;
  }

  String get status => this['status'];
  set status(String val) {
    this['status'] = val;
  }

  String get bundles => this['bundles'];
  set bundles(String val) {
    this['bundles'] = val;
  }

  DateTime get dueDate => this['dueDate'];
  set dueDate(DateTime val) {
    this['dueDate'] = val;
  }

  DateTime get endDate => this['endDate'];
  set endDate(DateTime val) {
    this['endDate'] = val;
  }

  String get aatStatus => this['aatStatus'];
  set aatStatus(String val) {
    this['aatStatus'] = val;
  }
}

class Opportunity extends RawEntity {
  String get name => this['name'];
  set name(String val) {
    this['name'] = val;
  }
}

class Account extends RawEntity {
  int get accountId => this['accountId'];
  set accountId(int val) {
    this['accountId'] = val;
  }
}
