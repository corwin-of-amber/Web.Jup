import { EventEmitter } from 'events';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap, history, indentWithTab } from '@codemirror/commands';
import { EditorState } from '@codemirror/state';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { python } from '@codemirror/lang-python';


const extensions = [
    keymap.of(defaultKeymap), keymap.of([indentWithTab]),
    history(),
    syntaxHighlighting(defaultHighlightStyle, {fallback: true}),
    python()
];

class CodeEditor extends EventEmitter {
    cm: EditorView

    constructor(container: HTMLElement, initialContent: string = '') {
        super();
        this.cm = new EditorView({
            doc: initialContent,
            extensions: this.extensions,
            parent: container
        });
    }

    get() {
        return this.cm.state.sliceDoc();
    }

    set(text: string) {
        this.cm.setState(EditorState.create(
            {doc: text, extensions: this.extensions}));
    }

    get extensions() {
        return [extensions,this.updateListener(), this.nav()]
    }

    private updateListener() {
        return EditorView.updateListener.of(v => {
            if (v.docChanged) this.emit('change');
        });
    }

    private nav() {
        let emit = (type: string) => () => this.emit('action', {type});
        return keymap.of([
            {key: "Shift-Enter", run: emit('exec-fwd')},
            {key: "Mod-Enter", run: emit('exec')},
            {key: "Ctrl-=", run: emit('insert-after')},
            {key: "Ctrl-+", run: emit('insert-before')},
            {key: "Ctrl--", run: emit('delete')}
        ]);
    }
}


export { CodeEditor }