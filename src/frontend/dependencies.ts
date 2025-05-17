import { ViviMap } from '../infra/collections';
import { StoreBase, LocalStore, VersionedStore, NOP } from '../infra/store';
import { Annotations } from './annotations';
import type { NotebookApp } from '../app';


class CrossDeps implements StoreBase<string> {

    app: NotebookApp
    stores: ViviMap<string, StoreBase<string>>

    constructor(app: NotebookApp) {
        this.app = app;
        this.stores = new ViviMap<string, StoreBase<string>>().withFactory(key =>
            new VersionedStore(new LocalStore(`expose:${key}`, JSON), NOP));
    }

    load() {
        let deps = this.app.annotations({type: 'use'})
                .flatMap((x: Annotations.UseAnnotation) => x.modules),
            code = deps.flatMap(m => this.stores.get(this._ext(m)).load() ?? []);

        if (code.length > 0)
            return code.join('\n');
        else
            return undefined;
    }

    save(p: any): void { /*ignore*/ }

    _ext(fn: string) {
        return fn.match(/[.](py|ipynb)$/) ? fn : `${fn}.ipynb`;
    }
}


export { CrossDeps }