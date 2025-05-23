import { IMimeBundle } from '@jupyterlab/nbformat';


class Vue3DisplayFormat {

    parser = new DOMParser

    formatResult(result: IMimeBundle): IMimeBundle | undefined {
        let html = result['text/html'];
        if (typeof html == 'string' && html.match(/^<\!DOCTYPE/)) {
            let xml = this.parseXML(html);
            if (xml)
                return {[`application/${xml.type}`]: {
                    is: xml.root.tagName,
                    props: this.formatData(xml.root)
                }};
        }
        else
            return undefined;
    }

    parseXML(s: string) {
        let doc = this.parser.parseFromString(s, 'application/xml'),
            dt = doc.firstChild;
        if (dt.nodeType == Node.DOCUMENT_TYPE_NODE) {
            return {type: dt.nodeName, root: doc.firstElementChild}
        }
        else  /* DOMParser reports error as HTML doc */
            console.error('XML parse error', s, doc);
    }

    parseData(s: string) {
        try {
            return JSON.parse(s);
        }
        catch (e) {
            console.error('JSON parse error', s, e);
            return {};
        }
    }

    formatData(root: Element) {
        let json = this.parseData(root.textContent);
        /** @todo check root attributes to select format adapter */
        return this.formatTabularGrid(json);
    }

    formatTabularGrid(json: any) {
        function rows(data: any[][], i=0) {
            if (i >= json.index.length)
                return data.map(row => row.map(cell => ({text: cell})))
            else
                return data.map(([key, subrows]) =>
                    [{text: key}, {subrows: rows(subrows, i + 1)}])
        }

        let x = [
            [...json.index, ...json.columns].map(x => ({text: x})),
            ...rows(json.data)
        ];
        return {data: x};
    }
}


export { Vue3DisplayFormat }