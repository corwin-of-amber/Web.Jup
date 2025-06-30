/** 
 * For this to work, the versions of `@codemirror/language` and
 * all of its dependencies must match the ones used by `vuebook`.
 * When using a submodule, there is no way to specify this constraint
 * within npm.
 * 
 * Versions can be extracted by running `etc/sync-codemirror-versions.js`.
 * @todo make this more automated
 */
import { javascriptLanguage } from '@codemirror/lang-javascript';
import { CodeEditor } from '../../packages/vuebook/src';


function install() {
    CodeEditor.Languages['javascript'] = [javascriptLanguage.extension];
}


export { install }