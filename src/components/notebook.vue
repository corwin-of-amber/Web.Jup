<template>
    <div class="notebook">
        <div v-for="cell in model.cells">
            <cell :model="cell" :ref="register"/>
        </div>
    </div>
</template>

<script lang="ts">
import Cell from './cell.vue';

export default {
    props: ['model', 'cells'],
    methods: {
        register(cell) {
            this._cells ??= new Map;
            this._cells.set(cell.model, cell);
        },
        updateAll() {
            for (let cell of this._cells.values()) {
                cell.updateModel();
            }
        }
    },
    components: { Cell }
}
</script>