/* eslint-disable no-param-reassign */
/* eslint-disable import/extensions */

import * as storage from './storage.js';
import create from './utils/create.js';
import language from './layouts/index.js'; // { en, ru }
import Key from './Key.js';

const main = create('main', '',
    [create('h1', 'title', 'Virtual Keyboard'),
    // create('h3', 'subtitle', 'Windows keyboard that has been made under Linux'),
    create('p', 'hint', 'Use left <kbd>Ctrl</kbd> + <kbd>Alt</kbd> and use button en/ru to switch language.')
    ]);




export default class Keyboard {
    constructor(rowsOrder) {
        this.rowsOrder = rowsOrder;
        this.keysPressed = {};
        this.isCaps = false;
    }

    init(langCode) {
        this.keyBase = language[langCode];
        this.output = create('textarea', 'output', null, main,
            ['placeholder', 'Start type something...'],
            ['rows', 5],
            ['cols', 50],
            ['spellcheck', false],
            ['autocorrect', 'off']);

        this.container = create('div', 'keyboard', null, main, ['language', langCode]);
        // this.open = create('button', 'open', null, main)
        document.body.prepend(main);

       

        return this;
    }

    

    generateLayout() {
        this.keyButtons = [];
        this.rowsOrder.forEach((row, i) => {
            const rowElement = create('div', 'keyboard__row', null, this.container, ['row', i + 1]);
            rowElement.style.gridTemplateColumns = `repeat(${row.length}, 1fr)`;
            row.forEach((code) => {
                const keyObj = this.keyBase.find((key) => key.code === code);
                if (keyObj) {
                    const keyButton = new Key(keyObj);
                    this.keyButtons.push(keyButton);
                    rowElement.appendChild(keyButton.div);
                }
            });
        });

        document.addEventListener('keydown', this.handleEvent);
        document.addEventListener('keyup', this.handleEvent);
        this.container.onmousedown = this.preHandleEvent;
        this.container.onmouseup = this.preHandleEvent;
    }

    preHandleEvent = (e) => {
        e.stopPropagation();
        const keyDiv = e.target.closest('.keyboard__key');
        if (!keyDiv) return;
        const { dataset: { code } } = keyDiv;
        keyDiv.addEventListener('mouseleave', this.resetButtonState);
        this.handleEvent({ code, type: e.type });
    };

    // ??-?? ?????????????????? ??????????????

    handleEvent = (e) => {
        if (e.stopPropagation) e.stopPropagation();
        const { code, type } = e;
        const keyObj = this.keyButtons.find((key) => key.code === code);
        if (!keyObj) return;
        this.output.focus();

        // ?????????????? ????????????
        if (type.match(/keydown|mousedown/)) {
            if (!type.match(/mouse/)) e.preventDefault();


            if (code.match(/Shift/)) this.shiftKey = true;

            if (this.shiftKey) this.switchUpperCase(true);

            if (code.match(/Control|Alt|Caps/) && e.repeat) return;

            if (code.match(/en\/ru/)) this.altKey = true;
            if (code.match(/close/)) this.altKey = true;
            if (code.match(/Control/)) this.ctrKey = true;
            if (code.match(/Alt/)) this.altKey = true;
            if (code.match(/Control/) && this.altKey) this.switchLanguage();
            if (code.match(/Alt/) && this.ctrKey) this.switchLanguage();
            if (code.match(/en\/ru/)) this.switchLanguage();
            if (code.match(/close/)) this.closeKeyboard();

            keyObj.div.classList.add('active');

            if (code.match(/Caps/) && !this.isCaps) {
                this.isCaps = true;
                this.switchUpperCase(true);
            } else if (code.match(/Caps/) && this.isCaps) {
                this.isCaps = false;
                this.switchUpperCase(false);
                keyObj.div.classList.remove('active');
            }


            // ????????????????????, ?????????? ???????????? ???? ?????????? ?? ?????????????? (???????? ?????? ????????????????)
            if (!this.isCaps) {
                // ???????? ???? ?????????? ????????, ?????????????? ???? ?????????? ???? ????????
                this.printToOutput(keyObj, this.shiftKey ? keyObj.shift : keyObj.small);
            } else if (this.isCaps) {
                // ???????? ?????????? ????????
                if (this.shiftKey) {
                    // ?? ?????? ???????? ?????????? ???????? - ???? ?????? ???????????? ???? ???????????????????????? ???????? ?????????????? ??????????????
                    this.printToOutput(keyObj, keyObj.sub.innerHTML ? keyObj.shift : keyObj.small);
                } else {
                    // ?? ?????? ???????? ???? ?????????? ???????? - ???? ?????? ???????????? ?????? ?????????????????????? ???????? ?????????????? ??????????????
                    this.printToOutput(keyObj, !keyObj.sub.innerHTML ? keyObj.shift : keyObj.small);
                }
            }
            this.keysPressed[keyObj.code] = keyObj;
            // ?????????????? ????????????
        } else if (e.type.match(/keyup|mouseup/)) {
            this.resetPressedButtons(code);
            // if (code.match(/Shift/) && !this.keysPressed[code])
            if (code.match(/Shift/)) {
                this.shiftKey = false;
                this.switchUpperCase(false);
            }
            if (code.match(/Control/)) this.ctrKey = false;
            if (code.match(/Alt/)) this.altKey = false;
            if (code.match(/en\/ru/)) this.altKey = false;
            if (code.match(/close/)) this.altKey = false;

            if (!code.match(/Caps/)) keyObj.div.classList.remove('active');
        }
    }

