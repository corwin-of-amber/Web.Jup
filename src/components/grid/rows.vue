<template>
    <template v-for="row, i in rows">
        <template v-for="component, j in row">
            <div v-if="component.text" v-text="component.text"
                :class="classFor(component, j)"
                :style="styleFor(component, j)"></div>
            <template v-if="component.subrows">
                <GridRows :rows="component.subrows"
                          :startPos="{row: startPos.row + i, 
                                      col: startPos.col + j}"></GridRows>
            </template>
        </template>
    </template>
</template>

<script lang="ts">
import { Vue, Component, Prop, toNative } from 'vue-facing-decorator';

import type { Cell }  from './index.vue';


@Component({name: 'GridRows'})
class IGridRows extends Vue {
    @Prop rows: any[][]
    @Prop({default: {row: 0, col: 0}})
    startPos: {row: number, col: number}

    classFor(cell: Cell, col: number) {
        let base = Array.isArray(cell.class)
        ? cell.class : cell.class ? [cell.class] : [];
        return base;
        if (this.startPos.col > 0) return base;
        return base.concat(col == 0 ? ['row'] : []);
    }

    styleFor(cell: Cell, col: number) {
        return {'--rowspan': cell.rowspan, 'grid-column': 1 + this.startPos.col + col}
    }
}

export default toNative(IGridRows);
</script>