<script>
  import { onMount } from 'svelte';
  import { joinRoom, selfId } from 'trystero/torrent';
  import { getTrackerConfig } from '$lib/logic/sync';
  import { _ } from 'svelte-i18n'



  let room;
  let sendMsg;

  let messages = [];
  let currentMsg = '';
  let peerCount = 0;

  onMount(() => {
    // 1. Entra na sala (qualquer um com esse ID entra no mesmo chat)
    const config = getTrackerConfig();
    room = joinRoom(config, 'sala-geral');

    // 2. Cria a ação de enviar/receber mensagens
    const [send, get] = room.makeAction('message');
    sendMsg = send;

    // 3. Ouve mensagens chegando
    get((data, peerId) => {
      messages = [...messages, { sender: 'Amigo', text: data, id: peerId }];
    });

    // 4. Ouve quando alguém entra ou sai
    room.onPeerJoin(peerId => {
      peerCount++;
      console.log(`Peer ${peerId} entrou`);
    });

    room.onPeerLeave(peerId => {
      peerCount--;
      console.log(`Peer ${peerId} saiu`);
    });
  });

  function enviar() {
    if (!currentMsg) return;

    // Envia para TODOS na sala
    sendMsg(currentMsg);

    // Adiciona na minha própria tela
    messages = [...messages, { sender: 'Eu', text: currentMsg, id: selfId }];
    currentMsg = '';
  }
</script>

<main class="p-4 max-w-lg mx-auto">
  <div class="mb-4 p-2 bg-gray-100 rounded">
    <h1 class="font-bold text-xl">Chat Trystero (Serverless)</h1>
    <p class="text-sm text-gray-600">
      Status: {peerCount > 0 ? '🟢 Conectado' : '🟡 Aguardando peers...'}
      ({peerCount} online)
    </p>
    <p class="text-xs text-gray-400">ID: {selfId}</p>
  </div>

  <div class="h-64 border rounded overflow-y-auto p-2 mb-4 bg-white">
    {#each messages as msg}
      <div class="mb-2 {msg.sender === 'Eu' ? 'text-right' : 'text-left'}">
        <span class="inline-block px-3 py-1 rounded text-sm
          {msg.sender === 'Eu' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black'}">
          {msg.text}
        </span>
      </div>
    {/each}
  </div>

  <div class="flex gap-2">
    <input
      class="flex-1 border p-2 rounded"
      bind:value={currentMsg}
      placeholder="Digite algo..."
      on:keydown={e => e.key === 'Enter' && enviar()}
    />
    <button class="bg-blue-600 text-white px-4 rounded" on:click={enviar}>
      {$_('chat.send')}
    </button>
  </div>
</main>
