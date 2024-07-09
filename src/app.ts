import { EventEmitter } from 'events';
import * as Vue from 'vue';
import { IMimeBundle } from '@jupyterlab/nbformat';

import { LocalStore, Serialization } from './infra/store';
// @ts-ignore
import { Notebook, Model, ModelImpl } from '../packages/vuebook';


class NotebookApp extends EventEmitter {
    model: ModelImpl
    view: Vue.ComponentPublicInstance

    store = new LocalStore<Model.Notebook>('untitled')

    constructor() {
        super();
        this.model = Vue.reactive(new ModelImpl().load());  //this.load());
        let app = Vue.createApp(Notebook, {
            model: this.model,
            'onCell:action': (action: NotebookApp.CellAction) =>
                this.handleCellAction(action)
        });
        this.view = app.mount('body');

        window.addEventListener('beforeunload', () => this.save());
    }

    new() {
        this.model = new ModelImpl(); // {cells: [this.mkCodeCell()]};
    }

    load() {
        return this.store.load() ?? {cells: [this.mkCodeCell()]};
    }

    save() {
        this.store.save(this.model);
    }

    addResult(cell: Model.Cell, result: IMimeBundle) {
        let viewable = ['image/svg+xml', 'text/html', 'text/plain'];
        for (let kind of viewable) {
            let payload = result[kind];
            if (typeof payload === 'string') {
                cell.outputs.push({kind, payload})
                break;
            }
        }
    }

    addError(cell: Model.Cell, error: string) {
        cell.outputs.push({kind: 'error', payload: error});
    }

    writeOutput(cell: Model.Cell, text: string) {
        cell.outputs ??= [];
        let term = cell.outputs.find(o => o.kind === 'term');
        if (!term) cell.outputs.push(term = {kind: 'term', payload: ''});
        term.payload += text;
    }

    runCell(cell: Model.Cell) {
        this.model.clearOutputs(cell);
        this.handleCellAction({type: 'exec', cell});
    }

    runAll() {
        for (let cell of this.model.cells) {
            if (!this.cellFlags(cell).ondemand)
                this.runCell(cell);
        }
    }

    clearOutputs(cell: Model.Cell) {
        cell.outputs = [];
    }

    insert(at: Model.Cell | number, newCell: Model.Cell,
           after: boolean = false) {
        if (typeof at !== 'number') {
            at = this.model.cells.indexOf(at);
            if (at < 0) this.model.cells.length;
            else if (after) at++;
        }
        this.model.cells.splice(at, 0, newCell);
    }

    delete(cell: Model.Cell) {
        let at = this.model.cells.indexOf(cell);
        if (at >= 0) this.model.cells.splice(at, 1);
    }

    mkCodeCell(code: string = ''): Model.Cell {
        return {
            kind: 'code',
            input: code,
            outputs: []
        };
    }

    focus(cell: Model.Cell) {
        let c = (<any[]>this.view.$refs.cells)
                .find(v => v.model.$key === cell.$key);
        if (c) c.editor.cm.focus();
    }

    handleCellAction(action: NotebookApp.CellAction) {
        /*switch (action.type) {
        case 'exec':
        case 'exec-fwd':        
            this.clearOutputs(action.cell);
            break;
        case 'insert-after':
            let ncell = this.mkCodeCell();
            this.insert(action.cell, ncell, true);
            requestAnimationFrame(() => this.focus(ncell));
            break;
        case 'delete':
            this.delete(action.cell);
            break;
        default:
            console.warn(action)
        }*/
        this.emit('cell:action', action);        
    }

    cellFlags(cell: Model.Cell) {
        /** @todo parse pragmas more systematically */
        return {
            ondemand: !!cell.input.match(/^#pragma ondemand/m)
        }
    }
}


namespace NotebookApp {

    export interface CellAction {
        type: string
        cell: Model.Cell
    }

    /**
     * Converts between a model and `.ipynb` JSON format
     */
    export class IpynbConverter implements Serialization<Model.Notebook> {
        metadata: any = {
            "kernelspec": {
                "display_name": "Python 3 (ipykernel)",
                "language": "python",
                "name": "python3"
            }
        }
        version = [4, 4]
        options = {indent: 1}
        
        parse(s: string): Model.Notebook {
            throw new Error('Method not implemented.');
        }

        stringify(d: Model.Notebook): string {
            return JSON.stringify(this.toJSON(d), null, this.options.indent);
        }

        toJSON(model: Model.Notebook) {
            return {
                cells: model.cells.map(cell => ({
                    cell_type: cell.kind,
                    metadata: {},
                    outputs: [],
                    source: this.lines(cell.input)
                })),
                metadata: this.metadata,
                nbformat: this.version[0],
                nbformat_minor: this.version[1]
            };
        }

        lines(s: string) {
            return [...s.matchAll(/.*\n|.+$/g)].map(mo => mo[0]);
        }
    }

}

export { NotebookApp }