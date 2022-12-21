<template>
    <div class="notebook">
        <div v-for="cell in model.cells" :key="key(cell)">
            <cell :model="cell" ref="cells" @action="cellAction(cell, $event)"/>
        </div>
    </div>
</template>

<script lang="ts">
import { NotebookApp } from '../app';
import Cell from './cell.vue';

export default {
    props: ['model'],
    created() {
        this._keys = new Map;
    },
    methods: {
        cellAction(cell: NotebookApp.Cell, action) {
            this.$emit('cell:action', {cell, ...action});
        },
        key(cell: NotebookApp.Cell) {
            let v = this._keys.get(cell);
            if (v === undefined) {
                v = Math.max(0, ...this._keys.values()) + 1;
                this._keys.set(cell, v);
            }
            return v;
        }
    },
    components: { Cell }
}
</script>