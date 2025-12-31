<script lang="ts">
    import { Settings, User, Sparkles, BookOpen, Skull } from 'lucide-svelte';
    import Modal from '$lib/components/common/Modal.svelte';
    import { t } from 'svelte-i18n';

    interface Props {
        isOpen: boolean;
        characterData: any; // Full character object
        onClose: () => void;
        onSave: (updates: any) => void;
    }

    let {
        isOpen = false,
        characterData = null,
        onClose,
        onSave
    }: Props = $props();

    // Editable fields
    let playerName = $state('');
    let magicSystem = $state<'standard' | 'forbidden_rules' | 'uncanny_arcana'>('standard');

    let MAGIC_SYSTEM_OPTIONS = [
        {
            value: 'standard',
            label: 'Standard',
            desc: 'Sistema de magia padrão do Shadow of the Demon Lord.',
            icon: BookOpen,
            disabled: false
        },
        {
            value: 'forbidden_rules',
            label: 'Forbidden Rules',
            desc: 'Coming Soon',
            icon: Skull,
            disabled: true
        },
        {
            value: 'uncanny_arcana',
            label: 'Uncanny Arcana',
            desc: 'Coming Soon',
            icon: Sparkles,
            disabled: true
        }
    ];

    $effect(() => {
        if (isOpen && characterData) {
            playerName = characterData.playerName || '';
            magicSystem = characterData.magicSystem || 'standard';
        }
    });

    function handleSave() {
        onSave({
            playerName,
            magicSystem
        });
    }
</script>

<Modal {isOpen} {onClose} title="⚙️ {$t('character.settings.title_label')}" maxWidth="max-w-md">
    <div class="space-y-6">
        <!-- Player Name -->
        <div>
            <label for="settings-player-name" class="text-xs text-slate-500 uppercase font-black block mb-1 tracking-widest flex items-center gap-1">
                <User size={12} /> {$t('character.settings.player_name')}
            </label>
            <input
                id="settings-player-name"
                class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500 transition-colors"
                placeholder="Seu nome ou apelido"
                bind:value={playerName}
            />
            <p class="text-[10px] text-slate-500 mt-1">O nome do jogador associado a este personagem.</p>
        </div>

        {#if characterData?.system === 'sofdl'}
            <div class="space-y-3 pt-4 border-t border-slate-800">
                <label class="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Sparkles size={14}/> {$t('character.settings.magic_system')}
                </label>
                <div class="grid grid-cols-1 gap-3">
                    {#each MAGIC_SYSTEM_OPTIONS as option}
                        <button
                            class="flex items-start gap-4 p-4 rounded-xl border text-left transition-all {magicSystem === option.value ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'} {option.disabled ? 'opacity-50 cursor-not-allowed' : ''}"
                            onclick={() => !option.disabled && (magicSystem = option.value as any)}
                            disabled={option.disabled}
                        >
                            <div class="mt-1 p-2 rounded-lg bg-slate-800 {magicSystem === option.value ? 'text-indigo-400' : 'text-slate-500'}">
                                <option.icon size={20} />
                            </div>
                            <div class="flex-1">
                                <h4 class="font-bold text-sm mb-1">{option.label}</h4>
                                <p class="text-[10px] opacity-70 leading-relaxed">{option.desc}</p>
                            </div>
                            {#if magicSystem === option.value}
                                <div class="ml-auto flex items-center h-full self-center">
                                    <div class="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                </div>
                            {/if}
                        </button>
                    {/each}
                </div>
            </div>
        {/if}

    </div>

    <div class="flex flex-col-reverse sm:flex-row gap-3 mt-8">
        <button onclick={onClose} class="flex-1 bg-slate-700 hover:bg-slate-600 transition-all py-4 sm:py-3 rounded-xl text-white font-bold active:scale-95">{$t('common.buttons.cancel') || 'Cancelar'}</button>
        <button onclick={handleSave} class="flex-1 bg-indigo-600 hover:bg-indigo-500 transition-all py-4 sm:py-3 rounded-xl text-white font-bold shadow-lg shadow-indigo-900/20 active:scale-95">{$t('common.buttons.save') || 'Salvar'}</button>
    </div>
</Modal>
