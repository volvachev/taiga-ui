import {Component} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {changeDetection} from '@demo/emulate/change-detection';
import {encapsulation} from '@demo/emulate/encapsulation';
import {TuiButton, TuiTextfield} from '@taiga-ui/core';
import {TuiTextarea, TuiTextareaLimit} from '@taiga-ui/kit';

@Component({
    standalone: true,
    imports: [
        ReactiveFormsModule,
        TuiButton,
        TuiTextarea,
        TuiTextareaLimit,
        TuiTextfield,
    ],
    templateUrl: './index.html',
    encapsulation,
    changeDetection,
})
export default class Example {
    protected control = new FormControl(
        'Adding [limit] directive allows you to display a counter of symbols inside the textarea, highlight excessive characters in red and also automatically add Validators.maxlength(x) validator',
    );

    constructor() {
        this.control.markAsTouched();
    }
}
