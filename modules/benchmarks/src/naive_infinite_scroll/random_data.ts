import {StringWrapper} from '@angular/facade';
import {
  CustomDate,
  Offering,
  Company,
  Opportunity,
  Account,
  STATUS_LIST,
  AAT_STATUS_LIST
} from './common';

export function generateOfferings(count: number): Offering[] {
  var res = [];
  for (var i = 0; i < count; i++) {
    res.push(generateOffering(i));
  }
  return res;
}

export function generateOffering(seed: number): Offering {
  var res = new Offering();
  res.name = generateName(seed++);
  res.company = generateCompany(seed++);
  res.opportunity = generateOpportunity(seed++);
  res.account = generateAccount(seed++);
  res.basePoints = seed % 10;
  res.kickerPoints = seed % 4;
  res.status = STATUS_LIST[seed % STATUS_LIST.length];
  res.bundles = randomString(seed++);
  res.dueDate = randomDate(seed++);
  res.endDate = randomDate(seed++, res.dueDate);
  res.aatStatus = AAT_STATUS_LIST[seed % AAT_STATUS_LIST.length];
  return res;
}

export function generateCompany(seed: number): Company {
  var res = new Company();
  res.name = generateName(seed);
  return res;
}

export function generateOpportunity(seed: number): Opportunity {
  var res = new Opportunity();
  res.name = generateName(seed);
  return res;
}

export function generateAccount(seed: number): Account {
  var res = new Account();
  res.accountId = seed;
  return res;
}

var names = [
  'Foo',
  'Bar',
  'Baz',
  'Qux',
  'Quux',
  'Garply',
  'Waldo',
  'Fred',
  'Plugh',
  'Xyzzy',
  'Thud',
  'Cruft',
  'Stuff'
];

function generateName(seed: number): string {
  return names[seed % names.length];
}

var offsets = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function randomDate(seed: number, minDate: CustomDate = null): CustomDate {
  if (minDate == null) {
    minDate = CustomDate.now();
  }

  return minDate.addDays(offsets[seed % offsets.length]);
}

var stringLengths = [5, 7, 9, 11, 13];
var charCodeOffsets = [0, 1, 2, 3, 4, 5, 6, 7, 8];

function randomString(seed: number): string {
  var len = stringLengths[seed % 5];
  var str = '';
  for (var i = 0; i < len; i++) {
    str += StringWrapper.fromCharCode(97 + charCodeOffsets[seed % 9] + i);
  }
  return str;
}
