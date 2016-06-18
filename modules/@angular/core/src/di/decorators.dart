library angular2.di.decorators;

import 'metadata.dart';
export 'metadata.dart';

/**
 * {@link InjectMetadata}.
 * @stable
 */
class Inject extends InjectMetadata {
  const Inject(dynamic token) : super(token);
}

/**
 * {@link OptionalMetadata}.
 * @stable
 */
class Optional extends OptionalMetadata {
  const Optional() : super();
}

/**
 * {@link InjectableMetadata}.
 * @stable
 */
class Injectable extends InjectableMetadata {
  const Injectable() : super();
}

/**
 * {@link SelfMetadata}.
 * @stable
 */
class Self extends SelfMetadata {
  const Self() : super();
}

/**
 * {@link HostMetadata}.
 * @stable
 */
class Host extends HostMetadata {
  const Host() : super();
}

/**
 * {@link SkipSelfMetadata}.
 * @stable
 */
class SkipSelf extends SkipSelfMetadata {
  const SkipSelf() : super();
}
