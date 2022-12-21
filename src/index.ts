
import { NotebookApp } from './app';
import { JupyterConnection } from './connection';
import './index.scss';


const SERVER = {
    url: 'http://localhost:2088',
    token: '4e85e700f95c1b8fa3465ccf4bf9d7a5060d588883080d80'
};

const WD = '/Users/corwin/var/workspace/papers/2022/hyper_arbiter/notebooks';


async function main() {
    let app = new NotebookApp();
    Object.assign(window, {app});

    let jup = new JupyterConnection(SERVER).attach(app);
    Object.assign(window, {jup});

    await jup.start({wd: WD});

    app.runAll();
}

document.addEventListener('DOMContentLoaded', main);