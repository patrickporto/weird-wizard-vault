<script lang="ts">
    import { googleSession, signIn, signOut } from '$lib/logic/googleDrive';
    import { LogOut, User } from 'lucide-svelte';
    import { t } from 'svelte-i18n';

    // Props
    interface Props {
        className?: string;
    }
    let { className = '' }: Props = $props();
    
    // Local State
    let showLogout = $state(false);
</script>

{#if $googleSession.signedIn}
    <div class="relative">
        <button 
            onclick={() => showLogout = !showLogout}
            class="flex items-center gap-2 p-1 rounded-full hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700 {className}"
            title={$googleSession.userProfile?.name || $t('common.auth.user')}
        >
            {#if $googleSession.userProfile?.picture}
                <img 
                    src={$googleSession.userProfile.picture} 
                    alt="Avatar" 
                    class="w-10 h-10 rounded-full border-2 border-indigo-500/50 shadow-lg object-cover"
                />
            {:else}
                <div class="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white border-2 border-indigo-400/30 shadow-lg">
                    <span class="font-bold text-lg">
                        {#if $googleSession.userProfile?.name}
                            {$googleSession.userProfile.name[0].toUpperCase()}
                        {:else}
                            <User size={20} />
                        {/if}
                    </span>
                </div>
            {/if}
            
            <!-- Online status indicator -->
            <div class="absolute bottom-1 right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
        </button>

        {#if showLogout}
            <div class="absolute right-0 top-full mt-2 w-48 bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div class="px-3 py-2 border-b border-slate-700 mb-2">
                    <p class="text-xs text-slate-400">{$t('common.auth.signed_in_as')}</p>
                    <p class="text-sm font-bold text-white truncate">{$googleSession.userProfile?.name ?? $t('common.auth.user')}</p>
                </div>
                <button 
                    onclick={() => { signOut(); showLogout = false; }}
                    class="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                >
                    <LogOut size={14} /> {$t('common.auth.logout')}
                </button>
            </div>
            
            <!-- Backdrop to close -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="fixed inset-0 z-40" onclick={() => showLogout = false}></div>
        {/if}
    </div>
{:else}
    <button 
        onclick={signIn}
        disabled={!$googleSession.isInited}
        class="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-full font-bold text-xs transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-wait disabled:scale-100 disabled:shadow-none {className}"
    >
        {#if !$googleSession.isInited}
            <div class="w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin"></div>
        {:else}
            <svg class="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
        {/if}
        <span>{$t('common.auth.login')}</span>
    </button>
{/if}
