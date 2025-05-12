<template>
    <div class="tabular" :style="{'--ncolumns': width}">
        <template v-for="row in data">
            <template v-for="component, i in row">
                <div v-if="component.text" v-text="component.text"
                    :class="classFor(component, i)"
                    :style="styleFor(component, i)"></div>
                <template v-if="component.subrows">
                    <template v-for="subrow in component.subrows">
                        <div v-for="cell in subrow" v-text="cell"></div>
                    </template>
                </template>
            </template>
        </template>
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
    }

    div.row {
        grid-column: 1;
        grid-row: span var(--rowspan, 1);
    }
    div.subrow {
        grid-column: 2;
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


@Component
class ITabular extends Vue {
    @Prop({default: []})
    data: Cell[][]

    get width() {
        return _.max(this.data.map(r => r.length)) ?? 0;
    }

    classFor(cell: Cell, col: number) {
        let base = Array.isArray(cell.class)
            ? cell.class : cell.class ? [cell.class] : [];
        return base.concat(col == 0 ? ['row'] : []);
    }

    styleFor(cell: Cell, col: number) {
        return {'--rowspan': cell.rowspan}
    }
}

type Cell = {
    text?: string
    subrows?: string[]

    class?: string | string[]
    rowspan?: number
}
//({text: string, class?: string | string[]} |
// {subrows: string[]}) & {rowspan?: number}


export { ITabular, Cell }
export default toNative(ITabular)
</script>