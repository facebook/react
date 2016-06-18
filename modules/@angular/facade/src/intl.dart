library facade.intl;

import 'package:intl/intl.dart';

String _normalizeLocale(String locale) => locale.replaceAll('-', '_');

enum NumberFormatStyle { Decimal, Percent, Currency }

class NumberFormatter {
  static String format(num number, String locale, NumberFormatStyle style,
      {int minimumIntegerDigits: 1,
      int minimumFractionDigits: 0,
      int maximumFractionDigits: 3,
      String currency,
      bool currencyAsSymbol: false}) {
    locale = _normalizeLocale(locale);
    NumberFormat formatter;
    switch (style) {
      case NumberFormatStyle.Decimal:
        formatter = new NumberFormat.decimalPattern(locale);
        break;
      case NumberFormatStyle.Percent:
        formatter = new NumberFormat.percentPattern(locale);
        break;
      case NumberFormatStyle.Currency:
        if (currencyAsSymbol) {
          // See https://github.com/dart-lang/intl/issues/59.
          throw new Exception(
              'Displaying currency as symbol is not supported.');
        }
        formatter = new NumberFormat.currencyPattern(locale, currency);
        break;
    }
    formatter.minimumIntegerDigits = minimumIntegerDigits;
    formatter.minimumFractionDigits = minimumFractionDigits;
    formatter.maximumFractionDigits = maximumFractionDigits;
    return formatter.format(number);
  }
}

class DateFormatter {
  static RegExp _multiPartRegExp = new RegExp(r'^([yMdE]+)([Hjms]+)$');

  static String format(DateTime date, String locale, String pattern) {
    locale = _normalizeLocale(locale);
    var formatter = new DateFormat(null, locale);
    var matches = _multiPartRegExp.firstMatch(pattern);
    if (matches != null) {
      // Support for patterns which have known date and time components.
      formatter.addPattern(matches[1]);
      formatter.addPattern(matches[2], ', ');
    } else {
      formatter.addPattern(pattern);
    }
    return formatter.format(date);
  }
}
