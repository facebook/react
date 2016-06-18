// #docregion Observable
import 'rxjs/add/operator/map';

import {Observable, Subscriber} from 'rxjs/Rx';

var obs = new Observable<number>((obs: Subscriber<any>) => {
  var i = 0;
  setInterval(() => obs.next(++i), 1000);
});
obs.map((i: number) => `${i} seconds elapsed`).subscribe(msg => console.log(msg));
// #enddocregion
