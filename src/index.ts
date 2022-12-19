
import { NotebookApp } from './app';
import { JupyterConnection } from './connection';


const SERVER = {
    url: 'http://localhost:2088',
    token: 'bb58b1459207f3b6be4c90ace8cae53bf0e9084ca5946b1e'
};

async function main() {
    let app = new NotebookApp();
    Object.assign(window, {app});

    app.model.cells[0].input = 'print("hola")';
    app.model.cells.push(app.mkCodeCell('6 + 7'))

    let jup = new JupyterConnection(SERVER).attach(app);
    Object.assign(window, {jup});

    await jup.start();

    jup.runAll();

    /*
    // Connect to the server and create a new kernel
    kman.startNew({}).then(kernel => {
        // Execute some code in the kernel
        Object.assign(window, {kernel});

        for (let cell of app.model.cells) {

            let ksfh = kernel.requestExecute({ code: cell.input });
            ksfh.registerMessageHook(msg => {
                console.log(msg);
                switch (msg.header.msg_type) {
                case 'stream':
                    app.writeOutput(cell, (msg as IStreamMsg).content.text);
                    break;
                case 'execute_result':
                    app.addResult(cell, (msg as IExecuteResultMsg).content.data);
                    break;
                }
                return true;
            });
        }

        window.addEventListener('beforeunload', () => { kernel.dispose(); kernel.shutdown(); });
    });*/
}

document.addEventListener('DOMContentLoaded', main);