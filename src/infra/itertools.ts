
function *enumerate<T>(iterable: Iterable<T>): Generator<[number, T]> {
    let i = 0;
    for (let el of iterable) yield [i++, el];
}

function *imap<T,S>(iterable: Iterable<T>, f: (t: T) => S): Generator<S> {
    for (let t of iterable) yield f(t);
}

function *ifilter<T>(iterable: Iterable<T>, p: (t: T) => boolean): Generator<T> {
    for (let t of iterable) if (p(t)) yield t;
}

function ifind<T>(iterable: Iterable<T>, p: (t: T) => boolean) {
    for (let t of iterable) if (p(t)) return t;
}


export { enumerate, imap, ifilter, ifind }