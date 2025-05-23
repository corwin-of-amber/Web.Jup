import { JupyterConnection } from "./backend/connection";


class JupyterAutocomplete {

    jup: JupyterConnection

    constructor(jup: JupyterConnection) {
        this.jup = jup;
    }

    async get(prefix: string, word: string) {
        if (prefix.length > 0 || word.length > 0) {
            try {
                var e: string[] =
                    await this.jup.evalJson(`dir(${prefix})`);
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


export { JupyterAutocomplete }