import {Component, DebugElement, ViewChild} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {By} from '@angular/platform-browser';
import {CHAR_NO_BREAK_SPACE} from '@taiga-ui/cdk';
import {configureTestSuite, NativeInputPO, PageObject} from '@taiga-ui/testing';

import {TuiInputRangeComponent} from '../input-range.component';
import {TuiInputRangeModule} from '../input-range.module';

describe('InputRange', () => {
    @Component({
        template: `
            <tui-input-range
                *ngIf="default"
                max="10"
                [formControl]="control"
            ></tui-input-range>
            <tui-input-range
                *ngIf="!default"
                [formControl]="control"
                [max]="max"
                [min]="min"
                [minLabel]="minLabel"
                [maxLabel]="maxLabel"
                [pluralize]="pluralize"
                [readOnly]="readOnly"
                [steps]="steps"
                [quantum]="quantum"
            ></tui-input-range>
        `,
    })
    class TestComponent {
        @ViewChild(TuiInputRangeComponent, {static: true})
        component!: TuiInputRangeComponent;

        control = new FormControl([0, 1]);
        default = false;
        max = 10;
        min = -10;
        quantum = 5;
        readOnly = false;
        steps = 0;
        minLabel = 'Nothing';
        maxLabel = 'All';
        pluralize = ['год', 'года', 'лет'];
    }

    let fixture: ComponentFixture<TestComponent>;
    let testComponent: TestComponent;
    let pageObject: PageObject<TestComponent>;

    let leftInputWrapper: DebugElement;
    let rightInputWrapper: DebugElement;

    let inputPOLeft: NativeInputPO;
    let inputPORight: NativeInputPO;

    const testContext = {
        get prefix() {
            return 'tui-input-range__';
        },
        get nativeInputAutoId() {
            return 'tui-primitive-textfield__native-input';
        },
        get valueContentAutoId() {
            return 'tui-primitive-textfield__value';
        },
        get valueDecorationAutoId() {
            return 'tui-primitive-textfield__value-decoration';
        },
    };

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            imports: [TuiInputRangeModule, ReactiveFormsModule],
            declarations: [TestComponent],
        });
    });

    beforeEach(async () => {
        fixture = TestBed.createComponent(TestComponent);
        pageObject = new PageObject(fixture);
        testComponent = fixture.componentInstance;

        fixture.detectChanges();
        await fixture.whenStable();

        initializeInputsPO();
    });

    describe('Default values', () => {
        beforeEach(() => {
            testComponent.default = true;
            fixture.detectChanges();

            initializeInputsPO();
        });

        it('minLabel is missing', () => {
            expect(
                pageObject.getByAutomationId(`${testContext.prefix}min-label`),
            ).toBeNull();
        });

        it('maxLabel is missing', () => {
            testComponent.control.setValue([0, 10]);
            fixture.detectChanges();

            expect(
                pageObject.getByAutomationId(`${testContext.prefix}min-label`),
            ).toBeNull();
        });

        it('Plural signature missing', () => {
            expect(getLeftValueContent()).toBeNull();
            expect(getRightValueContent()).toBeNull();
        });
    });

    describe('Labels', () => {
        it('Plural signature is present', () => {
            expect(getLeftValueContent()).toBe(`0${CHAR_NO_BREAK_SPACE}лет`);
            expect(getRightValueContent()).toBe(`1${CHAR_NO_BREAK_SPACE}год`);
        });

        it('minLabel is shown', () => {
            testComponent.control.setValue([-10, 10]);
            fixture.detectChanges();

            expect(getLeftValueContent()).toBe(testComponent.minLabel);
        });

        it('minLabel missing on focus', () => {
            testComponent.control.setValue([-10, 10]);
            inputPOLeft.focus();

            expect(getLeftValueContent()).toBeNull();
            expect(getLeftValueDecoration()).toBe('0лет');
        });

        it('maxLabel is shown', () => {
            testComponent.control.setValue([-10, 10]);
            fixture.detectChanges();

            expect(getRightValueContent()).toBe(testComponent.maxLabel);
        });

        it('maxLabel missing on focus', () => {
            testComponent.control.setValue([-10, 10]);
            inputPORight.focus();

            expect(getRightValueContent()).toBeNull();
            expect(getRightValueDecoration()).toBe('лет');
        });
    });

    describe('quantum', () => {
        it('Rounds the left value to the nearest quantum on loss of focus', () => {
            inputPOLeft.sendTextAndBlur('-7');

            expect(testComponent.control.value[0]).toBe(-5);
        });

        it('Rounds the left value of an input field to the nearest quantum when focus is lost', async () => {
            inputPOLeft.sendTextAndBlur('-7');

            await fixture.whenStable();
            fixture.detectChanges();
            await fixture.whenStable();

            expect(inputPOLeft.value).toBe('-5');
        });

        it('Rounds the right value to the nearest quantum on loss of focus', () => {
            inputPORight.sendTextAndBlur('7');

            expect(testComponent.control.value[1]).toBe(5);
        });

        it('Rounds the right value of an input field to the nearest quantum on loss of focus', async () => {
            inputPORight.sendTextAndBlur('7');

            await fixture.whenStable();
            fixture.detectChanges();
            await fixture.whenStable();

            expect(inputPORight.value).toBe('5');
        });
    });

    describe('Deleting Values', () => {
        it("Doesn't change value when left content is removed", () => {
            inputPOLeft.sendTextAndBlur('-5');
            inputPOLeft.sendTextAndBlur('');

            expect(testComponent.control.value[0]).toBe(-5);
            expect(inputPOLeft.value).toBe('-5');
        });

        it("Doesn't change value when deleting right content", () => {
            inputPORight.sendTextAndBlur('5');
            inputPORight.sendTextAndBlur('');

            expect(testComponent.control.value[1]).toBe(5);
            expect(inputPORight.value).toBe('5');
        });
    });

    describe('Changing values', () => {
        it('Prevents the left value from exceeding the right value when typing', () => {
            inputPORight.sendTextAndBlur('5');
            inputPOLeft.sendTextAndBlur('123');

            expect(testComponent.control.value[0]).toBe(testComponent.control.value[1]);
            expect(inputPOLeft.value).toBe(testComponent.control.value[1].toString());
        });

        it('Prevents the right value from becoming less than the left value when leaving the field', () => {
            inputPOLeft.sendTextAndBlur('-5');
            fixture.detectChanges();

            inputPORight.sendTextAndBlur('-10');

            expect(testComponent.control.value[1]).toBe(testComponent.control.value[0]);
            expect(inputPORight.value).toBe(testComponent.control.value[0].toString());
        });
    });

    describe('Format', () => {
        beforeEach(() => {
            testComponent.max = 100000;
            testComponent.quantum = 0.01;
            fixture.detectChanges();
            inputPORight.sendTextAndBlur('12345.67');
        });

        it('Formats input', () => {
            expect(inputPORight.value).toBe(`12${CHAR_NO_BREAK_SPACE}345,67`);
        });

        it("Doesn't format the value", () => {
            expect(testComponent.control.value[1]).toBe(12345.67);
        });
    });

    describe('Arrows', () => {
        beforeEach(() => {
            testComponent.min = 0;
            testComponent.max = 10;
            testComponent.quantum = 1;
            testComponent.control.setValue([2, 6]);
            fixture.detectChanges();
        });

        describe('readOnly', () => {
            it('The up arrow on the left margin does not increase the value', () => {
                testComponent.readOnly = true;
                fixture.detectChanges();

                inputPOLeft.sendKeydown('arrowUp');

                expect(testComponent.control.value[0]).toBe(2);
            });

            it('Down arrow on left margin does not decrease value', () => {
                testComponent.readOnly = true;
                fixture.detectChanges();

                inputPOLeft.sendKeydown('arrowDown');

                expect(testComponent.control.value[0]).toBe(2);
            });

            it('The up arrow on the right margin does not increase the value', () => {
                testComponent.readOnly = true;
                fixture.detectChanges();

                inputPORight.sendKeydown('arrowUp');

                expect(testComponent.control.value[1]).toBe(6);
            });

            it('Down arrow on right margin does not decrease value', () => {
                testComponent.readOnly = true;
                fixture.detectChanges();

                inputPORight.sendKeydown('arrowDown');

                expect(testComponent.control.value[1]).toBe(6);
            });
        });

        describe('Quantum', () => {
            it('The up arrow on the left margin increases start by a quantum', () => {
                inputPOLeft.sendKeydown('arrowUp');

                expect(testComponent.control.value[0]).toBe(3);
            });

            it('The down arrow on the left margin decreases start by a quantum', () => {
                inputPOLeft.sendKeydown('arrowDown');

                expect(testComponent.control.value[0]).toBe(1);
            });

            it('The up arrow on the right margin increases end by a quantum', () => {
                inputPORight.sendKeydown('arrowUp');

                expect(testComponent.control.value[1]).toBe(7);
            });

            it('The down arrow on the right margin decreases end by a quantum', () => {
                inputPORight.sendKeydown('arrowDown');

                expect(testComponent.control.value[1]).toBe(5);
            });
        });

        describe('Steps', () => {
            beforeEach(() => {
                testComponent.steps = 5;
                fixture.detectChanges();
            });

            it('The up arrow on the left margin increases start by one step', () => {
                inputPOLeft.sendKeydown('arrowUp');

                expect(testComponent.control.value[0]).toBe(4);
            });

            it('Down arrow on the left margin decreases start by one step', () => {
                inputPOLeft.sendKeydown('arrowDown');

                expect(testComponent.control.value[0]).toBe(0);
            });

            it('The up arrow on the right margin increases end by one step', () => {
                inputPORight.sendKeydown('arrowUp');

                expect(testComponent.control.value[1]).toBe(8);
            });

            it('Down arrow on the right margin decreases end by one step', () => {
                inputPORight.sendKeydown('arrowDown');

                expect(testComponent.control.value[1]).toBe(4);
            });
        });

        describe('Limitations', () => {
            it('The up arrow on the left margin does not increase start to a value greater than end', () => {
                testComponent.control.setValue([6, 6]);
                inputPOLeft.sendKeydown('arrowUp');

                expect(testComponent.control.value[0]).toBe(6);
            });

            it('The down arrow on the left margin does not decrease start to a value less than min', () => {
                testComponent.control.setValue([0, 6]);
                inputPOLeft.sendKeydown('arrowDown');

                expect(testComponent.control.value[0]).toBe(0);
            });

            it('The up arrow on the right margin does not increase end to a value greater than max', () => {
                testComponent.control.setValue([6, 10]);
                inputPORight.sendKeydown('arrowUp');

                expect(testComponent.control.value[1]).toBe(10);
            });

            it('The down arrow on the right margin does not decrease end to a value less than start', () => {
                testComponent.control.setValue([6, 6]);
                inputPORight.sendKeydown('arrowDown');

                expect(testComponent.control.value[1]).toBe(6);
            });

            it('Keyboard input does not exceed max', () => {
                inputPORight.sendText('12345');

                expect(inputPORight.value).toBe('10');
            });

            it('Keyboard input does not exceed min', () => {
                testComponent.min = -10;
                fixture.detectChanges();
                inputPOLeft.sendText('-123');

                expect(inputPOLeft.value).toBe('-10');
            });

            it('Keyboard input does not go beyond value[1]', () => {
                inputPOLeft.sendText('12345');

                expect(inputPOLeft.value).toBe('6');
            });

            it('Keyboard input does not output value[1] beyond value[0]', () => {
                inputPORight.sendText('1');

                expect(inputPORight.value).toBe('1');
                expect(testComponent.control.value[1]).toBe(6);
            });
        });
    });

    function getLeftValueContent(): string | null {
        const valueContent = pageObject.getByAutomationId(
            testContext.valueContentAutoId,
            leftInputWrapper,
        );

        return valueContent && valueContent.nativeElement.textContent.trim();
    }

    function getRightValueContent(): string | null {
        const valueContent = pageObject.getByAutomationId(
            testContext.valueContentAutoId,
            rightInputWrapper,
        );

        return valueContent && valueContent.nativeElement.textContent.trim();
    }

    function getLeftValueDecoration(): string {
        return pageObject
            .getByAutomationId(testContext.valueDecorationAutoId, leftInputWrapper)
            ?.nativeElement.textContent.trim()
            .replace('\n ', '');
    }

    function getRightValueDecoration(): string {
        return pageObject
            .getByAutomationId(`${testContext.prefix}pluralize-right`)
            ?.nativeElement.textContent.trim()
            .replace('\n ', '');
    }

    function initializeInputsPO() {
        leftInputWrapper = fixture.debugElement.query(
            By.css('tui-input-number:first-of-type'),
        );
        rightInputWrapper = fixture.debugElement.query(
            By.css('tui-input-number:last-of-type'),
        );

        inputPOLeft = new NativeInputPO(
            fixture,
            testContext.nativeInputAutoId,
            leftInputWrapper,
        );
        inputPORight = new NativeInputPO(
            fixture,
            testContext.nativeInputAutoId,
            rightInputWrapper,
        );
    }
});
