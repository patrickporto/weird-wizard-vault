<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Editor } from '@tiptap/core';
    import StarterKit from '@tiptap/starter-kit';
    import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
    import FloatingMenuExtension from '@tiptap/extension-floating-menu';
    import { Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered, Quote, Code } from 'lucide-svelte';
    import { fade } from 'svelte/transition';

    let { value = $bindable(''), placeholder = 'Digite suas notas...' } = $props();

    let element: HTMLElement;
    let editor: Editor | null = $state(null);
    let bubbleMenuElement: HTMLElement;
    let floatingMenuElement: HTMLElement;

    onMount(() => {
        editor = new Editor({
            element: element,
            extensions: [
                StarterKit.configure({
                    heading: {
                        levels: [1, 2]
                    }
                }),
                BubbleMenuExtension.configure({
                    element: bubbleMenuElement,
                }),
                FloatingMenuExtension.configure({
                    element: floatingMenuElement,
                })
            ],
            content: value,
            editorProps: {
                attributes: {
                    class: 'prose prose-invert max-w-none focus:outline-none min-h-[50vh] p-4 text-slate-300 leading-relaxed'
                          + ' prose-headings:text-indigo-400 prose-headings:font-bold prose-headings:mb-4 prose-headings:mt-6'
                          + ' prose-h1:text-3xl prose-h2:text-2xl'
                          + ' prose-p:mb-4'
                          + ' prose-ul:list-disc prose-ul:ml-6 prose-ul:text-slate-400 prose-li:marker:text-indigo-500'
                          + ' prose-ol:list-decimal prose-ol:ml-6 prose-ol:text-slate-400 prose-ol:marker:text-indigo-500'
                          + ' prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-400'
                          + ' prose-code:bg-slate-800 prose-code:rounded prose-code:px-1 prose-code:text-indigo-300 prose-code:before:content-none prose-code:after:content-none'
                          + ' prose-pre:bg-slate-900 prose-pre:p-4 prose-pre:rounded-lg'
                          + ' prose-strong:text-white prose-strong:font-bold'
                }
            },
            onUpdate: ({ editor }) => {
                value = editor.getHTML();
            },
        });
    });

    onDestroy(() => {
        if (editor) {
            editor.destroy();
        }
    });

    // Reactive update if value changes externally (e.g. initial load or character switch)
    $effect(() => {
        if (editor && value !== undefined && editor.getHTML() !== value) {
             editor.commands.setContent(value);
        }
    });

</script>

