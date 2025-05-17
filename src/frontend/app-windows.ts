import { EventEmitter } from 'events';
import { imap } from '../infra/itertools';


declare var nw: any;


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

    getAll(): Promise<Iterable<Window>> {
        return new Promise<Iterable<Window>>(resolve =>
            nw.Window.getAll((wins: Iterable<{window: Window}>) => 
                resolve(imap(wins, w => w.window))));
    }

    async broadcast(msg: any) {
        for (let w of await this.getAll()) {
            w.postMessage(msg, '*');
        }
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

    static instance: ApplicationWindows = undefined
}

type Role = 'master' | 'slave';


export { ApplicationWindows }