import vm from 'vm';

import jstokens from 'js-tokens';
import { IMimeBundle } from '@jupyterlab/nbformat';

import type { Model } from '../../packages/vuebook';
import { NotebookApp } from '../app';


class JsInterpreter {
    frontend: NotebookApp

    attach(frontend: NotebookApp) {
        this.frontend = frontend;
        this.frontend.on('cell:action', action =>
            this.handleCellAction(action));
        return this;
    }

    runCell(cell: Model.Cell) {
        try {
            /** @todo which context? */
            let result = new vm.Script(this.preprocess(cell.input))
                .runInThisContext({filename: 'this cell'});
            if (result !== undefined)
                this.frontend.addResult(cell, this.formatResult(result));
        }
        catch (e) {
            this.frontend.addError(cell, e.toString());
        }
    }

    private stripAnnotations(code: string) {
        return code.replaceAll(/^#!.*/gm, '//')
    }

    private preprocess(js: string) {
        js = this.stripAnnotations(js);
        let blk = Preprocess.lastBlock(js);
        if (blk) {
            let s = js.slice(blk[0], blk[1]);
            if (Preprocess.isObjectLiteral(s))
                js = Preprocess.splice(js, blk[0], blk[1], `(${s})`);
        }
        return js;
    }

    private formatResult(value: any): IMimeBundle {
        if (value instanceof HTMLElement) {
            return {'application/vue3': {
                is: 'HTMLEmbed',
                props: {element: value as any}
            }};
        }
        if (typeof value === 'object') {
            let s = `${value.constructor.name} {${
                Object.keys(value).map(k => `${k}: ..`).join(', ')}}`
            return {'text/plain': s};    
        }
        return {'text/plain': value.toString()};
    }

    private handleCellAction(action: NotebookApp.CellAction) {
        if (action.cell.kind === 'code/javascript') {
            this.runCell(action.cell);
        }
    }
}


namespace Preprocess {

    /** Locates the last top-level block (if any) */
    export function lastBlock(js: string) {
        let bal = 0, idx = 0, blk = [];
        for (let tok of jstokens(js)) {
            if (tok.value == '{' && bal == 0) blk = [idx];
    
            if (tok.value == '{') bal++;
            else if (tok.value == '}') bal--;
    
            idx += tok.value.length;
            
            if (tok.value == '}' && bal == 0) blk = [blk[0],idx];
        }

        return blk.length == 2 ? blk : undefined;
    }

    /** Heuristic to detect an object literal based on the first few tokens */
    export function isObjectLiteral(js: string) {
        let pat = OBJECT_LITERAL_PAT, state = 0;
        for (let tok of jstokens(js)) {
            if (tok.type == 'WhiteSpace') continue;
            if (pat[state](tok)) {
                if (++state >= pat.length) return true;
             }
             else return false;
        }
        return false;
    }

    /** splice() for strings */
    export function splice(s: string, start: number, end: number, ss: string) {
        return s.slice(0, start) + ss + s.slice(end);
    }

    const OBJECT_LITERAL_PAT: ((t: jstokens.Token) => boolean)[] = [
        (t => '{' == t.value), 
        (t => ['IdentifierName', 'StringLiteral'].includes(t.type)),
        (t => ':' == t.value)
    ];

}

export { JsInterpreter }