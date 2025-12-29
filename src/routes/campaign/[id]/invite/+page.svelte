<script lang="ts">
    import { page } from '$app/stores';
    import { liveCharacters, liveCampaigns } from '$lib/stores/live';
    import { Ghost, Users, Check, X } from 'lucide-svelte';
    import { goto } from '$app/navigation';
    import ConfirmationModal from '$lib/components/manager/ConfirmationModal.svelte';

    const campaignId = $page.params.id;
    // Try to get campaign name from live store or URL param as fallback
    let campaign = $derived($liveCampaigns.find(c => c.id === campaignId));
    let campaignName = $derived(campaign?.name || $page.url.searchParams.get('name') || 'Nova Campanha');

    let selectedCharId = $state<string | null>(null);
    let showConfirm = $state(false);

    function handleJoin() {
        if (!selectedCharId || !campaignId) return;
        showConfirm = true;
    }

    function confirmJoin() {
        if (!selectedCharId || !campaignId) return;

        const char = $liveCharacters.find(c => c.id === selectedCharId);
        if (char) {
            import('$lib/db').then(({ charactersMap }) => {
                charactersMap.set(selectedCharId!, {
                    ...char,
                    campaignId,
                    campaignName,
                    gmName: campaign?.gmName || 'Mestre'
                });
                goto(`/character/${selectedCharId}`);
            });
        }
    }
</script>

<div class="min-h-screen bg-slate-950 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div class="flex flex-col items-center text-center mb-8">
            <div class="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/30">
                <Users size={32} />
            </div>
            <h1 class="text-2xl font-bold text-white mb-2">Convite para Campanha</h1>
            <p class="text-slate-400">Você foi convidado para participar de <span class="text-indigo-400 font-bold">{campaignName}</span>.</p>
        </div>

        <div class="space-y-4 mb-8">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Escolha seu Personagem</label>
            <div class="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                {#each $liveCharacters as char}
                    <button 
                        onclick={() => selectedCharId = char.id}
                        class="w-full flex items-center gap-3 p-3 rounded-xl border transition-all {selectedCharId === char.id ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}"
                    >
                        <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold">
                            {char.name.charAt(0)}
                        </div>
                        <div class="flex-1 text-left">
                            <div class="font-bold text-sm">{char.name}</div>
                            <div class="text-[10px] opacity-60">Lvl {char.level} • {char.ancestry}</div>
                        </div>
                        {#if selectedCharId === char.id}
                            <Check size={16} class="text-indigo-400" />
                        {/if}
                    </button>
                {/each}
                {#if $liveCharacters.length === 0}
                    <div class="text-center py-8 text-slate-600 italic text-sm">
                        Nenhum personagem encontrado.<br/>
                        Crie um personagem primeiro!
                    </div>
                {/if}
            </div>
        </div>

        <div class="flex gap-3">
            <button onclick={() => goto('/')} class="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all">Recusar</button>
            <button 
                disabled={!selectedCharId}
                onclick={handleJoin} 
                class="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-all shadow-lg shadow-indigo-900/20"
            >
                Aceitar Convite
            </button>
        </div>
    </div>
</div>

<ConfirmationModal 
    isOpen={showConfirm}
    title="Confirmar Participação"
    message={`Deseja entrar na campanha "${campaignName}" com o personagem "${$liveCharacters.find(c => c.id === selectedCharId)?.name}"?`}
    onConfirm={confirmJoin}
    onCancel={() => showConfirm = false}
/>
