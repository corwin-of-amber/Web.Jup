import path from 'path';
import { NotebookApp } from './app';
import { JupyterConnection } from './connection';
import { FileStore, LocalStore } from './infra/store';
import { KeyMap } from './infra/keymap';
import { saveDialog } from './infra/file-dialog';


class IDE {
    app: NotebookApp
    kernel: JupyterConnection

    project: Project
    wd: string

    store: FileStore<NotebookApp.Model>
    ipynb: NotebookApp.IpynbConverter

    persist = new LocalStore('ide')

    constructor(project: Project) {
        this.project = project;
        this.wd = this.project.rootDir;

        this.app = new NotebookApp();
        this.kernel = new JupyterConnection(this.project.server)
        this.kernel.attach(this.app);

        this.ipynb = new NotebookApp.IpynbConverter();
        this.store = new FileStore(this._untitled(), this.ipynb);

        let s = this.persist.load() as State;
        if (s) this.state = s;
        window.addEventListener('beforeunload', () => this.persist.save(this.state));

        this.globalKeyMap().attach(document.body);
    }

    get state(): State {
        return {filename: this.store.filename};
    }
    set state(v: State) {
        if (v.filename) this.store.filename = v.filename;
    }

    async start() {
        await this.kernel.start({wd: this.wd});
        this.app.runAll();
    }

    new(filename: string = this._untitled()) {
        this.store.filename = filename;
        this.app.new();
    }

    save(filename?: string) {
        if (filename) {
            this.store.filename = path.resolve(this.wd, filename);
        }
        this.store.save(this.app.model);
    }

    async saveDialog() {
        let fn = (await saveDialog(this.store.filename, '.ipynb')).path;
        this.save(fn);
    }

    _untitled() { return path.join(this.wd, 'untitled.ipynb'); }

    globalKeyMap() {
        return new KeyMap({
            'Mod-S': () => this.save(),
            'Shift-Mod-S': () => { this.saveDialog(); },
            'Mod-R': () => this.app.runAll(),
            'Mod-I': () => this.kernel.userInterrupt()
        })
    }
}


interface Project {
    server: {url: string, token?: string}
    rootDir: string
}

type State = {filename: string}


export { IDE, Project }