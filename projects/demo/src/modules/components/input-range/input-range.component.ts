import {Component, forwardRef} from '@angular/core';
import {FormControl} from '@angular/forms';
import {changeDetection} from '@demo/emulate/change-detection';
import {TuiDocExample} from '@taiga-ui/addon-doc';
import {TuiPluralize, TuiSizeL} from '@taiga-ui/core';
import {TuiKeySteps} from '@taiga-ui/kit';

import {AbstractExampleTuiControl} from '../abstract/control';
import {ABSTRACT_PROPS_ACCESSOR} from '../abstract/inherited-documentation/abstract-props-accessor';

@Component({
    selector: 'example-tui-input-range',
    templateUrl: './input-range.template.html',
    changeDetection,
    providers: [
        {
            provide: ABSTRACT_PROPS_ACCESSOR,
            useExisting: forwardRef(() => ExampleTuiInputRangeComponent),
        },
    ],
})
export class ExampleTuiInputRangeComponent extends AbstractExampleTuiControl {
    readonly exampleModule = import('!!raw-loader!./examples/import/import-module.txt');
    readonly exampleHtml = import('!!raw-loader!./examples/import/insert-template.txt');

    readonly example1: TuiDocExample = {
        TypeScript: import('!!raw-loader!./examples/1/index.html'),
        HTML: import('!!raw-loader!./examples/1/index.html'),
        LESS: import('!!raw-loader!./examples/1/index.less'),
    };

    readonly example2: TuiDocExample = {
        TypeScript: import('!!raw-loader!./examples/2/index.ts'),
        HTML: import('!!raw-loader!./examples/2/index.html'),
        LESS: import('!!raw-loader!./examples/2/index.less'),
    };

    control = new FormControl();

    minVariants: readonly number[] = [0, 5, 7.77, -10];

    min = this.minVariants[0];

    maxVariants: readonly number[] = [10, 100, 10000];

    max = this.maxVariants[0];

    segmentsVariants: readonly number[] = [0, 1, 5, 13];

    segments = this.segmentsVariants[0];

    stepsVariants: readonly number[] = [0, 4, 10];

    steps = this.stepsVariants[0];

    quantumVariants: readonly number[] = [1, 0.001, 10, 100];

    quantum = this.quantumVariants[0];

    sizeVariants: readonly TuiSizeL[] = ['m', 'l'];

    size = this.sizeVariants[1];

    readonly pluralizeVariants: ReadonlyArray<TuiPluralize | Record<string, string>> = [
        ['year', 'years', 'years'],
        {one: 'thing', few: 'things', many: 'things', other: 'things'},
        {
            one: 'year',
            other: 'years',
        },
    ];

    pluralize: TuiPluralize | Record<string, string> | null = null;

    segmentsPluralize: Record<string, string> | TuiPluralize | null = null;

    minLabelVariants: readonly string[] = ['', 'Nothing'];

    minLabel = this.minLabelVariants[0];

    maxLabelVariants: readonly string[] = ['', 'Everything'];

    maxLabel = this.maxLabelVariants[0];

    keyStepsVariants: readonly TuiKeySteps[] = [[[50, 1000]]];

    keySteps: TuiKeySteps | null = null;
}
