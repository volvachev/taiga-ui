import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ContentChild,
    ElementRef,
    EventEmitter,
    forwardRef,
    HostBinding,
    Inject,
    Input,
    Optional,
    Output,
    QueryList,
    Self,
    TemplateRef,
    ViewChild,
    ViewChildren,
} from '@angular/core';
import {NgControl} from '@angular/forms';
import {
    AbstractTuiMultipleControl,
    ALWAYS_FALSE_HANDLER,
    ALWAYS_TRUE_HANDLER,
    EMPTY_QUERY,
    getActualTarget,
    isNativeFocusedIn,
    preventDefault,
    setNativeFocused,
    TUI_FOCUSABLE_ITEM_ACCESSOR,
    TuiActiveZoneDirective,
    TuiBooleanHandler,
    TuiContextWithImplicit,
    tuiDefaultProp,
    TuiFocusableElementAccessor,
    TuiScrollService,
    typedFromEvent,
} from '@taiga-ui/cdk';
import {
    HINT_CONTROLLER_PROVIDER,
    MODE_PROVIDER,
    TEXTFIELD_CONTROLLER_PROVIDER,
    TUI_DATA_LIST_HOST,
    TUI_HINT_WATCHED_CONTROLLER,
    TUI_MODE,
    TUI_TEXTFIELD_APPEARANCE,
    TUI_TEXTFIELD_WATCHED_CONTROLLER,
    TuiBrightness,
    TuiDataListDirective,
    TuiDataListHost,
    TuiHintControllerDirective,
    TuiHorizontalDirection,
    TuiHostedDropdownComponent,
    TuiModeDirective,
    TuiScrollbarComponent,
    TuiSizeL,
    TuiSizeS,
    TuiTextfieldController,
} from '@taiga-ui/core';
import {TuiStringifiableItem} from '@taiga-ui/kit/classes';
import {ALLOWED_SPACE_REGEXP} from '@taiga-ui/kit/components/tag';
import {FIXED_DROPDOWN_CONTROLLER_PROVIDER} from '@taiga-ui/kit/providers';
import {TUI_TAG_STATUS} from '@taiga-ui/kit/tokens';
import {TuiStatusT} from '@taiga-ui/kit/types';
import {PolymorpheusContent} from '@tinkoff/ng-polymorpheus';
import {merge, Observable, Subject} from 'rxjs';
import {filter, map, mapTo, switchMap, takeUntil} from 'rxjs/operators';

import {TUI_INPUT_TAG_OPTIONS, TuiInputTagOptions} from './input-tag-options';

const EVENT_Y_TO_X_COEFFICIENT = 3;

