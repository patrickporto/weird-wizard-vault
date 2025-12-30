<script lang="ts">
    import { syncStatus, lastSyncTime } from '$lib/stores/syncStatus';
    import { syncFromCloud, googleSession, signIn } from '$lib/logic/googleDrive';
    import { Cloud, RefreshCw, CheckCircle, AlertCircle, CloudOff } from 'lucide-svelte';
    import { fade } from 'svelte/transition';
    import { t } from 'svelte-i18n';
    
    let showTooltip = $state(false);

    // Format time for the current locale
    function formatTime(timestamp: number) {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
</script>

<div class="relative flex items-center">
    <button 
        onclick={() => !$googleSession.signedIn ? signIn() : syncFromCloud()}
        onmouseenter={() => showTooltip = true}
        onmouseleave={() => showTooltip = false}
        onfocus={() => showTooltip = true}
        onblur={() => showTooltip = false}
        class="flex items-center justify-center p-2 rounded-xl hover:bg-slate-800/50 transition-all active:scale-95 group focus:outline-none"
        aria-label={$t('common.status.label')}
    >
        {#if !$googleSession.signedIn}
            <CloudOff size={20} class="text-slate-600 group-hover:text-slate-400" />
        {:else if $syncStatus === 'syncing'}
            <RefreshCw size={20} class="animate-spin text-indigo-400" />
        {:else if $syncStatus === 'success'}
            <CheckCircle size={20} class="text-emerald-400 group-hover:text-emerald-300" />
        {:else if $syncStatus === 'error'}
            <AlertCircle size={20} class="text-red-400" />
        {:else}
            <Cloud size={20} class="text-slate-400 group-hover:text-slate-300" />
        {/if}
    </button>

    <!-- Tooltip -->
    {#if showTooltip}
        <div 
            transition:fade={{ duration: 150 }}
            class="absolute top-full right-0 mt-3 whitespace-nowrap bg-slate-900/95 backdrop-blur-md text-white text-[10px] font-bold py-2 px-3 rounded-lg shadow-2xl border border-slate-700/50 z-[100] pointer-events-none min-w-[120px]"
        >
            <div class="flex items-center gap-2">
                {#if !$googleSession.signedIn}
                    <span class="w-2 h-2 rounded-full bg-slate-600"></span>
                    <span>{$t('common.status.offline')}</span>
                {:else if $syncStatus === 'syncing'}
                    <span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    <span>{$t('common.status.syncing')}</span>
                {:else if $syncStatus === 'success'}
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>{$t('common.status.saved')}</span>
                {:else if $syncStatus === 'error'}
                    <span class="w-2 h-2 rounded-full bg-red-500"></span>
                    <span>{$t('common.status.error')}</span>
                {:else}
                    <span class="w-2 h-2 rounded-full bg-slate-500"></span>
                    <span>{$t('common.status.synced')}</span>
                {/if}
            </div>
            
            {#if $googleSession.signedIn && $lastSyncTime}
                <div class="mt-1.5 pt-1.5 border-t border-slate-800 text-[9px] text-slate-400 opacity-80 font-medium flex justify-between items-center gap-4">
                    <span>{$t('common.status.last_sync')}</span>
                    <span>{formatTime($lastSyncTime)}</span>
                </div>
            {:else if !$googleSession.signedIn}
                <div class="mt-1 text-[9px] text-slate-400 opacity-60 italic">
                    {$t('common.auth.login')}
                </div>
            {/if}
        </div>
    {/if}
</div>
