import {InjectionToken} from '@angular/core';
import {PolymorpheusContent} from '@tinkoff/ng-polymorpheus';

import {TuiSheet} from './sheet';

export interface TuiSheetOptions<I = undefined, T = unknown> {
    readonly image: PolymorpheusContent<TuiSheet<T, I>>;
    readonly imageSlide: boolean;
    readonly stops: readonly string[];
    readonly initial: number;
    readonly closeable: boolean;
    readonly overlay: boolean;
    readonly data: I;
}

export const TUI_SHEET_DEFAULT_OPTIONS: Omit<TuiSheetOptions, 'data'> = {
    image: '',
    imageSlide: true,
    stops: [],
    initial: 0,
    closeable: true,
    overlay: false,
};

export const TUI_SHEET_OPTIONS = new InjectionToken<Omit<TuiSheetOptions, 'data'>>(
    'Default parameters for sheet component',
    {
        factory: () => TUI_SHEET_DEFAULT_OPTIONS,
    },
);
