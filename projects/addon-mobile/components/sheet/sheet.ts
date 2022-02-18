import {TuiContextWithImplicit} from '@taiga-ui/cdk';
import {PolymorpheusContent} from '@tinkoff/ng-polymorpheus';
import {Observable, Observer} from 'rxjs';

import {TuiSheetOptions} from './sheet-options';

export interface TuiSheet<T, I = undefined>
    extends TuiSheetOptions<I, T>,
        TuiContextWithImplicit<Observer<T>> {
    readonly content: PolymorpheusContent<TuiSheet<T, I>>;
    readonly scroll$: Observable<number>;
    completeWith(value: T): void;
}