<div class="relative bg-slate-950 border border-slate-800 rounded-lg group focus-within:border-indigo-500/50 transition-colors">

    <!-- Bubble Menu (Selected Text) -->
    <div bind:this={bubbleMenuElement} class="flex bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden mb-2">
        {#if editor}
            <button
                onclick={() => editor?.chain().focus().toggleBold().run()}
                class="p-2 hover:bg-slate-800 transition-colors {editor.isActive('bold') ? 'text-indigo-400 bg-slate-800' : 'text-slate-400'}"
                title="Bold"
            >
                <Bold size={16} />
            </button>
            <button
                onclick={() => editor?.chain().focus().toggleItalic().run()}
                class="p-2 hover:bg-slate-800 transition-colors {editor.isActive('italic') ? 'text-indigo-400 bg-slate-800' : 'text-slate-400'}"
                title="Italic"
            >
                <Italic size={16} />
            </button>
            <button
                onclick={() => editor?.chain().focus().toggleStrike().run()}
                class="p-2 hover:bg-slate-800 transition-colors {editor.isActive('strike') ? 'text-indigo-400 bg-slate-800' : 'text-slate-400'}"
                title="Strikethrough"
            >
                <Strikethrough size={16} />
            </button>
            <button
                onclick={() => editor?.chain().focus().toggleCode().run()}
                class="p-2 hover:bg-slate-800 transition-colors {editor.isActive('code') ? 'text-indigo-400 bg-slate-800' : 'text-slate-400'}"
                title="Code"
            >
                <Code size={16} />
            </button>
        {/if}
    </div>

    <!-- Floating Menu (Empty Line) -->
    <div bind:this={floatingMenuElement} class="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden ml-[-30px]">
        {#if editor}
            <button
                onclick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                class="p-2 hover:bg-slate-800 transition-colors {editor.isActive('heading', { level: 1 }) ? 'text-indigo-400' : 'text-slate-400'}"
                title="Heading 1"
            >
                <Heading1 size={16} />
            </button>
            <button
                onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                class="p-2 hover:bg-slate-800 transition-colors {editor.isActive('heading', { level: 2 }) ? 'text-indigo-400' : 'text-slate-400'}"
                title="Heading 2"
            >
                <Heading2 size={16} />
            </button>
            <button
                onclick={() => editor?.chain().focus().toggleBulletList().run()}
                class="p-2 hover:bg-slate-800 transition-colors {editor.isActive('bulletList') ? 'text-indigo-400' : 'text-slate-400'}"
                title="Bullet List"
            >
                <List size={16} />
            </button>
            <button
                onclick={() => editor?.chain().focus().toggleOrderedList().run()}
                class="p-2 hover:bg-slate-800 transition-colors {editor.isActive('orderedList') ? 'text-indigo-400' : 'text-slate-400'}"
                title="Ordered List"
            >
                <ListOrdered size={16} />
            </button>
            <button
                onclick={() => editor?.chain().focus().toggleBlockquote().run()}
                class="p-2 hover:bg-slate-800 transition-colors {editor.isActive('blockquote') ? 'text-indigo-400' : 'text-slate-400'}"
                title="Quote"
            >
                <Quote size={16} />
            </button>
        {/if}
    </div>

    <div bind:this={element} class="custom-scrollbar max-h-[60vh] overflow-y-auto"></div>
</div>

<style>
    /* Custom Scrollbar for the editor content */
    :global(.ProseMirror) {
        min-height: 100px;
    }
    :global(.ProseMirror:focus) {
        outline: none;
    }
    :global(.tiptap p.is-editor-empty:first-child::before) {
        color: #475569;
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
    }

    /* Manual Typography Styles since plugin is missing */
    :global(.ProseMirror h1) {
        font-size: 1.875rem;
        line-height: 2.25rem;
        font-weight: 700;
        color: #818cf8; /* indigo-400 */
        margin-top: 1.5rem;
        margin-bottom: 1rem;
    }
    :global(.ProseMirror h2) {
        font-size: 1.5rem;
        line-height: 2rem;
        font-weight: 700;
        color: #818cf8; /* indigo-400 */
        margin-top: 1.5rem;
        margin-bottom: 1rem;
    }
    :global(.ProseMirror ul) {
        list-style-type: disc;
        padding-left: 1.5rem;
        margin-bottom: 1rem;
    }
    :global(.ProseMirror ol) {
        list-style-type: decimal;
        padding-left: 1.5rem;
        margin-bottom: 1rem;
    }
    :global(.ProseMirror li) {
        margin-bottom: 0.25rem;
    }
    :global(.ProseMirror blockquote) {
        border-left-width: 4px;
        border-color: #6366f1; /* indigo-500 */
        padding-left: 1rem;
        font-style: italic;
        color: #94a3b8; /* slate-400 */
        margin-bottom: 1rem;
    }
    :global(.ProseMirror pre) {
        background-color: #0f172a; /* slate-900 */
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
    }
    :global(.ProseMirror code) {
        background-color: #1e293b; /* slate-800 */
        padding: 0.125rem 0.25rem;
        border-radius: 0.25rem;
        color: #a5b4fc; /* indigo-300 */
    }
    :global(.ProseMirror p) {
        margin-bottom: 1rem;
    }
</style>
