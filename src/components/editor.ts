import { EventEmitter } from 'events';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { EditorState, StateField } from '@codemirror/state';
import { syntaxHighlighting, defaultHighlightStyle, indentUnit } from '@codemirror/language';
import { python, pythonLanguage } from '@codemirror/lang-python';
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';



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

    get extensions() { return Setup.of(this); }

}


namespace Setup {

    export function of(o: CodeEditor) {
        return [extensions, operator.init(() => o)];
    }

    export const operator = StateField.define<CodeEditor>({
        create() { return null; },
        update(v: CodeEditor) { return v; }
    });
    
    export const extensions = [
        keymap.of(defaultKeymap), keymap.of(historyKeymap),
        keymap.of([indentWithTab]),
        history(),
        syntaxHighlighting(defaultHighlightStyle), indentUnit.of('    '),
        updateListener(), nav(),
        autocompletion(),
        python(),
        pythonLanguage.data.of({
            autocomplete: jupyterCompletions
        })
    ];
    
    function updateListener() {
        return EditorView.updateListener.of(v => {
            if (v.docChanged) v.state.field(operator).emit('change');
        });
    }

    function nav() {
        let emit = (type: string) => (cm: EditorView) =>
            cm.state.field(operator).emit('action', {type});
        return keymap.of([
            {key: "Shift-Enter", run: emit('exec-fwd')},
            {key: "Mod-Enter", run: emit('exec')},
            {key: "Ctrl-=", run: emit('insert-after')},
            {key: "Ctrl-+", run: emit('insert-before')},
            {key: "Ctrl--", run: emit('delete')}
        ]);
    }

}

function jupyterCompletions(context: CompletionContext) {
    let word = context.matchBefore(/\w*/)
    if (word.from == word.to && !context.explicit)
      return null
    return {
      from: word.from,
      options: [
        {label: "%time", type: "keyword"}
      ]
    }
}


export { CodeEditor }