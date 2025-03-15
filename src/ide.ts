import path from 'path';

import { Model, CodeEditor } from '../packages/vuebook';

import { NotebookApp } from './app';
import { StoreBase, FileStore, QualifiedLocalStore, VersionedStore,
         Serialization } from './infra/store';
import { KeyMap } from './infra/keymap';
import { saveDialog } from './infra/file-dialog';
import { JupyterConnection } from './backend/connection';
import { JupyterSubprocess } from './backend/slave-process';
import { JupyterHosts } from './backend/hosts';
import { JupyterAutocomplete } from './autocomplete';
import atexit from './infra/atexit';


class IDE {
    app: NotebookApp
    jup: {
        subproc: JupyterSubprocess,
        conn: JupyterConnection
    }

    project: Project
    wd: string

    store: FileStore<Model.Notebook>
    ipynb: NotebookApp.IpynbConverter
    prerun: StoreBase<string>

    persist = new QualifiedLocalStore('ide')

    constructor(project: Project) {
        this.project = project;
        this.wd = this.project.rootDir;

        this.app = new NotebookApp();
        this.jup = {
            subproc: new JupyterSubprocess({port: 2088}),
            conn: undefined
        };

        this.ipynb = new NotebookApp.IpynbConverter();
        this.store = new FileStore(this._untitled(), this.ipynb);

        let s = this.persist.load() as State;
        if (s) this.state = s;
        atexit(() => this.persist.save(this.state), this);

        this.globalKeyMap().attach(document.body);
    }

    get state(): State {
        return {filename: this.store.filename};
    }
    set state(v: State) {
        if (v.filename) this.store.filename = v.filename;
    }

    async start() {
        let url = await this.jup.subproc.start();
        await this.connectTo(new JupyterConnection(url));
    }

    async switchToRemote(host: JupyterHosts.RuntimeInfo) {
        await this.jup.conn?.destroy();
        await this.connectTo(new JupyterConnection(
            {baseUrl: host.url, token: host.token}));
    }

    async connectTo(conn: JupyterConnection) {
        this.jup.conn = conn;
        this.jup.conn.attach(this.app);
        await this.jup.conn.start({wd: this.wd, prerun: this.prerun});
        // configure editor (this is global)
        CodeEditor.lookupCompletions =
            new JupyterAutocomplete(this.jup.conn);
    }

    new(filename: string = this._untitled()) {
        this.store.filename = filename;
        this.app.new();
    }

    load(filename: string) {
        this.store.filename = path.resolve(this.wd, filename);
        this.app.loadFrom(this.store.load());
    }

    save(filename?: string) {
        if (filename) {
            this.store.filename = path.resolve(this.wd, filename);
        }
        this.store.save(this.app.model.to());
        this.expose(); /** @todo not always? */
    }

    async saveDialog() {
        let fn = (await saveDialog(this.store.filename, '.ipynb')).path;
        this.save(fn);
    }

    export(filename: string, format?: 'py' | 'ipynb') {
        let ser: Serialization<Model.Notebook>
        format ??= filename.match(/[.]([^.]+)$/)?.[1] as any;
        switch (format) {
            case 'py':
                ser = new Model.PythonScriptConverter(); break;
            case 'ipynb':
                ser = new Model.IpynbConverter(); break;
            default:
                throw new Error(format ? `unrecognized format '${format}' for '${filename}'`
                                       : `cannot detect format for '${filename}'`)
        }

        new FileStore<Model.Notebook>(filename, ser).save(this.app.model);
    }

    expose() {
        let ser = new Model.PythonScriptConverter,
            store = new VersionedStore(
                        new QualifiedLocalStore("expose", JSON), ser);

        store.save(this.app.model);
    }

    _untitled() { return path.join(this.wd, 'untitled.ipynb'); }

    globalKeyMap() {
        return new KeyMap({
            'Mod-S': () => this.save(),
            'Shift-Mod-S': () => { this.saveDialog(); },
            'Mod-R': () => this.app.runAll(),
            'Mod-I': () => this.jup.conn.userInterrupt()
        })
    }
}


interface Project {
    server?: {url: string, token?: string}
    rootDir: string
}

type State = {filename: string}


export { IDE, Project }