import {bootstrap} from '@angular/platform-browser-dynamic';
import {Component, Injectable} from '@angular/core';
import {NgIf, NgFor, FORM_DIRECTIVES} from '@angular/common';

/**
 * You can find the Angular 1 implementation of this example here:
 * https://github.com/wardbell/ng1DataBinding
 */

// ---- model

var _nextId = 1;
class Person {
  personId: number;
  mom: Person;
  dad: Person;
  friends: Person[];

  constructor(public firstName: string, public lastName: string, public yearOfBirth: number) {
    this.personId = _nextId++;
    this.firstName = firstName;
    this.lastName = lastName;
    this.mom = null;
    this.dad = null;
    this.friends = [];
    this.personId = _nextId++;
  }

  get age(): number { return 2015 - this.yearOfBirth; }
  get fullName(): string { return `${this.firstName} ${this.lastName}`; }
  get friendNames(): string { return this.friends.map(f => f.fullName).join(', '); }
}



// ---- services

@Injectable()
class DataService {
  currentPerson: Person;
  persons: Person[];

  constructor() {
    this.persons = [
      new Person('Victor', 'Savkin', 1930),
      new Person('Igor', 'Minar', 1920),
      new Person('John', 'Papa', 1910),
      new Person('Nancy', 'Duarte', 1910),
      new Person('Jack', 'Papa', 1910),
      new Person('Jill', 'Papa', 1910),
      new Person('Ward', 'Bell', 1910),
      new Person('Robert', 'Bell', 1910),
      new Person('Tracy', 'Ward', 1910),
      new Person('Dan', 'Wahlin', 1910)
    ];

    this.persons[0].friends = [0, 1, 2, 6, 9].map(_ => this.persons[_]);
    this.persons[1].friends = [0, 2, 6, 9].map(_ => this.persons[_]);
    this.persons[2].friends = [0, 1, 6, 9].map(_ => this.persons[_]);
    this.persons[6].friends = [0, 1, 2, 9].map(_ => this.persons[_]);
    this.persons[9].friends = [0, 1, 2, 6].map(_ => this.persons[_]);

    this.persons[2].mom = this.persons[5];
    this.persons[2].dad = this.persons[4];
    this.persons[6].mom = this.persons[8];
    this.persons[6].dad = this.persons[7];

    this.currentPerson = this.persons[0];
  }
}



// ---- components

@Component({
  selector: 'full-name-cmp',
  template: `
    <h1>Edit Full Name</h1>
    <div>
      <form>
          <div>
            <label>
              First: <input [(ngModel)]="person.firstName" type="text" placeholder="First name">
            </label>
          </div>

          <div>
            <label>
              Last: <input [(ngModel)]="person.lastName" type="text" placeholder="Last name">
            </label>
          </div>

          <div>
            <label>{{person.fullName}}</label>
          </div>
      </form>
    </div>
  `,
  directives: [FORM_DIRECTIVES]
})
class FullNameComponent {
  constructor(private _service: DataService) {}
  get person(): Person { return this._service.currentPerson; }
}

@Component({
  selector: 'person-detail-cmp',
  template: `
    <h2>{{person.fullName}}</h2>

    <div>
      <form>
        <div>
					<label>First: <input [(ngModel)]="person.firstName" type="text" placeholder="First name"></label>
				</div>

        <div>
					<label>Last: <input [(ngModel)]="person.lastName" type="text" placeholder="Last name"></label>
				</div>

        <div>
					<label>Year of birth: <input [(ngModel)]="person.yearOfBirth" type="number" placeholder="Year of birth"></label>
          Age: {{person.age}}
				</div>\

        <div *ngIf="person.mom != null">
					<label>Mom:</label>
          <input [(ngModel)]="person.mom.firstName" type="text" placeholder="Mom's first name">
          <input [(ngModel)]="person.mom.lastName" type="text" placeholder="Mom's last name">
          {{person.mom.fullName}}
				</div>

        <div *ngIf="person.dad != null">
					<label>Dad:</label>
          <input [(ngModel)]="person.dad.firstName" type="text" placeholder="Dad's first name">
          <input [(ngModel)]="person.dad.lastName" type="text" placeholder="Dad's last name">
          {{person.dad.fullName}}
				</div>

        <div *ngIf="person.friends.length > 0">
					<label>Friends:</label>
          {{person.friendNames}}
				</div>
      </form>
    </div>
  `,
  directives: [FORM_DIRECTIVES, NgIf]
})
class PersonsDetailComponent {
  constructor(private _service: DataService) {}
  get person(): Person { return this._service.currentPerson; }
}

@Component({
  selector: 'persons-cmp',
  template: `
    <h1>FullName Demo</h1>
    <div>
      <ul>
  		  <li *ngFor="let person of persons">
  			  <label (click)="select(person)">{{person.fullName}}</label>
  			</li>
  	 </ul>

     <person-detail-cmp></person-detail-cmp>
    </div>
  `,
  directives: [FORM_DIRECTIVES, PersonsDetailComponent, NgFor]
})
class PersonsComponent {
  persons: Person[];

  constructor(private _service: DataService) { this.persons = _service.persons; }

  select(person: Person): void { this._service.currentPerson = person; }
}


@Component({
  selector: 'person-management-app',
  viewProviders: [DataService],
  template: `
    <button (click)="switchToEditName()">Edit Full Name</button>
    <button (click)="switchToPersonList()">Person Array</button>

    <full-name-cmp *ngIf="mode == 'editName'"></full-name-cmp>
    <persons-cmp *ngIf="mode == 'personList'"></persons-cmp>
  `,
  directives: [FullNameComponent, PersonsComponent, NgIf]
})
class PersonManagementApplication {
  mode: string;

  switchToEditName(): void { this.mode = 'editName'; }
  switchToPersonList(): void { this.mode = 'personList'; }
}

export function main() {
  bootstrap(PersonManagementApplication);
}
