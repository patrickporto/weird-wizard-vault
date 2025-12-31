<script lang="ts">
    import { t } from 'svelte-i18n';
    import { damage, normalHealth, currentHealth, modalState } from '$lib/stores/characterStore';
    import { sotdlCharacter, sotdlCharacterActions } from '$lib/stores/characterStoreSotDL';
    import Modal from '$lib/components/common/Modal.svelte';

    let isOpen = $derived($modalState.isOpen && ($modalState.type === 'health' || $modalState.type === 'health_damage'));
    let isSotDL = $derived($modalState.type === 'health_damage');
    let formData = $state({ d: 0, nh: 0, ch: 0 });

    $effect(() => {
        if (isOpen) {
            if (isSotDL) {
                // SotDL: Calculate current health from Health - Damage
                const health = $sotdlCharacter.health;
                const dmg = $sotdlCharacter.damage;
                formData = { d: dmg, nh: health, ch: health - dmg };
            } else {
                formData = { d: $damage, nh: $normalHealth, ch: $currentHealth };
            }
        }
    });

    function onClose() {
        modalState.update(m => ({ ...m, type: null, isOpen: false, data: null }));
    }

    function saveHealth() {
        if (isSotDL) {
            // SotDL: Save Damage and Health independently
            const newDamage = Math.max(0, parseInt(formData.d as any));
            const newHealth = Math.max(1, parseInt(formData.nh as any));

            sotdlCharacter.update(c => ({
                ...c,
                damage: newDamage,
                health: newHealth
            }));
        } else {
            damage.set(Math.max(0, parseInt(formData.d as any)));
            normalHealth.set(Math.max(1, parseInt(formData.nh as any)));
            currentHealth.set(Math.max(0, parseInt(formData.ch as any)));
        }
        onClose();
    }
</script>

<Modal {isOpen} title={$t('character.modals.health_damage')} {onClose}>
    <div class="space-y-4 p-1">
        <div class="grid grid-cols-2 gap-4">
            {#if isSotDL}
                <!-- SotDL: Just Health (Total) and Damage -->
                <div class="col-span-2">
                    <label class="text-xs text-slate-400 uppercase font-bold">
                        {$t('enemy_modal.health')}
                        <input type="number" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={formData.nh} />
                    </label>
                </div>
            {:else}
                <!-- Normal WW Inputs -->
                <div>
                     <label class="text-xs text-slate-400 uppercase font-bold">
                         {$t('character.modals.normal_health')}
                         <input type="number" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={formData.nh} />
                     </label>
                </div>
                <div>
                    <label class="text-xs text-slate-400 uppercase font-bold">
                        {$t('character.modals.current_health')}
                        <input type="number" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" bind:value={formData.ch} />
                    </label>
                </div>
            {/if}
        </div>

        <div>
            <label class="text-xs text-red-400 uppercase font-bold">
                {$t('character.modals.damage')}
                <input
                    type="number"
                    class="w-full bg-slate-900 border border-red-900/50 rounded p-2 text-white"
                    bind:value={formData.d}
                />
            </label>
        </div>

        <button onclick={saveHealth} class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded">
            {$t('character.modals.update')}
        </button>
    </div>
</Modal>
