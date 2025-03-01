import fs from 'fs';
import { IDE } from './ide';
import './index.scss';

import { CodeEditor } from '../packages/vuebook';

import { proxySetup } from './etc/proxy-settings';


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

    proxySetup().then(() => console.log('PROXY SET'));

    let ide = new IDE({
        rootDir: WD
    });
    Object.assign(window, {ide});

    ide.start();

    CodeEditor.lookupCompletions = {
        async get(prefix: string, word: string) {
            try {
                var e = await ide.jup.conn.evalJson(`dir(${prefix})`);
            }
            catch {
                return undefined;
            }
            if (!word.startsWith('_'))
                e = e.filter(w => !w.startsWith('_'));
            return e.map(w => ({label: w}));
        }
    }
}

document.addEventListener('DOMContentLoaded', main);