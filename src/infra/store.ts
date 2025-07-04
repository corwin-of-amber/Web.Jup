import fs from 'fs';


interface Serialization<Doc = any> {
    parse(s: string): Doc
    stringify(d: Doc): string
}

const NOP = new class implements Serialization<string> {
    parse(s: string) { return s; }
    stringify(s: string) { return s; }
}

class VersionedSerialization<Doc = any> implements Serialization<Doc> {
    inner: Serialization<{version: string, data: Doc}>
    version: string

    constructor(version: string, inner: Serialization<{version: string, data: Doc}>) {
        this.inner = inner;
        this.version = version;
    }

    parse(s: string) {
        var d = this.inner.parse(s);
        if (!d.version) {
            console.warn('missing version in serialized document');
            return <any>d;
        }
        if (d.version !== this.version)  /** @todo migration policies */
            throw new Error(`inconsistent versions; expected '${this.version}', got '${d.version}'`);
        return d.data;
    }

    stringify(d: Doc): string {
        return this.inner.stringify({version: this.version, data: d});
    }
}

const DEFAULT_VER = '0.1.0',
      DEFAULT_SER = new VersionedSerialization(DEFAULT_VER, JSON);


interface StoreBase<Doc = any> {
    load(): Doc
    save(p: Doc): void
}

class LocalStore<Doc = any> implements StoreBase<Doc> {
    ser: Serialization
    key: string
    loadedValue: string

    constructor(key: string, ser: Serialization<Doc> = DEFAULT_SER) {
        this.ser = ser;
        this.key = key;
    }

    load(): Doc {
        var l = localStorage[this.key];
        if (l !== undefined) this.loadedValue = l;
        return l === undefined ? undefined : this.ser.parse(l);
    }

    save(d: Doc) {
        if (d !== undefined) localStorage[this.key] = this.ser.stringify(d);
    }

    delete() {
        delete localStorage[this.key];
    }

    revert() {
        if (this.loadedValue) localStorage[this.key] = this.loadedValue;
        else this.delete();
    }
}


class QualifiedLocalStore<Doc = any> extends LocalStore<Doc> {
    constructor(key: string, ser: Serialization<Doc> = DEFAULT_SER) {
        super(null, ser);
        this.key = this.qualify(key); // yes, this is not best
    }

    qualify(key: string) {
        return this.prefix + key;
    }

    get prefix() {
        let p = window['store:prefix'];
        return (typeof p === 'string') ? `${p}:` : '';
    }
}


class FileStore<Doc = any> implements StoreBase<Doc> {
    ser: Serialization
    filename: string
    loadedValue: string

    constructor(filename: string, ser: Serialization<Doc> = DEFAULT_SER) {
        this.ser = ser;
        this.filename = filename;
    }

    load(): Doc {
        var text = fs.readFileSync(this.filename, 'utf-8');
        return this.ser.parse(text);
    }

    save(d: Doc) {
        fs.writeFileSync(this.filename, this.ser.stringify(d));
    }
}


interface SerializationTo<Doc = any, To = string> {
    parse(s: To): Doc
    stringify(d: Doc): To
}

class Nop<T> implements SerializationTo<T, T> {
    parse(s: T) { return s; }
    stringify(d: T) { return d; }
}

class VersionedStore<Doc, To = string, W extends StoreBase<Versioned<To>> = StoreBase<Versioned<To>>>
        implements StoreBase<Doc> {

    inner: W
    ser: SerializationTo<Doc, To>
    current: {timestamp: number, revision: number}

    constructor(inner: W, ser: SerializationTo<Doc, To>) {
        this.inner = inner;
        this.ser = ser;
    }

    load(): Doc {
        let d = this.inner.load();
        if (d && d.revision != this.current?.revision) {
            this.current = this.vertag(d)
            return this.ser.parse(d.data);
        }
        else
            return undefined; /* signifies no new data */
    }

    peek() {
        let d = this.inner.load();
        this.current = d ? this.vertag(d) : undefined;
    }

    save(d: Doc) {
        let data = this.ser.stringify(d);
        this.peek();
        this.inner.save({
            timestamp: Date.now(),
            revision: (this.current?.revision ?? 0) + 1,
            data
        });
    }

    private vertag<T>(d: Versioned<T>): VersionTag {
        return {timestamp: d.timestamp, revision: d.revision};
    }
}

type VersionTag = {timestamp: number, revision: number}
type Versioned<Doc> = VersionTag & {data: Doc};


function persistField<T>(obj: T, key: keyof T, store: StoreBase<any>) {
    var v = store.load();
    if (v !== undefined) obj[key] = v;
    let flush = () => store.save(obj[key]);
    window.addEventListener('beforeunload', flush)
    window.addEventListener('pagehide', flush)
    return flush;
}


export { Serialization, NOP, StoreBase, LocalStore, QualifiedLocalStore,
         FileStore, VersionedStore, Versioned, DEFAULT_SER, persistField }
