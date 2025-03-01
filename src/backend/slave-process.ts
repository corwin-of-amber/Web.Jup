import child_process from 'child_process';
import { Future } from '../infra/future';


class JupyterSubprocess {

    settings: JupyterSubprocess.Settings

    proc: child_process.ChildProcess
    connectionInfo: Future<URL>

    constructor(settings: JupyterSubprocess.Settings) {
        this.settings = settings;
        this.connectionInfo = new Future;

        window.addEventListener('beforeunload', () => this.cleanup());
    }

    start(): Promise<URL> {
        this.proc = child_process.spawn('jupyter-lab', 
            [`--port=${this.settings.port}`, '--no-browser']);

        let td = new TextDecoder();
        this.proc.stderr.on('data', buf => this._handle(td.decode(buf)));

        return this.connectionInfo.promise;
    }

    cleanup() {
        this.proc?.kill();
    }

    _handle(log: string) {
        console.log(log);

        for (let mo of log.matchAll(/https?:\S+/g)) {
            try {
                this.connectionInfo.resolve(new URL(mo[0]));
            }
            catch {
                console.warn(`invalid url: ${mo[0]}`);
            }
        }
    }
}


namespace JupyterSubprocess {

    export type Settings = {port: number}

}


export { JupyterSubprocess }