@Component({
    selector: 'tui-input-tag',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './input-tag.template.html',
    styleUrls: ['./input-tag.style.less'],
    providers: [
        {
            provide: TUI_FOCUSABLE_ITEM_ACCESSOR,
            useExisting: forwardRef(() => TuiInputTagComponent),
        },
        {
            provide: TUI_DATA_LIST_HOST,
            useExisting: forwardRef(() => TuiInputTagComponent),
        },
        FIXED_DROPDOWN_CONTROLLER_PROVIDER,
        TEXTFIELD_CONTROLLER_PROVIDER,
        HINT_CONTROLLER_PROVIDER,
        MODE_PROVIDER,
    ],
})
export class TuiInputTagComponent
    extends AbstractTuiMultipleControl<string>
    implements TuiFocusableElementAccessor, TuiDataListHost<string>
{
    @ViewChild(TuiHostedDropdownComponent)
    private readonly hostedDropdown?: TuiHostedDropdownComponent;

    @ViewChild('focusableElement')
    private readonly focusableElement?: ElementRef<HTMLInputElement>;

    @ViewChild('tagsContainer')
    private readonly tagsContainer?: ElementRef<HTMLElement>;

    @ViewChildren('tag', {read: ElementRef})
    private readonly tags: QueryList<ElementRef<HTMLElement>> = EMPTY_QUERY;

    @ViewChild('cleaner', {read: ElementRef})
    private readonly cleanerSvg?: ElementRef<HTMLElement>;

    @ViewChild(TuiScrollbarComponent, {read: ElementRef})
    private readonly scrollBar?: ElementRef<HTMLElement>;

    private readonly scrollToStart$ = new Subject<void>();
    private readonly scrollToEnd$ = new Subject<void>();

    // TODO: Remove in 3.0
    @Input()
    @tuiDefaultProp()
    allowSpaces = true;

    @Input()
    @tuiDefaultProp()
    separator: string | RegExp = this.options.separator;

    @Input()
    @tuiDefaultProp()
    icon = '';

    @Input()
    @tuiDefaultProp()
    iconAlign: TuiHorizontalDirection = 'right';

    @Input()
    @tuiDefaultProp()
    search = '';

    @Input()
    @tuiDefaultProp()
    editable = true;

    @Input()
    @tuiDefaultProp()
    tagValidator: TuiBooleanHandler<string> = ALWAYS_TRUE_HANDLER;

    @Input()
    @HostBinding('class._expandable')
    @tuiDefaultProp()
    expandable = true;

    @Input()
    @tuiDefaultProp()
    inputHidden = false;

    @Input()
    @tuiDefaultProp()
    uniqueTags = this.options.uniqueTags;

    @Input()
    @tuiDefaultProp()
    disabledItemHandler: TuiBooleanHandler<string | TuiStringifiableItem<any>> =
        ALWAYS_FALSE_HANDLER;

    @Input('pseudoFocused')
    set pseudoFocusedSetter(value: boolean | null) {
        if (!value && !this.focused) {
            this.scrollToStart$.next();
        }

        this.pseudoFocused = value;
    }

    @Output()
    readonly searchChange = new EventEmitter<string>();

    @ContentChild(TuiDataListDirective, {read: TemplateRef})
    readonly datalist?: TemplateRef<TuiContextWithImplicit<TuiActiveZoneDirective>>;

    @ViewChild('errorIcon')
    readonly errorIconTemplate?: TemplateRef<{}>;

    @ViewChild(TuiScrollbarComponent)
    set scrollerSetter(scroller: TuiScrollbarComponent | null) {
        this.initScrollerSubscrition(scroller);
    }

    status$: Observable<TuiStatusT> = this.mode$.pipe(
        map(mode => (mode ? 'default' : this.tagStatus)),
    );

    open = false;

    constructor(
        @Optional()
        @Self()
        @Inject(NgControl)
        control: NgControl | null,
        @Inject(ChangeDetectorRef) changeDetectorRef: ChangeDetectorRef,
        @Inject(TuiScrollService) private readonly tuiScrollService: TuiScrollService,
        @Inject(ElementRef) private readonly elementRef: ElementRef<HTMLElement>,
        @Inject(TUI_TEXTFIELD_APPEARANCE) readonly appearance: string,
        @Optional()
        @Inject(TuiModeDirective)
        private readonly modeDirective: TuiModeDirective | null,
        @Inject(TUI_MODE)
        private readonly mode$: Observable<TuiBrightness | null>,
        @Inject(TUI_TAG_STATUS) private readonly tagStatus: TuiStatusT,
        @Inject(TUI_HINT_WATCHED_CONTROLLER)
        readonly hintController: TuiHintControllerDirective,
        @Inject(TUI_TEXTFIELD_WATCHED_CONTROLLER)
        readonly controller: TuiTextfieldController,
        @Inject(TUI_INPUT_TAG_OPTIONS)
        private readonly options: TuiInputTagOptions,
        @Optional()
        @Inject(TuiHostedDropdownComponent)
        private readonly parentHostedDropdown?: TuiHostedDropdownComponent,
    ) {
        super(control, changeDetectorRef);
    }

    get nativeFocusableElement(): HTMLInputElement | null {
        return !this.focusableElement || this.computedDisabled
            ? null
            : this.focusableElement.nativeElement;
    }

    get focused(): boolean {
        return (
            isNativeFocusedIn(this.elementRef.nativeElement) ||
            !!this.hostedDropdown?.focused
        );
    }

    @HostBinding('attr.data-size')
    get size(): TuiSizeL | TuiSizeS {
        return this.controller.size;
    }

    @HostBinding('class._label-outside')
    get labelOutside(): boolean {
        const {size, labelOutside} = this.controller;

        return size === 's' || labelOutside;
    }

    get hasCleaner(): boolean {
        return this.controller.cleaner && this.hasValue && this.interactive;
    }

    get hasNativeValue(): boolean {
        return !!this.search;
    }

    get hasValue(): boolean {
        return !!this.value.length || this.hasNativeValue;
    }

    get hasPlaceholder(): boolean {
        return (
            !this.labelOutside ||
            (!this.hasValue && (!this.hasExampleText || this.inputHidden))
        );
    }

    get placeholderRaised(): boolean {
        return (
            !this.labelOutside &&
            ((this.computedFocused && !this.readOnly) || this.hasValue)
        );
    }

    get hasExampleText(): boolean {
        return (
            !!this.controller.exampleText &&
            this.computedFocused &&
            !this.hasValue &&
            !this.readOnly
        );
    }

    get hasTooltip(): boolean {
        return !!this.hintController.content && !this.disabled;
    }

    get iconAlignLeft(): boolean {
        return !!this.icon && this.iconAlign === 'left';
    }

    get iconAlignRight(): boolean {
        return !!this.icon && this.iconAlign === 'right';
    }

    get hasRightIcons(): boolean {
        return this.hasCleaner || this.hasTooltip || this.iconAlignRight;
    }

    /**
     * @deprecated: use `status$ | async` instead
     * TODO: remove in v3.0
     */
    get status(): TuiStatusT {
        return this.modeDirective && this.modeDirective.mode ? 'default' : this.tagStatus;
    }

    get canOpen(): boolean {
        return this.interactive && !!this.datalist;
    }

    getLeftContent(tag: string): PolymorpheusContent {
        return !this.tagValidator(tag) && this.errorIconTemplate
            ? this.errorIconTemplate
            : '';
    }

    onCleanerClick() {
        this.updateSearch('');
        this.clear();
        this.focusInput();
        this.parentHostedDropdown?.updateOpen(true);
    }

    onActiveZone(active: boolean) {
        this.open = false;
        this.addTag();
        this.updateFocused(active);

        if (!this.computedFocused) {
            this.scrollToStart$.next();
        }
    }

    onMouseDown(event: MouseEvent) {
        const actualTarget = getActualTarget(event);

        if (
            !this.focusableElement ||
            actualTarget === this.focusableElement.nativeElement ||
            // TODO: iframe warning
            !(event.target instanceof Element) ||
            (this.cleanerSvg && this.cleanerSvg.nativeElement.contains(event.target)) ||
            (this.tagsContainer &&
                actualTarget !== this.tagsContainer.nativeElement &&
                this.tagsContainer.nativeElement.contains(actualTarget))
        ) {
            return;
        }

        event.preventDefault();
        this.focusInput();
    }

    onFieldKeyDownBackspace(event: Event | KeyboardEvent) {
        if (!this.labelOutside && !this.hasNativeValue && this.value.length) {
            this.deleteLastEnabledItem();
        } else {
            this.onFieldKeyDownArrowLeft(event);
        }
    }

    onFieldKeyDownArrowLeft(event: Event | KeyboardEvent) {
        if (!this.labelOutside || this.hasNativeValue || !this.value.length) {
            return;
        }

        event.preventDefault();
        setNativeFocused(this.tags.last.nativeElement);
    }

    onFieldKeyDownEnter() {
        this.addTag();
        this.scrollToEnd$.next();
    }

    onTagKeyDownArrowLeft(currentIndex: number) {
        if (currentIndex > 0) {
            this.onScrollKeyDown(currentIndex, -1);
        }
    }

    onTagKeyDownArrowRight(currentIndex: number) {
        if (currentIndex === this.value.length - 1) {
            this.focusInput();
        } else {
            this.onScrollKeyDown(currentIndex, 1);
        }
    }

    onTagEdited(value: string, index: number) {
        this.focusInput();
        this.updateValue(
            this.value
                .map((tag, tagIndex) =>
                    tagIndex !== index
                        ? tag
                        : value
                              .split(this.separator)
                              .map(tag => tag.trim())
                              .filter(Boolean),
                )
                .reduce<string[]>(
                    (result, item: string | string[]) => result.concat(item),
                    [],
                ),
        );
    }

    handleOption(item: string) {
        this.focusInput();
        this.updateSearch('');
        this.updateValue(this.value.concat(item));
        this.open = false;
        this.scrollToEnd$.next();
    }

    onInput(value: string) {
        const array = this.allowSpaces
            ? value.split(this.separator)
            : value.split(ALLOWED_SPACE_REGEXP);
        const tags = array
            .map(item => item.trim())
            .filter((item, index, {length}) => item.length > 0 && index !== length - 1);
        const validated = tags.filter(tag => !this.disabledItemHandler(tag));

        if (array.length > 1) {
            this.updateSearch(array[array.length - 1].trim());
            this.updateValue([...this.value, ...validated]);
        } else {
            this.updateSearch(value);
        }

        this.open = this.hasNativeValue;
    }

    onHoveredChange(hovered: boolean) {
        this.updateHovered(hovered);
    }

    setDisabledState() {
        super.setDisabledState();
        this.open = false;
    }

    protected updateValue(value: string[]) {
        const seen = new Set();

        super.updateValue(
            value
                .reverse()
                .filter(
                    item =>
                        !this.uniqueTags || (!!item && !seen.has(item) && seen.add(item)),
                )
                .reverse(),
        );
    }

    private onScrollKeyDown(currentIndex: number, flag: number) {
        const tag = this.tags.find((_item, index) => index === currentIndex + flag);

        if (!tag || !this.scrollBar) {
            return;
        }

        setNativeFocused(tag.nativeElement);

        if (
            flag * this.scrollBar.nativeElement.clientWidth -
                flag * tag.nativeElement.offsetLeft -
                tag.nativeElement.clientWidth <
            0
        ) {
            this.scrollBar.nativeElement.scrollLeft +=
                flag * tag.nativeElement.clientWidth;
        }
    }

    private initScrollerSubscrition(scroller: TuiScrollbarComponent | null) {
        if (!scroller || !scroller.browserScrollRef) {
            return;
        }

        const {nativeElement} = scroller.browserScrollRef;

        const wheel$ = typedFromEvent(nativeElement, 'wheel', {passive: false}).pipe(
            filter(event => event.deltaX === 0 && this.shouldScroll(nativeElement)),
            preventDefault(),
            map(({deltaY}) =>
                Math.max(nativeElement.scrollLeft + deltaY * EVENT_Y_TO_X_COEFFICIENT, 0),
            ),
        );
        const start$ = this.scrollToStart$.pipe(mapTo(0));
        const end$ = this.scrollToEnd$.pipe(map(() => nativeElement.scrollWidth));

        merge(wheel$, start$, end$)
            .pipe(
                switchMap(left => this.tuiScrollService.scroll$(nativeElement, 0, left)),
                takeUntil(this.destroy$),
            )
            .subscribe();
    }

    private updateSearch(value: string) {
        if (this.focusableElement) {
            this.focusableElement.nativeElement.value = value;
        }

        this.search = value;
        this.searchChange.emit(value);
    }

    private shouldScroll({scrollWidth, offsetWidth}: HTMLElement): boolean {
        return scrollWidth > offsetWidth;
    }

    private addTag() {
        const inputValue = this.search.trim();

        if (!inputValue || this.disabledItemHandler(inputValue)) {
            return;
        }

        this.updateSearch('');
        this.updateValue(this.value.concat(inputValue));
    }

    private deleteLastEnabledItem() {
        for (let index = this.value.length - 1; index >= 0; index--) {
            if (!this.disabledItemHandler(this.value[index])) {
                this.updateValue([
                    ...this.value.slice(0, index),
                    ...this.value.slice(index + 1, this.value.length),
                ]);

                break;
            }
        }
    }

    private focusInput(preventScroll: boolean = false) {
        if (this.nativeFocusableElement) {
            setNativeFocused(this.nativeFocusableElement, true, preventScroll);
        }
    }
}
