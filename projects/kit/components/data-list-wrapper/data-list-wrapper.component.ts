import {
    ChangeDetectionStrategy,
    Component,
    forwardRef,
    Inject,
    Input,
    QueryList,
    ViewChildren,
} from '@angular/core';
import {
    EMPTY_QUERY,
    isNativeFocused,
    isPresent,
    tuiDefaultProp,
    TuiElementDirective,
} from '@taiga-ui/cdk';
import {
    TUI_DATA_LIST_ACCESSOR,
    TuiDataListAccessor,
    TuiOptionComponent,
    TuiSizeL,
    TuiSizeXS,
    TuiValueContentContext,
} from '@taiga-ui/core';
import {TUI_ITEMS_HANDLERS, TuiItemsHandlers} from '@taiga-ui/kit/tokens';
import {PolymorpheusContent} from '@tinkoff/ng-polymorpheus';

@Component({
    selector: 'tui-data-list-wrapper:not([labels])',
    templateUrl: './data-list-wrapper.template.html',
    styleUrls: ['./data-list-wrapper.style.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: TUI_DATA_LIST_ACCESSOR,
            useExisting: forwardRef(() => TuiDataListWrapperComponent),
        },
    ],
})
export class TuiDataListWrapperComponent<T> implements TuiDataListAccessor<T> {
    @ViewChildren(forwardRef(() => TuiOptionComponent))
    private readonly optionsQuery: QueryList<TuiOptionComponent<T>> = EMPTY_QUERY;

    @Input()
    @tuiDefaultProp()
    items: ReadonlyArray<readonly T[]> | readonly T[] | null = [];

    @Input()
    @tuiDefaultProp()
    disabledItemHandler: TuiItemsHandlers<T>['disabledItemHandler'] =
        this.itemsHandlers.disabledItemHandler;

    @Input()
    @tuiDefaultProp()
    emptyContent: PolymorpheusContent = '';

    @Input()
    @tuiDefaultProp()
    size: TuiSizeXS | TuiSizeL = 'm';

    constructor(
        @Inject(TUI_ITEMS_HANDLERS)
        private readonly itemsHandlers: TuiItemsHandlers<T | T[]>,
    ) {}

    @Input()
    @tuiDefaultProp()
    itemContent: PolymorpheusContent<TuiValueContentContext<T>> | null = ({$implicit}) =>
        this.itemsHandlers.stringify($implicit);

    getContext(
        $implicit: T,
        {nativeElement}: TuiElementDirective,
    ): TuiValueContentContext<T> {
        return {$implicit, active: isNativeFocused(nativeElement)};
    }

    getOptions(includeDisabled: boolean = false): readonly T[] {
        return this.optionsQuery
            .toArray()
            .filter(({disabled}) => includeDisabled || !disabled)
            .map(({value}) => value)
            .filter(isPresent);
    }
}
