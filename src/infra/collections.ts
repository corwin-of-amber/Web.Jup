import { ifilter, imap } from "./itertools";


class ViviMap<K, V> extends Map<K, V> {
    factory: (key: K) => V = () => undefined;

    withFactory(factory: (key: K) => V) {
        this.factory = factory;
        return this;
    }

    get(key: K) {
        var v = super.get(key);
        if (v === undefined)
            super.set(key, v = this.factory(key));
        return v;
    }
}

function mapValues<K,V,VV>(m: Map<K, V>, f: (v: V) => VV): Map<K, VV> {
    return new Map(imap(m.entries(), ([k,v]) => [k, f(v)]));
}

function filterKeys<K,V>(m: Map<K, V>, p: (k: K) => boolean): Map<K,V> {
    return new Map(ifilter(m.entries(), ([k,_]) => p(k)));
}


export { ViviMap, mapValues, filterKeys }