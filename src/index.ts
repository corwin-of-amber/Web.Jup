import { IDE } from './ide';
import './index.scss';

import { proxySetup } from './etc/proxy-settings';
import { JupyterHosts } from './backend/hosts';
import { ApplicationWindows } from './frontend/app-windows';


const WD = 'tmp/scratch';


async function main() {
    let sp = new URLSearchParams(location.search);
    let slave = sp.has('slave'), master = !slave,
        native = !!process.versions?.nw;

    if (slave)           /* this must be assigned before IDE creation */
        window['store:prefix'] = `slave-${sp.get('slave')}`;
        
    let ide = new IDE({
        rootDir: WD
    });
    Object.assign(window, {ide, ApplicationWindows});
    
    if (sp.has('keyboard')) {
        ide.app.view.options.keyboard.custom = true;
    }

    if (native) {
        let appwins = new ApplicationWindows(slave ? 'slave' : 'master');
        if (slave) {
            appwins.on('bind', ({master}) => ide.connectToMaster(master));
        }
        ApplicationWindows.instance = appwins;

        proxySetup().then(() => console.log('PROXY SET'));

        ide.hosts = JupyterHosts.fromFile('tmp/jups');
        ide.hosts.refresh().then(() => ide.updateHostList());

        if (master) {
            ide.start();
        }
    }
}

document.addEventListener('DOMContentLoaded', main);