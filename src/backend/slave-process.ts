import child_process from 'child_process';
import atexit from '../infra/atexit';
import { Future } from '../infra/future';


class JupyterSubprocess {

    settings: JupyterSubprocess.Settings

    proc: child_process.ChildProcess
    batchFlags = ['--no-browser', '--ServerApp.use_redirect_file=False']
    connectionInfo: Future<URL>

    constructor(settings: JupyterSubprocess.Settings) {
        this.settings = Object.assign({}, DEFAULTS, settings);
        this.connectionInfo = new Future;

        atexit(() => this.cleanup(), this);
    }

    start(): Promise<URL> {
        this.proc = child_process.spawn('jupyter', 
            ['server', `--port=${this.settings.port}`, ...this.batchFlags],
            {
                env: {
                    PATH: process.env['PATH'],
                    ...this.settings.envOpts
                }
            });

        this.proc.on('error', console.error);

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

    export type Settings = {
        port: number
        envOpts?: {[name: string]: string}
    }

    export const DEFAULT_SETTINGS: Settings = {
        port: 2088,
        envOpts: {PYDEVD_DISABLE_FILE_VALIDATION: '1'}
    }
}

import DEFAULTS = JupyterSubprocess.DEFAULT_SETTINGS


export { JupyterSubprocess }