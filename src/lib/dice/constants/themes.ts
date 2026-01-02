export interface DiceTheme {
	name: string;
	description?: string;
	author?: string;
	showColorPicker?: boolean;
	surface: string;
	category: string;
	dice: {
		foreground: string | string[];
		background: string | string[];
		outline?: string | string[];
		edge?: string | string[];
		texture: string | string[];
		material: string;
    font: string;
	};
	cubeMap?: string[];
}

const DEFAULT_CUBEMAP = ['envmap.jpg', 'envmap.jpg', 'envmap.jpg', 'envmap.jpg', 'envmap.jpg', 'envmap.jpg'];
const TABLE_CUBEMAP = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'];

export const THEMES: Record<string, DiceTheme> = {
// Original Themes (Apps/Presets)
	'default': {
		name: 'Solid Color',
		author: 'MajorVictory',
		showColorPicker: true,
		surface: 'wood_tray',
		category: 'Basic',
    dice: {
      foreground: '#ff0000',
      background: 'rgba(255, 255, 255, 1)',
      outline: 'rgba(0, 0, 0, 1)',
      edge: 'rgba(0, 0, 0, 1)',
      texture: 'none',
      material: 'glass',
      font: 'Arial'
    },
		cubeMap: DEFAULT_CUBEMAP
  },
};
