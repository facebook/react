/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {isValidIdentifier} from '@babel/types';
import {z} from 'zod';
import {Effect, ValueKind} from '..';
import {EffectSchema, ValueKindSchema} from './HIR';

export type ObjectPropertiesConfig = {[key: string]: TypeConfig};
export const ObjectPropertiesSchema: z.ZodType<ObjectPropertiesConfig> = z
  .record(
    z.string(),
    z.lazy(() => TypeSchema),
  )
  .refine(record => {
    return Object.keys(record).every(
      key => key === '*' || key === 'default' || isValidIdentifier(key),
    );
  }, 'Expected all "object" property names to be valid identifier, `*` to match any property, of `default` to define a module default export');

export type ObjectTypeConfig = {
  kind: 'object';
  properties: ObjectPropertiesConfig | null;
};
export const ObjectTypeSchema: z.ZodType<ObjectTypeConfig> = z.object({
  kind: z.literal('object'),
  properties: ObjectPropertiesSchema.nullable(),
});

export type FunctionTypeConfig = {
  kind: 'function';
  positionalParams: Array<Effect>;
  restParam: Effect | null;
  calleeEffect: Effect;
  returnType: TypeConfig;
  returnValueKind: ValueKind;
};
export const FunctionTypeSchema: z.ZodType<FunctionTypeConfig> = z.object({
  kind: z.literal('function'),
  positionalParams: z.array(EffectSchema),
  restParam: EffectSchema.nullable(),
  calleeEffect: EffectSchema,
  returnType: z.lazy(() => TypeSchema),
  returnValueKind: ValueKindSchema,
});

export type BuiltInTypeConfig = 'Ref' | 'Array' | 'Primitive' | 'MixedReadonly';
export const BuiltInTypeSchema: z.ZodType<BuiltInTypeConfig> = z.union([
  z.literal('Ref'),
  z.literal('Array'),
  z.literal('Primitive'),
  z.literal('MixedReadonly'),
]);

export type TypeReferenceConfig = {
  kind: 'type';
  name: BuiltInTypeConfig;
};
export const TypeReferenceSchema: z.ZodType<TypeReferenceConfig> = z.object({
  kind: z.literal('type'),
  name: BuiltInTypeSchema,
});

export type TypeConfig =
  | ObjectTypeConfig
  | FunctionTypeConfig
  | TypeReferenceConfig;
export const TypeSchema: z.ZodType<TypeConfig> = z.union([
  ObjectTypeSchema,
  FunctionTypeSchema,
  TypeReferenceSchema,
]);
