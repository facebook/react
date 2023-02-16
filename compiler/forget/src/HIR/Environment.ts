import { IdentifierId, makeIdentifierId } from "./HIR";

export class Environment {
  #nextIdentifer: number = 0;

  get nextIdentifierId(): IdentifierId {
    return makeIdentifierId(this.#nextIdentifer++);
  }
}
