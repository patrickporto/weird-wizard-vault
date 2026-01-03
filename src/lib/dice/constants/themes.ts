/** Style properties for a dice type */
export interface DiceStyle {
  foreground: string | string[];
  background: string | string[];
  outline?: string | string[];
  edge?: string | string[];
  texture: string | string[];
  material: string;
  font: string;
  /** Vertical offset for text positioning (0 = centered, negative = up, positive = down) */
  fontOffsetY?: number;
  labels?: Record<string, string[]>;
}

export interface DiceTheme {
  name: string;
  description?: string;
  author?: string;
  showColorPicker?: boolean;
  surface: string;
  category: string;
  /** Default dice style */
  dice: DiceStyle;
  /** Override style for d20 dice */
  d20?: Partial<DiceStyle>;
  /** Override style for boon dice (positive d6) */
  boon?: Partial<DiceStyle>;
  /** Override style for bane dice (negative d6) */
  bane?: Partial<DiceStyle>;
  cubeMap?: string[];
}

const DEFAULT_CUBEMAP = ['envmap.jpg', 'envmap.jpg', 'envmap.jpg', 'envmap.jpg', 'envmap.jpg', 'envmap.jpg'];
const TABLE_CUBEMAP = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'];

export const THEMES: Record<string, DiceTheme> = {
  // Original Themes (Apps/Presets)
  'default': {
    name: 'Default',
    author: 'Patrick Porto',
    surface: 'wood_tray',
    category: 'RPG',
    dice: {
      foreground: '#fff',
      background: '#000',
      outline: '#fff',
      edge: '#000',
      texture: 'none',
      material: 'perfectmetal',
      font: 'Arial, system-ui',
      labels: {
        d6: ['1', '2', '3', '4', '5', '6'],
        d20: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20']
      }
    },
    // Override para boons (opcional)
    boon: {
      background: '#1a4d2e',  // Verde escuro
      foreground: '#4ade80',  // Verde claro
      edge: '#1a4d2e',
      outline: '#fff',
    },
    // Override para banes (opcional)
    bane: {
      background: '#4d1a1a',  // Vermelho escuro
      foreground: '#f87171',  // Vermelho claro
      edge: '#4d1a1a',
      outline: '#fff',
    },
    cubeMap: DEFAULT_CUBEMAP
  },
  'demonlord': {
    name: 'Demon Lord',
    author: 'Patrick Porto',
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
    boon: {
      background: '#fff',
      foreground: '#000',
      edge: '#fff',
      outline: '#000',
      fontOffsetY: -15,
      labels: {
        d6: ['1', '2', '3', '4', '5', '/artworks/dice/demonlord-face.webp'],
      }
    },
    bane: {
      background: '#ff0000',
      foreground: '#fff',
      edge: '#ff0000',
      outline: '#fff',
      fontOffsetY: -15,
    },
    cubeMap: DEFAULT_CUBEMAP
  },
};
