import {
    ChangeDetectionStrategy,
    Component,
    DoCheck,
    Inject,
    Input,
    Optional,
    ViewChild,
} from '@angular/core';
import {TuiHandler} from '@taiga-ui/cdk';
import {PolymorpheusContent} from '@tinkoff/ng-polymorpheus';
import {Observable, Subject} from 'rxjs';
import {distinctUntilChanged, map, startWith} from 'rxjs/operators';

import {TuiTreeChildrenDirective} from '../../directives/tree-children.directive';
import {TuiTreeContext} from '../../misc/tree.interfaces';
import {TUI_TREE_NODE} from '../../misc/tree.tokens';
import {TuiTreeItemComponent} from '../tree-item/tree-item.component';

@Component({
    selector: 'tui-tree[value]',
    templateUrl: 'tree.template.html',
    styleUrls: ['tree.style.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: TUI_TREE_NODE,
            useExisting: TuiTreeComponent,
        },
    ],
    host: {
        role: 'tree',
    },
})
export class TuiTreeComponent<T> implements DoCheck {
    private readonly check$ = new Subject<void>();

    @Input()
    declare value: T | readonly T[];

    @ViewChild(TuiTreeItemComponent)
    readonly item?: TuiTreeItemComponent;

    @ViewChild(TuiTreeComponent)
    readonly child?: TuiTreeComponent<T>;

    readonly children$: Observable<readonly T[]> = this.check$.pipe(
        startWith(null),
        map(() => this.handler(this.value as T)),
        distinctUntilChanged(),
    );

    constructor(
        @Optional()
        @Inject(TuiTreeChildrenDirective)
        readonly directive: TuiTreeChildrenDirective<T> | null,
    ) {}

    @Input()
    content: PolymorpheusContent<TuiTreeContext<T | readonly T[]>> = ({$implicit}) =>
        String($implicit);

    ngDoCheck() {
        this.check$.next();
        this.item?.ngDoCheck();
        this.child?.ngDoCheck();
    }

    private get handler(): TuiHandler<T, readonly T[]> {
        return this.directive?.childrenHandler ?? TuiTreeChildrenDirective.defaultHandler;
    }
}
