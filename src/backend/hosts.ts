import _ from 'lodash';
import path from 'path';
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

    get active() {
        return this.entries.map(e => e.info);
    }

    async fetch() {
        let entries = this.store.load();
        entries = entries.filter(e =>
            path.basename(e.meta.filename).startsWith('jpserver-'));
        return _.sortBy(entries, e => -e.meta.timestamp);
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