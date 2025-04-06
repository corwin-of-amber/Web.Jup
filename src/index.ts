import { IDE } from './ide';
import './index.scss';

import { proxySetup } from './etc/proxy-settings';
import { JupyterHosts } from './backend/hosts';
import { LocalStore, NOP, VersionedStore } from './infra/store';


declare var nw: any;

const WD = 'tmp/scratch';


class ApplicationWindows {
    role: Role

    constructor(role: Role) {
        this.role = role;
        switch (this.role) {
            case 'master':
                this.broadcast({type: 'startup'}); break;
            case 'slave':
                window.addEventListener('message', m =>
                    this.handleSlave(m));
                break;
        }
    }

    broadcast(msg: any) {
        nw.Window.getAll((wins: Iterable<{window: Window}>) => {
            for (let w of wins) {
                w.window.postMessage(msg, '*');
            }
        });
    }

    handleSlave(m: {data: any}) {
        console.log(m.data);
        switch (m.data.type) {
            case 'startup': window.location.reload(); break;
        }
    }
}

type Role = 'master' | 'slave';


async function main() {
    let sp = new URLSearchParams(location.search);
    let slave = sp.has('slave');

    let appwins = new ApplicationWindows(slave ? 'slave' : 'master');
    if (slave)
        window['store:prefix'] = 'slave';

    proxySetup().then(() => console.log('PROXY SET'));

    let ide = new IDE({
        rootDir: WD
    });
    Object.assign(window, {ide, appwins});

    ide.hosts = JupyterHosts.fromFile('tmp/jups');
    ide.hosts.refresh().then(() => ide.updateHostList());

    if (!slave) {
        ide.prerun =
            new VersionedStore(new LocalStore('slave:expose', JSON), NOP);
        ide.start();
    }
}

document.addEventListener('DOMContentLoaded', main);