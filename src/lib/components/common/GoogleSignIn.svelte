<script lang="ts">
    import { googleSession, signIn, signOut } from '$lib/logic/googleDrive';
    import { LogOut, Cloud } from 'lucide-svelte';

    let { className = '' } = $props();
</script>

{#if $googleSession.signedIn}
    <div class="flex items-center gap-2 {className}">
        <div class="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 text-xs font-bold">
            <Cloud size={14} />
            <span>Conectado</span>
        </div>
        <button 
            onclick={signOut}
            class="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="Sair do Google Drive"
        >
            <LogOut size={14} />
        </button>
    </div>
{:else}
    <button 
        onclick={signIn}
        disabled={!$googleSession.isInited}
        class="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-wait {className}"
    >
        {#if !$googleSession.isInited}
             <div class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
        {:else}
            <svg class="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
        {/if}
        <span>Entrar com Google</span>
    </button>
{/if}
