// flow-typed signature: 933ff4628bc0f673e7f1b45afde46a81
// flow-typed version: 31fffd602f/intl/flow_>=v0.261.x

declare var Intl: {
  Collator: Class<Intl$Collator>,
  DateTimeFormat: Class<Intl$DateTimeFormat>,
  Locale: Class<Intl$LocaleClass>,
  NumberFormat: Class<Intl$NumberFormat>,
  PluralRules: ?Class<Intl$PluralRules>,
  getCanonicalLocales?: (locales?: Intl$Locales) => Intl$Locale[],
  ...
}

type Intl$Locale = string
type Intl$Locales = Intl$Locale | Intl$Locale[]

declare class Intl$Collator {
  constructor (
    locales?: Intl$Locales,
    options?: Intl$CollatorOptions
  ): Intl$Collator;

  static (
    locales?: Intl$Locales,
    options?: Intl$CollatorOptions
  ): Intl$Collator;

  compare (string, string): number;

  resolvedOptions (): {
    locale: Intl$Locale,
    usage: 'sort' | 'search',
    sensitivity: 'base' | 'accent' | 'case' | 'variant',
    ignorePunctuation: boolean,
    collation: string,
    numeric: boolean,
    caseFirst?: 'upper' | 'lower' | 'false',
    ...
  };

  static supportedLocalesOf (locales?: Intl$Locales): Intl$Locale[];
}

type FormatToPartsType = | 'day' | 'dayPeriod' | 'era' | 'hour' | 'literal'
  | 'minute' | 'month' | 'second' | 'timeZoneName' | 'weekday' | 'year';

declare class Intl$DateTimeFormat {
  constructor (
    locales?: Intl$Locales,
    options?: Intl$DateTimeFormatOptions
  ): Intl$DateTimeFormat;

  static (
    locales?: Intl$Locales,
    options?: Intl$DateTimeFormatOptions
  ): Intl$DateTimeFormat;

  format (value?: Date | number): string;

  formatRange(startDate?: Date | number, endDate?: Date | number): string;

  formatToParts (value?: Date | number): Array<{
    type: FormatToPartsType,
    value: string,
    ...
  }>;

  resolvedOptions (): {
    locale: Intl$Locale,
    calendar: string,
    numberingSystem: string,
    timeZone?: string,
    hour12: boolean,
    weekday?: 'narrow' | 'short' | 'long',
    era?: 'narrow' | 'short' | 'long',
    year?: 'numeric' | '2-digit',
    month?: 'numeric' | '2-digit' | 'narrow' | 'short' | 'long',
    day?: 'numeric' | '2-digit',
    hour?: 'numeric' | '2-digit',
    minute?: 'numeric' | '2-digit',
    second?: 'numeric' | '2-digit',
    timeZoneName?: 'short' | 'long',
    ...
  };

  static supportedLocalesOf (locales?: Intl$Locales): Intl$Locale[];
}

declare class Intl$LocaleClass {
  baseName: string,
  calendar?: string,
  caseFirst?: 'upper' | 'lower' | 'false',
  collation?: string,
  hourCycle?: 'h11' | 'h12' | 'h23' | 'h24',
  language: string,
  numberingSystem?: string,
  numeric?: boolean,
  region?: string,
  script?: string,

  constructor(
    tag: string,
    options?: Intl$LocaleOptions,
  ): Intl$LocaleClass;

  maximize(): Intl$LocaleClass;

  minimize(): Intl$LocaleClass;
}

declare type Intl$LocaleOptions = {
  calendar?: string,
  caseFirst?: 'upper' | 'lower' | 'false',
  collation?: string,
  hourCycle?: 'h11' | 'h12' | 'h23' | 'h24',
  numeric?: boolean,
  numberingSystem?: string,
  ...
};

declare class Intl$NumberFormat {
  constructor (
    locales?: Intl$Locales,
    options?: Intl$NumberFormatOptions
  ): Intl$NumberFormat;

  static (
    locales?: Intl$Locales,
    options?: Intl$NumberFormatOptions
  ): Intl$NumberFormat;

  format (number): string;

  resolvedOptions (): {
    locale: Intl$Locale,
    numberingSystem: string,
    style: 'decimal' | 'currency' | 'percent' | 'unit',
    currency?: string,
    currencyDisplay?: 'symbol' | 'code' | 'name' | 'narrowSymbol',
    useGrouping: boolean,
    minimumIntegerDigits?: number,
    minimumFractionDigits?: number,
    maximumFractionDigits?: number,
    minimumSignificantDigits?: number,
    maximumSignificantDigits?: number,
    ...
  };

  static supportedLocalesOf (locales?: Intl$Locales): Intl$Locale[];
}

declare class Intl$PluralRules {
  constructor (
    locales?: Intl$Locales,
    options?: Intl$PluralRulesOptions
  ): Intl$PluralRules;

  select (number): Intl$PluralRule;

  resolvedOptions (): {
    locale: Intl$Locale,
    type: 'cardinal' | 'ordinal',
    minimumIntegerDigits?: number,
    minimumFractionDigits?: number,
    maximumFractionDigits?: number,
    minimumSignificantDigits?: number,
    maximumSignificantDigits?: number,
    pluralCategories: Intl$PluralRule[],
    ...
  };

  static supportedLocalesOf (locales?: Intl$Locales): Intl$Locale[];
}

type Intl$PluralRule = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'

declare type Intl$PluralRulesOptions = {
  localeMatcher?: 'lookup' | 'best fit',
  type?: 'cardinal' | 'ordinal',
  minimumIntegerDigits?: number,
  minimumFractionDigits?: number,
  maximumFractionDigits?: number,
  minimumSignificantDigits?: number,
  maximumSignificantDigits?: number,
  ...
}
