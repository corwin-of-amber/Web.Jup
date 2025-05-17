import assert from 'assert';

import { ServerConnection, KernelManager, KernelMessage } from '@jupyterlab/services';
import { IKernelConnection } from '@jupyterlab/services/lib/kernel/kernel';
import { IErrorMsg, IExecuteReply, IExecuteResultMsg, IIOPubMessage, IOPubMessageType, IStatusMsg, IStreamMsg } from '@jupyterlab/services/lib/kernel/messages';
import ansiStrip from 'strip-ansi';
import unescapeJs from 'unescape-js';

import type { Model } from '../../packages/vuebook';
import type { NotebookApp } from '../app';
import { StoreBase } from '../infra/store';
import atexit from '../infra/atexit';
import { Retrying } from '../infra/retry';


class JupyterConnection {
    server: Partial<ServerConnection.ISettings>
    kman: KernelManager
    kernel: IKernelConnection

    frontend: NotebookApp

    prerun: StoreBase<string>
    connectRetry = new Retrying

    constructor(server: URL | {baseUrl: string, token?: string}) {
        this.server = (server instanceof URL) ? {
                baseUrl: server.origin,
                token: server.searchParams.get('token')
            } :  server;

        atexit(() => this.destroy(), this);
    }

    static promote(connInfo: JupyterConnection | URL | {baseUrl: string}) {
        return connInfo instanceof JupyterConnection ? connInfo :
            new JupyterConnection(connInfo);
    }

    connect() {
        assert(!this.kman);
        this.kman = new KernelManager({
            serverSettings: ServerConnection.makeSettings(this.server)
        });
    }

    async start(options: KernelStartOptions = {}) {
        if (!this.kman) this.connect();
        return this.connectRetry.repeatedly(
            () => this.startTry(options), 500);
    }

    async startTry(options: KernelStartOptions = {}) {
        this.kernel = await this.kman.startNew({});
        this.kernel.registerCommTarget('jupyter.widget', (comm, msg) => this.handleComm(comm, msg));
        if (options.prerun) this.prerun = options.prerun;
        if (options.wd) this.chdir(options.wd);
    }

    handleComm(comm, msg) {
        /** @todo not implemented */
        console.log('handleComm', comm, msg)
    }

    async destroy() {
        if (this.kman) {
            try {
                await this.kernel?.shutdown();
            }
            catch (e) { console.warn('[disconnect]', e); }
            this.kman.dispose();
        }
        this.kman = undefined;
        this.connectRetry.stop();
    }

    attach(frontend: NotebookApp) {
        this.frontend = frontend;
        this.frontend.on('cell:action', action =>
            this.kman && this.handleCellAction(action));
        return this;
    }

    runAll() {
        for (let cell of this.frontend.model.cells) {
            this.runCell(cell);
        }
    }

    runCell(cell: Model.Cell) {
        let ksfh = this.kernel.requestExecute({ code: cell.input });
        ksfh.registerMessageHook(msg => {
            this.processKernelMessage(cell, msg);
            return true;
        });
    }

    runPrerun() {
        let code = this.prerun?.load();
        if (code)
            this.exec(code);
    }

    formatErrorTraceback(traceback: string[]) {
        // hack to remove leading '----' and 'Traceback:' lines
        if (traceback.length > 2) traceback = traceback.slice(2);
        return ansiStrip(traceback.join('\n'));
    }

    userInterrupt() {
        this.kernel.interrupt();
    }

    async chdir(wd: string) {
        await this.kernel.requestExecute({
            code: `import os; os.chdir(${JSON.stringify(wd)})`
        }).done;
    }

    async exec(code: string, options: Partial<KernelMessage.IExecuteRequestMsg['content']> = {}) {
        return await this.kernel.requestExecute({
            code,
            silent: true,
            allow_stdin: false,
            ...options
        }).done;
    }

    async eval(expr: string) {
        let p = await this.kernel.requestExecute({
            code: '',
            user_expressions: {v: expr},
            silent: true,
            allow_stdin: false
        }).done;
        return (p.content as IExecuteReply).user_expressions['v'];
    }

    async evalJson(expr: string) {
        let v = await this.eval(`__import__('json').dumps(${expr})`);
        switch (v['status']) {
        case 'error':
            throw new Error(`${v['ename']}: ${v['evalue']}`);
        case 'ok':
            let text = v?.['data']?.['text/plain'];
            if (typeof text === 'string')
                return JSON.parse(unescapeJs(text.slice(1, -1)));
        }
        throw new Error(`invalid eval response from kernel`);
    }

    private processKernelMessage(cell: Model.Cell, msg: IIOPubMessage<IOPubMessageType>) {
        switch (msg.header.msg_type) {
        case 'status':
            this.frontend.setStatus(cell, (msg as IStatusMsg).content.execution_state);
            break;
        case 'stream':
            this.frontend.writeOutput(cell, (msg as IStreamMsg).content.text);
            break;
        case 'execute_result':
            this.frontend.addResult(cell, (msg as IExecuteResultMsg).content.data);
            break;
        case 'error':
            this.frontend.addError(cell,
                this.formatErrorTraceback((msg as IErrorMsg).content.traceback));
            break;
        }
    }

    private handleCellAction(action: NotebookApp.CellAction) {
        switch (action.type) {
        case 'exec':
        case 'exec-fwd':
            this.runPrerun();
            this.runCell(action.cell);
            break;
        }
    }
}


type KernelStartOptions = {
    wd?: string
    prerun?: StoreBase<string>
}


export { JupyterConnection, KernelStartOptions }