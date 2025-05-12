<template>
    <Notebook ref="notebook" :model="model" :options="options"
        @cell:action="$emit('cell:action', $event)"></Notebook>
    <CommandPalette ref="commands" :commands="commandNav.toc[commandNav.current]"
        @command="handleCommand($event)"></CommandPalette>
</template>

<script lang="ts">
import { Vue, toNative, Ref, Prop, Component } from 'vue-facing-decorator';
import { Notebook, CommandPalette, INotebook, ICommandPalette }
    from '../../packages/vuebook';
import { Options, Model as M } from '../../packages/vuebook';


/** @note important -- must use *exact* same ver as vuebook */
import { useCommandState } from 'vue-command-palette';


@Component({
    emits: ['cell:action', 'command'],
    components: { Notebook, CommandPalette }
})
class IApp extends Vue {
    @Ref notebook: INotebook
    @Ref commands: ICommandPalette
    @Ref remoteHosts: ICommandPalette

    model: M.Notebook = {cells: []}
    options: Partial<Options> = {
        collapsible: false,
        editor: {completions: [], virtualKeyboard: false}
    }
    
    commandNav = {
        current: '/',
        toc: {
            '/':       [['New', 'Open...', 'Save', 'Save As...'], ['New Window (slave)'], ['Connect to Remote...']],
            '/remote': [['newton'], ['Refresh...']]
        },
        state: useCommandState()
    }

    mounted() {
        this.$watch(() => this.commands.isOpen,
            isOpen => { if (!isOpen) this.commandNav.state.resetStore(); });
    }

    commandBar(at = '/') {
        this.commandNav.current = at;
        requestAnimationFrame(() => this.commands.open());
    }

    handleCommand(cmd: {command: string}) {
        let ctx = this.commandNav.current;
        this.$emit('command', ctx == '/' ? cmd : {command: ctx, arg: cmd.command});
    }
}

export { IApp }
export default toNative(IApp)
</script>
