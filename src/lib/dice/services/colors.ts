import { TEXTURELIST } from '$lib/dice/constants/texturelist';
import { THEMES, type DiceTheme } from '$lib/dice/constants/themes';

interface DiceColorsOptions {
  assetPath?: string;
}

interface ColorSetOptions {
  name?: string;
  colorset?: string;
  texture?: string;
  material?: string;
}

interface TextureData {
  source?: string;
  source_bump?: string;
  texture?: HTMLImageElement | HTMLImageElement[];
  bump?: HTMLImageElement | HTMLImageElement[];
  material?: string;
}

interface ColorSet {
  name: string;
  texture: TextureData;
  material?: string;
  labels?: Record<string, any[]>;
  [key: string]: any; // Allow other colorset props
}

type TextureList = Record<string, TextureData>;

export class DiceColors {
  #colorsets: Map<string, ColorSet> = new Map();
  #assetPath?: string;

  constructor(options: DiceColorsOptions = {}) {
    this.#assetPath = options.assetPath;
  }

  async #loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (error) => {
        console.error('Unable to load image texture:', error);
        reject(new Error('Image loading failed'));
      };
      img.crossOrigin = 'anonymous';
      img.src = src;
    });
  }

  async #imageLoader(data: TextureData): Promise<TextureData> {
    const result: TextureData = { ...data };

    if (result.source && result.source !== '') {
      result.texture = await this.#loadImage(result.source);
    }

    if (result.source_bump && result.source_bump !== '') {
      result.bump = await this.#loadImage(result.source_bump);
    }

    return result;
  }

  #getTexture(textureName: string | string[]): TextureData {
    if (Array.isArray(textureName)) {
      // Handle array of textures if needed, or pick first.
      // For now, let's assume single texture or handle specific logic.
      // Current logic seems to expect a single string key for TEXTURELIST.
      return (TEXTURELIST as TextureList)[textureName[0]] ?? (TEXTURELIST as TextureList).none;
    }
    return (TEXTURELIST as TextureList)[textureName] ?? (TEXTURELIST as TextureList).none;
  }

  async getColorSet(options: string | ColorSetOptions): Promise<ColorSet> {
    const setName = typeof options === 'string' ? options : options?.colorset;

    const theme = THEMES[setName || 'white'] || THEMES['default'];
    // Use theme.dice as the base colorset
    const baseColorset = theme.dice;

    const colorset: ColorSet = {
      name: theme.name,
      ...baseColorset,
      texture: { ...((TEXTURELIST as TextureList).none) } // placeholder
    };

    // Get texture name from options or use the base colorset's texture source
    const textureName = typeof options === 'string'
      ? baseColorset.texture
      : options.texture ?? baseColorset.texture;

    // Get and load texture data
    colorset.texture = await this.#imageLoader(this.#getTexture(textureName || 'none'));

    // Apply material type if specified
    if (typeof options !== 'string' && options?.material) {
      colorset.texture.material = options.material;
    } else if (baseColorset.material) {
      colorset.texture.material = baseColorset.material;
    }

    // Load label images if present in theme
    if (theme.dice.labels) {
      colorset.labels = {};
      for (const [type, labels] of Object.entries(theme.dice.labels)) {
        colorset.labels[type] = await this.#loadLabelImages(labels);
      }
    }

    // Cache for later use
    if (setName) {
      this.#colorsets.set(setName, colorset);
    }

    return colorset;
  }

  /**
   * Get colorset for a specific dice type (d20, boon, bane)
   * Merges base dice style with type-specific overrides
   */
  async getColorSetForDiceType(
    themeName: string,
    diceType: 'd20' | 'boon' | 'bane' | 'default'
  ): Promise<ColorSet> {
    const theme = THEMES[themeName] || THEMES['default'];

    // Get base colorset
    const baseColorset = { ...theme.dice };

    // Apply type-specific overrides if they exist
    const override = diceType !== 'default' ? theme[diceType] : undefined;
    if (override) {
      Object.assign(baseColorset, override);
    }

    const colorset: ColorSet = {
      name: `${theme.name}-${diceType}`,
      ...baseColorset,
      texture: { ...((TEXTURELIST as TextureList).none) }
    };

    // Get and load texture data
    colorset.texture = await this.#imageLoader(this.#getTexture(baseColorset.texture || 'none'));

    // Apply material type
    if (baseColorset.material) {
      colorset.texture.material = baseColorset.material;
    }

    // Load label images if present
    if (baseColorset.labels) {
      colorset.labels = {};
      for (const [type, labels] of Object.entries(baseColorset.labels)) {
        colorset.labels[type] = await this.#loadLabelImages(labels);
      }
    }

    return colorset;
  }

  async makeColorSet(options: any = {}): Promise<ColorSet> {
    // Generate a unique name since custom colorsets don't have named IDs
    const customName = options.name ?? Date.now().toString();

    if (this.#colorsets.has(customName)) {
      return this.#colorsets.get(customName)!;
    }

    // Get texture from options or default to 'none'
    const textureName = options.texture ?? 'none';
    const textureData = await this.#imageLoader(this.#getTexture(textureName));

    // Apply material type if specified
    if (options.material) {
      textureData.material = options.material;
    }

    const colorset: ColorSet = {
      name: customName,
      foreground: options.foreground ?? '#ffffff',
      background: options.background ?? '#000000',
      outline: options.outline,
      edge: options.edge,
      font: options.font,
      texture: textureData,
      material: options.material ?? 'plastic'
    };

    if (options.labels) {
      colorset.labels = {};
      for (const [type, labels] of Object.entries(options.labels as Record<string, string[]>)) {
        colorset.labels[type] = await this.#loadLabelImages(labels);
      }
    }

    // Cache for later use
    this.#colorsets.set(colorset.name, colorset);

    return colorset;
  }

  async #loadLabelImages(labels: string[]): Promise<any[]> {
    return Promise.all(
      labels.map(async (label) => {
        if (typeof label === 'string' && /\.(png|jpe?g|gif|webp)$/i.test(label)) {
          try {
            return await this.#loadImage(label);
          } catch (error) {
            console.error(`Failed to load label image: ${label}`, error);
            return label;
          }
        }
        return label;
      })
    );
  }
}
