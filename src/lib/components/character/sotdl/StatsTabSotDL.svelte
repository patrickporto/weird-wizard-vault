<script lang="ts">
    import { t } from 'svelte-i18n';

    import AttributesSectionSotDL from './AttributesSectionSotDL.svelte';
    import VitalsSectionSotDL from './VitalsSectionSotDL.svelte';
    import AfflictionsSectionSotDL from './AfflictionsSectionSotDL.svelte';
    import SensesSectionSotDL from './SensesSectionSotDL.svelte';
    import CampaignStatusSotDL from './CampaignStatusSotDL.svelte';
</script>

<div class="space-y-4 flex-1 flex flex-col">
    <AttributesSectionSotDL />

    <VitalsSectionSotDL />
    <SensesSectionSotDL />
    <AfflictionsSectionSotDL />

    <div class="lg:hidden mt-auto pt-6">
        <CampaignStatusSotDL banner />
    </div>
</div>
