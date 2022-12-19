<template>
    <div class="cell">
        <div class="cell--input" ref="input"></div>
        <div class="cell--output" v-for="out in model.outputs" :data-kind="out.kind">
            <div class="payload">{{ out.payload }}</div>
        </div>
    </div>
</template>

<script lang="ts">
import { CodeEditor } from './editor';

export default {
    props: ['model'],
    mounted() {
        this.editor = new CodeEditor(this.$refs.input, this.model.input);
        this.editor.on('change', () => this.updateModel());
        this.editor.on('action', a => this.$emit('action', a));
        this.$watch(() => this.model.input, v => {
            if (!this._isUpdating) {
                console.warn('--set editor', this.model);
                this.editor.set(v);
            }
        });
    },
    methods: {
        updateModel() {
            this._isUpdating = true;
            this.model.input = this.editor.get();
            Promise.resolve().then(() => this._isUpdating = false);
        }
    }
}
</script>