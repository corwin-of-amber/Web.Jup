<template>
    <Notebook ref="notebook" :model="model" :options="options"
        @cell:action="companion.handleCellAction($event)"></Notebook>
    <CommandPalette ref="commands" :commands="commandList"></CommandPalette>
</template>

<script lang="ts">
import { Vue, toNative, Ref, Prop, Component } from 'vue-facing-decorator';
import { Notebook, CommandPalette, INotebook, ICommandPalette }
    from '../../packages/vuebook';
import { Model as M } from '../../packages/vuebook';

@Component({
    components: { Notebook, CommandPalette }
})
class IApp extends Vue {
    @Ref notebook: INotebook
    @Ref commands: ICommandPalette

    @Prop companion: any
    model: M.Notebook = {cells: []}
    options = {collapsible: false}

    commandList = ['Open...', 'Save', 'Save As...', 'New Window (slave)']
}

export { IApp }
export default toNative(IApp)
</script>
