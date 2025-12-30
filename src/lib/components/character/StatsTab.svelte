<script lang="ts">
    import { modalState } from '$lib/stores/characterStore';
    import { Clover } from 'lucide-svelte';

    import AttributesSection from './AttributesSection.svelte';
    import VitalsSection from './VitalsSection.svelte';
    import AfflictionsSection from './AfflictionsSection.svelte';
    import SensesSection from './SensesSection.svelte';
    import CampaignStatus from './CampaignStatus.svelte';
</script>

<div class="space-y-4 flex-1 flex flex-col">
    <AttributesSection />

    <button onclick={() => modalState.set({type: 'pre_roll', isOpen: true, data: {type:'luck', source: {name:'Sorte'}}})} class="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-center gap-3 group transition-all shadow-lg shadow-emerald-900/30 hover:shadow-emerald-500/20 active:scale-[0.98] cursor-pointer">
        <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clover size={24} class="text-white"/>
        </div>
        <span class="font-black text-white uppercase tracking-wider text-sm">Teste de Sorte</span>
    </button>

    <VitalsSection />
    <SensesSection />
    <AfflictionsSection />

    <div class="lg:hidden mt-auto pt-6">
        <CampaignStatus banner />
    </div>
</div>

