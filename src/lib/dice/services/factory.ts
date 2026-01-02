'use strict';
import { DicePreset } from './preset';
import { MATERIALTYPES } from '$lib/dice/constants/materialtypes';
import { DICE_GEOM } from '$lib/dice/constants/dice';
import type { DiceShape } from '$lib/dice/constants/dice';

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createCanvas } from '$lib/dice/services/platform';


type MaterialType = keyof typeof MATERIALTYPES;

interface DiceFactoryConfig {
  baseScale: number;
  bumpMapping: boolean;
  scale?: number;
}

interface RotateConfig {
  [key: string]: { even?: number; odd?: number; all?: number };
}

interface DiceColorData {
  id?: string;
  foreground: string;
  background: string;
  outline: string;
  texture: any;
  edge?: string;
  font?: string;
}

interface DiceObject {
  shape: string;
  scale: number;
  mass: number;
  values: number[];
  labels: any[];
  color?: string;
  font?: string;
  normals?: any[];
  type?: string;
}

interface GeometryGroup {
  materialIndex: number;
  start: number;
  count: number;
}

type DiceGeometryType = THREE.BufferGeometry & {
  cannon_shape?: CANNON.Cylinder | CANNON.ConvexPolyhedron;
};

interface DiceValues {
  value: number;
  label: string;
  reason: string;
}

interface DiceResult extends DiceValues {
  ignore?: boolean;
}

interface DiceMesh extends THREE.Mesh {
  result: DiceResult[];
  shape: DiceShape;
  rerolls: number;
  resultReason: string;
  mass: number;
  notation?: { type: string };
  body?: { quaternion: THREE.Quaternion };
  geometry: THREE.BufferGeometry & { groups: GeometryGroup[] };
  getFaceValue?: () => DiceValues;
  storeRolledValue?: (reason?: string) => void;
  getLastValue?: () => DiceResult;
  ignoreLastValue?: (ignore: boolean) => void;
  setLastValue?: (result: DiceResult) => void;
}

interface ChamferResult {
  vectors: THREE.Vector3[];
  faces: number[][];
}

const DEFAULT_CONFIG: DiceFactoryConfig = {
  baseScale: 100,
  bumpMapping: true,
};

const MATERIAL_OPTIONS = {
  specular: 0xffffff,
  color: 0xb5b5b5,
  shininess: 5,
  flatShading: true,
};

type GeometryCreationFunction = (
  vertices: number[][],
  faces: number[][],
  radius: number,
  tab: number,
  af: number,
  chamfer: number
) => DiceGeometryType | CANNON.ConvexPolyhedron;

export class DiceFactory {
  static #dice = new Map<string, DiceObject>();

  #geometries = new Map<string, THREE.BufferGeometry>();
  #materials_cache = new Map<string, { composite: THREE.Texture; bump: THREE.Texture | null }>();
  #label_color = '';
  #dice_color = '';
  #edge_color = '';
  #label_outline = '';
  #dice_texture: any = '';
  #dice_material = '';
  #dice_font = 'Arial';

  private baseScale: number;
  private bumpMapping: boolean;
  private colordata?: DiceColorData;
  private dice_color_rand = '';
  private label_color_rand = '';
  private label_outline_rand = '';
  private dice_texture_rand: any = '';
  private dice_material_rand = '';
  private edge_color_rand = '';

  constructor(options: Partial<DiceFactoryConfig> = {}) {
    const config = { ...DEFAULT_CONFIG, ...options };
    this.baseScale = config.baseScale;
    this.bumpMapping = config.bumpMapping;
  }

  updateConfig(options: Partial<DiceFactoryConfig> = {}) {
    if (options.scale) {
      this.#scaleGeometry();
    }
    Object.assign(this, options);
  }

  setBumpMapping(bumpMapping: boolean): void {
    this.bumpMapping = bumpMapping;
    this.#materials_cache.clear();
  }

  async create(type: string): Promise<DiceMesh | null> {
    const diceobj = this.get(type);
    if (!diceobj) return null;

    let geom = this.#geometries.get(type);
    if (!geom) {
      const newGeom = this.createGeometry(
        type as DiceShape,
        diceobj.scale * this.baseScale,
        this.createDiceGeometry.bind(this)
      );
      if (newGeom instanceof THREE.BufferGeometry) {
        this.#geometries.set(type, newGeom);
        geom = newGeom;
      }
    }
    if (!geom) return null;

    this.setMaterialInfo();

    const materials = await this.createMaterials(diceobj, this.baseScale / 2, 1.0);
    if (!materials || materials.length === 0) return null;

    const mesh = new THREE.Mesh(geom, materials);
    const dicemesh = mesh as unknown as DiceMesh;

    Object.assign(dicemesh, {
      result: [],
      shape: diceobj.shape,
      rerolls: 0,
      resultReason: 'natural',
      mass: diceobj.mass,
      notation: { type }
    });

    this.#attachDiceMeshMethods(dicemesh);

    if (diceobj.color && Array.isArray(dicemesh.material)) {
      const material = dicemesh.material[0] as THREE.MeshStandardMaterial | THREE.MeshPhongMaterial;
      material.color = new THREE.Color(diceobj.color);
      material.emissive = new THREE.Color(diceobj.color);
      material.emissiveIntensity = 1;
      material.needsUpdate = true;
    }

    return this.#fixMaterials(dicemesh, diceobj.values.length);
  }

