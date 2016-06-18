library random_data;

import 'common.dart';

List<Offering> generateOfferings(int count) =>
    new List.generate(count, generateOffering);

Offering generateOffering(int seed) {
  final res = new Offering();
  res.name = generateName(seed++);
  res.company = generateCompany(seed++);
  res.opportunity = generateOpportunity(seed++);
  res.account = generateAccount(seed++);
  res.basePoints = seed % 10;
  res.kickerPoints = seed % 4;
  res.status = STATUS_LIST[seed % STATUS_LIST.length];
  res.bundles = randomString(seed++);
  res.dueDate = randomDate(seed++);
  res.endDate = randomDate(seed++, minDate: res.dueDate);
  res.aatStatus = AAT_STATUS_LIST[seed % AAT_STATUS_LIST.length];
  return res;
}

Company generateCompany(int seed) {
  return new Company()..name = generateName(seed);
}

Opportunity generateOpportunity(int seed) {
  return new Opportunity()..name = generateName(seed);
}

Account generateAccount(int seed) {
  return new Account()..accountId = seed;
}

String generateName(int seed) {
  const names = const [
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
  return names[seed % names.length];
}

DateTime randomDate(int seed, {DateTime minDate}) {
  if (minDate == null) {
    minDate = new DateTime.now();
  }

  const offsets = const [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  return minDate.add(new Duration(days: offsets[seed % offsets.length]));
}

String randomString(int seed) {
  return new String.fromCharCodes(new List.generate(
      const [5, 7, 9, 11, 13][seed % 5],
      (i) =>
          'a'.codeUnitAt(0) + const [0, 1, 2, 3, 4, 5, 6, 7, 8][seed % 9] + i));
}
