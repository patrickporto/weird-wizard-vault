<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Editor } from '@tiptap/core';
    import StarterKit from '@tiptap/starter-kit';
    import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
    import Placeholder from '@tiptap/extension-placeholder';
    import Suggestion from '@tiptap/suggestion';
    import { Plugin, PluginKey } from '@tiptap/pm/state';
    import { Bold, Italic, Strikethrough, Code } from 'lucide-svelte';
    import SlashMenu from './SlashMenu.svelte';
    import tippy from 'tippy.js';
    import 'tippy.js/dist/tippy.css';
    import 'tippy.js/animations/shift-away.css';
    import { mount, unmount } from 'svelte';

    let { value = $bindable(''), placeholder = "Digite '/' para comandos..." } = $props();

    let element: HTMLElement;
    let editor: Editor | null = $state(null);
    let bubbleMenuElement: HTMLElement;

    // Slash Command Suggestions
    const getSlashCommands = () => {
        return [
            {
                title: 'Texto',
                description: 'Comece a escrever com texto simples.',
                icon: 'Type',
                command: ({ editor, range }) => {
                    editor.chain().focus().deleteRange(range).setParagraph().run();
                },
            },
            {
                title: 'Título 1',
                description: 'Cabeçalho de seção grande.',
                icon: 'Heading1',
                command: ({ editor, range }) => {
                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
                },
            },
            {
                title: 'Título 2',
                description: 'Cabeçalho de seção médio.',
                icon: 'Heading2',
                command: ({ editor, range }) => {
                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
                },
            },
            {
                title: 'Lista com marcadores',
                description: 'Crie uma lista simples com bullets.',
                icon: 'List',
                command: ({ editor, range }) => {
                    editor.chain().focus().deleteRange(range).toggleBulletList().run();
                },
            },
            {
                title: 'Lista numerada',
                description: 'Crie uma lista com numeração.',
                icon: 'ListOrdered',
                command: ({ editor, range }) => {
                    editor.chain().focus().deleteRange(range).toggleOrderedList().run();
                },
            },
            {
                title: 'Citação',
                description: 'Capture uma citação.',
                icon: 'Quote',
                command: ({ editor, range }) => {
                    editor.chain().focus().deleteRange(range).toggleBlockquote().run();
                },
            },
            {
                title: 'Código',
                description: 'Capture um trecho de código.',
                icon: 'Code',
                command: ({ editor, range }) => {
                    editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
                },
            },
        ];
    };

    const renderSlashMenu = () => {
        let component: any;
        let popup: any;
        let domElement: HTMLElement;

        return {
            onStart: (props: any) => {
                domElement = document.createElement('div');

                // Using Svelte 5 mount API for dynamic component
                component = mount(SlashMenu, {
                    target: domElement,
                    props: {
                        items: props.items,
                        command: (item: any) => {
                            item.command(props);
                        },
                        editor: props.editor,
                        location: props.clientRect
                    }
                });

                if (!props.clientRect) {
                    return;
                }

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: domElement,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                    maxWidth: 300,
                    zIndex: 9999, // Ensure it's above everything
                });
            },
            onUpdate(props: any) {
                // Update component props manually since we don't have direct reactivity here easily
                // Alternatively, we could destroy and recreate or use a store passed to component
                // For simplicity/robustness in Svelte 5 manual mount context:

                if (component) {
                    unmount(component);
                }

                domElement = document.createElement('div');
                component = mount(SlashMenu, {
                    target: domElement,
                    props: {
                        items: props.items,
                        command: (item: any) => {
                            item.command(props);
                        },
                        editor: props.editor,
                        location: props.clientRect
                    }
                });

                if (popup) {
                    popup[0].setProps({
                        getReferenceClientRect: props.clientRect,
                        content: domElement,
                    });
                }
            },
            onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                    popup[0].hide();
                    return true;
                }
                // Delegate key events to the component handler logic
                return component?.onKeyDown(props);
            },
            onExit() {
                if (popup) {
                    popup[0].destroy();
                }
                if (component) {
                    unmount(component);
                }
            },
        };
    };

    const SlashCommandsExtension = PluginKey // Just a placeholder for the concept if we needed a custom extension class

    // We create a Custom Extension that wraps Suggestion
    import { Extension } from '@tiptap/core';

    const Commands = Extension.create({
        name: 'slash-commands',
        addOptions() {
            return {
                suggestion: {
                    char: '/',
                    command: ({ editor, range, props }) => {
                        props.command({ editor, range });
                    },
                },
            };
        },
        addProseMirrorPlugins() {
            return [
                Suggestion({
                    editor: this.editor,
                    ...this.options.suggestion,
                }),
            ];
        },
    });

    onMount(() => {
        editor = new Editor({
            element: element,
            extensions: [
                StarterKit.configure({
                    heading: {
                        levels: [1, 2, 3]
                    }
                }),
                Placeholder.configure({
                    placeholder: ({ node }) => {
                        if (node.type.name === 'heading') {
                            return 'Título ' + node.attrs.level;
                        }
                        return placeholder;
                    },
                    includeChildren: true,
                }),
                Commands.configure({
                    suggestion: {
                        items: ({ query }) => {
                            return getSlashCommands().filter(item =>
                                item.title.toLowerCase().startsWith(query.toLowerCase()) ||
                                item.title.toLowerCase().includes(query.toLowerCase())
                            );
                        },
                        render: renderSlashMenu
                    }
                }),
                BubbleMenuExtension.configure({
                    element: bubbleMenuElement,
                    tippyOptions: {
                        duration: 200,
                        placement: 'top',
                        animation: 'shift-away',
                        zIndex: 1000
                    }
                }),
            ],
            content: value,
            editorProps: {
                attributes: {
                    class: 'focus:outline-none min-h-[60vh] text-slate-200 leading-relaxed text-base md:text-sm selection:bg-indigo-500/30'
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
        if (editor && value !== undefined && value !== null && editor.getHTML() !== value) {
             // Only update if content is significantly different to avoid cursor jumps
             if (editor.getText() === '' && value === '') return;
             // Check if HTML content matches roughly (Tiptap can change HTML structure slightly)
             if (editor.getHTML() === value) return;

             editor.commands.setContent(value);
        }
    });

</script>

<div class="relative w-full">

    <!-- Bubble Menu (Selected Text) -->
    <div bind:this={bubbleMenuElement} class="flex items-center bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden p-1 gap-0.5 z-50">
        {#if editor}
            <button
                onclick={() => editor?.chain().focus().toggleBold().run()}
                class="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors rounded {editor.isActive('bold') ? 'text-indigo-400 bg-indigo-500/10' : ''}"
                title="Bold"
            >
                <Bold size={16} />
            </button>
            <button
                onclick={() => editor?.chain().focus().toggleItalic().run()}
                class="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors rounded {editor.isActive('italic') ? 'text-indigo-400 bg-indigo-500/10' : ''}"
                title="Italic"
            >
                <Italic size={16} />
            </button>
            <button
                onclick={() => editor?.chain().focus().toggleStrike().run()}
                class="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors rounded {editor.isActive('strike') ? 'text-indigo-400 bg-indigo-500/10' : ''}"
                title="Strikethrough"
            >
                <Strikethrough size={16} />
            </button>
            <div class="w-px h-4 bg-slate-700 mx-1"></div>
            <button
                onclick={() => editor?.chain().focus().toggleCode().run()}
                class="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors rounded {editor.isActive('code') ? 'text-indigo-400 bg-indigo-500/10' : ''}"
                title="Code"
            >
                <Code size={16} />
            </button>
        {/if}
    </div>

    <div bind:this={element} class="custom-scrollbar w-full outline-none prose-invert pb-[30vh]"></div>
</div>

<style>
    /* Custom Scrollbar for the editor content */
    :global(.ProseMirror) {
        min-height: 100px;
        outline: none !important;
    }

    /* Placeholder Styling */
    :global(.tiptap p.is-editor-empty:first-child::before),
    :global(.tiptap .is-empty::before) {
        color: #475569; /* slate-600 */
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
        font-style: italic;
    }

    /* Notion-like Block Spacing & Typography */
     :global(.ProseMirror h1) {
        font-size: 2.25em; /* Bigger */
        line-height: 1.1;
        font-weight: 800;
        color: #f8fafc;
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        letter-spacing: -0.025em;
    }
    :global(.ProseMirror h2) {
        font-size: 1.75em;
        line-height: 1.2;
        font-weight: 700;
        color: #e2e8f0;
        margin-top: 1.4em;
        margin-bottom: 0.4em;
        letter-spacing: -0.025em;
    }
    :global(.ProseMirror h3) {
        font-size: 1.35em;
        line-height: 1.3;
        font-weight: 600;
        color: #cbd5e1;
        margin-top: 1.25em;
        margin-bottom: 0.25em;
    }
    :global(.ProseMirror ul), :global(.ProseMirror ol) {
        margin-left: 0;
        margin-right: 0;
        padding-left: 1.25em;
        margin-bottom: 0.5em; /* Tighter lists */
    }
    :global(.ProseMirror li) {
        margin-bottom: 0.1em; /* Tighter list items */
        position: relative;
    }
    :global(.ProseMirror p) {
        margin-top: 0.5em;
        margin-bottom: 0.5em; /* Less gap between paragraphs */
        line-height: 1.75;
    }
    :global(.ProseMirror blockquote) {
        border-left: 3px solid #6366f1; /* indigo-500 */
        padding-left: 1em;
        font-style: italic;
        color: #94a3b8; /* slate-400 */
        margin: 1em 0;
    }
    :global(.ProseMirror code) {
        background-color: #1e293b; /* slate-800 */
        padding: 0.1em 0.3em;
        border-radius: 0.25rem;
        color: #ef4444; /* red-500 styling preference or keep indigo */
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.9em;
    }
    /* Specific Notion-like code block */
    :global(.ProseMirror pre) {
        background: #0f172a;
        color: #f8fafc;
        font-family: 'JetBrains Mono', monospace;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        overflow-x: auto;
        margin: 1em 0;
    }
    :global(.ProseMirror pre code) {
        color: inherit;
        padding: 0;
        background: none;
        font-size: 0.9em;
    }
</style>
