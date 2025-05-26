import { Key } from "./layout";


function sendKey(key: Key) {
    if (typeof key === 'string')
        sendKeyText(key);
    else if (key.text)
        sendKeyText(key.text);
    else if (key.code)
        sendKeyEvent(key.code.s, key.code.n);
}

function sendKeyText(text: string) {
    /* sorry for using a deprecated API, but inserting into a `contenteditable` is too hard */
    document.execCommand('insertText', false, text);
}

function sendKeyEvent(scode: string, ncode: number) {
    document.activeElement.dispatchEvent(
        new KeyboardEvent('keydown', {
            key: scode, code: scode,
            keyCode: ncode, which: ncode,
            bubbles: true,
            cancelable: true
        })
    );
}


export { sendKey, sendKeyText, sendKeyEvent }