import vm from 'vm';


namespace Annotations {

    export interface Annotation {
        type: string
    }

    export interface UseAnnotation extends Annotation {
        modules: string[]
    }

    export function array<T>(r: T | T[]): T[] {
        return r ? Array.isArray(r) ? r : [r] : [];
    }

    export let context = vm.createContext({
        use(...modules: (string | string[])[]): UseAnnotation {
            return {
                type: 'use',
                modules: modules.flatMap(array)
            };
        }
    });

    /**
     * Extracts annotations of the form `#!func(...args)` and evaluates
     * them in the annotations context.
     * 
     * @returns an array of annotations obtained from evaluation
     */
    export function parse(text: string): Annotation[] {
        let ctx = Annotations.context,
            collected = [] as Annotation[];
        for (let mo of text.matchAll(/^#!\s*(.*)/mg)) {
            try {
                let res = new vm.Script(mo[1]).runInContext(ctx);
                for (let a of Annotations.array(res)) {
                    collected.push(a);
                }
            }
            catch (e) { 
                console.warn(`error in annotation '${mo[0]}'`, e);
            }
        }

        return collected;        
    }
}

export { Annotations }