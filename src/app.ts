import * as Vue from 'vue';
import { IMimeBundle } from '@jupyterlab/nbformat';


// @ts-ignore
import rootComponent from './components/notebook.vue';


class NotebookApp {
    model: NotebookApp.Model
    view: Vue.ComponentPublicInstance

    constructor() {
        this.model = Vue.reactive({cells: [this.mkCodeCell()]});
        let app = Vue.createApp(rootComponent, {model: this.model, cells: []});
        this.view = app.mount('body');
    }

    addResult(cell: NotebookApp.Cell, result: IMimeBundle) {
        for (let [kind, payload] of Object.entries(result)) {
            if (typeof payload === 'string') {
                cell.outputs.push({kind, payload})
                break;
            }
        }
    }

    writeOutput(cell: NotebookApp.Cell, text: string) {
        cell.outputs ??= [];
        let term = cell.outputs.find(o => o.kind === 'term');
        if (!term) cell.outputs.push(term = {kind: 'term', payload: ''});
        term.payload += text;
    }

    mkCodeCell(code: string = ''): NotebookApp.Cell {
        return {
            kind: 'code',
            input: code,
            outputs: []
        };
    }
}


namespace NotebookApp {
    export interface Model {
        cells: Cell[]
    }

    export interface Cell {
        kind: string
        input: string
        outputs?: Output[]
    }

    export interface Output {
        kind: string
        payload: string
    }
}

export { NotebookApp }