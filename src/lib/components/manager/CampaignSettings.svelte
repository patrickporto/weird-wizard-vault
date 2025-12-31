<script lang="ts">
    import { t } from 'svelte-i18n';
    import Modal from '$lib/components/common/Modal.svelte';
    import type { InitiativeStyle } from '$lib/systems';
    import { Settings, Dices, Users, User, ArrowDownUp } from 'lucide-svelte';

    interface Props {
        isOpen: boolean;
        campaign: any;
        onClose: () => void;
        onSave: (updates: any) => void;
    }

    let { isOpen, campaign, onClose, onSave }: Props = $props();

    let initiativeStyle = $state<InitiativeStyle>('dle');

    let INITIATIVE_OPTIONS = $derived<{ value: InitiativeStyle; label: string; desc: string; icon: any }[]>([
        {
            value: 'dle',
            label: $t('campaign.settings.initiative_styles.dle'),
            desc: 'Turnos alternados entre Jogadores e Inimigos (Padrão Weird Wizard)',
            icon: ArrowDownUp
        },
        {
            value: 'standard',
            label: $t('campaign.settings.initiative_styles.standard'),
            desc: 'Jogadores escolhem turno Rápido ou Lento a cada rodada.',
            icon: Dices
        },
        {
            value: 'team',
            label: $t('campaign.settings.initiative_styles.team'),
            desc: 'Rolagem d6 por equipe a cada rodada.',
            icon: Users
        },
        {
            value: 'individual',
            label: $t('campaign.settings.initiative_styles.individual'),
            desc: 'Rolagem d20 + Agilidade única.',
            icon: User
        }
    ]);

    $effect(() => {
        if (isOpen && campaign) {
            initiativeStyle = campaign.initiativeStyle || 'dle';
        }
    });

    function save() {
        onSave({ initiativeStyle });
        onClose();
    }
</script>

<Modal {isOpen} {onClose} title={$t('campaign.settings.title')}>
    <div class="space-y-6">
        {#if campaign?.system === 'sofdl'}
            <div class="space-y-3">
                 <label class="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                     <Settings size={14}/> {$t('campaign.settings.initiative_style')}
                 </label>
                 <div class="grid grid-cols-1 gap-3">
                     {#each INITIATIVE_OPTIONS as option}
                        <button
                            class="flex items-start gap-4 p-4 rounded-xl border text-left transition-all {initiativeStyle === option.value ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}"
                            onclick={() => initiativeStyle = option.value}
                        >
                            <div class="mt-1 p-2 rounded-lg bg-slate-800 {initiativeStyle === option.value ? 'text-indigo-400' : 'text-slate-500'}">
                                <option.icon size={20} />
                            </div>
                            <div>
                                <h4 class="font-bold text-sm mb-1">{option.label}</h4>
                                <p class="text-xs opacity-70 leading-relaxed">{option.desc}</p>
                            </div>
                            {#if initiativeStyle === option.value}
                                <div class="ml-auto flex items-center h-full">
                                    <div class="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                </div>
                            {/if}
                        </button>
                     {/each}
                 </div>
            </div>


        {:else}
            <div class="p-8 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                <p>Nenhuma configuração específica disponível para este sistema.</p>
            </div>
        {/if}

        <div class="pt-4 border-t border-slate-800">
             <button
                 onclick={save}
                 class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-[0.98]"
             >
                 Salvar Alterações
             </button>
        </div>
    </div>
</Modal>
