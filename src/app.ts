import { EventEmitter } from 'events';
import * as Vue from 'vue';
import { IMimeBundle } from '@jupyterlab/nbformat';


// @ts-ignore
import rootComponent from './components/notebook.vue';


class NotebookApp extends EventEmitter {
    model: NotebookApp.Model
    view: Vue.ComponentPublicInstance

    constructor() {
        super();
        this.model = Vue.reactive({cells: [this.mkCodeCell()]});
        let app = Vue.createApp(rootComponent, {
            model: this.model,
            'onCell:action': (action: NotebookApp.CellAction) =>
                this.handleCellAction(action)
        });
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

    addError(cell: NotebookApp.Cell, error: string) {
        cell.outputs.push({kind: 'error', payload: error});
    }

    writeOutput(cell: NotebookApp.Cell, text: string) {
        cell.outputs ??= [];
        let term = cell.outputs.find(o => o.kind === 'term');
        if (!term) cell.outputs.push(term = {kind: 'term', payload: ''});
        term.payload += text;
    }

    clearOutputs(cell: NotebookApp.Cell) {
        cell.outputs = [];
    }

    mkCodeCell(code: string = ''): NotebookApp.Cell {
        return {
            kind: 'code',
            input: code,
            outputs: []
        };
    }

    handleCellAction(action: NotebookApp.CellAction) {
        switch (action.type) {
        case 'exec':
        case 'exec-fwd':        
            this.clearOutputs(action.cell);
            break;
        }
        this.emit('cell:action', action);        
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

    export interface CellAction {
        type: string
        cell: Cell
    }
}

export { NotebookApp }