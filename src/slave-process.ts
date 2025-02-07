import child_process from 'child_process';
import { Future } from './infra/future';


class JupyterSubprocess {

    proc: child_process.ChildProcess
    connectionInfo: Future<URL>

    constructor(settings: {port: number}) {
        this.proc = child_process.spawn('jupyter-lab', 
            [`--port=${settings.port}`, '--no-browser']);

        this.connectionInfo = new Future;

        let td = new TextDecoder();
        this.proc.stderr.on('data', buf => this._handle(td.decode(buf)));

        window.addEventListener('beforeunload', () => this.cleanup());
    }

    cleanup() {
        this.proc.kill();
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


export { JupyterSubprocess }