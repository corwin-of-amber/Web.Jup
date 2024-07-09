import path from 'path';


export function saveFile(filename: string, content: string | Uint8Array) {
    var blob = new Blob([content]), ourl = URL.createObjectURL(blob),
        a = document.createElement('a');
    a.setAttribute('href', ourl);
    a.setAttribute('download', filename);
    a.click();

    setTimeout(() => URL.revokeObjectURL(ourl), EXPIRE);
}

export function saveDialog(filename: string, ext?: string): Promise<FileEx> {
    var input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('nwworkingdir', path.dirname(filename));
    input.setAttribute('nwsaveas', path.basename(filename));
    if (ext) {
        if (!ext.startsWith('.')) ext = '.' + ext;
        input.setAttribute('accept', ext);
    }
    return new Promise(resolve => {
        input.addEventListener('change', () => {
            if (input.files[0]) resolve(input.files[0] as FileEx);
        });
        input.click();
    });
}

/** extended file info returned from NWjs */
export type FileEx = File & {size: number, path: string};

/** max time for save-as interaction */
const EXPIRE = 900000;

