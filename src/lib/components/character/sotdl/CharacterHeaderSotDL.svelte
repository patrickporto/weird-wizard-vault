<script lang="ts">
    import { t } from 'svelte-i18n';
    import { sotdlCharacter, sotdlCurrentHealth, sotdlIsInjured, sotdlIsIncapacitated } from '$lib/stores/characterStoreSotDL';
    import { Settings, ChevronLeft, LayoutDashboard, Brain, Skull } from 'lucide-svelte';
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import Avatar from '$lib/components/common/Avatar.svelte';
    import { fade } from 'svelte/transition';

    import { modalState } from '$lib/stores/characterStore';
    import ImageCropperModal from '$lib/components/common/ImageCropperModal.svelte';
    import { saveImage } from '$lib/logic/image';
    import { Camera, UserCog } from 'lucide-svelte';
    import HealthBarDesktop from '$lib/components/common/HealthBarDesktop.svelte';
    import HealthBarMobile from '$lib/components/common/HealthBarMobile.svelte';

    let healthPercentage = $derived(($sotdlCharacter.health > 0) ? (($sotdlCharacter.damage / $sotdlCharacter.health) * 100) : 0);

    let isMenuOpen = $state(false);
    let isCropperOpen = $state(false);
    let tempImage = $state('');
    let fileInput = $state<HTMLInputElement>();

    function openModal(type: string, data: any = {}) {
        modalState.update(m => ({ ...m, type, isOpen: true, data }));
    }

    function handleFileSelect(e: Event) {
       const files = (e.target as HTMLInputElement).files;
       if (files && files.length > 0) {
           const file = files[0];
           const reader = new FileReader();
           reader.onload = () => {
               tempImage = reader.result as string;
               isCropperOpen = true;
               isMenuOpen = false;
           };
           reader.readAsDataURL(file);
       }
       if (e.target) (e.target as HTMLInputElement).value = '';
   }

   async function handleCrop(blob: Blob) {
        try {
            const hash = await saveImage(blob);
            sotdlCharacter.update(c => ({ ...c, imageUrl: hash }));
            isCropperOpen = false;
        } catch (e: any) {
            alert(e.message || "Erro ao salvar imagem");
        }
   }
</script>

