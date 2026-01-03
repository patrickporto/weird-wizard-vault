<script lang="ts">
    import { t } from 'svelte-i18n';
    import { page } from '$app/stores';
    import { liveCharacters } from '$lib/stores/live';
    import { character } from '$lib/stores/characterStore';
    import { Users, Check, Wifi, WifiOff, AlertTriangle, Gamepad2 } from 'lucide-svelte';
    import { DEFAULT_SYSTEM, getSystem } from '$lib/systems';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { joinCampaignRoom, isGmOnline } from '$lib/logic/sync';
	import { onMount } from 'svelte';
	import ConfirmationModal from '$lib/components/manager/ConfirmationModal.svelte';
	import { verifyPassword } from '$lib/logic/crypto';

	const campaignId = $page.params.id;
	// Get campaign info from the character store which is updated by the getCampaign sync action
	let campaignName = $derived($character.campaignName || $t('invite.searching'));
	let gmName = $derived($character.gmName || '...');
	let passwordHash = $derived($character.passwordHash);

	// Filter out characters that are already in a campaign AND have matching system
    let campaignSystem = $derived($character.system || DEFAULT_SYSTEM);
	let availableCharacters = $derived($liveCharacters.filter(c => !c.campaignId && (c.system || DEFAULT_SYSTEM) === campaignSystem));
    let hasSystemMismatch = $derived($liveCharacters.some(c => !c.campaignId && (c.system || DEFAULT_SYSTEM) !== campaignSystem));

	let selectedCharId = $state<string | null>(null);
	let showConfirm = $state(false);

	// Password state
	let passwordInput = $state('');
	let passwordError = $state(false);
	let isVerifying = $state(false);
	let generalError = $state('');

	onMount(() => {
		if (campaignId) {
			joinCampaignRoom(campaignId, false);
		}
	});

	async function handleJoin() {
		generalError = '';
		if (!selectedCharId || !campaignId) return;

		// Double-check that the character is not already in a campaign
		const char = $liveCharacters.find(c => c.id === selectedCharId);
		if (char?.campaignId) {
			generalError = $t('invite.already_in_campaign');
			return;
		}

		// Verify password if required
		if (passwordHash) {
			if (!passwordInput) {
				passwordError = true;
				return;
			}

			isVerifying = true;
			const valid = await verifyPassword(passwordInput, passwordHash);
			isVerifying = false;

			if (!valid) {
				passwordError = true;
				// No need for general error, input specific error is enough
				return;
			}
		}

		passwordError = false;
		showConfirm = true;
	}

	function confirmJoin() {
		if (!selectedCharId || !campaignId) return;

		const char = $liveCharacters.find(c => c.id === selectedCharId);
		if (char) {
			// Final check before joining
			if (char.campaignId) {
				generalError = $t('invite.already_in_campaign');
				showConfirm = false;
				return;
			}

			import('$lib/db').then(({ charactersMap }) => {
				charactersMap.set(selectedCharId!, {
					...char,
					campaignId,
					campaignName,
					gmName,
					campaignApproval: 'pending'
				});
				goto(resolve('/characters/[id]', { id: selectedCharId }));
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
            <h1 class="text-2xl font-bold text-white mb-2">{$t('invite.title')}</h1>
            <p class="text-slate-400">
                {$t('invite.invited_to')}
                <span class="text-indigo-400 font-bold">{campaignName}</span>
                {#if gmName !== '...'}
                    <span class="block text-xs mt-1 uppercase tracking-widest text-slate-500 font-black">{$t('common.labels.master')}: {gmName}</span>
                {/if}
            </p>
             <div class="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700 font-bold uppercase tracking-wider">
                 <Gamepad2 size={12} /> {$t(getSystem(campaignSystem).nameKey)}
             </div>
            {#if $isGmOnline}
                <div class="mt-4 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] text-green-500 font-bold uppercase tracking-wider flex items-center gap-2">
                    <Wifi size={12}/> {$t('invite.gm_online')}
                </div>
            {:else}
                <div class="mt-4 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] text-amber-500 font-bold uppercase tracking-wider animate-pulse flex items-center gap-2">
                    <WifiOff size={12}/> {$t('invite.waiting_gm')}
                </div>
            {/if}
        </div>

        {#if generalError}
            <div class="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3">
                <AlertTriangle size={20} class="text-red-500 mb-0.5" />
                <p class="text-red-400 text-sm font-bold">{generalError}</p>
            </div>
        {/if}

        {#if passwordHash}
            <div class="mb-6 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                 <label for="campaign-pwd-input" class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                     <div class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div> {$t('invite.password.required')}
                 </label>
                 <input
                    id="campaign-pwd-input"
                    type="password"
                    placeholder={$t('invite.password.placeholder')}
                    bind:value={passwordInput}
                    class="w-full bg-slate-900 border {passwordError ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white outline-none focus:border-indigo-500 transition-colors"
                 />
                 {#if passwordError}
                    <p class="text-red-400 text-xs mt-1">{$t('invite.password.incorrect')}</p>
                 {/if}
            </div>
        {/if}

        <div class="space-y-4 mb-8">
            <label for="char-selector" class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{$t('invite.select_character')}</label>
            <div id="char-selector" class="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                {#each availableCharacters as char}
                    <button
                        onclick={() => { selectedCharId = char.id; generalError = ''; }}
                        class="w-full flex items-center gap-3 p-3 rounded-xl border transition-all {selectedCharId === char.id ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}"
                    >
                        <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold">
                            {char.name.charAt(0)}
                        </div>
                        <div class="flex-1 text-left">
                            <div class="font-bold text-sm">{char.name}</div>
                            <div class="text-[10px] opacity-60 flex items-center gap-1">
                                {$t('common.labels.level')} {char.level} • {char.ancestry}
                                <span class="w-1 h-1 rounded-full bg-slate-600"></span>
                                 <Gamepad2 size={8} /> {$t(getSystem(char.system || DEFAULT_SYSTEM).nameKey)}
                            </div>
                        </div>
                        {#if selectedCharId === char.id}
                            <Check size={16} class="text-indigo-400" />
                        {/if}
                    </button>
                {/each}
                {#if availableCharacters.length === 0}
                    <div class="text-center py-8 text-slate-600 italic text-sm space-y-2">
                        {#if $liveCharacters.length === 0}
                            <div>{$t('invite.no_characters')}</div>
                            <div>{$t('invite.create_first')}</div>
                        {:else}
                            <div class="flex flex-col items-center gap-2">
                                <AlertTriangle size={24} class="text-amber-500" />
                                <div class="text-amber-500 font-bold">{$t('invite.all_in_campaigns')}</div>
                                {#if hasSystemMismatch}
                                     <div class="text-xs text-slate-500 max-w-[200px]">{$t('invite.system_mismatch_info', { values: { system: $t(getSystem(campaignSystem).nameKey) } })}</div>
                                {:else}
                                    <div class="text-xs text-slate-500">{$t('invite.create_or_leave')}</div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>

        <div class="flex gap-3">
            <button onclick={() => goto(resolve('/'))} class="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all">{$t('invite.decline')}</button>
            <button
                disabled={!selectedCharId || isVerifying || (!!passwordHash && !passwordInput) || campaignName === $t('invite.searching')}
                onclick={handleJoin}
                class="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
            >
                {#if isVerifying}
                    <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> {$t('invite.validating')}
                {:else if campaignName === $t('invite.searching')}
                    <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> {$t('invite.loading')}
                {:else}
                    {$t('invite.accept')}
                {/if}
            </button>
        </div>
    </div>
</div>

<ConfirmationModal
    isOpen={showConfirm}
    title={$t('invite.confirm_title')}
    message={$t('invite.confirm_message', { values: { campaign: campaignName, character: $liveCharacters.find(c => c.id === selectedCharId)?.name } })}
    onConfirm={confirmJoin}
    onCancel={() => showConfirm = false}
/>
