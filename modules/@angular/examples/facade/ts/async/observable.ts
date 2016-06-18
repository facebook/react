// #docregion Observable
import {Observable, Subscriber} from 'rxjs/Rx';
var obs = new Observable<number>((obs: Subscriber<number>) => {
  var i = 0;
  setInterval(() => { obs.next(++i); }, 1000);
});
obs.subscribe(i => console.log(`${i} seconds elapsed`));
// #enddocregion
