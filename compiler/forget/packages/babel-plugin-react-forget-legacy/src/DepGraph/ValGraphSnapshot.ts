/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as IR from "../IR";
import type { ValGraph, ValVertex } from "./ValGraph";

export class ValGraphSnapshot {
  vertices: ValVertexSnapshot[];

  constructor(valGraph: ValGraph) {
    this.vertices = [...valGraph.vertices.values()].map((v) => v.snapshot());
  }

  toMap() {
    return new Map(this.vertices.map((c) => c.toMapEntry()));
  }
}

export type MapValue = {
  inputs?: string[];
  dependencies?: string[];
  dependents?: string[];
};

export class ReactiveInput {}
export const reactiveInputTag = new ReactiveInput();

export class StableInput {}
export const stableInputTag = new StableInput();

export class ValVertexSnapshot {
  val: IR.ValSnapshot;

  inputs: IR.ValSnapshot[];

  outgoings: IR.ValSnapshot[];

  incomings: IR.ValSnapshot[];

  constructor(valVertex: ValVertex) {
    this.val = valVertex.val.snapshot();
    this.inputs = [...valVertex.inputs].map((v) => v.snapshot());
    this.outgoings = [...valVertex.outgoings].map((v) => v.val.snapshot());
    this.incomings = [...valVertex.incomings].map((v) => v.val.snapshot());
  }

  toMapEntry(): [string, MapValue] {
    const data: MapValue = {};
    const key = this.val.toString();
    const inputs = this.inputs.map((val) => val.toString());
    const dependencies = this.incomings.map((val) => val.toString());
    const dependents = this.outgoings.map((val) => val.toString());

    if (dependencies.length > 0) data.dependencies = dependencies;
    if (dependents.length > 0) data.dependents = dependents;

    if (this.val.isInput) {
      // Set a prototype as a tag in pretty-format.
      const tag = this.val.isReactive ? reactiveInputTag : stableInputTag;
      Object.setPrototypeOf(data, tag);
    } else {
      data.inputs = inputs;
    }

    return [key, data];
  }
}
