import { EventEmitter } from 'events';
import * as Vue from 'vue';
import { IMimeBundle } from '@jupyterlab/nbformat';
import { Status } from '@jupyterlab/services/lib/kernel/messages';

import { QualifiedLocalStore, Serialization } from './infra/store';
import atexit from './infra/atexit';

import { Model, ModelImpl } from '../packages/vuebook/src';
import App, { IApp } from './components/app.vue';
import { Annotations } from './frontend/annotations';
import { Vue3DisplayFormat } from './frontend/display-extensions';


class NotebookApp extends EventEmitter {
    model: ModelImpl

    instance: Vue.App
    view: IApp
    displayFormats = [new Vue3DisplayFormat]

    store = new QualifiedLocalStore<Model.Notebook>("workbook");

    constructor() {
        super();
        this._createUI(document.body);
        this.load();
        atexit(() => this.save(), this);
    }

    _createUI(container: HTMLElement) {
        this.instance = Vue.createApp(App, {
            'onCell:action': (action: NotebookApp.CellAction) => this.handleCellAction(action),
            onCommand: (cmd: {command: string}) => this.emit('command', cmd)
        });
        this.view = this.instance.mount(container) as IApp;
    }

    new() {
        this.model = Vue.reactive(new ModelImpl().from({}));
        this.view.model = this.model;
    }

    load() {
        this.model = Vue.reactive(new ModelImpl().from(this.store.load()));
        this.view.model = this.model;
    }

    loadFrom(m: Model.Notebook) {
        this.model = Vue.reactive(ModelImpl.promote(m));
        this.view.model = this.model;
    }

    save() {
        this.store.save(this.model.to());
    }

    /**
     * Invoked by Jupyter backend when execution starts/finishes.
     */
    setStatus(cell: Model.Cell, status: Status) {
        cell.loading = status !== 'idle';
    }

    /**
     * Invoked by the Jupyter backend when computation completes.
     */
    addResult(cell: Model.Cell, result: IMimeBundle) {
        for (let fmt of this.displayFormats)
            result = fmt.formatResult(result) ?? result;

        this.model.addResult(cell, result);
    }

    /**
     * Invoked by the Jupyter backend when computation fails with
     * an error.
     */
    addError(cell: Model.Cell, error: string) {
        this.model.addError(cell, error);
    }

    writeOutput(cell: Model.Cell, text: string) {
        this.model.writeOutput(cell, text);
    }

    runCell(cell: Model.Cell) {
        this.emit('cell:action', {type: 'exec', cell});
    }

    runAll() {
        for (let cell of this.model.cells) {
            if (this.cellAnnotations(cell, {type: 'ondemand'}).length > 0)
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
            if (at < 0) at = this.model.cells.length;
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
        // Preflight: determine or update cell kind
        let cell = action.cell;
        cell.kind = 'code/python';  /** @todo only for code */
        for (let {kind} of this.cellAnnotations(cell, {type: 'kind'}) as Annotations.KindAnnotation[]) {
            cell.kind = kind;
        }
        // Dispatch to app handlers
        this.emit('cell:action', action);        
    }

    annotations(filt?: {type: string}): Annotations.Annotation[] {
        return this.model.cells.flatMap(cell => this.cellAnnotations(cell, filt));
    }

    cellAnnotations(cell: Model.Cell, filt?: {type: string}): Annotations.Annotation[] {
        let ffilt = filt ? (as: Annotations.Annotation[]) => 
            as.filter(a => !filt.type || a.type === filt.type) : ((as: any) => as);
        return ffilt(Annotations.parse(cell.input));
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
                    input: cell.source.join(''),
                    outputs: []
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