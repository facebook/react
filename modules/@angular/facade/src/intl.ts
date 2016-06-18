export enum NumberFormatStyle {
  Decimal,
  Percent,
  Currency
}

export class NumberFormatter {
  static format(
      num: number, locale: string, style: NumberFormatStyle,
      {minimumIntegerDigits = 1, minimumFractionDigits = 0, maximumFractionDigits = 3, currency,
       currencyAsSymbol = false}: {
        minimumIntegerDigits?: number,
        minimumFractionDigits?: number,
        maximumFractionDigits?: number,
        currency?: string,
        currencyAsSymbol?: boolean
      } = {}): string {
    var intlOptions: Intl.NumberFormatOptions = {
      minimumIntegerDigits: minimumIntegerDigits,
      minimumFractionDigits: minimumFractionDigits,
      maximumFractionDigits: maximumFractionDigits
    };
    intlOptions.style = NumberFormatStyle[style].toLowerCase();
    if (style == NumberFormatStyle.Currency) {
      intlOptions.currency = currency;
      intlOptions.currencyDisplay = currencyAsSymbol ? 'symbol' : 'code';
    }
    return new Intl.NumberFormat(locale, intlOptions).format(num);
  }
}
var DATE_FORMATS_SPLIT =
    /((?:[^yMLdHhmsaZEwGjJ']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|L+|d+|H+|h+|J+|j+|m+|s+|a|Z|G+|w+))(.*)/;

var PATTERN_ALIASES = {
  yMMMdjms: datePartGetterFactory(combine([
    digitCondition('year', 1),
    nameCondition('month', 3),
    digitCondition('day', 1),
    digitCondition('hour', 1),
    digitCondition('minute', 1),
    digitCondition('second', 1),
  ])),
  yMdjm: datePartGetterFactory(combine([
    digitCondition('year', 1), digitCondition('month', 1), digitCondition('day', 1),
    digitCondition('hour', 1), digitCondition('minute', 1)
  ])),
  yMMMMEEEEd: datePartGetterFactory(combine([
    digitCondition('year', 1), nameCondition('month', 4), nameCondition('weekday', 4),
    digitCondition('day', 1)
  ])),
  yMMMMd: datePartGetterFactory(
      combine([digitCondition('year', 1), nameCondition('month', 4), digitCondition('day', 1)])),
  yMMMd: datePartGetterFactory(
      combine([digitCondition('year', 1), nameCondition('month', 3), digitCondition('day', 1)])),
  yMd: datePartGetterFactory(
      combine([digitCondition('year', 1), digitCondition('month', 1), digitCondition('day', 1)])),
  jms: datePartGetterFactory(combine(
      [digitCondition('hour', 1), digitCondition('second', 1), digitCondition('minute', 1)])),
  jm: datePartGetterFactory(combine([digitCondition('hour', 1), digitCondition('minute', 1)]))
};

var DATE_FORMATS = {
  yyyy: datePartGetterFactory(digitCondition('year', 4)),
  yy: datePartGetterFactory(digitCondition('year', 2)),
  y: datePartGetterFactory(digitCondition('year', 1)),
  MMMM: datePartGetterFactory(nameCondition('month', 4)),
  MMM: datePartGetterFactory(nameCondition('month', 3)),
  MM: datePartGetterFactory(digitCondition('month', 2)),
  M: datePartGetterFactory(digitCondition('month', 1)),
  LLLL: datePartGetterFactory(nameCondition('month', 4)),
  dd: datePartGetterFactory(digitCondition('day', 2)),
  d: datePartGetterFactory(digitCondition('day', 1)),
  HH: hourExtracter(datePartGetterFactory(hour12Modify(digitCondition('hour', 2), false))),
  H: hourExtracter(datePartGetterFactory(hour12Modify(digitCondition('hour', 1), false))),
  hh: hourExtracter(datePartGetterFactory(hour12Modify(digitCondition('hour', 2), true))),
  h: hourExtracter(datePartGetterFactory(hour12Modify(digitCondition('hour', 1), true))),
  jj: datePartGetterFactory(digitCondition('hour', 2)),
  j: datePartGetterFactory(digitCondition('hour', 1)),
  mm: digitModifier(datePartGetterFactory(digitCondition('minute', 2))),
  m: datePartGetterFactory(digitCondition('minute', 1)),
  ss: digitModifier(datePartGetterFactory(digitCondition('second', 2))),
  s: datePartGetterFactory(digitCondition('second', 1)),
  // while ISO 8601 requires fractions to be prefixed with `.` or `,`
  // we can be just safely rely on using `sss` since we currently don't support single or two digit
  // fractions
  sss: datePartGetterFactory(digitCondition('second', 3)),
  EEEE: datePartGetterFactory(nameCondition('weekday', 4)),
  EEE: datePartGetterFactory(nameCondition('weekday', 3)),
  EE: datePartGetterFactory(nameCondition('weekday', 2)),
  E: datePartGetterFactory(nameCondition('weekday', 1)),
  a: hourClockExtracter(datePartGetterFactory(hour12Modify(digitCondition('hour', 1), true))),
  Z: datePartGetterFactory({timeZoneName: 'long'}),
  z: datePartGetterFactory({timeZoneName: 'short'}),
  ww: datePartGetterFactory({}),  // Week of year, padded (00-53). Week 01 is the week with the
                                  // first Thursday of the year. not support ?
  w: datePartGetterFactory({}),   // Week of year (0-53). Week 1 is the week with the first Thursday
                                  // of the year not support ?
  G: datePartGetterFactory(nameCondition('era', 1)),
  GG: datePartGetterFactory(nameCondition('era', 2)),
  GGG: datePartGetterFactory(nameCondition('era', 3)),
  GGGG: datePartGetterFactory(nameCondition('era', 4))
};


function digitModifier(inner: (date: Date, locale: string) => string): (
    date: Date, locale: string) => string {
  return function(date: Date, locale: string): string {
    var result = inner(date, locale);

    return result.length == 1 ? '0' + result : result;
  };
}

function hourClockExtracter(inner: (date: Date, locale: string) => string): (
    date: Date, locale: string) => string {
  return function(date: Date, locale: string): string {
    var result = inner(date, locale);

    return result.split(' ')[1];
  };
}

function hourExtracter(inner: (date: Date, locale: string) => string): (
    date: Date, locale: string) => string {
  return function(date: Date, locale: string): string {
    var result = inner(date, locale);

    return result.split(' ')[0];
  };
}

function hour12Modify(
    options: Intl.DateTimeFormatOptions, value: boolean): Intl.DateTimeFormatOptions {
  options.hour12 = value;
  return options;
}

function digitCondition(prop: string, len: number): Intl.DateTimeFormatOptions {
  var result: {[k: string]: string} = {};
  result[prop] = len == 2 ? '2-digit' : 'numeric';
  return result;
}
function nameCondition(prop: string, len: number): Intl.DateTimeFormatOptions {
  var result: {[k: string]: string} = {};
  result[prop] = len < 4 ? 'short' : 'long';
  return result;
}

function combine(options: Intl.DateTimeFormatOptions[]): Intl.DateTimeFormatOptions {
  var result = {};

  options.forEach(option => { (<any>Object).assign(result, option); });

  return result;
}

function datePartGetterFactory(ret: Intl.DateTimeFormatOptions): (date: Date, locale: string) =>
    string {
  return function(date: Date, locale: string): string {
    return new Intl.DateTimeFormat(locale, ret).format(date);
  };
}


var datePartsFormatterCache: Map<string, string[]> = new Map<string, string[]>();

function dateFormatter(format: string, date: Date, locale: string): string {
  var text = '';
  var match: any /** TODO #9100 */;
  var fn: any /** TODO #9100 */;
  var parts: string[] = [];
  if ((PATTERN_ALIASES as any /** TODO #9100 */)[format]) {
    return (PATTERN_ALIASES as any /** TODO #9100 */)[format](date, locale);
  }


  if (datePartsFormatterCache.has(format)) {
    parts = datePartsFormatterCache.get(format);
  } else {
    var matchs = DATE_FORMATS_SPLIT.exec(format);

    while (format) {
      match = DATE_FORMATS_SPLIT.exec(format);
      if (match) {
        parts = concat(parts, match, 1);
        format = parts.pop();
      } else {
        parts.push(format);
        format = null;
      }
    }

    datePartsFormatterCache.set(format, parts);
  }

  parts.forEach(part => {
    fn = (DATE_FORMATS as any /** TODO #9100 */)[part];
    text += fn ? fn(date, locale) :
                 part === '\'\'' ? '\'' : part.replace(/(^'|'$)/g, '').replace(/''/g, '\'');
  });

  return text;
}

var slice = [].slice;
function concat(
    array1: any /** TODO #9100 */, array2: any /** TODO #9100 */,
    index: any /** TODO #9100 */): string[] {
  return array1.concat(slice.call(array2, index));
}

export class DateFormatter {
  static format(date: Date, locale: string, pattern: string): string {
    return dateFormatter(pattern, date, locale);
  }
}
