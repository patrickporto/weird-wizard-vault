<script lang="ts">
   import { character, characterActions } from '$lib/stores/characterStore';
   import { isGmOnline } from '$lib/logic/sync';
   import { Users, LogOut, Wifi, WifiOff } from 'lucide-svelte';
   
   interface Props {
      compact?: boolean;
      banner?: boolean;
   }
   
   let { compact = false, banner = false }: Props = $props();
</script>

{#if $character.campaignId}
    {#if banner}
        <!-- Mobile Premium Banner -->
        <div class="bg-indigo-600/10 backdrop-blur-md border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-indigo-950/20">
            <div class="flex items-center gap-3">
                <div class="relative">
                    <div class="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                        <Users size={20}/>
                    </div>
                    <div class="absolute -top-1 -right-1 w-3 h-3 {$isGmOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-600'} rounded-full border-2 border-slate-950 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                </div>
                <div>
                     <div class="text-[10px] text-indigo-400/70 font-black uppercase tracking-[0.2em] leading-none mb-1">Campanha Ativa</div>
                     <div class="font-bold text-white text-base leading-tight">{$character.campaignName}</div>
                     <div class="text-[10px] text-slate-400 mt-0.5 font-medium flex items-center gap-1">
                        <span class="opacity-50 font-bold uppercase tracking-tighter">Mestre:</span> 
                        <span class="text-indigo-300">{$character.gmName}</span>
                     </div>
                </div>
            </div>
            <button 
                onclick={() => { if(confirm('Sair da campanha?')) characterActions.leaveCampaign() }} 
                class="bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-slate-500 hover:text-red-400 transition-all active:scale-95"
                title="Sair"
            >
                <LogOut size={18}/>
            </button>
        </div>
    {:else if compact}
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full shadow-sm glass">
            <div class="w-1.5 h-1.5 rounded-full {$isGmOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-600'} shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
            <span class="text-[9px] font-black text-indigo-400 uppercase tracking-widest truncate max-w-[150px]">{$character.campaignName}</span>
        </div>
    {:else}
        <!-- Sidebar Desktop Style -->
        <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg backdrop-blur-sm group hover:border-indigo-500/30 transition-all duration-300 {!$isGmOnline ? 'opacity-60 saturate-50' : ''}">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <div class="p-1.5 {$isGmOnline ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-500'} rounded-lg">
                        <Users size={16}/>
                    </div>
                    <h3 class="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">Campanha Ativa</h3>
                </div>
                <button 
                    onclick={characterActions.leaveCampaign} 
                    class="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Abandonar Campanha"
                >
                    <LogOut size={14}/>
                </button>
            </div>
            
            <div class="space-y-1">
                 <div class="font-bold text-white text-lg tracking-tight leading-tight">{$character.campaignName}</div>
                 <div class="text-[10px] font-medium text-slate-500 flex items-center gap-1.5 pt-0.5">
                    <span class="uppercase tracking-tighter opacity-70">Mestre:</span>
                    <span class="text-indigo-400 font-bold">{$character.gmName}</span>
                 </div>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-white/5">
                 <div class="flex items-center gap-2">
                    <div class="w-1.5 h-1.5 rounded-full {$isGmOnline ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)] animate-pulse' : 'bg-slate-700'}"></div>
                    <span class="text-[11px] font-bold uppercase tracking-wider {$isGmOnline ? 'text-slate-400' : 'text-slate-600'}">
                        {$isGmOnline ? 'Online' : 'Offline'}
                    </span>
                 </div>
                 <div class="flex items-center gap-1 text-[10px] text-slate-600 font-mono">
                    {#if $isGmOnline}
                        <Wifi size={10} class="opacity-40"/>
                    {:else}
                        <WifiOff size={10} class="opacity-40 text-red-500/50"/>
                    {/if}
                    {$isGmOnline ? 'SYNCED' : 'WAITING'}
                 </div>
            </div>
        </div>
    {/if}
{/if}
