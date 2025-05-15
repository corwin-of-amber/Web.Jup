<template>
    <div class="tabular" :style="{'--ncolumns': width,
                                  '--nrows': computedHeight}">
        <GridRows :rows="data"></GridRows>
    </div>
</template>

<style lang="scss">
div.tabular {
    --ncolumns: 10;
    display: grid;
    width: fit-content;
    grid-template-columns: repeat(var(--ncolumns), auto);
    gap: 1px;
    padding: 1px;
    background-color: black;
    > div {
        background-color: white;
        padding: 2px;
        grid-row: span var(--rowspan, 1);
    }

    div.url {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
}
</style>

<script lang="ts">
import _ from 'lodash';
import { Vue, Component, Prop, toNative } from 'vue-facing-decorator';
import GridRows from './rows.vue';

@Component({
    name: "Grid",
    components: { GridRows }
})
class ITabular extends Vue {
    @Prop({default: []})
    data: Cell[][]

    get width() {
        return _.max(this.data.map(r => r.length)) ?? 0;
    }

    get computedHeight() {
        return this.height(this.data);
    }

    height(rows: Cell[][]) {
        return _.sum(rows.map(row => {
            let max = _.max(row.map(cell => {
                if (cell.subrows) return this.height(cell.subrows);
                else return 1;
            }));
            for (let cell of row) {
                cell.rowspan = max;
            }
            return max;
        }));
    }    
}

type Cell = {
    text?: string
    subrows?: Cell[][]

    class?: string | string[]
    rowspan?: number
}
//({text: string, class?: string | string[]} |
// {subrows: string[]}) & {rowspan?: number}


export { ITabular, Cell }
export default toNative(ITabular)
</script>