<header class="bg-slate-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40 shadow-2xl">
    <div class="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-3">
       <div class="flex items-center justify-between gap-2 sm:gap-4">

            <!-- Left: Back & Profile -->
            <div class="flex items-center gap-3 sm:gap-3">
                <button
                    onclick={() => goto(resolve('/'))}
                    class="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all flex items-center gap-1 group"
                >
                    <ChevronLeft size={24} class="group-hover:-translate-x-0.5 transition-transform"/>
                    <LayoutDashboard size={20} class="hidden sm:block opacity-50"/>
                </button>

                <div class="relative">
                    <button
                        class="flex items-center gap-3 group text-left relative"
                        onclick={() => isMenuOpen = !isMenuOpen}
                    >
                        <div class="rounded-xl sm:rounded-full overflow-hidden border-2 border-white/10 w-12 h-12">
                             <Avatar hash={$sotdlCharacter.imageUrl} alt={$sotdlCharacter.name} fallbackText={$sotdlCharacter.name.charAt(0)} size="custom" />
                        </div>
                        <div>
                            <h1 class="text-base font-black text-white leading-tight truncate max-w-[120px]">{$sotdlCharacter.name}</h1>
                            <p class="text-xs text-slate-500 font-black uppercase tracking-widest">Nv {$sotdlCharacter.level} • SotDL</p>
                        </div>
                    </button>

                    <!-- Menu Dropdown -->
                    {#if isMenuOpen}
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div class="fixed inset-0 z-40" onclick={() => isMenuOpen = false}></div>
                        <div class="absolute top-full left-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                            <button
                                onclick={() => fileInput?.click()}
                                class="w-full text-left px-4 py-3 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 flex items-center gap-3 transition-colors border-b border-slate-700/50"
                            >
                                <Camera size={16} class="text-indigo-400"/> {$t('character.header.change_photo')}
                            </button>
                            <button
                                onclick={() => { openModal('character_info'); isMenuOpen = false; }}
                                class="w-full text-left px-4 py-3 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 flex items-center gap-3 transition-colors"
                            >
                                <UserCog size={16} class="text-slate-400"/> {$t('character.header.edit_info')}
                            </button>
                        </div>
                     {/if}
                </div>
            </div>

            <!-- Center: Health Bar & Stats -->
            <div class="hidden md:flex flex-1 max-w-lg gap-6 items-center justify-center">
                 <!-- Stats Trackers -->
                 <div class="flex gap-3">
                     <!-- Insanity -->
                     <button onclick={() => openModal('stat', { system: 'sofdl', key: 'insanity' })} class="bg-slate-900/50 hover:bg-slate-900 border border-slate-700/50 rounded-xl px-3 py-1.5 flex flex-col items-center justify-center min-w-[70px] shadow-sm transition-all hover:scale-105 active:scale-95 group">
                         <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 group-hover:text-purple-400 transition-colors">{$t('sofdl.attributes.insanity')}</span>
                         <div class="flex items-center gap-1.5">
                             <Brain size={14} class="text-purple-500 opacity-70 group-hover:opacity-100 transition-opacity"/>
                             <span class="text-lg font-black text-white leading-none">{$sotdlCharacter.insanity}</span>
                         </div>
                     </button>

                     <!-- Corruption -->
                     <button onclick={() => openModal('stat', { system: 'sofdl', key: 'corruption' })} class="bg-slate-900/50 hover:bg-slate-900 border border-slate-700/50 rounded-xl px-3 py-1.5 flex flex-col items-center justify-center min-w-[70px] shadow-sm transition-all hover:scale-105 active:scale-95 group">
                         <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 group-hover:text-red-500 transition-colors">{$t('sofdl.attributes.corruption')}</span>
                         <div class="flex items-center gap-1.5">
                             <Skull size={14} class="text-red-600 opacity-70 group-hover:opacity-100 transition-opacity"/>
                             <span class="text-lg font-black text-white leading-none">{$sotdlCharacter.corruption}</span>
                         </div>
                     </button>
                 </div>

                <!-- Health Bar (WW Style - Growing Damage) -->
                 <HealthBarDesktop
                    currentHealth={$sotdlCharacter.health}
                    damage={$sotdlCharacter.damage}
                    tempHealth={0}
                    isInjured={$sotdlIsInjured}
                    isIncapacitated={$sotdlIsIncapacitated}
                    damagePercentage={healthPercentage}
                    onClick={() => openModal('health_damage')}
                 />
            </div>

            <!-- Right: Actions -->
            <div class="flex items-center gap-2">
                 <button
                    onclick={() => openModal('character_info')}
                    class="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full"
                    title={$t('character.header.settings')}
                >
                     <Settings size={20}/>
                 </button>
            </div>
       </div>
    </div>

      <!-- Health Bar -->
      <HealthBarMobile
          currentHealth={$sotdlCharacter.health}
          damage={$sotdlCharacter.damage}
          tempHealth={0}
          isInjured={$sotdlIsInjured}
          isIncapacitated={$sotdlIsIncapacitated}
          damagePercentage={healthPercentage}
          onClick={() => openModal('health_damage')}
      />
    <!-- Mobile Header Stats Row (Insanity/Corruption) -->
    <div class="md:hidden border-t border-white/5 bg-slate-950/20 px-4 py-3 flex flex-col gap-4">
        <!-- Stats Row -->
        <div class="flex gap-3">
             <button onclick={() => openModal('stat', { system: 'sofdl', key: 'insanity' })} class="flex-1 bg-slate-900 rounded-xl border border-slate-800 p-2 flex items-center justify-between shadow-sm active:scale-95 transition-transform">
                 <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Brain size={14} class="text-purple-400"/>
                    </div>
                    <span class="text-[10px] font-bold text-slate-400 uppercase">{$t('sofdl.attributes.insanity')}</span>
                 </div>
                 <span class="text-lg font-black text-white">{$sotdlCharacter.insanity}</span>
             </button>

             <button onclick={() => openModal('stat', { system: 'sofdl', key: 'corruption' })} class="flex-1 bg-slate-900 rounded-xl border border-slate-800 p-2 flex items-center justify-between shadow-sm active:scale-95 transition-transform">
                 <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-lg bg-red-900/30 flex items-center justify-center">
                        <Skull size={14} class="text-red-500"/>
                    </div>
                    <span class="text-[10px] font-bold text-slate-400 uppercase">{$t('sofdl.attributes.corruption')}</span>
                 </div>
                 <span class="text-lg font-black text-white">{$sotdlCharacter.corruption}</span>
             </button>
        </div>

    </div>
</header>

<input
    type="file"
    bind:this={fileInput}
    onchange={handleFileSelect}
    hidden
    accept="image/*"
/>

<ImageCropperModal
    isOpen={isCropperOpen}
    imageUrl={tempImage}
    onClose={() => isCropperOpen = false}
    onCrop={handleCrop}
/>
