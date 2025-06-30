/**
 * This script is used to force the versions of CodeMirror packages
 * to match those of `vuebook` (which resides in a submodule).
 */

import fs from 'fs';

const SUBMOD = 'packages/vuebook',
      PKGS =  ['@codemirror/state', '@codemirror/view', '@codemirror/language',
               '@lezer/common', '@lezer/highlight', '@lezer/lr' /* 'style-mod' also? */];

function main() {
    let plj = JSON.parse(fs.readFileSync(`${SUBMOD}/package-lock.json`, 'utf-8'));

    for (let pkg of PKGS) {
        console.log(pkg, plj['packages'][`node_modules/${pkg}`]?.version)
    }
}


main();
