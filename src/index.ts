import fs from 'fs';
import { NotebookApp } from './app';
import { JupyterConnection } from './connection';
import './index.scss';


const SERVER = {
    url: 'http://localhost:2088',
    token: undefined
};

const WD = '/Users/corwin/var/workspace/papers/2022/hyper_arbiter/notebooks';


async function main() {
    try {
        SERVER.token ??= fs.readFileSync('.url', 'utf-8');
    }
    catch (e) { console.warn(e); }

    let app = new NotebookApp();
    Object.assign(window, {app});

    let jup = new JupyterConnection(SERVER).attach(app);
    Object.assign(window, {jup});

    await jup.start({wd: WD});

    app.runAll();
}

document.addEventListener('DOMContentLoaded', main);