  #attachDiceMeshMethods(dicemesh: DiceMesh): void {
    dicemesh.getFaceValue = function () {
      const reason = this.resultReason;
      const vector = new THREE.Vector3(0, 0, this.shape === 'd4' ? -1 : 1);

      let closest_face: GeometryGroup | undefined;
      let closest_angle = Math.PI * 2;
      const normals = this.geometry.getAttribute('normal')?.array;
      if (!normals) return { value: 0, label: '', reason };

      for (let i = 0; i < (this.geometry.groups?.length || 0); ++i) {
        const face = this.geometry.groups[i];
        if (!face || face.materialIndex === 0) continue;

        const startVertex = i * 9;
        const normal = new THREE.Vector3(
          normals[startVertex],
          normals[startVertex + 1],
          normals[startVertex + 2]
        );

        const quaternion = this.body?.quaternion;
        if (!quaternion) return { value: 0, label: '', reason };

        const angle = normal
          .clone()
          .applyQuaternion(quaternion)
          .angleTo(vector);

        if (angle < closest_angle) {
          closest_angle = angle;
          closest_face = face;
        }
      }

      if (!closest_face?.materialIndex) return { value: 0, label: '', reason };

      const matindex = closest_face.materialIndex - 1;
      const diceobj = DiceFactory.#dice.get(this.notation?.type || '');
      if (!diceobj) return { value: 0, label: '', reason };

      if (this.shape === 'd4') {
        const labelindex2 = matindex - 1 === 0 ? 5 : matindex;
        const labels = diceobj.labels[matindex - 1];
        if (!labels) return { value: 0, label: '', reason };

        const labelArray = labels[labelindex2];
        if (!labelArray) return { value: 0, label: '', reason };

        return {
          value: matindex,
          label: labelArray[0] || '',
          reason,
        };
      }

      const offset = ['d10', 'd2'].includes(this.shape) ? 1 : 2;
      const adjustedMatindex = ['d10', 'd2'].includes(this.shape)
        ? matindex + 1
        : matindex;

      const value =
        diceobj.values[(adjustedMatindex - 1) % diceobj.values.length];
      const labelIndex = ((adjustedMatindex - 1) % (diceobj.labels.length - 2)) + offset;
      const label = diceobj.labels[labelIndex] || '';

      return { value, label, reason };
    };

    dicemesh.storeRolledValue = function (reason) {
      this.resultReason = reason || this.resultReason;
      this.result.push(this.getFaceValue());
    };

    dicemesh.getLastValue = function () {
      return this.result?.at(-1) ?? { value: undefined, label: '', reason: '' };
    };

    dicemesh.ignoreLastValue = function (ignore) {
      const lastvalue = this.getLastValue();
      if (lastvalue.value === undefined) return;

      lastvalue.ignore = ignore;
      this.setLastValue(lastvalue);
    };

