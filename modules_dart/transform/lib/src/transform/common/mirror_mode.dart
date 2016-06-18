library angular2.transform.common.mirror_mode;

/// Modes for mirror use.
/// `none` is the default value and signifies that mirror use should be
/// removed.
/// `debug` allows the use of mirrors and logs a notice whenever they are
/// accessed.
/// `verbose` allows the use of mirrors and logs a stack trace whenever they
/// are accessed.
enum MirrorMode { debug, none, verbose }
