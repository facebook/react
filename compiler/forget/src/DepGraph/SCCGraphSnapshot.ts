/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as IR from "../IR";
import type { SCCGraph, SCCVertex } from "./SCCGraph";
import type { MapValue, ValVertexSnapshot } from "./ValGraphSnapshot";
import { reactiveInputTag, stableInputTag } from "./ValGraphSnapshot";

export class SCCGraphSnapshot {
  vertices: SCCVertexSnapshot[];

  constructor(sccGraph: SCCGraph) {
    this.vertices = [...sccGraph.vertices.values()].map((v) => v.snapshot());
  }

  toMap() {
    const lnum = (k: string) => parseInt(k.split(/\[(\d+):/)[1]);

    return new Map(
      this.vertices
        .map((c) => c.toMapEntry())
        .sort(([a], [b]) => lnum(a) - lnum(b))
    );
  }
}

export class SCCVertexSnapshot {
  members: ValVertexSnapshot[];

  inputs: IR.ValSnapshot[];

  outgoings: ValVertexSnapshot[][];

  incomings: ValVertexSnapshot[][];

  constructor(sccVertex: SCCVertex) {
    this.members = [...sccVertex.members].map((v) => v.snapshot());
    this.inputs = [...sccVertex.inputs].map((v) => v.snapshot());
    this.outgoings = [...sccVertex.outgoings].map((v) =>
      [...v.members].map((m) => m.snapshot())
    );
    this.incomings = [...sccVertex.incomings].map((v) =>
      [...v.members].map((m) => m.snapshot())
    );
  }

  toString() {
    const vs = this.members.map((v) => v.val.toString()).join(",");
    return `[${vs}]`;
  }

  isInput() {
    return this.members.length === 1 && this.members[0].val.isInput;
  }

  isReactive() {
    return this.members.length === 1 && this.members[0].val.isReactive;
  }

  toMapEntry(): [string, MapValue] {
    const data: MapValue = {};
    const key = this.toString();
    const inputs = this.inputs.map((val) => val.toString());
    const dependencies = this.incomings.map((d) => stringifyVertices(d));
    const dependents = this.outgoings.map((d) => stringifyVertices(d));

    if (dependencies.length > 0) data.dependencies = dependencies;
    if (dependents.length > 0) data.dependents = dependents;
    if (this.isInput()) {
      // Set a prototype as a tag in pretty-format.
      const tag = this.isReactive() ? reactiveInputTag : stableInputTag;
      Object.setPrototypeOf(data, tag);
    } else {
      data.inputs = inputs;
    }

    return [key, data];
  }
}

function stringifyVertices(members: ValVertexSnapshot[]) {
  const vs = members.map((v) => v.val.toString()).join(",");
  return `[${vs}]`;
}
