import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    Inject,
    Input,
} from '@angular/core';
import {TUI_PREVIEW_TEXTS} from '@taiga-ui/addon-preview/tokens';
import {
    clamp,
    dragAndDropFrom,
    px,
    round,
    tuiDefaultProp,
    TuiDestroyService,
    TuiDragStage,
    TuiZoom,
    typedFromEvent,
} from '@taiga-ui/cdk';
import {tuiSlideInTop} from '@taiga-ui/core';
import {LanguagePreview} from '@taiga-ui/i18n';
import {BehaviorSubject, combineLatest, merge, Observable} from 'rxjs';
import {map, mapTo, startWith} from 'rxjs/operators';

const INITIAL_SCALE_COEF = 0.8;
const EMPTY_COORDINATES: [number, number] = [0, 0];
const ROTATION_ANGLE = 90;

@Component({
    selector: 'tui-preview',
    templateUrl: './preview.template.html',
    styleUrls: ['./preview.style.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [tuiSlideInTop],
    providers: [TuiDestroyService],
})
export class TuiPreviewComponent {
    @Input()
    @tuiDefaultProp()
    zoomable = true;

    @Input()
    @tuiDefaultProp()
    rotatable = false;

    minZoom = 1;

    width = 0;
    height = 0;

    readonly zoom$ = new BehaviorSubject<number>(this.minZoom);
    readonly rotation$ = new BehaviorSubject<number>(0);
    readonly coordinates$ = new BehaviorSubject<readonly [number, number]>(
        EMPTY_COORDINATES,
    );

    readonly transitioned$ = merge(
        dragAndDropFrom(this.elementRef.nativeElement).pipe(
            map(({stage}) => stage !== TuiDragStage.Continues),
        ),
        typedFromEvent(this.elementRef.nativeElement, 'touchmove', {passive: true}).pipe(
            mapTo(false),
        ),
        typedFromEvent(this.elementRef.nativeElement, 'wheel', {passive: true}).pipe(
            mapTo(false),
        ),
    );

    readonly cursor$ = dragAndDropFrom(this.elementRef.nativeElement).pipe(
        map(({stage}) => (stage === TuiDragStage.Continues ? 'grabbing' : 'initial')),
        startWith('initial'),
    );

    readonly wrapperTransform$ = combineLatest([
        this.coordinates$.pipe(map(([x, y]) => `${px(x)}, ${px(y)}`)),
        this.zoom$,
        this.rotation$,
    ]).pipe(
        map(
            ([translate, zoom, rotation]) =>
                `translate(${translate}) scale(${zoom}) rotate(${rotation}deg)`,
        ),
    );

    constructor(
        @Inject(ElementRef) readonly elementRef: ElementRef<HTMLElement>,
        @Inject(TuiDestroyService) readonly destroy$: Observable<void>,
        @Inject(TUI_PREVIEW_TEXTS)
        readonly texts$: Observable<LanguagePreview['previewTexts']>,
    ) {}

    rotate() {
        this.rotation$.next(this.rotation$.value - ROTATION_ANGLE);
    }

    onPan(delta: [number, number] | readonly [number, number]) {
        this.coordinates$.next(
            this.getGuardedCoordinates(
                this.coordinates$.value[0] + delta[0],
                this.coordinates$.value[1] + delta[1],
            ),
        );
    }

    onMutation(contentWrapper: HTMLElement) {
        const {clientWidth, clientHeight} = contentWrapper;

        this.refresh(clientWidth, clientHeight);
    }

    onZoom({clientX, clientY, delta}: TuiZoom) {
        if (this.zoomable) {
            this.processZoom(clientX, clientY, delta);
        }
    }

    onResize(contentResizeEntries: readonly ResizeObserverEntry[]) {
        if (contentResizeEntries.length === 0) {
            return;
        }

        const {width, height} = contentResizeEntries[0].contentRect;

        this.refresh(width, height);
    }

    reset() {
        this.zoom$.next(this.minZoom);
        this.coordinates$.next(EMPTY_COORDINATES);
    }

    private get offsets(): {offsetX: number; offsetY: number} {
        const offsetX = ((this.zoom$.value - this.minZoom) * this.width) / 2;
        const offsetY = ((this.zoom$.value - this.minZoom) * this.height) / 2;

        return {offsetX, offsetY};
    }

    private calculateMinZoom(
        contentHeight: number,
        contentWidth: number,
        boxHeight: number,
        boxWidth: number,
    ): number {
        const bigSize =
            contentHeight > boxHeight * INITIAL_SCALE_COEF ||
            contentWidth > boxWidth * INITIAL_SCALE_COEF;
        const {clientHeight, clientWidth} = this.elementRef.nativeElement;

        return bigSize
            ? round(
                  Math.min(
                      (clientHeight * INITIAL_SCALE_COEF) / contentHeight,
                      (clientWidth * INITIAL_SCALE_COEF) / contentWidth,
                  ),
                  2,
              )
            : 1;
    }

    private refresh(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.minZoom = this.calculateMinZoom(
            height,
            width,
            this.elementRef.nativeElement.clientHeight,
            this.elementRef.nativeElement.clientWidth,
        );
        this.zoom$.next(this.minZoom);
        this.coordinates$.next(EMPTY_COORDINATES);
        this.rotation$.next(0);
    }

    private processZoom(clientX: number, clientY: number, delta: number) {
        const oldScale = this.zoom$.value;
        const newScale = clamp(oldScale + delta, this.minZoom, 2);

        const center = this.getScaleCenter(
            {clientX, clientY},
            this.coordinates$.value,
            this.zoom$.value,
        );

        const moveX = center[0] * oldScale - center[0] * newScale;
        const moveY = center[1] * oldScale - center[1] * newScale;

        this.zoom$.next(newScale);
        this.coordinates$.next(
            this.getGuardedCoordinates(
                this.coordinates$.value[0] + moveX,
                this.coordinates$.value[1] + moveY,
            ),
        );
    }

    private getGuardedCoordinates(x: number, y: number): readonly [number, number] {
        const {offsetX, offsetY} = this.offsets;

        return [clamp(x, -offsetX, offsetX), clamp(y, -offsetY, offsetY)];
    }

    private getScaleCenter(
        {clientX, clientY}: {clientX: number; clientY: number},
        [x, y]: readonly [number, number],
        scale: number,
    ): [number, number] {
        return [
            (clientX - x - this.elementRef.nativeElement.offsetWidth / 2) / scale,
            (clientY - y - this.elementRef.nativeElement.offsetHeight / 2) / scale,
        ];
    }
}
