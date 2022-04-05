import {Component} from '@angular/core';
import {FormControl} from '@angular/forms';
import {changeDetection} from '@demo/emulate/change-detection';
import {encapsulation} from '@demo/emulate/encapsulation';
import {Observable, of, Subject} from 'rxjs';
import {delay, filter, startWith, switchMap} from 'rxjs/operators';

import {default as avatar} from '!!file-loader!../../../../../assets/images/avatar.jpg';

class User {
    constructor(
        readonly firstName: string,
        readonly lastName: string,
        readonly avatarUrl: string | null = null,
    ) {}

    toString(): string {
        return `${this.firstName} ${this.lastName}`;
    }
}

const databaseMockData: readonly User[] = [
    new User('Roman', 'Sedov', 'http://marsibarsi.me/images/1x1small.jpg'),
    new User('Alex', 'Inkin', avatar),
];

@Component({
    selector: 'tui-combo-box-example-1',
    templateUrl: './index.html',
    styleUrls: ['./index.less'],
    changeDetection,
    encapsulation,
})
export class TuiComboBoxExample1 {
    readonly search$: Subject<string | null> = new Subject();

    readonly items$: Observable<readonly User[] | null> = this.search$.pipe(
        filter(value => value !== null),
        switchMap(search =>
            this.serverRequest(search).pipe(startWith<readonly User[] | null>(null)),
        ),
        startWith(databaseMockData),
    );

    readonly testValue = new FormControl(databaseMockData[1]);

    onSearchChange(searchQuery: string | null) {
        this.search$.next(searchQuery);
    }

    extractValueFromEvent(event: Event): string {
        return (event.target as EventTarget & {value?: string})?.value ?? '';
    }

    /**
     * Service request emulation
     */
    private serverRequest(searchQuery: string | null): Observable<readonly User[]> {
        const result = databaseMockData.filter(user =>
            searchQuery
                ? user.toString().toLowerCase().includes(searchQuery.toLowerCase())
                : user,
        );

        return of(result).pipe(delay(Math.random() * 1000 + 500));
    }
}
