import fs from 'fs';
import { IDE } from './ide';
import './index.scss';


const SERVER = {
    url: 'http://localhost:2088',
    token: undefined
};

const WD = 'tmp/scratch';


async function main() {
    try {
        SERVER.token ??= fs.readFileSync('.url', 'utf-8');
    }
    catch (e) { console.warn(e); }

    let ide = new IDE({
        rootDir: WD
    });
    Object.assign(window, {ide});

    ide.start();
}

document.addEventListener('DOMContentLoaded', main);