
class Retrying {

    era: number = 0  /* just a running index to flag stop */

    async repeatedly<T>(op: () => Promise<T>, wait: number): Promise<T> {
        let cur = ++this.era;
        while (this.era === cur) {
            try {
                return await op();
            }
            catch (e) { console.log('retry'); await delay(wait); }
        }
    }

    stop() {
        this.era++;
    }
}


const delay = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms));


export { Retrying, delay }