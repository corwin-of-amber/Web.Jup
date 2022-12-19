
import { NotebookApp } from './app';
import { JupyterConnection } from './connection';
import './index.scss';


const SERVER = {
    url: 'http://localhost:2088',
    token: 'bb58b1459207f3b6be4c90ace8cae53bf0e9084ca5946b1e'
};

async function main() {
    let app = new NotebookApp();
    Object.assign(window, {app});

    app.model.cells[0].input = 'from z3 import *';
    app.model.cells.push(app.mkCodeCell('x = Int("x"); x'))
    app.model.cells.push(app.mkCodeCell('ForAll([x], x * 6 + 4 - 0)'))

    let jup = new JupyterConnection(SERVER).attach(app);
    Object.assign(window, {jup});

    await jup.start();

    jup.runAll();
}

document.addEventListener('DOMContentLoaded', main);