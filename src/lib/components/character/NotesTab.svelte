<script lang="ts">
    import { t } from 'svelte-i18n';
    import { character } from '$lib/stores/characterStore';
    import LanguagesSection from './LanguagesSection.svelte';
    import RichTextEditor from '$lib/components/common/RichTextEditor.svelte';
</script>

<div class="space-y-6">
    <!-- Languages Section - Mobile Only (shown in sidebar on desktop) -->
    <div class="lg:hidden">
        <LanguagesSection />
    </div>

    <div class="space-y-4">
        <div class="flex justify-between items-center mb-2">
            <h3 class="text-xs font-bold text-slate-500 uppercase">{$t('character.notes.title')}</h3>
            <span class="text-[10px] text-slate-600 italic">{$t('character.notes.autosave')}</span>
        </div>
        <RichTextEditor
            bind:value={$character.notes}
            placeholder={$t('character.notes.placeholder')}
        />
    </div>
</div>
