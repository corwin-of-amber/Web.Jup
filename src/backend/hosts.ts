import _ from 'lodash';
import path from 'path';
import child_process from 'child_process';
import { FileStore, StoreBase } from '../infra/store';


class JupyterHosts {

    store: StoreBase<Entry[]>
    entries: Entry[] = []

    constructor(store: StoreBase<Entry[]>) {
        this.store = store;
    }

    async refresh() {
        /** @todo filter and sort by timestamp */
        this.entries = await this.fetch();
        return this;
    }

    async refreshRemote() {
        this.entries = await this.fetchRemote();
        return this;
    }

    get active() {
        return this.entries.map(e => e.info);
    }

    async fetch() {
        let entries = this.store.load();
        entries = entries.filter(e =>
            path.basename(e.meta.filename).startsWith('jpserver-'));
        return _.sortBy(entries, e => -e.meta.timestamp);
    }

    async fetchRemote() {
        let out = await new Promise<string>((resolve, reject) =>
            /** @todo this is oddly specific */
            child_process.execFile('newton', ['var/scripts/list-jups'], {encoding: 'utf8'},
                (err, stdout, stderr) => {
                    if (stderr) console.warn('[remotes]', stderr);
                    if (err) reject(err);
                    else resolve(stdout);
                }));
        
        this.store.save(JSON.parse(out));
        return await this.fetch();
    }

    formatForDisplay() {
        let df = new Intl.DateTimeFormat('en', {hour: 'numeric', minute: 'numeric', month: 'numeric', day: 'numeric', hour12:false});
        return this.entries.map(({info, meta}, i) =>
            `[${i}] ${info.hostname} (${df.format(meta.timestamp * 1000)})`);
    }

    static fromFile(filename: string) {
        return new this(new FileStore<Entry[]>(filename, JSON));
    }
}

import Entry = JupyterHosts.Entry

namespace JupyterHosts {
    /**
     * Running instance info, as saved in Jupyter's `runtime` dir.
     */
    export type RuntimeInfo = {
        hostname: string
        port: number
        token: string

        pid: number
        root_dir: string
        sock: string
        password: boolean
        secure: boolean
        base_url: string
        url: string
        version: string
    };

    export type Entry = {
        meta: { filename: string, timestamp: number }
        info: RuntimeInfo
    }

}



export { JupyterHosts }