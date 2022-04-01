import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Directive,
    ElementRef,
    forwardRef,
    HostBinding,
    Inject,
    Input,
    Optional,
    QueryList,
    Self,
    ViewChild,
    ViewChildren,
} from '@angular/core';
import {NgControl} from '@angular/forms';
import {
    EMPTY_QUERY,
    isNativeFocused,
    isNativeFocusedIn,
    setNativeFocused,
    TUI_FOCUSABLE_ITEM_ACCESSOR,
    TUI_IS_MOBILE,
    TuiContextWithImplicit,
    tuiDefaultProp,
    TuiFocusableElementAccessor,
    TuiNativeFocusableElement,
} from '@taiga-ui/cdk';
import {
    getFractionPartPadded,
    TUI_TEXTFIELD_APPEARANCE,
    TuiDecimalT,
    TuiSizeL,
} from '@taiga-ui/core';
import {AbstractTuiInputSlider, quantumAssertion} from '@taiga-ui/kit/abstract';
import {TuiInputNumberComponent} from '@taiga-ui/kit/components/input-number';
import {TuiRangeComponent} from '@taiga-ui/kit/components/range';
import {TuiKeySteps} from '@taiga-ui/kit/types';
import {PolymorpheusContent} from '@tinkoff/ng-polymorpheus';

