<template>
    <div class="virtual-keyboard" @mousedown.prevent @touchstart.prevent>
        <div v-for="row, i in keys" class="key-row"
                :style="{'--i': i, '--len': row.keys.length}">
            <div v-for="key in row.keys" class="key"
                :class="classFor(key)" v-html="htmlFor(key)"
                @mousedown="send(key)" @touchstart="send(key)">
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
div.virtual-keyboard {
    /* @todo customizable font/color theme */
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    font-size: 13px;
    line-height: 0.9;

    background: #ddd;
    position: fixed;
    bottom: 0px;
    left: 0px; right: 0px;
    padding: 4px;

    > .key-row {
        width: fit-content;
        display: grid;
        grid-template-columns: repeat(var(--len), auto);
        gap: 3px;
        padding: 1.5px 2px;

        padding-left: calc(var(--i) * 1em);

        .key {
            background-color: white;
            text-align: center;
            padding: 9px 0;
            box-shadow: black 0px 0px 9px 0px inset;
            border-radius: 9px;
            outline: 1px solid #aaa;
            cursor: pointer;

            &:not(.wide) {
                width: 2em;
            }
            &.wide {
                padding: 9px;
            }
            &.sep {
                box-shadow: none;
                outline: none;
                background: none;
                width: 1em;
            }
            &.bar {
                min-width: 5em;
            }
        }
    }
}
</style>

<script lang="ts">
import { Vue, Component, Prop, toNative } from 'vue-facing-decorator';
import type { Key, KeyRow } from './layout';
import { sendKey } from './send';

@Component
class IKeyboard extends Vue {
    @Prop
    keys: KeyRow[]

    classFor(key: Key) {
        return typeof key === 'string' ? {} : key.class;
    }

    htmlFor(key: Key) {
        return typeof key === 'string' ? key : key.html;
    }

    send(key: Key) { sendKey(key); }
}

export { IKeyboard, KeyRow, Key }
export default toNative(IKeyboard)
</script>
