import _ from 'lodash';

type KeyRow = {keys: Key[]}
type Key = string | {
    role?: string,
    html: string,
    class?: string | string[],
    text?: string,
    code?: {s: string, n: number}
};


const QWERTY: KeyRow[] = [
    {keys: [..."qwertyuiop"]},
    {keys: [..."asdfghjkl"]},
    {keys: [..."zxcvbnm"]}
]

const BKRT: KeyRow[] = [
    {keys: [{html: 'BK', code: {s: 'Backspace', n: 8}, class: 'wide'}]},
    {keys: [{html: 'RET', code: {s: 'Enter', n: 13}, class: 'wide'}]}
]

const PUNCT: KeyRow[] = [
    {keys: [...":,", {html: "[ _ ]", text: " ", class: ['wide', 'bar']}, ...".()"]}
]

const SEP: Key = {html: '', class: 'sep'}

const SEPCOL: KeyRow[] = [
    {keys: [SEP]}, {keys: [SEP]}, {keys: [SEP]}
]

function weld(...blocks: KeyRow[][]) {
    return _.zipWith(...blocks, (...a) => ({
        keys: [].concat(...a.map(row => row?.keys ?? []))
    }));
}

export { KeyRow, Key, QWERTY, BKRT, SEP, SEPCOL, PUNCT, weld }