import { ServerConnection, KernelManager } from '@jupyterlab/services';
import { IKernelConnection } from '@jupyterlab/services/lib/kernel/kernel';
import { IErrorMsg, IExecuteResultMsg, IIOPubMessage, IOPubMessageType, IStreamMsg } from '@jupyterlab/services/lib/kernel/messages';
import ansiStrip from 'strip-ansi';
import { NotebookApp } from './app';


class JupyterConnection {
    frontend: NotebookApp
    kman: KernelManager
    kernel: IKernelConnection

    constructor(server: {url: string, token: string}) {
        const serverSettings = ServerConnection.makeSettings({
            baseUrl: server.url,
            token: server.token
        });
    
        this.kman = new KernelManager({ serverSettings });
    }

    async start() {
        this.kernel = await this.kman.startNew({});
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

    runCell(cell: NotebookApp.Cell) {
        let ksfh = this.kernel.requestExecute({ code: cell.input });
        ksfh.registerMessageHook(msg => {
            this.processKernelMessage(cell, msg);
            return true;
        });
    }

    formatErrorTraceback(traceback: string[]) {
        return ansiStrip(traceback.slice(2).join('\n'));
    }

    private processKernelMessage(cell: NotebookApp.Cell, msg: IIOPubMessage<IOPubMessageType>) {
        console.log(msg);
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


export { JupyterConnection }