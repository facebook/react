// @enablePropagateDepsInHIR

import {identity} from 'shared-runtime';

/**
 * identity(...)?.toString() is the outer optional, and data?.value is the inner
 * one.
 *
 * We currently bail out here because we recursively traverse all optionals
 * reachable from the outer one (and accidentally visit data?.value).
 *
 * TODO: support nested optionals by improving how we traverse optional value
 * blocks
 */
function Foo({data}: {data: null | {value: number}}) {
  return identity(data?.value)?.toString();
}
