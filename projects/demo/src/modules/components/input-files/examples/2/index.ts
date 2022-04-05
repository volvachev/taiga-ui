import {Component} from '@angular/core';
import {FormControl} from '@angular/forms';
import {changeDetection} from '@demo/emulate/change-detection';
import {encapsulation} from '@demo/emulate/encapsulation';
import {TuiFileLike} from '@taiga-ui/kit';

@Component({
    selector: 'tui-input-files-example-2',
    templateUrl: './index.html',
    changeDetection,
    encapsulation,
})
export class TuiInputFilesExample2 {
    readonly control = new FormControl([]);
    rejectedFiles: readonly TuiFileLike[] = [];

    onReject(files: TuiFileLike | readonly TuiFileLike[]) {
        this.rejectedFiles = [...this.rejectedFiles, ...(files as TuiFileLike[])];
    }

    removeFile({name}: File) {
        this.control.setValue(
            this.control.value.filter((current: File) => current.name !== name),
        );
    }

    clearRejected({name}: TuiFileLike) {
        this.rejectedFiles = this.rejectedFiles.filter(
            rejected => rejected.name !== name,
        );
    }
}