    resetButtonState = ({ target: { dataset: { code } } }) => {
        if (code.match('Shift')) {
            this.shiftKey = false;
            this.switchUpperCase(false);
            this.keysPressed[code].div.classList.remove('active');
        }
        if (code.match(/Control/)) this.ctrKey = false;
        if (code.match(/Alt/)) this.altKey = false;
        this.resetPressedButtons(code);
        this.output.focus();
    }

    resetPressedButtons = (targetCode) => {
        if (!this.keysPressed[targetCode]) return;
        if (!this.isCaps) this.keysPressed[targetCode].div.classList.remove('active');
        this.keysPressed[targetCode].div.removeEventListener('mouseleave', this.resetButtonState);
        delete this.keysPressed[targetCode];
    }

    switchUpperCase(isTrue) {
        // ???????? - ?????????? ????????????????, ???? ?????????????????? ?????????????? ?????? ????????????????
        if (isTrue) {
            // ???? ???????????????????? ???????? ???????????? ?? keyButtons, ???????????? ?????????? ?????????? ?????????????????????????? ???? ??????
            this.keyButtons.forEach((button) => {
                // ???????? ?? ???????????? ???????? ?????????????????? - ???? ???????????? ???????????????????????????? ??????????
                if (button.sub) {
                    // ???????? ???????????? ?????? ???? ????????, ?????????? ?????????????????? ?? ????????????????????????
                    if (this.shiftKey) {
                        button.sub.classList.add('sub-active');
                        button.letter.classList.add('sub-inactive');
                    }
                }
                // ???? ?????????????? ???????????????????????????? ????????????
                // ?? ???????? ????????, ?? ???? ????????, ?? ???????????? ???????? ???????????? ?????? ??????????????????????
                if (!button.isFnKey && this.isCaps && !this.shiftKey && !button.sub.innerHTML) {
                    // ?????????? ?????????????????? ?????????????? ?????????????????? ?????????????? letter
                    button.letter.innerHTML = button.shift;
                    // ???????? ???????? ?? ?????????? ????????
                } else if (!button.isFnKey && this.isCaps && this.shiftKey) {
                    // ?????????? ???????????????? ?????????????? ?????? ?????????????????? ?????????????? letter
                    button.letter.innerHTML = button.small;
                    // ?? ???????? ?????? ???????????? ???????? - ?????????? ?????????????????? ?????????????? ?? ?????????????????? ??????????????
                    // ???????????? ?? ????????????, ?????? ?????????????????????? --- ?????? ?????? ???????? ?????????????????? ?????? ?????? ??????
                } else if (!button.isFnKey && !button.sub.innerHTML) {
                    button.letter.innerHTML = button.shift;
                }
            });
        } else {
            // ???????????????? ?????????????? ?? ???????????????? ??????????????
            this.keyButtons.forEach((button) => {
                // ???? ?????????????? ???????????????????????????? ????????????
                // ???????? ???????? ????????????????????
                if (button.sub.innerHTML && !button.isFnKey) {
                    // ???? ???????????????????? ?? ????????????????
                    button.sub.classList.remove('sub-active');
                    button.letter.classList.remove('sub-inactive');
                    // ???????? ???? ?????????? ????????
                    if (!this.isCaps) {
                        // ???? ???????????? ???????????????????? ???????????????? ???????????????? ???????????? ??????????????
                        button.letter.innerHTML = button.small;
                    } else if (!this.isCaps) {
                        // ???????? ???????? ?????????? - ???? ???????????????????? ?????????????? ??????????????
                        button.letter.innerHTML = button.shift;
                    }
                    // ???????? ?????? ???????????? ?????? ?????????????????????? (?????????? ???? ?????????????? ????????????????????????????)
                } else if (!button.isFnKey) {
                    // ???? ???????? ?????????? ????????
                    if (this.isCaps) {
                        // ???????????????????? ?????????????? ??????????????
                        button.letter.innerHTML = button.shift;
                    } else {
                        // ???????? ?????????? ???????? - ???????????????????? ???????????? ??????????????
                        button.letter.innerHTML = button.small;
                    }
                }
            });
        }
    }

