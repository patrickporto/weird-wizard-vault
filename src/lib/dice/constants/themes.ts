import { resolve } from '$app/paths';

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
  /** Material property overrides */
  materialOptions?: {
    color?: number;
    roughness?: number;
    metalness?: number;
    envMapIntensity?: number;
  };
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
      material: 'silk',
      font: 'Arial, system-ui',
      labels: {
        d6: ['1', '2', '3', '4', '5', '6'],
        d20: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20']
      }
    },
    boon: {
      background: '#fff',
      foreground: '#000',
      edge: '#fff',
      outline: '#000',
    },
    bane: {
      background: '#b30511ff',
      foreground: '#fff',
      edge: '#b30511ff',
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
      texture: 'Metal',
      material: 'perfectmetal',
      font: '"Uncial Antiqua", system-ui',
      labels: {
        d6: ['1', '2', '3', '4', '5', resolve('/artworks/dice/demonlord-face-white.webp')],
        d20: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', resolve('/artworks/dice/demonlord-face-white.webp')]
      }
    },
    boon: {
      background: '#fff',
      foreground: '#000',
      edge: '#fff',
      outline: '#000',
      fontOffsetY: -15,
      labels: {
        d6: ['1', '2', '3', '4', '5', resolve('/artworks/dice/demonlord-face.webp')],
      }
    },
    bane: {
      background: '#85161c',
      foreground: '#fff',
      edge: '#85161c',
      outline: '#fff',
      fontOffsetY: -15,
    },
    cubeMap: DEFAULT_CUBEMAP
  },
  'weirdwizard': {
    name: 'Weird Wizard',
    author: 'Patrick Porto',
    surface: 'wood_tray',
    category: 'RPG',
    dice: {
      foreground: '#000',
      background: '#fff',
      outline: '#000',
      edge: '#fff',
      material: 'silk',
      texture: 'none',
      font: 'Arial, system-ui',
      labels: {
        d6: ['1', '2', '3', '4', '5', '6'],
        d20: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20']
      }
    },
    boon: {
      background: '#1e4935',
      foreground: '#fff',
      edge: '#1e4935',
      outline: '#fff',
      materialOptions: {
        color: 0x1e4935,
        roughness: 0.5,
        metalness: 0.6,
        envMapIntensity: 1
      }
    },
    bane: {
      background: '#7b2cbf',
      foreground: '#fff',
      edge: '#7b2cbf',
      outline: '#fff',
      materialOptions: {
        color: 0x7b2cbf,
        roughness: 0.5,
        metalness: 0.6,
        envMapIntensity: 1
      }
    },
    cubeMap: DEFAULT_CUBEMAP
  },
};
