import {Component, forwardRef, Inject} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {changeDetection} from '@demo/emulate/change-detection';
import {TuiCodeCVCLength, tuiCreateLuhnValidator} from '@taiga-ui/addon-commerce';
import {TuiDocExample} from '@taiga-ui/addon-doc';
import {TuiHintOptions, TuiNotificationsService} from '@taiga-ui/core';

import {AbstractExampleTuiControl} from '../abstract/control';
import {ABSTRACT_PROPS_ACCESSOR} from '../abstract/inherited-documentation/abstract-props-accessor';

@Component({
    selector: 'example-input-card',
    templateUrl: './input-card.template.html',
    styleUrls: ['./input-card.style.less'],
    changeDetection,
    providers: [
        {
            provide: ABSTRACT_PROPS_ACCESSOR,
            useExisting: forwardRef(() => ExampleTuiInputCardComponent),
        },
    ],
})
export class ExampleTuiInputCardComponent extends AbstractExampleTuiControl {
    readonly exampleModule = import('!!raw-loader!./examples/import/import-module.txt');
    readonly exampleHtml = import('!!raw-loader!./examples/import/insert-template.txt');

    readonly example1: TuiDocExample = {
        TypeScript: import('!!raw-loader!./examples/1/index.ts'),
        HTML: import('!!raw-loader!./examples/1/index.html'),
    };

    card = '';

    readonly lengthVariants: TuiCodeCVCLength[] = [3, 4];

    length = this.lengthVariants[0];

    cleaner = false;

    exampleText = '0000 0000 0000 0000';

    hintContentCVC = null;

    hintDirectionCVC: TuiHintOptions['direction'] = 'bottom-left';

    hintModeCVC = null;

    readonly cards = {
        common: 'https://ng-web-apis.github.io/dist/assets/images/common.svg',
        universal: 'https://ng-web-apis.github.io/dist/assets/images/universal.svg',
        intersection:
            'https://ng-web-apis.github.io/dist/assets/images/intersection-observer.svg',
        mutation:
            'https://ng-web-apis.github.io/dist/assets/images/mutation-observer.svg',
    };

    cardSrcVariants = Object.keys(this.cards);

    cardSrcSelected: string | null = null;

    autocompleteEnabledCard = false;

    autocompleteEnabledCVC = false;

    autocompleteEnabledExpire = false;

    control = new FormGroup({
        card: new FormControl('', [
            Validators.required,
            tuiCreateLuhnValidator('Invalid card number'),
        ]),
        expire: new FormControl('', Validators.required),
        cvc: new FormControl('', Validators.required),
    });

    constructor(
        @Inject(TuiNotificationsService)
        private readonly notifications: TuiNotificationsService,
    ) {
        super();
    }

    get cardSrc(): string | null {
        return this.cardSrcSelected === null
            ? null
            : (this.cards as any)[this.cardSrcSelected];
    }

    get disabledCard(): boolean {
        return this.isDisabled('card');
    }

    set disabledCard(value: boolean) {
        this.toggleDisabled(value, 'card');
    }

    get disabledExpire(): boolean {
        return this.isDisabled('expire');
    }

    set disabledExpire(value: boolean) {
        this.toggleDisabled(value, 'expire');
    }

    get disabledCVC(): boolean {
        return this.isDisabled('cvc');
    }

    set disabledCVC(value: boolean) {
        this.toggleDisabled(value, 'cvc');
    }

    isDisabled(control: string): boolean {
        return this.control.get(control)!.disabled;
    }

    toggleDisabled(value: boolean, control: string) {
        if (value) {
            this.control.get(control)!.disable();

            return;
        }

        this.control.get(control)!.enable();
    }

    onBinChange(bin: string | null) {
        this.notifications.show(`bin: ${bin}`).subscribe();
    }
}
