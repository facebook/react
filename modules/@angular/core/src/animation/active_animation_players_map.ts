import {ListWrapper, Map, StringMapWrapper} from '../facade/collection';
import {isPresent} from '../facade/lang';

import {AnimationPlayer} from './animation_player';

export class ActiveAnimationPlayersMap {
  private _map = new Map<any, {[key: string]: AnimationPlayer}>();
  private _allPlayers: AnimationPlayer[] = [];

  get length(): number { return this.getAllPlayers().length; }

  find(element: any, animationName: string): AnimationPlayer {
    var playersByAnimation = this._map.get(element);
    if (isPresent(playersByAnimation)) {
      return playersByAnimation[animationName];
    }
  }

  findAllPlayersByElement(element: any): AnimationPlayer[] {
    var players: any[] /** TODO #9100 */ = [];
    StringMapWrapper.forEach(
        this._map.get(element), (player: any /** TODO #9100 */) => players.push(player));
    return players;
  }

  set(element: any, animationName: string, player: AnimationPlayer): void {
    var playersByAnimation = this._map.get(element);
    if (!isPresent(playersByAnimation)) {
      playersByAnimation = {};
    }
    var existingEntry = playersByAnimation[animationName];
    if (isPresent(existingEntry)) {
      this.remove(element, animationName);
    }
    playersByAnimation[animationName] = player;
    this._allPlayers.push(player);
    this._map.set(element, playersByAnimation);
  }

  getAllPlayers(): AnimationPlayer[] { return this._allPlayers; }

  remove(element: any, animationName: string): void {
    var playersByAnimation = this._map.get(element);
    if (isPresent(playersByAnimation)) {
      var player = playersByAnimation[animationName];
      delete playersByAnimation[animationName];
      var index = this._allPlayers.indexOf(player);
      ListWrapper.removeAt(this._allPlayers, index);

      if (StringMapWrapper.isEmpty(playersByAnimation)) {
        this._map.delete(element);
      }
    }
  }
}