    switchLanguage = () => {
        const langAbbr = Object.keys(language);
        let langIdx = langAbbr.indexOf(this.container.dataset.language);
        this.keyBase = langIdx + 1 < langAbbr.length ? language[langAbbr[langIdx += 1]]
            : language[langAbbr[langIdx -= langIdx]];

        this.container.dataset.language = langAbbr[langIdx];
        storage.set('kbLang', langAbbr[langIdx]);

        this.keyButtons.forEach((button) => {
            const keyObj = this.keyBase.find((key) => key.code === button.code);
            if (!keyObj) return;
            button.shift = keyObj.shift;
            button.small = keyObj.small;
            if (keyObj.shift && keyObj.shift.match(/[^a-zA-Z??-????-??????0-9]/g)) {
                button.sub.innerHTML = keyObj.shift;
            } else {
                button.sub.innerHTML = '';
            }
            button.letter.innerHTML = keyObj.small;
        });
        if (this.isCaps) this.switchUpperCase(true);
    }

    // closeKeyboard() {
    //     const close = document.querySelector('.keyboard');
   
    //     close.classList.toggle('hidden')
    // }
    // openKeyboard() {
    //     const open = document.querySelector('.keyboard')
    //     open.classList.remove('hidden');
    // }
    //    
    //     openKeyboard()


    printToOutput(keyObj, symbol) {
        let cursorPos = this.output.selectionStart;
        const left = this.output.value.slice(0, cursorPos);
        const right = this.output.value.slice(cursorPos);
        const textHandlers = {
            Tab: () => {
                this.output.value = `${left}\t${right}`;
                cursorPos += 1;
            },
            ArrowLeft: () => {
                cursorPos = cursorPos - 1 >= 0 ? cursorPos - 1 : 0;
            },
            ArrowRight: () => {
                cursorPos += 1;
            },
            ArrowUp: () => {
                const positionFromLeft = this.output.value.slice(0, cursorPos).match(/(\n).*$(?!\1)/g) || [[1]];
                cursorPos -= positionFromLeft[0].length;
            },
            ArrowDown: () => {
                const positionFromLeft = this.output.value.slice(cursorPos).match(/^.*(\n).*(?!\1)/) || [[1]];
                cursorPos += positionFromLeft[0].length;
            },
            Enter: () => {
                this.output.value = `${left}\n${right}`;
                cursorPos += 1;
            },
            Delete: () => {
                this.output.value = `${left}${right.slice(1)}`;
            },
            Backspace: () => {
                this.output.value = `${left.slice(0, -1)}${right}`;
                cursorPos -= 1;
            },
            Space: () => {
                this.output.value = `${left} ${right}`;
                cursorPos += 1;
            },
        };
        if (textHandlers[keyObj.code]) textHandlers[keyObj.code]();
        else if (!keyObj.isFnKey) {
            cursorPos += 1;
            this.output.value = `${left}${symbol || ''}${right}`;
        }
        this.output.setSelectionRange(cursorPos, cursorPos);
    }
}

