import { ServerConnection, KernelManager } from '@jupyterlab/services';


const URL = 'http://localhost:2088',
      TOKEN = '6af40fe6ab2408f1e2584f0d3251b0aee36fa41c7feca493'


function main() {
    // Configure the server connection
    const serverSettings = ServerConnection.makeSettings({
        baseUrl: URL,
        token: TOKEN
    });

    const kman = new KernelManager({ serverSettings });

    // Connect to the server and create a new kernel
    kman.startNew({}).then(kernel => {
        // Execute some code in the kernel
        Object.assign(window, {kernel});

        let ksfh = kernel.requestExecute({ code: 'print("Hello, Jupyter!")' });
        ksfh.registerMessageHook(msg => { console.log(msg); return true; });

        window.addEventListener('beforeunload', () => kernel.dispose());
    });
}

document.addEventListener('DOMContentLoaded', main);