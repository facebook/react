import {DefaultIterableDifferFactory} from './differs/default_iterable_differ';
import {DefaultKeyValueDifferFactory, KeyValueChangeRecord} from './differs/default_keyvalue_differ';
import {IterableDifferFactory, IterableDiffers} from './differs/iterable_differs';
import {KeyValueDifferFactory, KeyValueDiffers} from './differs/keyvalue_differs';

export {SimpleChanges} from '../metadata/lifecycle_hooks';
export {SimpleChange, ValueUnwrapper, WrappedValue, devModeEqual, looseIdentical, uninitialized} from './change_detection_util';
export {ChangeDetectorRef} from './change_detector_ref';
export {CHANGE_DETECTION_STRATEGY_VALUES, CHANGE_DETECTOR_STATE_VALUES, ChangeDetectionStrategy, ChangeDetectorState, isDefaultChangeDetectionStrategy} from './constants';
export {CollectionChangeRecord, DefaultIterableDifferFactory} from './differs/default_iterable_differ';
export {DefaultIterableDiffer} from './differs/default_iterable_differ';
export {DefaultKeyValueDifferFactory, KeyValueChangeRecord} from './differs/default_keyvalue_differ';
export {IterableDiffer, IterableDifferFactory, IterableDiffers, TrackByFn} from './differs/iterable_differs';
export {KeyValueDiffer, KeyValueDifferFactory, KeyValueDiffers} from './differs/keyvalue_differs';
export {PipeTransform} from './pipe_transform';


/**
 * Structural diffing for `Object`s and `Map`s.
 */
export const keyValDiff: KeyValueDifferFactory[] =
    /*@ts2dart_const*/[new DefaultKeyValueDifferFactory()];

/**
 * Structural diffing for `Iterable` types such as `Array`s.
 */
export const iterableDiff: IterableDifferFactory[] =
    /*@ts2dart_const*/[new DefaultIterableDifferFactory()];

export const defaultIterableDiffers = /*@ts2dart_const*/ new IterableDiffers(iterableDiff);

export const defaultKeyValueDiffers = /*@ts2dart_const*/ new KeyValueDiffers(keyValDiff);