// @dynamic
@Component({
    selector: 'tui-input-range',
    templateUrl: './input-range.template.html',
    styleUrls: ['./input-range.style.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: TUI_FOCUSABLE_ITEM_ACCESSOR,
            useExisting: forwardRef(() => TuiInputRangeComponent),
        },
    ],
})
export class TuiInputRangeComponent
    extends AbstractTuiInputSlider<[number, number]>
    implements TuiFocusableElementAccessor
{
    @ViewChildren(TuiInputNumberComponent)
    private readonly inputNumberRefs: QueryList<TuiInputNumberComponent> = EMPTY_QUERY;

    @ViewChild(TuiRangeComponent)
    private readonly rangeRef: TuiRangeComponent | null = null;

    private lastActiveSide: 'left' | 'right' = 'left';

    @Input()
    @tuiDefaultProp()
    min = 0;

    /* TODO: make `100` as default value (like in native sliders) */
    @Input()
    @tuiDefaultProp()
    max = Infinity;

    @Input()
    @tuiDefaultProp(quantumAssertion, 'Quantum must be positive')
    quantum = 1;

    @Input()
    @tuiDefaultProp()
    steps = 0;

    @Input()
    @tuiDefaultProp()
    segments = 0;

    @Input()
    @tuiDefaultProp()
    keySteps: TuiKeySteps | null = null;

    @Input()
    @tuiDefaultProp()
    leftValueContent: PolymorpheusContent<TuiContextWithImplicit<number>> = '';

    @Input()
    @tuiDefaultProp()
    rightValueContent: PolymorpheusContent<TuiContextWithImplicit<number>> = '';

    /**
     * @deprecated use `tuiTextfieldSize` instead
     * TODO delete in v3.0
     */
    @Input()
    @HostBinding('attr.data-size')
    @tuiDefaultProp()
    size: TuiSizeL = 'l';

    constructor(
        @Optional()
        @Self()
        @Inject(NgControl)
        control: NgControl | null,
        @Inject(ChangeDetectorRef) changeDetectorRef: ChangeDetectorRef,
        @Inject(TUI_IS_MOBILE)
        private readonly isMobile: boolean,
        @Inject(TUI_TEXTFIELD_APPEARANCE)
        readonly appearance: string,
        @Inject(ElementRef) private readonly elementRef: ElementRef,
    ) {
        super(control, changeDetectorRef);
    }

    get leftFocusableElement(): HTMLInputElement | null {
        const [leftTextInputRef] = this.inputNumberRefs;

        return leftTextInputRef?.nativeFocusableElement || null;
    }

    get rightFocusableElement(): HTMLInputElement | null {
        const [, rightTextInputRef] = this.inputNumberRefs;

        return rightTextInputRef?.nativeFocusableElement || null;
    }

    get nativeFocusableElement(): TuiNativeFocusableElement | null {
        return !this.leftFocusableElement || this.disabled
            ? null
            : this.leftFocusableElement;
    }

    get focused(): boolean {
        return isNativeFocusedIn(this.elementRef.nativeElement);
    }

    get showLeftValueContent(): boolean {
        return (
            !isNativeFocused(this.leftFocusableElement) &&
            !(this.rangeRef?.focused && this.lastActiveSide === 'left')
        );
    }

    get showRightValueContent(): boolean {
        return (
            !isNativeFocused(this.rightFocusableElement) &&
            !(this.rangeRef?.focused && this.lastActiveSide === 'right')
        );
    }

    get precision(): number {
        return getFractionPartPadded(this.quantum).length;
    }

    get decimal(): TuiDecimalT {
        return this.precision ? 'not-zero' : 'never';
    }

    get computedSteps(): number {
        return this.steps || (this.max - this.min) / this.quantum;
    }

    /**
     * TODO replace by controller.labelOutside in v3.0 (let user configure this property by yourself)
     */
    @HostBinding('class._label-outside')
    get legacyLabelOutside(): boolean {
        return this.size === 'm';
    }

    onActiveZone(active: boolean) {
        this.updateFocused(active);
    }

    incrementByStep(event: KeyboardEvent, right: boolean) {
        if (this.readOnly) {
            return;
        }

        event.preventDefault();
        this.processStep(true, right);
    }

    decrementByStep(event: KeyboardEvent, right: boolean) {
        if (this.readOnly) {
            return;
        }

        event.preventDefault();
        this.processStep(false, right);
    }

    onInputLeft(value: number | null) {
        this.safelyUpdateValue([value ?? this.safeCurrentValue[0], this.value[1]]);
    }

    onInputRight(value: number | null) {
        this.safelyUpdateValue([this.value[0], value ?? this.safeCurrentValue[1]]);
    }

    onRangeValue([left, right]: [number, number]) {
        this.rangeRef?.nativeFocusableElement?.focus();

        const isLeftValueChanged = left !== this.value[0];
        const isRightValueChanged = right !== this.value[1];

        if (isLeftValueChanged || isRightValueChanged) {
            this.lastActiveSide = isLeftValueChanged ? 'left' : 'right';
        }

        this.safelyUpdateValue([left, right]);
    }

    focusToTextInput() {
        const element =
            this.lastActiveSide === 'left'
                ? this.leftFocusableElement
                : this.rightFocusableElement;

        if (!this.isMobile && element) {
            setNativeFocused(element);
        }
    }

    protected getFallbackValue(): [number, number] {
        return [0, 0];
    }

    private safelyUpdateValue([leftValue, rightValue]: [number, number]) {
        const leftGuardedValue = this.valueGuard(leftValue);
        const rightGuardedValue = this.valueGuard(rightValue);

        const leftSafeValue = Math.min(leftGuardedValue, rightGuardedValue);
        const rightSafeValue = Math.max(leftGuardedValue, rightGuardedValue);

        this.updateValue([leftSafeValue, rightSafeValue]);
    }

    private processStep(increment: boolean, right: boolean) {
        const start = this.valueGuard(
            increment ? this.value[0] + this.step : this.value[0] - this.step,
        );
        const end = this.valueGuard(
            increment ? this.value[1] + this.step : this.value[1] - this.step,
        );
        const value: [number, number] = [
            right ? this.value[0] : Math.min(start, this.value[1]),
            right ? Math.max(end, this.value[0]) : this.value[1],
        ];

        if (value[0] !== this.value[0] || value[1] !== this.value[1]) {
            this.safelyUpdateValue(value);
            this.updateTextInputValue(right ? value[1] : value[0], right);
        }
    }

    private updateTextInputValue(value: number, right: boolean) {
        const [leftInputRef, rightInputRef] = this.inputNumberRefs;
        const textInputRef = right ? rightInputRef : leftInputRef;

        if (textInputRef) {
            textInputRef.nativeValue = textInputRef.getFormattedValue(value);
        }
    }
}

@Directive({
    selector: '[tuiTextfieldNoneAppearance]',
    providers: [
        {
            provide: TUI_TEXTFIELD_APPEARANCE,
            useValue: 'Not existing appearance to prevent any customization',
        },
    ],
})
export class TuiTextfieldNoneAppearanceDirective {}
