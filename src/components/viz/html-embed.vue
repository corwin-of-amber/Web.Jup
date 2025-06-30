<template>
    <div class="html-embed" :class="{[status]: true}">HTML Embed</div>
</template>

<style>
.html-embed.stale::after {
    content: '...';
}
</style>

<script lang="ts">
import { Vue, Component, Prop, toNative } from 'vue-facing-decorator';

@Component
class IHTMLEmbed extends Vue {
    @Prop element: HTMLElement

    mounted() {
        this.$watch('element', el => {
            this.$el.innerHTML = '';
            if (el instanceof Node)
                this.$el.appendChild(el);
        }, {immediate: true});
    }

    get status() {
        return (this.element === undefined) ? 'vacant' :
                (this.element instanceof Node) ? 'active' : 'stale';
    }
}

export { IHTMLEmbed }
export default toNative(IHTMLEmbed)
</script>