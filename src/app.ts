import { EventEmitter } from 'events';
import * as Vue from 'vue';
import { IMimeBundle } from '@jupyterlab/nbformat';

import { LocalStore, Serialization } from './infra/store';

import { Notebook, Model, ModelImpl } from '../packages/vuebook';


class NotebookApp extends EventEmitter {
    model: ModelImpl
    view: Vue.ComponentPublicInstance

    constructor() {
        super();
        this.load();
        let app = Vue.createApp(Notebook, {
            model: this.model,
            options: {collapsible: false},
            'onCell:action': (action: NotebookApp.CellAction) =>
                this.handleCellAction(action)
        });
        this.view = app.mount('body');

        window.addEventListener('beforeunload', () => this.save());
    }

    new() {
        this.model = Vue.reactive(new ModelImpl().from({}));
    }

    load() {
        this.model = Vue.reactive(new ModelImpl().load());
    }

    loadFrom(m: Model.Notebook) {
        //this.model = this.view.model = Vue.reactive(ModelImpl.promote(m));
    }

    save() {
        this.model.save();
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

    focus(cell: Model.Cell & {$key?: any}) {
        let c = (<any[]>this.view.$refs.cells)
                .find(v => v.model.$key === cell.$key);
        if (c) c.editor.cm.focus();
    }

    handleCellAction(action: NotebookApp.CellAction) {
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
            return this.fromJSON(JSON.parse(s));
        }

        stringify(d: Model.Notebook): string {
            return JSON.stringify(this.toJSON(d), null, this.options.indent);
        }

        fromJSON(json: any): Model.Notebook {
            return {
                cells: json.cells.map(cell => ({
                    kind: cell.cell_type,
                    input: cell.source.join('')
                }))
            };
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