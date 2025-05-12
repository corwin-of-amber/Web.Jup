import { IDE } from './ide';
import './index.scss';

import { proxySetup } from './etc/proxy-settings';
import { JupyterHosts } from './backend/hosts';
import { LocalStore, NOP, VersionedStore } from './infra/store';
import { EventEmitter } from 'events';


declare var nw: any;

const WD = 'tmp/scratch';


class ApplicationWindows extends EventEmitter {
    role: Role

    master: Window

    constructor(role: Role) {
        super();
        this.role = role;
        switch (this.role) {
            case 'master':
                window.addEventListener('message', m =>
                    this.handleMaster(m));
                this.broadcast({type: 'startup'});
                break;
            case 'slave':
                window.addEventListener('message', m =>
                    this.handleSlave(m));
                this.broadcast({type: 'announce'});
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

    handleMaster(m: MessageEvent<any>) {
        console.log(m.data, m.source);
        switch (m.data.type) {
            case 'announce':
                (m.source as Window).postMessage({type: 'bind'}, '*');
                break;
        }
    }

    handleSlave(m: MessageEvent<any>) {
        console.log(m.data);
        switch (m.data.type) {
            case 'startup': window.location.reload(); break;
            case 'bind':
                this.master = m.source as Window;
                this.emit('bind', {master: this.master});
                break;
        }
    }
}

type Role = 'master' | 'slave';


async function main() {
    let sp = new URLSearchParams(location.search);
    let slave = sp.has('slave'), master = !slave,
        native = !!process.versions?.nw;

    if (slave)
        window['store:prefix'] = 'slave';  /* this must be assign before IDE */
        
    let ide = new IDE({
        rootDir: WD
    });
    Object.assign(window, {ide});
    
    if (native) {
        let appwins = new ApplicationWindows(slave ? 'slave' : 'master');
        if (slave) {
            appwins.on('bind', ({master}) => ide.connectToMaster(master));
        }

        proxySetup().then(() => console.log('PROXY SET'));

        ide.hosts = JupyterHosts.fromFile('tmp/jups');
        ide.hosts.refresh().then(() => ide.updateHostList());

        if (master) {
            ide.prerun =
                new VersionedStore(new LocalStore('slave:expose', JSON), NOP);
            ide.start();
        }
    }
}

document.addEventListener('DOMContentLoaded', main);