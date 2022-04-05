import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ContentChild,
    EventEmitter,
    Inject,
    Input,
    Optional,
    Output,
    Self,
    TemplateRef,
    ViewChild,
} from '@angular/core';
import {NgControl} from '@angular/forms';
import {
    AbstractTuiControl,
    getClipboardDataText,
    isNativeFocused,
    setNativeFocused,
    TuiActiveZoneDirective,
    TuiContextWithImplicit,
    tuiDefaultProp,
    TuiFocusableElementAccessor,
    TuiInputModeT,
    tuiRequiredSetter,
} from '@taiga-ui/cdk';
import {
    formatPhone,
    TUI_MASK_SYMBOLS_REGEXP,
    TUI_TEXTFIELD_CLEANER,
    TuiDataListDirective,
    TuiDataListHost,
    TuiHostedDropdownComponent,
    TuiPrimitiveTextfieldComponent,
    TuiTextfieldCleanerDirective,
    TuiTextMaskOptions,
} from '@taiga-ui/core';
import {TextMaskConfig} from 'angular2-text-mask';
import {Observable} from 'rxjs';

import {INPUT_PHONE_PROVIDERS, SELECTION_STREAM} from './input-phone.providers';

// @dynamic
@Component({
    selector: 'tui-input-phone',
    templateUrl: './input-phone.template.html',
    styleUrls: ['./input-phone.style.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: INPUT_PHONE_PROVIDERS,
})
export class TuiInputPhoneComponent
    extends AbstractTuiControl<string>
    implements TuiFocusableElementAccessor, TuiDataListHost<string>
{
    @ViewChild(TuiHostedDropdownComponent)
    private readonly dropdown?: TuiHostedDropdownComponent;

    @ViewChild(TuiPrimitiveTextfieldComponent)
    private readonly textfield?: TuiPrimitiveTextfieldComponent;

    @Input('countryCode')
    @tuiRequiredSetter()
    set countryCodeSetter(countryCode: string) {
        this.updateValueWithNewCountryCode(countryCode);
        this.countryCode = countryCode;
    }

    @Input()
    @tuiDefaultProp()
    phoneMaskAfterCountryCode = '(###) ###-##-##';

    @Input()
    @tuiDefaultProp()
    allowText = false;

    @Input()
    @tuiDefaultProp()
    search = '';

    @Output()
    readonly searchChange = new EventEmitter<string>();

    @ContentChild(TuiDataListDirective, {read: TemplateRef})
    readonly datalist?: TemplateRef<TuiContextWithImplicit<TuiActiveZoneDirective>>;

    readonly textMaskOptions: TextMaskConfig = {
        mask: value =>
            this.allowText && !this.value && isText(value) && value !== '+'
                ? false
                : [
                      ...this.countryCode.split(''),
                      ' ',
                      ...this.phoneMaskAfterCountryCode
                          .replace(/[^#\- ()]+/g, '')
                          .split('')
                          .map(item => (item === '#' ? /\d/ : item)),
                  ],
        pipe: value => {
            if (this.allowText) {
                return value;
            }

            return value === '' && this.focused && !this.readOnly
                ? `${this.countryCode} `
                : value.replace(/-$/, '');
        },
        guide: false,
    } as TuiTextMaskOptions as unknown as TextMaskConfig;

    countryCode = '+7';

    open = false;

    constructor(
        @Optional()
        @Self()
        @Inject(NgControl)
        control: NgControl | null,
        @Inject(ChangeDetectorRef) changeDetectorRef: ChangeDetectorRef,
        @Inject(SELECTION_STREAM)
        selection$: Observable<unknown>,
        @Inject(TUI_TEXTFIELD_CLEANER)
        private readonly textfieldCleaner: TuiTextfieldCleanerDirective,
    ) {
        super(control, changeDetectorRef);

        selection$.subscribe(() => {
            this.setCaretPosition();
        });
    }

    get nativeFocusableElement(): HTMLInputElement | null {
        return !this.textfield || this.computedDisabled
            ? null
            : this.textfield.nativeFocusableElement;
    }

    get focused(): boolean {
        return (
            isNativeFocused(this.nativeFocusableElement) ||
            (!!this.dropdown && this.dropdown.focused)
        );
    }

    get computedValue(): string {
        return this.value
            ? formatPhone(this.value, this.countryCode, this.phoneMaskAfterCountryCode)
            : this.search || '';
    }

    get inputMode(): TuiInputModeT {
        return this.allowText ? 'text' : 'numeric';
    }

    get canOpen(): boolean {
        return this.interactive && !!this.datalist;
    }

    get canClean(): boolean {
        return this.computedValue !== this.countryCode && this.textfieldCleaner.cleaner;
    }

    onHovered(hovered: boolean) {
        this.updateHovered(hovered);
    }

    onDrop(event: DragEvent) {
        if (!event.dataTransfer) {
            return;
        }

        this.setValueWithoutPrefix(event.dataTransfer.getData('text'));
        event.preventDefault();
    }

    onPaste(event: Event | ClipboardEvent) {
        this.setValueWithoutPrefix(getClipboardDataText(event as ClipboardEvent));
    }

    onActiveZone(active: boolean) {
        this.updateFocused(active);

        if (active && !this.computedValue && !this.readOnly && !this.allowText) {
            this.updateSearch(this.countryCode);

            return;
        }

        if (
            this.computedValue === this.countryCode ||
            (this.search !== null &&
                isNaN(parseInt(this.search.replace(TUI_MASK_SYMBOLS_REGEXP, ''), 10)))
        ) {
            this.updateSearch('');
        }
    }

    onBackspace(event: Event | KeyboardEvent) {
        const target = event.target as HTMLInputElement;

        if (
            (target.selectionStart || 0) <= this.nonRemovableLength &&
            target.selectionStart === target.selectionEnd
        ) {
            event.preventDefault();
        }
    }

    onValueChange(value: string) {
        value = value === '' ? this.countryCode : value;

        const parsed = isText(value) ? value : value.replace(TUI_MASK_SYMBOLS_REGEXP, '');

        this.updateSearch(parsed);
        this.updateValue(parsed === this.countryCode || isText(parsed) ? '' : parsed);
        this.open = true;
    }

    handleOption(item: string) {
        this.focusInput();
        this.updateValue(item);
        this.updateSearch('');
        this.open = false;
    }

    setDisabledState() {
        super.setDisabledState();
        this.open = false;
    }

    writeValue(value: string | null) {
        super.writeValue(value);
        this.updateSearch('');
    }

    protected getFallbackValue(): string {
        return '';
    }

    private get caretIsInForbiddenArea(): boolean {
        const {nativeFocusableElement} = this;

        if (!nativeFocusableElement) {
            return false;
        }

        const {selectionStart, selectionEnd} = nativeFocusableElement;

        return (
            isNativeFocused(nativeFocusableElement) &&
            selectionStart !== null &&
            selectionStart < this.nonRemovableLength &&
            selectionStart === selectionEnd
        );
    }

    private get nonRemovableLength(): number {
        return this.isTextValue ? 0 : this.countryCode.length + 1;
    }

    private get maxPhoneLength(): number {
        return (
            this.countryCode.length +
            this.phoneMaskAfterCountryCode.replace(/[^#]+/g, '').length
        );
    }

    private get isTextValue(): boolean {
        return !!this.search && isText(this.search);
    }

    private setCaretPosition() {
        if (this.caretIsInForbiddenArea && !!this.nativeFocusableElement) {
            this.nativeFocusableElement.setSelectionRange(
                this.nonRemovableLength,
                this.nonRemovableLength,
            );
        }
    }

    private setValueWithoutPrefix(value: string) {
        if (this.readOnly) {
            return;
        }

        this.open = true;
        this.updateValue(this.cleanValue(value));
        this.updateSearch(
            this.allowText && isText(value)
                ? value
                : value.replace(TUI_MASK_SYMBOLS_REGEXP, ''),
        );
    }

    private cleanValue(value: string): string {
        const reg: RegExp =
            this.countryCode === '+7'
                ? /^7|^8/
                : new RegExp(this.countryCode.substring(1));
        const oldValueExist =
            this.value.length > this.countryCode.length &&
            this.value.length < this.maxPhoneLength;
        const newValueLength = value.replace(TUI_MASK_SYMBOLS_REGEXP, '').length;
        const cleanNewValue = value.replace(/[^0-9]+/g, '');
        const selectionLength = String(getSelection()).length;

        if (oldValueExist && selectionLength === 0) {
            return `${this.value}${cleanNewValue}`.slice(0, this.maxPhoneLength);
        }

        if (newValueLength < this.maxPhoneLength - 1) {
            return `${this.countryCode}${cleanNewValue}`.slice(0, this.maxPhoneLength);
        }

        return `${this.countryCode}${cleanNewValue.replace(reg, '')}`.slice(
            0,
            this.maxPhoneLength,
        );
    }

    private focusInput() {
        if (this.nativeFocusableElement) {
            setNativeFocused(this.nativeFocusableElement, true, true);
        }
    }

    private updateSearch(search: string) {
        if (this.search === search) {
            return;
        }

        this.search = search;
        this.searchChange.emit(search);
    }

    private updateValueWithNewCountryCode(newCountryCode: string) {
        if (!this.isTextValue) {
            this.updateValue(this.value.replace(this.countryCode, newCountryCode));
        }
    }
}

function isText(value: string): boolean {
    return isNaN(parseInt(value.replace(TUI_MASK_SYMBOLS_REGEXP, ''), 10));
}
