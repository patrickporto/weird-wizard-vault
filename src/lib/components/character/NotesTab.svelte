<script>
    import { character } from '$lib/stores/characterStore';
</script>

<div class="space-y-4">
    <div class="flex justify-between items-center mb-2"><h3 class="text-xs font-bold text-slate-500 uppercase">Anotações do Personagem</h3><span class="text-[10px] text-slate-600 italic">Salvo automaticamente</span></div>
    <textarea class="w-full h-[60vh] bg-slate-950 border border-slate-800 rounded p-4 text-white resize-none focus:border-indigo-500 focus:outline-none custom-scrollbar leading-relaxed font-mono text-sm" bind:value={$character.notes} placeholder="Escreva aqui a história, anotações de campanha, NPCs importantes, segredos..."></textarea>
</div>
