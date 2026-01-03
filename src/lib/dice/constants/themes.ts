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
    labels?: Record<string, string[]>;
  };
  cubeMap?: string[];
}

const DEFAULT_CUBEMAP = ['envmap.jpg', 'envmap.jpg', 'envmap.jpg', 'envmap.jpg', 'envmap.jpg', 'envmap.jpg'];
const TABLE_CUBEMAP = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'];

export const THEMES: Record<string, DiceTheme> = {
  // Original Themes (Apps/Presets)
  'demonlord': {
    name: 'Demon Lord',
    author: 'Patrick Porto',
    showColorPicker: true,
    surface: 'wood_tray',
    category: 'RPG',
    dice: {
      foreground: '#fff',
      background: '#000',
      outline: '#fff',
      edge: '#000',
      texture: 'none',
      material: 'perfectmetal',
      font: '"Uncial Antiqua", system-ui',
      labels: {
        d6: ['1', '2', '3', '4', '5', '/artworks/dice/demonlord-face-white.webp'],
        d20: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '/artworks/dice/demonlord-face-white.webp']
      }
    },
    cubeMap: DEFAULT_CUBEMAP
  },
};
