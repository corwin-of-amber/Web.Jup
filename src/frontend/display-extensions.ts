import { IMimeBundle } from '@jupyterlab/nbformat';


class Vue3DisplayFormat {

    parser = new DOMParser

    formatResult(result: IMimeBundle): IMimeBundle | undefined {
        let html = result['text/html'];
        if (typeof html == 'string') {
            let mo = html.match(/^<\?DOCTYPE (.*?)>(.*)/);
            if (mo) {
                let xml = this.parseXML(mo[2]);
                if (xml)
                    return {[`application/${mo[1]}`]: {
                        is: xml.tagName,
                        props: this.parseData(xml.textContent)
                    }};
            }
        }
        else
            return undefined;
    }

    parseXML(s: string) {
        let doc = this.parser.parseFromString(s, 'application/xml'),
            tag = doc.firstElementChild.tagName;
        if (tag === 'html')  /* DOMParser reports error as HTML doc */
            console.error('XML parse error', s, doc);
        else
            return doc.firstElementChild;
    }

    parseData(s: string) {
        try {
            return {data: JSON.parse(s)};
        }
        catch (e) {
            console.error('JSON parse error', s, e);
            return {};
        }
    }
}


export { Vue3DisplayFormat }