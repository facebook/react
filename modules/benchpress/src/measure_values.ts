import {Date, DateWrapper} from '@angular/facade';
import {Map} from '@angular/facade';

export class MeasureValues {
  constructor(public runIndex: number, public timeStamp: Date,
              public values: {[key: string]: any}) {}

  toJson() {
    return {
      'timeStamp': DateWrapper.toJson(this.timeStamp),
      'runIndex': this.runIndex,
      'values': this.values
    };
  }
}
