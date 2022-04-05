import {isPlatformBrowser, Location} from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ContentChild,
    ElementRef,
    forwardRef,
    HostListener,
    Inject,
    Input,
    OnInit,
    PLATFORM_ID,
    Renderer2,
    TemplateRef,
    ViewChild,
} from '@angular/core';
import {AbstractControl, FormControl, FormGroup} from '@angular/forms';
import {UrlSerializer} from '@angular/router';
import {px, TUI_IS_MOBILE, TuiDestroyService} from '@taiga-ui/cdk';
import {TuiBrightness, TuiModeDirective} from '@taiga-ui/core';
import {Subject} from 'rxjs';
import {startWith, takeUntil} from 'rxjs/operators';

import {TUI_DOC_DEMO_TEXTS} from '../../tokens/i18n';

const MIN_COMPONENT_WIDTH = 104;

// @dynamic
@Component({
    selector: 'tui-doc-demo',
    templateUrl: './demo.template.html',
    styleUrls: ['./demo.style.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        TuiDestroyService,
        {
            provide: TuiModeDirective,
            useExisting: forwardRef(() => TuiDocDemoComponent),
        },
    ],
})
export class TuiDocDemoComponent implements OnInit, AfterViewInit {
    @ViewChild('content')
    private readonly content?: ElementRef<HTMLElement>;

    @ViewChild('wrapper')
    private readonly wrapper?: ElementRef<HTMLElement>;

    @ViewChild('resizerText')
    private readonly resizerText?: ElementRef<HTMLElement>;

    private readonly isBrowser: boolean;
    private initialX = 0;
    private wrapperWidth = 0;

    @Input()
    control: AbstractControl | null = null;

    @ContentChild(TemplateRef)
    readonly template: TemplateRef<{}> | null = null;

    testForm?: FormGroup;
    updateOnVariants = ['change', 'blur', 'submit'];
    updateOn: 'change' | 'blur' | 'submit' = 'change';
    expanded = false;
    opaque = true;
    modeControl = new FormControl();
    mode: TuiBrightness | null = null;
    readonly change$ = new Subject<void>();
    readonly items: readonly TuiBrightness[] = ['onLight', 'onDark'];

    constructor(
        @Inject(TUI_IS_MOBILE) readonly isMobile: boolean,
        @Inject(TuiDestroyService) private readonly destroy$: TuiDestroyService,
        @Inject(Renderer2) private readonly renderer: Renderer2,
        @Inject(PLATFORM_ID) platformId: Object,
        @Inject(Location) locationRef: Location,
        @Inject(UrlSerializer) urlSerializer: UrlSerializer,
        @Inject(TUI_DOC_DEMO_TEXTS) readonly texts: [string, string, string],
    ) {
        this.isBrowser = isPlatformBrowser(platformId);

        const parsedMode = locationRef.path().match(/tuiMode=(onDark|onLight)/);

        if (parsedMode !== null && parsedMode.length > 0) {
            this.modeControl.setValue(parsedMode[1]);
        }

        this.modeControl.valueChanges
            .pipe(startWith(this.modeControl.value), takeUntil(this.destroy$))
            .subscribe(mode => {
                const urlTree = urlSerializer.parse(locationRef.path());

                urlTree.queryParams = {
                    ...urlTree.queryParams,
                    tuiMode: mode,
                };

                locationRef.go(String(urlTree));

                this.mode = mode;
                this.change$.next();
            });
    }

    @HostListener('window:resize')
    onResize() {
        this.setResizerTextContent();
    }

    ngOnInit() {
        this.createForm();
    }

    ngAfterViewInit() {
        this.setResizerTextContent();
    }

    setResizerTextContent() {
        if (!this.content || !this.resizerText) {
            return;
        }

        const paddingLeft = this.isBrowser
            ? getComputedStyle(this.content.nativeElement).paddingLeft
            : '0';
        const {offsetWidth} = this.content.nativeElement;

        this.resizerText.nativeElement.textContent = String(
            offsetWidth - parseInt(paddingLeft || '0', 10) * 2,
        );
    }

    onDragStart(event: MouseEvent) {
        event.preventDefault();
        this.initialX = event.clientX;
        this.wrapperWidth = this.wrapper ? this.wrapper.nativeElement.offsetWidth : 0;
    }

    onDragContinues(event: MouseEvent) {
        const deltaX = this.initialX - event.clientX;

        this.resizeContent(deltaX);
        this.setResizerTextContent();
    }

    onDragEnd() {
        this.wrapperWidth = this.wrapper ? this.wrapper.nativeElement.offsetWidth : 0;
    }

    toggleDetails() {
        this.expanded = !this.expanded;
    }

    updateOnChange(updateOn: 'change' | 'blur' | 'submit') {
        this.updateOn = updateOn;
        this.createForm();
    }

    private createForm() {
        const {control, updateOn} = this;

        if (!control) {
            return;
        }

        this.testForm = new FormGroup({testValue: control}, {updateOn});
    }

    private resizeContent(delta: number) {
        if (!this.wrapper) {
            return;
        }

        this.renderer.setStyle(
            this.wrapper.nativeElement,
            'width',
            px(Math.max(this.wrapperWidth - delta, MIN_COMPONENT_WIDTH)),
        );
    }
}
