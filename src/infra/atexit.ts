
var handlers: [string, Op][] = undefined;

function atexit(op: Op, rank: string | object = 'general') {
    if (typeof rank === 'object')
        rank = rank.constructor.name;
    if (!handlers) {
        handlers = [];
        window.addEventListener('beforeunload', cleanup);
    }
    handlers.push([rank, op]);
}

function cleanup() {
    for (let [rank, op] of handlers) {
        try { op(); }
        catch (e) {
            console.error(`Error in finalizer [${rank}]`, e);
        }
    }
}

type Op = () => void


export default atexit