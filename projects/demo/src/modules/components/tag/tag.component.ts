import {Component, TemplateRef, ViewChild} from '@angular/core';
import {changeDetection} from '@demo/emulate/change-detection';
import {RawLoaderContent, TuiDocExample} from '@taiga-ui/addon-doc';
import {TuiSizeL, TuiSizeS} from '@taiga-ui/core';
import {TuiStatusT} from '@taiga-ui/kit';
import {PolymorpheusContent} from '@tinkoff/ng-polymorpheus';

@Component({
    selector: 'example-tag',
    templateUrl: './tag.template.html',
    styleUrls: ['./tag.style.less'],
    changeDetection,
})
export class ExampleTuiTagComponent {
    @ViewChild('errorIcon')
    errorTemplate?: TemplateRef<{}>;

    readonly exampleOptions: RawLoaderContent = import(
        '!!raw-loader!./examples/import/define-options.md'
    );

    readonly exampleModule: RawLoaderContent = import(
        '!!raw-loader!./examples/import/import-module.md'
    );

    readonly exampleHtml: RawLoaderContent = import(
        '!!raw-loader!./examples/import/insert-template.md'
    );

    readonly example1: TuiDocExample = {
        TypeScript: import('!!raw-loader!./examples/1/index.ts'),
        HTML: import('!!raw-loader!./examples/1/index.html'),
    };

    readonly example2: TuiDocExample = {
        TypeScript: import('!!raw-loader!./examples/2/index.ts'),
        HTML: import('!!raw-loader!./examples/2/index.html'),
        LESS: import('!!raw-loader!./examples/2/index.less'),
    };

    readonly example3: TuiDocExample = {
        TypeScript: import('!!raw-loader!./examples/3/index.ts'),
        HTML: import('!!raw-loader!./examples/3/index.html'),
        LESS: import('!!raw-loader!./examples/3/index.less'),
    };

    readonly example4: TuiDocExample = {
        TypeScript: import('!!raw-loader!./examples/4/index.ts'),
        HTML: import('!!raw-loader!./examples/4/index.html'),
        LESS: import('!!raw-loader!./examples/4/index.less'),
    };

    readonly example5: TuiDocExample = {
        TypeScript: import('!!raw-loader!./examples/5/index.ts'),
        HTML: import('!!raw-loader!./examples/5/index.html'),
    };

    removable = false;

    disabled = false;

    editable = false;

    autoColor = false;

    hoverable = false;

    showLoader = false;

    value = 'John Cleese';

    maxLengthVariants: number[] = [10, 20];

    maxLength: number | null = null;

    readonly statusVariants: readonly TuiStatusT[] = [
        'default',
        'primary',
        'custom',
        'success',
        'error',
        'warning',
    ];

    status = this.statusVariants[0];

    readonly sizeVariants: ReadonlyArray<TuiSizeS | TuiSizeL> = ['s', 'm', 'l'];

    size: TuiSizeS | TuiSizeL = this.sizeVariants[1];

    readonly leftContentVariants = ['', 'Error icon'];

    leftContentSelected = '';

    get leftContent(): PolymorpheusContent {
        return this.errorTemplate && this.leftContentSelected !== null
            ? this.errorTemplate
            : '';
    }

    editTag(value: string) {
        this.value = value;
    }
}