    dicemesh.setLastValue = function (result) {
      if (!this.result?.length || !result?.length) return;
      return (this.result[this.result.length - 1] = result);
    };
  }

  get(type: string): DiceObject | undefined {
    if (!DiceFactory.#dice.has(type)) {
      DiceFactory.#dice.set(type, new DicePreset(type as DiceShape));
    }
    return DiceFactory.#dice.get(type);
  }

  getGeometry(type: string): THREE.BufferGeometry | undefined {
    return this.#geometries.get(type);
  }

  #scaleGeometry() {
    // Implementation for scaling geometry
  }

  #fixMaterials(mesh: DiceMesh, uniqueSides: number): DiceMesh {
    if (Array.isArray(mesh.material) && uniqueSides <= 3) {
      const materials = [...mesh.material];
      const baseIndex = materials.length - uniqueSides;
      for (let i = 0; i < baseIndex; i++) {
        materials[i] = materials[baseIndex];
      }
      mesh.material = materials;
    }
    return mesh;
  }

  async createMaterials(
    diceobj: DiceObject,
    size: number,
    margin: number,
    allowcache = true,
    d4specialindex = 0
  ): Promise<Array<THREE.MeshStandardMaterial | THREE.MeshPhongMaterial>> {
    let materials: Array<THREE.MeshStandardMaterial | THREE.MeshPhongMaterial> = [];
    let labels = diceobj.labels;
    if (diceobj.shape == 'd4') {
      labels = diceobj.labels[d4specialindex];
      size = this.baseScale / 2;
      margin = this.baseScale * 2;
    }

    for (let i = 0; i < labels.length; ++i) {
      let mat: THREE.MeshStandardMaterial | THREE.MeshPhongMaterial;
      if (this.dice_material_rand && this.dice_material_rand !== 'none') {
        const materialType = this.dice_material_rand as MaterialType;
        mat = new THREE.MeshStandardMaterial(MATERIALTYPES[materialType]);
        mat.envMapIntensity = 0;
      } else {
        mat = new THREE.MeshPhongMaterial(MATERIAL_OPTIONS);
      }

      let canvasTextures;
      if (i == 0) {
        //edge
        //if the texture is fully opaque, we do not use it for edge
        let texture = { name: 'none' };
        if (this.dice_texture_rand?.composite != 'source-over')
          texture = this.dice_texture_rand;

        canvasTextures = await this.createTextMaterial(
          diceobj,
          labels,
          i,
          size,
          margin,
          texture,
          this.label_color_rand,
          this.label_outline_rand,
          this.edge_color_rand,
          allowcache
        );
        if (canvasTextures?.composite) {
          mat.map = canvasTextures.composite;
        }
      } else {
        canvasTextures = await this.createTextMaterial(
          diceobj,
          labels,
          i,
          size,
          margin,
          this.dice_texture_rand,
          this.label_color_rand,
          this.label_outline_rand,
          this.dice_color_rand,
          allowcache
        );
        if (canvasTextures?.composite) {
          mat.map = canvasTextures.composite;
        }

        if (this.bumpMapping) {
          let scale = 0.75;
          if (size > 35) scale = 1;
          if (size > 40) scale = 2.5;
          if (size > 45) scale = 4;
          mat.bumpScale = scale;

          if (canvasTextures?.bump) {
            mat.bumpMap = canvasTextures.bump;
          }
          if (diceobj.shape != 'd4' && diceobj.normals?.[i]) {
            mat.bumpMap = new THREE.Texture(diceobj.normals[i]);
            mat.bumpScale = 4;
            mat.bumpMap.needsUpdate = true;
          }
        }
      }
      mat.opacity = 1;
      mat.transparent = true;
      mat.depthTest = false;
      mat.needsUpdate = true;
      materials.push(mat);
    }

    return materials;
  }

  async createTextMaterial(
    diceobj: DiceObject,
    labels: any[],
    index: number,
    size: number,
    margin: number,
    texture: any,
    forecolor: string,
    outlinecolor: string,
    backcolor: string,
    allowcache: boolean
  ): Promise<{ composite: THREE.Texture; bump: THREE.Texture | null } | null> {
    if (labels[index] === undefined) return null;

    texture = texture || this.dice_texture_rand;
    forecolor = forecolor || this.label_color_rand;
    outlinecolor = outlinecolor || this.label_outline_rand;
    backcolor = backcolor || this.dice_color_rand;
    allowcache = allowcache == undefined ? true : allowcache;

    let text = labels[index];
    let isTexture = false;
    let textCache = text;
    if (text instanceof HTMLImageElement) {
      textCache = text.src;
    } else if (text instanceof Array) {
      text.forEach((el) => {
        textCache += el.src;
      });
    }

    // an attempt at materials caching
    let cachestring =
      diceobj.type +
      textCache +
      index +
      texture.name +
      forecolor +
      outlinecolor +
      backcolor;
    if (diceobj.shape == 'd4') {
      cachestring =
        diceobj.type +
        textCache +
        texture.name +
        forecolor +
        outlinecolor +
        backcolor;
    }
    if (allowcache && this.#materials_cache.get(cachestring) != null) {
      return this.#materials_cache.get(cachestring) || null;
    }

    const { canvas, context } = await createCanvas();
    if (!canvas || !context) return null;

    context.globalAlpha = 0;
    context.clearRect(0, 0, canvas.width, canvas.height);

    const { canvas: canvasBump, context: contextBump } = await createCanvas();
    if (!canvasBump || !contextBump) return null;

    contextBump.globalAlpha = 0;
    contextBump.clearRect(0, 0, canvasBump.width, canvasBump.height);

    let ts;

    if (diceobj.shape == 'd4') {
      ts = this.calculateTextureSize(size + margin) * 4;
    } else {
      ts = this.calculateTextureSize(size + size * 2 * margin) * 4;
    }

    canvas.width = canvas.height = ts;
    canvasBump.width = canvasBump.height = ts;

    // create color
    context.fillStyle = backcolor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    contextBump.fillStyle = '#FFFFFF';
    contextBump.fillRect(0, 0, canvasBump.width, canvasBump.height);

    //create underlying texture
    if (texture.texture && texture.name != '' && texture.name != 'none') {
      context.globalCompositeOperation = texture.composite || 'source-over';
      context.drawImage(texture.texture, 0, 0, canvas.width, canvas.height);
      context.globalCompositeOperation = 'source-over';

      if (texture.bump) {
        contextBump.globalCompositeOperation = 'source-over';
        contextBump.drawImage(texture.bump, 0, 0, canvas.width, canvas.height);
      }
    } else {
      context.globalCompositeOperation = 'source-over';
    }

    // create text
    context.globalCompositeOperation = 'source-over';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    contextBump.textAlign = 'center';
    contextBump.textBaseline = 'middle';

    if (diceobj.shape != 'd4') {
      // fixes texture rotations on specific dice models
      const rotate: Record<DiceShape, { even?: number; odd?: number; all?: number }> = {
        d2: { all: 0 },
        d4: { all: 0 },
        d6: { all: 0 },
        d8: { even: -7.5, odd: -127.5 },
        d10: { all: -6 },
        d12: { all: 5 },
        d20: { all: -7.5 },
        d100: { all: -6 }
      };

      // fix for some faces being weirdly rotated
      let rotateface = rotate[diceobj.shape as DiceShape];
      if (rotateface) {
        let degrees;
        if (rotateface.hasOwnProperty('all')) {
          degrees = rotateface.all;
        } else {
          if (index > 0 && index % 2 != 0) {
            degrees = rotateface.odd;
          } else {
            degrees = rotateface.even;
          }
        }
        // let degrees = ((rotateface.hasOwnProperty("all") ? rotateface.all : false) || (index > 0 && (index % 2) != 0)) ? rotateface.odd : rotateface.even;

        if (degrees && degrees != 0) {
          var hw = canvas.width / 2;
          var hh = canvas.height / 2;

          context.translate(hw, hh);
          context.rotate(degrees * (Math.PI / 180));
          context.translate(-hw, -hh);

          contextBump.translate(hw, hh);
          contextBump.rotate(degrees * (Math.PI / 180));
          contextBump.translate(-hw, -hh);
        }
      }

      //custom texture face
      if (text instanceof HTMLImageElement) {
        isTexture = true;
        context.drawImage(
          text,
          0,
          0,
          text.width,
          text.height,
          0,
          0,
          canvas.width,
          canvas.height
        );

        // text-only face
      } else {
        let fontsize = ts / (1 + 2 * margin);
        let textstarty = canvas.height / 2 + 10;
        let textstartx = canvas.width / 2;

        if (diceobj.shape == 'd10') {
          fontsize = fontsize * 0.75;
          textstarty = textstarty * 1.15 - 10;
        } else if (diceobj.shape == 'd20') {
          textstartx = textstartx * 0.98;
        }

        const font = this.#dice_font || diceobj.font || 'Arial';
        context.font = fontsize + 'pt ' + font;
        contextBump.font = fontsize + 'pt ' + font;

        let lineHeight = context.measureText('M').width * 1.4;
        let textlines = text.split('\n');

        if (textlines.length > 1) {
          fontsize = fontsize / textlines.length;
          const font = this.#dice_font || diceobj.font || 'Arial';
          context.font = fontsize + 'pt ' + font;
          contextBump.font = fontsize + 'pt ' + font;
          lineHeight = context.measureText('M').width * 1.2;
          textstarty -= (lineHeight * textlines.length) / 2;
        }

        for (let i = 0, l = textlines.length; i < l; i++) {
          let textline = textlines[i].trim();

          // attempt to outline the text with a meaningful color
          if (outlinecolor != 'none' && outlinecolor != backcolor) {
            context.strokeStyle = outlinecolor;
            context.lineWidth = 5;
            context.strokeText(textlines[i], textstartx, textstarty);

            contextBump.strokeStyle = '#000000';
            contextBump.lineWidth = 5;
            contextBump.strokeText(textlines[i], textstartx, textstarty);

            if (textline == '6' || textline == '9') {
              context.strokeText('  .', textstartx, textstarty);
              contextBump.strokeText('  .', textstartx, textstarty);
            }
          }

          context.fillStyle = forecolor;
          context.fillText(textlines[i], textstartx, textstarty);

          contextBump.fillStyle = '#000000';
          contextBump.fillText(textlines[i], textstartx, textstarty);

          if (textline == '6' || textline == '9') {
            context.fillText('  .', textstartx, textstarty);
            contextBump.fillText('  .', textstartx, textstarty);
          }
          textstarty += lineHeight * 1.5;
        }
      }
    } else {
      var hw = canvas.width / 2;
      var hh = canvas.height / 2;

      const font = this.#dice_font || diceobj.font || 'Arial';
      context.font = (ts / 128) * 24 + 'pt ' + font;
      contextBump.font = (ts / 128) * 24 + 'pt ' + font;

      //draw the numbers
      for (let i = 0; i < text.length; i++) {
        //custom texture face
        if (text[i] instanceof HTMLImageElement) {
          let scaleTexture = text[i].width / canvas.width;
          context.drawImage(
            text[i],
            0,
            0,
            text[i].width,
            text[i].height,
            100 / scaleTexture,
            25 / scaleTexture,
            60 / scaleTexture,
            60 / scaleTexture
          );
        } else {
          // attempt to outline the text with a meaningful color
          if (outlinecolor != 'none' && outlinecolor != backcolor) {
            context.strokeStyle = outlinecolor;
            context.lineWidth = 5;
            context.strokeText(text[i], hw, hh - ts * 0.3);

            contextBump.strokeStyle = '#000000';
            contextBump.lineWidth = 5;
            contextBump.strokeText(text[i], hw, hh - ts * 0.3);
          }

          //draw label in top middle section
          context.fillStyle = forecolor;
          context.fillText(text[i], hw, hh - ts * 0.3);

          contextBump.fillStyle = '#000000';
          contextBump.fillText(text[i], hw, hh - ts * 0.3);
        }

        //rotate 1/3 for next label
        context.translate(hw, hh);
        context.rotate((Math.PI * 2) / 3);
        context.translate(-hw, -hh);

        contextBump.translate(hw, hh);
        contextBump.rotate((Math.PI * 2) / 3);
        contextBump.translate(-hw, -hh);
      }

      //debug side numbering
      // context.fillStyle = forecolor;
      // context.fillText(index, hw, hh);
    }

    var compositetexture = new THREE.CanvasTexture(canvas);
    var bumpMap;
    if (!isTexture) {
      bumpMap = new THREE.CanvasTexture(canvasBump);
    } else {
      bumpMap = null;
    }

    if (allowcache) {
      this.#materials_cache.set(cachestring, {
        composite: compositetexture,
        bump: bumpMap,
      });
    }

    return { composite: compositetexture, bump: bumpMap };
  }

  applyColorSet(colordata: DiceColorData): void {
    this.colordata = colordata;
    this.#label_color = colordata.foreground;
    this.#dice_color = colordata.background;
    this.#label_outline = colordata.outline;
    this.#dice_texture = colordata.texture;
    this.#dice_material = colordata.texture?.material || 'none';
    this.#edge_color = colordata.edge || colordata.background;
    if (colordata.font) {
      this.#dice_font = colordata.font;
    }
  }

  setRandomColors(): void {
    // set base color first
    if (Array.isArray(this.#dice_color)) {
      const colorindex = Math.floor(Math.random() * this.#dice_color.length);

      // if color list and label list are same length, treat them as a parallel list
      if (
        Array.isArray(this.#label_color) &&
        this.#label_color.length == this.#dice_color.length
      ) {
        this.label_color_rand = this.#label_color[colorindex];

        // if label list and outline list are same length, treat them as a parallel list
        if (
          Array.isArray(this.#label_outline) &&
          this.#label_outline.length == this.#label_color.length
        ) {
          this.label_outline_rand = this.#label_outline[colorindex];
        }
      }
      // if texture list is same length do the same
      if (
        Array.isArray(this.#dice_texture) &&
        this.#dice_texture.length == this.#dice_color.length
      ) {
        this.dice_texture_rand = this.#dice_texture[colorindex];
        this.dice_material_rand = this.dice_texture_rand.material;
      }

      //if edge list and color list are same length, treat them as a parallel list
      if (
        Array.isArray(this.#edge_color) &&
        this.#edge_color.length == this.#dice_color.length
      ) {
        this.edge_color_rand = this.#edge_color[colorindex];
      }

      this.dice_color_rand = this.#dice_color[colorindex];
    } else {
      this.dice_color_rand = this.#dice_color;
    }

    // set edge color if not set
    if (this.edge_color_rand === '') {
      if (Array.isArray(this.#edge_color)) {
        const colorindex = Math.floor(Math.random() * this.#edge_color.length);
        this.edge_color_rand = this.#edge_color[colorindex];
      } else {
        this.edge_color_rand = this.#edge_color;
      }
    }

    // if selected label color is still not set, pick one
    if (this.label_color_rand === '' && Array.isArray(this.#label_color)) {
      const colorindex = Math.floor(Math.random() * this.#label_color.length);

      // if label list and outline list are same length, treat them as a parallel list
      if (
        Array.isArray(this.#label_outline) &&
        this.#label_outline.length == this.#label_color.length
      ) {
        this.label_outline_rand = this.#label_outline[colorindex];
      }

      this.label_color_rand = this.#label_color[colorindex];
    } else if (this.label_color_rand === '') {
      this.label_color_rand = this.#label_color;
    }

    // if selected label outline is still not set, pick one
    if (this.label_outline_rand === '' && Array.isArray(this.#label_outline)) {
      const colorindex = Math.floor(Math.random() * this.#label_outline.length);
      this.label_outline_rand = this.#label_outline[colorindex];
    } else if (this.label_outline_rand === '') {
      this.label_outline_rand = this.#label_outline;
    }

    // same for textures list
    if (this.dice_texture_rand === '' && Array.isArray(this.#dice_texture)) {
      this.dice_texture_rand =
        this.#dice_texture[
        Math.floor(Math.random() * this.#dice_texture.length)
        ];
      this.dice_material_rand =
        this.dice_texture_rand.material || this.#dice_material;
    } else if (this.dice_texture_rand === '') {
      this.dice_texture_rand = this.#dice_texture;
      this.dice_material_rand =
        this.dice_texture_rand.material || this.#dice_material;
    }

    //apply material
    if (this.dice_material_rand === '' && Array.isArray(this.#dice_material)) {
      this.dice_material_rand =
        this.#dice_material[
        Math.floor(Math.random() * this.#dice_material.length)
        ];
    } else if (this.dice_material_rand === '') {
      this.dice_material_rand = this.#dice_material;
    }
  }

  setMaterialInfo(colorset = ''): void {
    const prevcolordata = this.colordata;
    const prevtexture = this.#dice_texture;
    const prevmaterial = this.#dice_material;

    //reset random choices
    this.dice_color_rand = '';
    this.label_color_rand = '';
    this.label_outline_rand = '';
    this.dice_texture_rand = '';
    this.dice_material_rand = '';
    this.edge_color_rand = '';

    this.setRandomColors();

    if (this.colordata?.id && prevcolordata?.id && this.colordata.id !== prevcolordata.id) {
      this.applyColorSet(prevcolordata);
    }
  }

  calculateTextureSize(approx: number): number {
    return Math.pow(2, Math.floor(Math.log(approx) / Math.log(2)));
  }

  createPhysicsShape(vertices: number[][], faces: number[][], radius: number): CANNON.ConvexPolyhedron {
    const vectors = new Array(vertices.length);
    for (let i = 0; i < vertices.length; ++i) {
      vectors[i] = new THREE.Vector3().fromArray(vertices[i]).normalize();
    }
    const cv = new Array(vertices.length);
    const cf = new Array(faces.length);
    for (let i = 0; i < vectors.length; ++i) {
      const v = vectors[i];
      cv[i] = new CANNON.Vec3(v.x * radius, v.y * radius, v.z * radius);
    }
    for (let i = 0; i < faces.length; ++i) {
      cf[i] = faces[i].slice(0, faces[i].length - 1);
    }
    return new CANNON.ConvexPolyhedron({ vertices: cv, faces: cf });
  }

  createBasicDiceGeometry(
    vectors: THREE.Vector3[],
    faces: number[][],
    radius: number,
    tab: number,
    af: number
  ): THREE.BufferGeometry {
    let geom = new THREE.BufferGeometry();

    for (let i = 0; i < vectors.length; ++i) {
      vectors[i] = vectors[i].multiplyScalar(radius);
    }

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    const cb = new THREE.Vector3();
    const ab = new THREE.Vector3();
    let materialIndex: number;
    let faceFirstVertexIndex = 0;

    for (let i = 0; i < faces.length; ++i) {
      const ii = faces[i];
      const fl = ii.length - 1;
      const aa = (Math.PI * 2) / fl;
      materialIndex = ii[fl] + 1;
      for (let j = 0; j < fl - 2; ++j) {
        //Vertices
        positions.push(...vectors[ii[0]].toArray());
        positions.push(...vectors[ii[j + 1]].toArray());
        positions.push(...vectors[ii[j + 2]].toArray());

        // Flat face normals
        cb.subVectors(vectors[ii[j + 2]], vectors[ii[j + 1]]);
        ab.subVectors(vectors[ii[0]], vectors[ii[j + 1]]);
        cb.cross(ab);
        cb.normalize();

        // Vertex Normals
        normals.push(...cb.toArray());
        normals.push(...cb.toArray());
        normals.push(...cb.toArray());

        //UVs
        uvs.push(
          (Math.cos(af) + 1 + tab) / 2 / (1 + tab),
          (Math.sin(af) + 1 + tab) / 2 / (1 + tab)
        );
        uvs.push(
          (Math.cos(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab),
          (Math.sin(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab)
        );
        uvs.push(
          (Math.cos(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab),
          (Math.sin(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab)
        );
      }

      //Set Group for face materials.
      const numOfVertices = (fl - 2) * 3;
      for (let i = 0; i < numOfVertices / 3; i++) {
        geom.addGroup(faceFirstVertexIndex, 3, materialIndex);
        faceFirstVertexIndex += 3;
      }
    }

    geom.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius);
    return geom;
  }

  createD10Geometry(
    vectors: THREE.Vector3[],
    faces: number[][],
    radius: number,
    tab: number,
    af: number
  ): THREE.BufferGeometry {
    let geom = new THREE.BufferGeometry();

    for (let i = 0; i < vectors.length; ++i) {
      vectors[i] = vectors[i].multiplyScalar(radius);
    }

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    const cb = new THREE.Vector3();
    const ab = new THREE.Vector3();
    let materialIndex: number;
    let faceFirstVertexIndex = 0;

    for (let i = 0; i < faces.length; ++i) {
      const ii = faces[i];
      const fl = ii.length - 1;
      const aa = (Math.PI * 2) / fl;
      materialIndex = ii[fl] + 1;
      const w = 0.65;
      const h = 0.85;
      const v0 = 1 - 1 * h;
      const v1 = 1 - (0.895 / 1.105) * h;
      const v2 = 1;

      for (let j = 0; j < fl - 2; ++j) {
        //Vertices
        positions.push(...vectors[ii[0]].toArray());
        positions.push(...vectors[ii[j + 1]].toArray());
        positions.push(...vectors[ii[j + 2]].toArray());

        // Flat face normals
        cb.subVectors(vectors[ii[j + 2]], vectors[ii[j + 1]]);
        ab.subVectors(vectors[ii[0]], vectors[ii[j + 1]]);
        cb.cross(ab);
        cb.normalize();

        // Vertex Normals
        normals.push(...cb.toArray());
        normals.push(...cb.toArray());
        normals.push(...cb.toArray());

        //UVs
        if (faces[i][faces[i].length - 1] == -1 || j >= 2) {
          uvs.push(
            (Math.cos(af) + 1 + tab) / 2 / (1 + tab),
            (Math.sin(af) + 1 + tab) / 2 / (1 + tab)
          );
          uvs.push(
            (Math.cos(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab),
            (Math.sin(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab)
          );
          uvs.push(
            (Math.cos(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab),
            (Math.sin(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab)
          );
        } else if (j == 0) {
          uvs.push(0.5 - w / 2, v1);
          uvs.push(0.5, v0);
          uvs.push(0.5 + w / 2, v1);
        } else if (j == 1) {
          uvs.push(0.5 - w / 2, v1);
          uvs.push(0.5 + w / 2, v1);
          uvs.push(0.5, v2);
        }
      }

      //Set Group for face materials.
      const numOfVertices = (fl - 2) * 3;
      for (let i = 0; i < numOfVertices / 3; i++) {
        geom.addGroup(faceFirstVertexIndex, 3, materialIndex);
        faceFirstVertexIndex += 3;
      }
    }

    geom.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius);
    return geom;
  }

  createChamferedGeometry(vectors: THREE.Vector3[], faces: number[][], chamfer: number): ChamferResult {
    const chamfer_vectors: THREE.Vector3[] = [];
    const chamfer_faces: number[][] = [];
    const corner_faces = new Array(vectors.length);
    for (let i = 0; i < vectors.length; ++i) corner_faces[i] = [];
    for (let i = 0; i < faces.length; ++i) {
      const ii = faces[i];
      const fl = ii.length - 1;
      const center_point = new THREE.Vector3();
      const face = new Array(fl);
      for (let j = 0; j < fl; ++j) {
        const vv = vectors[ii[j]].clone();
        center_point.add(vv);
        corner_faces[ii[j]].push((face[j] = chamfer_vectors.push(vv) - 1));
      }
      center_point.divideScalar(fl);
      for (let j = 0; j < fl; ++j) {
        const vv = chamfer_vectors[face[j]];
        vv.subVectors(vv, center_point)
          .multiplyScalar(chamfer)
          .addVectors(vv, center_point);
      }
      face.push(ii[fl]);
      chamfer_faces.push(face);
    }
    for (let i = 0; i < faces.length - 1; ++i) {
      for (let j = i + 1; j < faces.length; ++j) {
        const pairs: [number, number][] = [];
        let lastm = -1;
        for (let m = 0; m < faces[i].length - 1; ++m) {
          const n = faces[j].indexOf(faces[i][m]);
          if (n >= 0 && n < faces[j].length - 1) {
            if (lastm >= 0 && m != lastm + 1) pairs.unshift([i, m], [j, n]);
            else pairs.push([i, m], [j, n]);
            lastm = m;
          }
        }
        if (pairs.length != 4) continue;
        chamfer_faces.push([
          chamfer_faces[pairs[0][0]][pairs[0][1]],
          chamfer_faces[pairs[1][0]][pairs[1][1]],
          chamfer_faces[pairs[3][0]][pairs[3][1]],
          chamfer_faces[pairs[2][0]][pairs[2][1]],
          -1,
        ]);
      }
    }
    for (let i = 0; i < corner_faces.length; ++i) {
      const cf = corner_faces[i];
      const face: number[] = [cf[0]];
      let count = cf.length - 1;
      while (count) {
        for (let m = faces.length; m < chamfer_faces.length; ++m) {
          const index = chamfer_faces[m].indexOf(face[face.length - 1]);
          if (index >= 0 && index < 4) {
            const next_vertex = chamfer_faces[m][index === 0 ? 3 : index - 1];
            if (cf.indexOf(next_vertex) >= 0) {
              face.push(next_vertex);
              break;
            }
          }
        }
        --count;
      }
      face.push(-1);
      chamfer_faces.push(face);
    }
    return { vectors: chamfer_vectors, faces: chamfer_faces };
  }

  createDiceGeometry(
    vertices: number[][],
    faces: number[][],
    radius: number,
    tab: number,
    af: number,
    chamfer: number
  ): DiceGeometryType {
    const vectors = new Array(vertices.length);
    for (let i = 0; i < vectors.length; ++i) {
      vectors[i] = new THREE.Vector3().fromArray(vertices[i]).normalize();
    }
    const cg = this.createChamferedGeometry(vectors, faces, chamfer);
    const baseGeom = faces.length !== 10
      ? this.createBasicDiceGeometry(cg.vectors, cg.faces, radius, tab, af)
      : this.createD10Geometry(cg.vectors, cg.faces, radius, tab, af);

    const geom = baseGeom as DiceGeometryType;
    const shape = this.createPhysicsShape(vertices, faces, radius);
    geom.cannon_shape = shape;
    geom.name = 'd' + faces.length;
    return geom;
  }

  createGeometry(
    type: DiceShape,
    radius: number,
    geometryFunction: GeometryCreationFunction = this.createDiceGeometry.bind(this)
  ): DiceGeometryType | null {
    switch (type) {
      case 'd2': {
        const geom = new THREE.CylinderGeometry(
          1 * radius,
          1 * radius,
          0.1 * radius,
          32
        ) as DiceGeometryType;
        geom.cannon_shape = new CANNON.Cylinder(
          1 * radius,
          1 * radius,
          0.1 * radius,
          8
        );
        return geom;
      }
      case 'd4': {
        return geometryFunction(
          DICE_GEOM.d4.vertices,
          DICE_GEOM.d4.faces,
          radius,
          -0.1,
          (Math.PI * 7) / 6,
          0.96
        ) as DiceGeometryType;
      }
      case 'd6': {
        return geometryFunction(
          DICE_GEOM.d6.vertices,
          DICE_GEOM.d6.faces,
          radius,
          0.1,
          Math.PI / 4,
          0.96
        ) as DiceGeometryType;
      }
      case 'd8': {
        return geometryFunction(
          DICE_GEOM.d8.vertices,
          DICE_GEOM.d8.faces,
          radius,
          0,
          -Math.PI / 4 / 2,
          0.965
        ) as DiceGeometryType;
      }
      case 'd10': {
        return geometryFunction(
          DICE_GEOM.d10.vertices,
          DICE_GEOM.d10.faces,
          radius,
          0.3,
          Math.PI,
          0.945
        ) as DiceGeometryType;
      }
      case 'd12': {
        return geometryFunction(
          DICE_GEOM.d12.vertices,
          DICE_GEOM.d12.faces,
          radius,
          0.2,
          -Math.PI / 4 / 2,
          0.968
        ) as DiceGeometryType;
      }
      case 'd20': {
        return geometryFunction(
          DICE_GEOM.d20.vertices,
          DICE_GEOM.d20.faces,
          radius,
          -0.2,
          -Math.PI / 4 / 2,
          0.955
        ) as DiceGeometryType;
      }
      default: {
        console.error(`Geometry for ${type} is not available`);
        return null;
      }
    }
  }
}
