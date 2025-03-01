#!/usr/bin/env node

import fs from 'fs';

for (let arg of process.argv.slice(2)) {
    let mo = arg.match(/^file:\/\/(.*)$/);
    if (mo) {
        mo = fs.readFileSync(mo[1], 'utf-8').match(/a href=".*token=(.*?)"/);
        if (mo) fs.writeFileSync(".url", mo[1]);
    }
}