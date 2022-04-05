import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ContentChild,
    Inject,
    Input,
    Optional,
    Self,
    TemplateRef,
    ViewChild,
} from '@angular/core';
import {NgControl} from '@angular/forms';
import {
    AbstractTuiControl,
    isNativeFocused,
    setNativeFocused,
    TuiActiveZoneDirective,
    TuiContextWithImplicit,
    tuiDefaultProp,
    TuiFocusableElementAccessor,
} from '@taiga-ui/cdk';
import {
    TuiDataListDirective,
    TuiDataListHost,
    TuiHorizontalDirection,
    TuiHostedDropdownComponent,
    TuiPrimitiveTextfieldComponent,
} from '@taiga-ui/core';
import {PolymorpheusContent} from '@tinkoff/ng-polymorpheus';

import {TUI_INPUT_PROVIDERS} from './input.providers';

@Component({
    selector: 'tui-input',
    templateUrl: './input.template.html',
    styleUrls: ['./input.style.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: TUI_INPUT_PROVIDERS,
})
export class TuiInputComponent
    extends AbstractTuiControl<string>
    implements TuiFocusableElementAccessor, TuiDataListHost<string>
{
    @ViewChild(TuiHostedDropdownComponent)
    private readonly hostedDropdown?: TuiHostedDropdownComponent;

    @ViewChild(TuiPrimitiveTextfieldComponent)
    private readonly textfield?: TuiPrimitiveTextfieldComponent;

    @Input()
    @tuiDefaultProp()
    icon: string | null = null;

    @Input()
    @tuiDefaultProp()
    iconAlign: TuiHorizontalDirection = 'left';

    @ContentChild(TuiDataListDirective, {read: TemplateRef})
    readonly datalist: PolymorpheusContent<
        TuiContextWithImplicit<TuiActiveZoneDirective> | Record<any, any>
    > = '';

    open = false;

    constructor(
        @Optional()
        @Self()
        @Inject(NgControl)
        control: NgControl | null,
        @Inject(ChangeDetectorRef) changeDetectorRef: ChangeDetectorRef,
    ) {
        super(control, changeDetectorRef);
    }

    get nativeFocusableElement(): HTMLInputElement | null {
        return this.computedDisabled || !this.textfield
            ? null
            : this.textfield.nativeFocusableElement;
    }

    get focused(): boolean {
        return (
            isNativeFocused(this.nativeFocusableElement) ||
            (!!this.hostedDropdown && this.hostedDropdown.focused)
        );
    }

    get canOpen(): boolean {
        return this.interactive && !!this.datalist;
    }

    onValueChange(value: string) {
        this.updateValue(value);
        this.open = true;
    }

    onHovered(hovered: boolean) {
        this.updateHovered(hovered);
    }

    onActiveZone(active: boolean) {
        this.updateFocused(active);
    }

    handleOption(item: unknown) {
        this.setNativeValue(String(item));
        this.focusInput();
        this.updateValue(String(item));
        this.open = false;
    }

    protected getFallbackValue(): string {
        return '';
    }

    private focusInput(preventScroll: boolean = false) {
        if (this.nativeFocusableElement) {
            setNativeFocused(this.nativeFocusableElement, true, preventScroll);
        }
    }

    private setNativeValue(value: string) {
        if (this.nativeFocusableElement) {
            this.nativeFocusableElement.value = value;
        }
    }
}
