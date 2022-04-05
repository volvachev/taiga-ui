import {Component} from '@angular/core';
import {FormControl} from '@angular/forms';
import {changeDetection} from '@demo/emulate/change-detection';
import {encapsulation} from '@demo/emulate/encapsulation';
import {TuiFileLike} from '@taiga-ui/kit';
import {Subject} from 'rxjs';

@Component({
    selector: 'tui-input-files-example-1',
    templateUrl: './index.html',
    changeDetection,
    encapsulation,
})
export class TuiInputFilesExample1 {
    readonly control = new FormControl();
    readonly rejectedFiles$: Subject<TuiFileLike | null> = new Subject();

    onReject(file: TuiFileLike | readonly TuiFileLike[]) {
        this.rejectedFiles$.next(file as TuiFileLike);
    }

    removeFile() {
        this.control.setValue(null);
    }

    clearRejected() {
        this.rejectedFiles$.next(null);
    }
}
