import { ServerConnection, KernelManager } from '@jupyterlab/services';
import { IKernelConnection } from '@jupyterlab/services/lib/kernel/kernel';
import { IErrorMsg, IExecuteReply, IExecuteResultMsg, IIOPubMessage, IOPubMessageType, IStreamMsg } from '@jupyterlab/services/lib/kernel/messages';
import ansiStrip from 'strip-ansi';
import unescapeJs from 'unescape-js';

import { Model } from '../../packages/vuebook';
import type { NotebookApp } from '../app';


class JupyterConnection {
    frontend: NotebookApp
    kman: KernelManager
    kernel: IKernelConnection

    connect(server: URL | {baseUrl: string, token?: string}) {
        if (server instanceof URL)
            server = {
                baseUrl: server.origin,
                token: server.searchParams.get('token')
            };
        
        this.kman = new KernelManager({
            serverSettings: ServerConnection.makeSettings(server)
        });
    }

    async start(options: KernelStartOptions = {}) {
        this.kernel = await this.kman.startNew({});
        if (options.wd) this.chdir(options.wd);
        window.addEventListener('beforeunload', () => this.kernel.shutdown());
    }

    attach(frontend: NotebookApp) {
        this.frontend = frontend;
        this.frontend.on('cell:action', action =>
            this.handleCellAction(action));
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
            this.runCell(action.cell);
            break;
        }
    }
}


type KernelStartOptions = {
    wd?: string
}


export { JupyterConnection, KernelStartOptions }