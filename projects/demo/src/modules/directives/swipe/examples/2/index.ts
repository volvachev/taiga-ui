import {Component} from '@angular/core';
import {changeDetection} from '@demo/emulate/change-detection';
import {encapsulation} from '@demo/emulate/encapsulation';
import {TuiSwipe} from '@taiga-ui/cdk';
import {Subject} from 'rxjs';

@Component({
    selector: 'tui-swipe-example-2',
    templateUrl: './index.html',
    styleUrls: ['./index.less'],
    changeDetection,
    encapsulation,
})
export class TuiSwipeExample2 {
    readonly open$: Subject<boolean> = new Subject();

    toggle(open: boolean) {
        this.open$.next(open);
    }

    onSwipe(swipe: TuiSwipe) {
        console.info(swipe.direction);

        if (swipe.direction === 'left') {
            this.toggle(true);
        }

        if (swipe.direction === 'right') {
            this.toggle(false);
        }
    }
}
