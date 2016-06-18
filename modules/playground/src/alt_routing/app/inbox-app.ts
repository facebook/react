import {Component, Injectable} from '@angular/core';
import {
  Routes,
  Route,
  Router,
  ROUTER_DIRECTIVES,
  ROUTER_PROVIDERS,
  OnActivate,
  RouteSegment,
  RouteTree,
  UrlTree
} from '@angular/router';
import * as db from './data';
import {Location} from '@angular/common';
import {PromiseWrapper} from '@angular/core/src/facade/async';
import {isPresent, DateWrapper} from '@angular/core/src/facade/lang';
import {PromiseCompleter} from '@angular/core/src/facade/promise';

class InboxRecord {
  id: string = '';
  subject: string = '';
  content: string = '';
  email: string = '';
  firstName: string = '';
  lastName: string = '';
  date: string;
  draft: boolean = false;

  constructor(data: {
    id: string,
    subject: string,
    content: string,
    email: string,
    firstName: string,
    lastName: string,
    date: string, draft?: boolean
  } = null) {
    if (isPresent(data)) {
      this.setData(data);
    }
  }

  setData(record: {
    id: string,
    subject: string,
    content: string,
    email: string,
    firstName: string,
    lastName: string,
    date: string, draft?: boolean
  }) {
    this.id = record['id'];
    this.subject = record['subject'];
    this.content = record['content'];
    this.email = record['email'];
    this.firstName = (record as any /** TODO #9100 */)['first-name'];
    this.lastName = (record as any /** TODO #9100 */)['last-name'];
    this.date = record['date'];
    this.draft = record['draft'] == true;
  }
}

@Injectable()
class DbService {
  getData(): Promise<any[]> {
    var p = new PromiseCompleter<any[]>();
    p.resolve(db.data);
    return p.promise;
  }

  drafts(): Promise<any[]> {
    return this.getData().then(
        (data: any[]): any[] =>
            data.filter(record => isPresent(record['draft']) && record['draft'] == true));
  }

  emails(): Promise<any[]> {
    return this.getData().then((data: any[]): any[] =>
                                   data.filter(record => !isPresent(record['draft'])));
  }

  email(id: any /** TODO #9100 */): Promise<any> {
    return PromiseWrapper.then(this.getData(), (data: any[]) => {
      for (var i = 0; i < data.length; i++) {
        var entry = data[i];
        if (entry['id'] == id) {
          return entry;
        }
      }
      return null;
    });
  }
}

@Component(
    {selector: 'inbox-detail', directives: ROUTER_DIRECTIVES, templateUrl: 'app/inbox-detail.html'})
class InboxDetailCmp implements OnActivate {
  record: InboxRecord = new InboxRecord();
  ready: boolean = false;

  constructor(private _db: DbService) {}

  routerOnActivate(curr: RouteSegment, prev?: RouteSegment, currTree?: RouteTree,
                   prevTree?: RouteTree): void {
    let id = curr.getParam("id");
    this._db.email(id).then(data => this.record.setData(data));
  }
}

@Component({selector: 'inbox', templateUrl: 'app/inbox.html', directives: ROUTER_DIRECTIVES})
class InboxCmp implements OnActivate {
  items: InboxRecord[] = [];
  ready: boolean = false;

  constructor(private _db: DbService) {}

  routerOnActivate(curr: RouteSegment, prev?: RouteSegment, currTree?: RouteTree,
                   prevTree?: RouteTree): void {
    var sortType = curr.getParam('sort');
    var sortEmailsByDate = isPresent(sortType) && sortType == "date";

    PromiseWrapper.then(this._db.emails(), (emails: any[]) => {
      this.ready = true;
      this.items = emails.map(data => new InboxRecord(data));

      if (sortEmailsByDate) {
        this.items.sort((a: InboxRecord, b: InboxRecord) =>
                            DateWrapper.toMillis(DateWrapper.fromISOString(a.date)) <
                                    DateWrapper.toMillis(DateWrapper.fromISOString(b.date)) ?
                                -1 :
                                1);
      }
    });
  }
}


@Component({selector: 'drafts', templateUrl: 'app/drafts.html', directives: ROUTER_DIRECTIVES})
class DraftsCmp {
  items: InboxRecord[] = [];
  ready: boolean = false;

  constructor(db: DbService) {
    PromiseWrapper.then(db.drafts(), (drafts: any[]) => {
      this.ready = true;
      this.items = drafts.map(data => new InboxRecord(data));
    });
  }
}

@Component({
  selector: 'inbox-app',
  providers: [DbService, ROUTER_PROVIDERS],
  templateUrl: 'app/inbox-app.html',
  directives: ROUTER_DIRECTIVES,
})
@Routes([
  new Route({path: '/', component: InboxCmp}),
  new Route({path: '/inbox', component: InboxCmp}),
  new Route({path: '/drafts', component: DraftsCmp}),
  new Route({path: '/detail/:id', component: InboxDetailCmp})
])
export class InboxApp {
  constructor(private _location: Location) {}
  inboxPageActive() { return this._location.path() == ''; }
  draftsPageActive() { return this._location.path() == '/drafts'; }
}
