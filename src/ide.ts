import path from 'path';
import { NotebookApp } from './app';
import { JupyterConnection } from './connection';
import { FileStore } from './infra/store';


class IDE {
    app: NotebookApp
    kernel: JupyterConnection

    project: Project
    wd: string

    store: FileStore<NotebookApp.Model>
    ipynb: NotebookApp.IpynbConverter

    constructor(project: Project) {
        this.project = project;
        this.wd = this.project.rootDir;

        this.app = new NotebookApp();
        this.kernel = new JupyterConnection(this.project.server)
        this.kernel.attach(this.app);

        this.ipynb = new NotebookApp.IpynbConverter();
        this.store = new FileStore(this._untitled(), this.ipynb);
    }

    async start() {
        await this.kernel.start({wd: this.wd});
        this.app.runAll();
    }

    save(filename?: string) {
        if (filename) {
            this.store.filename = path.join(this.wd, filename);
        }
        this.store.save(this.app.model);
    }

    _untitled() { return path.join(this.wd, 'untitled.ipynb'); }
}


interface Project {
    server: {url: string, token?: string}
    rootDir: string
}


export { IDE, Project }