import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import { DiceNotation } from './notation';
import { DiceFactory } from './factory';
import { DiceColors } from './colors';
import { THEMES } from '$lib/dice/constants/themes';
import { PHYSICS } from '$lib/dice/constants/physics';
import { MATERIALS } from '$lib/dice/constants/materials';
import { CAMERA } from '$lib/dice/constants/camera';
import { POSITION } from '$lib/dice/constants/position';
import { DICE } from '$lib/dice/constants/dice';
import { ANIMATION } from '$lib/dice/constants/animation';
// import CannonDebugger from 'cannon-es-debugger'
import debounce from 'just-debounce-it';

interface DiceBoxConfig {
  assetPath: string;
  framerate: number;
  sounds: boolean;
  volume: number;
  color_spotlight: number;
  shadows: boolean;
  theme_surface: string;
  sound_dieMaterial: string;
  theme_customColorset: any | null;
  theme_colorset: string;
  theme_texture: string;
  theme_material: string;
  gravity_multiplier: number;
  light_intensity: number;
  baseScale: number;
  strength: number;
  iterationLimit: number;
}

interface DisplayConfig {
  currentWidth: number | null;
  currentHeight: number | null;
  containerWidth: number | null;
  containerHeight: number | null;
  aspect: number | null;
  scale: number | null;
}

interface CameraHeightConfig {
  max: number | null;
  close: number | null;
  medium: number | null;
  far: number | null;
}

interface BoxBody {
  desk: CANNON.Body | null;
  topWall: CANNON.Body | null;
  bottomWall: CANNON.Body | null;
  leftWall: CANNON.Body | null;
  rightWall: CANNON.Body | null;
}

interface ThemeConfig {
  colorset: string;
  texture: string;
  material: string;
}

interface Vector2D {
  x: number;
  y: number;
}

interface DiceResult {
  type: string;
  sides: number;
  id: number;
  value: number;
  reason?: string;
}

const DEFAULT_CONFIG: DiceBoxConfig = {
  assetPath: './',
  framerate: 1 / 60,
  sounds: false,
  volume: 100,
  color_spotlight: 0xefdfd5,
  shadows: true,
  theme_surface: 'green-felt',
  sound_dieMaterial: 'plastic',
  theme_customColorset: null,
  theme_colorset: 'white',
  theme_texture: '',
  theme_material: 'glass',
  gravity_multiplier: 400,
  light_intensity: 0.7,
  baseScale: 100,
  strength: 1,
  iterationLimit: 1000,
};

export class DiceBox {
  #initialized = false;
  #last_time = 0;
  #running: number | boolean = false;
  #rolling = false;
  #soundDelay = 10;
  #animstate = '';
  #dieIndex = 0;

  private container: HTMLDivElement;
  private dimensions: THREE.Vector2;
  private box_body: BoxBody;
  private diceList: any[] = [];
  private display: DisplayConfig = {
    currentWidth: null,
    currentHeight: null,
    containerWidth: null,
    containerHeight: null,
    aspect: null,
    scale: null
  };
  private cameraHeight: CameraHeightConfig = {
    max: null,
    close: null,
    medium: null,
    far: null
  };
  private scene: THREE.Scene;
  private world: CANNON.World;
  private dice_body_material: CANNON.Material;
  private sounds_table: Map<string, any[]> = new Map();
  private sounds_dice: any[] = [];
  private lastSoundType: string = '';
  private lastSoundStep: number = 0;
  private lastSound: number = 0;
  private DiceColors: DiceColors;
  private DiceFactory: DiceFactory;
  private surface: string = '';
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private light!: THREE.DirectionalLight;
  private light_amb!: THREE.HemisphereLight;
  private desk!: THREE.Mesh;
  private colorData: any;
  private notationVectors: any;
  private iteration: number = 0;
  private steps: number = 0;
  private DiceFunctions: any;
  private selector: { dice: string[] } = { dice: [] };

  // Propriedades do DiceBoxConfig com inicializadores
  private assetPath: string = './';
  private framerate: number = 1 / 60;
  private sounds: boolean = false;
  private volume: number = 100;
  private color_spotlight: number = 0xefdfd5;
  private shadows: boolean = true;
  private theme_surface: string = 'green-felt';
  private sound_dieMaterial: string = 'plastic';
  private theme_customColorset: any | null = null;
  private theme_colorset: string = 'white';
  private theme_texture: string = '';
  private theme_material: string = 'glass';
  private gravity_multiplier: number = 400;
  private light_intensity: number = 0.7;
  private baseScale: number = 100;
  private strength: number = 1;
  private iterationLimit: number = 1000;

  constructor(element: HTMLDivElement, options: Partial<DiceBoxConfig> = {}) {
    this.container = element;
    this.dimensions = new THREE.Vector2(
      this.container.clientWidth,
      this.container.clientHeight
    );

    this.box_body = {
      desk: null,
      topWall: null,
      bottomWall: null,
      leftWall: null,
      rightWall: null,
    };

    this.scene = new THREE.Scene();
    this.world = new CANNON.World();
    this.dice_body_material = new CANNON.Material();

    // Merge com default config e options
    Object.assign(this, DEFAULT_CONFIG, options);

    this.DiceColors = new DiceColors({ assetPath: this.assetPath });
    this.DiceFactory = new DiceFactory({
      baseScale: this.baseScale,
    });
    this.DiceFactory.setBumpMapping(true);

    this.surface = THEMES[this.theme_surface as keyof typeof THEMES].surface;
  }

  get initialized() {
    return this.#initialized;
  }

  get running() {
    return this.#running;
  }

  get rolling() {
    return this.#rolling;
  }

  toggleShadows(enabled: boolean): void {
    this.shadows = enabled;
    if (this.renderer) this.renderer.shadowMap.enabled = this.shadows;
    if (this.light) this.light.castShadow = this.shadows;
    if (this.desk) this.desk.receiveShadow = this.shadows;
  }

  async initialize() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });

    this.container.appendChild(this.renderer.domElement);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = this.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.setClearColor(0x000000, 0);

    this.setDimensions(this.dimensions);

    this.world.gravity.set(0, 0, PHYSICS.GRAVITY_MULTIPLIER * this.gravity_multiplier);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = PHYSICS.SOLVER_ITERATIONS;
    this.world.allowSleep = true;

    this.makeWorldBox();
    this.resizeWorld();

    try {
      await this.loadTheme({
        colorset: this.theme_colorset,
        texture: this.theme_texture,
        material: this.theme_material,
      });

      if (this.sounds) {
        await this.loadSounds();
      }

      this.#initialized = true;
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error('Initialization failed:', error);
      throw error;
    }
  }

  makeWorldBox() {
    // Remove existing bodies if they exist
    if (this.box_body.desk) this.world.removeBody(this.box_body.desk);
    if (this.box_body.topWall) this.world.removeBody(this.box_body.topWall);
    if (this.box_body.bottomWall)
      this.world.removeBody(this.box_body.bottomWall);
    if (this.box_body.leftWall) this.world.removeBody(this.box_body.leftWall);
    if (this.box_body.rightWall) this.world.removeBody(this.box_body.rightWall);

    const desk_body_material = new CANNON.Material();
    const barrier_body_material = new CANNON.Material();

    this.world.addContactMaterial(
      new CANNON.ContactMaterial(desk_body_material, this.dice_body_material, {
        mass: 0,
        friction: MATERIALS.FRICTION,
        restitution: MATERIALS.DESK_RESTITUTION,
      })
    );
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(
        barrier_body_material,
        this.dice_body_material,
        { mass: 0, friction: MATERIALS.FRICTION, restitution: MATERIALS.BARRIER_RESTITUTION }
      )
    );
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(
        this.dice_body_material,
        this.dice_body_material,
        { mass: 0, friction: MATERIALS.FRICTION, restitution: MATERIALS.DESK_RESTITUTION }
      )
    );

    this.box_body.desk = new CANNON.Body({
      allowSleep: false,
      mass: 0,
      shape: new CANNON.Plane(),
      material: desk_body_material,
    });
    this.world.addBody(this.box_body.desk);

    this.box_body.topWall = new CANNON.Body({
      allowSleep: false,
      mass: 0,
      shape: new CANNON.Plane(),
      material: barrier_body_material,
    });
    this.box_body.topWall.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      Math.PI / 2
    );
    this.box_body.topWall.position.set(
      0,
      this.display.containerHeight * POSITION.WALL_SCALE,
      0
    );
    this.world.addBody(this.box_body.topWall);

    this.box_body.bottomWall = new CANNON.Body({
      allowSleep: false,
      mass: 0,
      shape: new CANNON.Plane(),
      material: barrier_body_material,
    });
    this.box_body.bottomWall.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    );
    this.box_body.bottomWall.position.set(
      0,
      -this.display.containerHeight * POSITION.WALL_SCALE,
      0
    );
    this.world.addBody(this.box_body.bottomWall);

    this.box_body.leftWall = new CANNON.Body({
      allowSleep: false,
      mass: 0,
      shape: new CANNON.Plane(),
      material: barrier_body_material,
    });
    this.box_body.leftWall.quaternion.setFromAxisAngle(
      new CANNON.Vec3(0, 1, 0),
      -Math.PI / 2
    );
    this.box_body.leftWall.position.set(
      this.display.containerWidth * POSITION.WALL_SCALE,
      0,
      0
    );
    this.world.addBody(this.box_body.leftWall);

    this.box_body.rightWall = new CANNON.Body({
      allowSleep: false,
      mass: 0,
      shape: new CANNON.Plane(),
      material: barrier_body_material,
    });
    this.box_body.rightWall.quaternion.setFromAxisAngle(
      new CANNON.Vec3(0, 1, 0),
      Math.PI / 2
    );
    this.box_body.rightWall.position.set(
      -this.display.containerWidth * POSITION.WALL_SCALE,
      0,
      0
    );
    this.world.addBody(this.box_body.rightWall);
  }

  async loadTheme(themeConfig: ThemeConfig): Promise<void> {
    let colorData;
    if (this.theme_customColorset) {
      colorData = await this.DiceColors.makeColorSet(this.theme_customColorset);
    } else {
      colorData = await this.DiceColors.getColorSet(themeConfig);
    }
    this.DiceFactory.applyColorSet(colorData);
    this.colorData = colorData;
  }

  async loadSounds() {
    let surfaces = {
      felt: 7,
      wood_table: 7,
      wood_tray: 7,
      metal: 9,
    };

    //TODO: add dice hit noises for other materials
    let dieMaterials = {
      coin: 6,
      metal: 12,
      plastic: 15,
      wood: 12,
    };

    const hassound_dieMaterial =
      this.colorData.texture.material.match(/wood|metal/g);

    this.sound_dieMaterial = hassound_dieMaterial
      ? this.colorData.texture.material
      : 'plastic';

    if (!this.sounds_table.has(this.surface)) {
      this.sounds_table.set(this.surface, []);
      let numsounds = surfaces[this.surface];
      for (let s = 1; s <= numsounds; ++s) {
        const clip = await this.loadAudio(
          this.assetPath +
          'sounds/surfaces/surface_' +
          this.surface +
          s +
          '.mp3'
        );
        this.sounds_table.get(this.surface).push(clip);
      }
    }
    // load the coin sounds for all sets
    if (!this.sounds_dice.hasOwnProperty('coin')) {
      this.sounds_dice['coin'] = [];
      let numsounds = dieMaterials['coin'];
      for (let s = 1; s <= numsounds; ++s) {
        const clip = await this.loadAudio(
          this.assetPath + 'sounds/dicehit/dicehit_coin' + s + '.mp3'
        );
        this.sounds_dice['coin'].push(clip);
      }
    }
    if (!this.sounds_dice.hasOwnProperty(this.sound_dieMaterial)) {
      this.sounds_dice[this.sound_dieMaterial] = [];
      let numsounds = dieMaterials[this.sound_dieMaterial];
      for (let s = 1; s <= numsounds; ++s) {
        const clip = await this.loadAudio(
          this.assetPath +
          'sounds/dicehit/dicehit_' +
          this.sound_dieMaterial +
          s +
          '.mp3'
        );
        this.sounds_dice[this.sound_dieMaterial].push(clip);
      }
    }
  }

  loadAudio(src: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      let audio = new Audio();
      audio.oncanplaythrough = () => resolve(audio);
      audio.crossOrigin = 'anonymous';
      audio.src = src;
      audio.onerror = (error: Event) => reject(error);
    }).catch((error: Error) => {
      console.error('Unable to load audio');
      throw error;
    });
  }

  async updateConfig(options = {}) {
    // if(options.scale && this.scale !== options.scale){
    // 	this.DiceFactory.updateConfig({
    // 		scale: options.scale
    // 	})
    // }
    Object.assign(this, options);
    this.theme_customColorset = options.theme_customColorset
      ? options.theme_customColorset
      : null;
    if (options.theme_colorset) {
      this.theme_colorset = options.theme_colorset;
    }
    if (options.theme_texture) {
      this.theme_texture = options.theme_texture;
    }
    if (options.theme_material) {
      this.theme_material = options.theme_material;
    }
    if (
      options.theme_colorset ||
      options.theme_texture ||
      options.theme_material ||
      options.theme_customColorset
    ) {
      await this.loadTheme({
        colorset: this.theme_colorset,
        texture: this.theme_texture,
        material: this.theme_material,
      });
    }
  }

  setDimensions(dimensions: THREE.Vector2): void {
    this.display.currentWidth = this.container.clientWidth / 2;
    this.display.currentHeight = this.container.clientHeight / 2;
    if (dimensions) {
      this.display.containerWidth = dimensions.x;
      this.display.containerHeight = dimensions.y;
    } else {
      this.display.containerWidth = this.display.currentWidth;
      this.display.containerHeight = this.display.currentHeight;
    }
    this.display.aspect = Math.min(
      this.display.currentWidth / this.display.containerWidth,
      this.display.currentHeight / this.display.containerHeight
    );
    if (this.display.aspect) {
      this.display.scale =
      Math.sqrt(
        this.display.containerWidth * this.display.containerWidth +
        this.display.containerHeight * this.display.containerHeight
      ) / 13;
    }

    this.makeWorldBox();

    this.renderer.setSize(
      this.display.currentWidth * 2,
      this.display.currentHeight * 2
    );

    this.cameraHeight.max =
      this.display.currentHeight /
      this.display.aspect /
      POSITION.CAMERA_TAN_ANGLE;

    this.cameraHeight.medium = this.cameraHeight.max / POSITION.MEDIUM_DIVIDER;
    this.cameraHeight.far = this.cameraHeight.max;
    this.cameraHeight.close = this.cameraHeight.max / POSITION.CLOSE_DIVIDER;

    if (this.camera) this.scene.remove(this.camera);
    this.camera = new THREE.PerspectiveCamera(
      CAMERA.FOV,
      this.display.currentWidth / this.display.currentHeight,
      CAMERA.NEAR,
      this.cameraHeight.max * CAMERA.FAR_MULTIPLIER
    );

    switch (this.#animstate) {
      case 'selector':
        this.camera.position.z =
          (this.selector?.dice?.length || 1) > 9
            ? this.cameraHeight.far
          : (this.selector?.dice?.length || 1) < 6
              ? this.cameraHeight.close
              : this.cameraHeight.medium;
        break;
      case 'throw':
      case 'afterthrow':
      default:
        this.camera.position.z = this.cameraHeight.far;
    }

    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    const maxwidth = Math.max(
      this.display.containerWidth,
      this.display.containerHeight
    );

    if (this.light) this.scene.remove(this.light);
    if (this.light_amb) this.scene.remove(this.light_amb);

    // Ambient hemisphere light: bright sky color + dark ground color
    this.light_amb = new THREE.HemisphereLight(
      0xffffff,  // sky color (bright white)
      0x080820,  // ground color (dark blue)
      4.0        // high intensity for ambient fill
    );
    this.scene.add(this.light_amb);

    // Main directional light for sharp specular highlights
    this.light = new THREE.DirectionalLight(
      0xffffff,
      1.5  // moderate intensity, balanced with hemisphere
    );
    this.light.position.set(
      -this.display.containerWidth / 20,
      this.display.containerHeight / 20,
      maxwidth / 2
    );
    this.light.target.position.set(0, 0, 0);
    this.light.castShadow = this.shadows;
    this.light.shadow.camera.near = maxwidth / 10;
    this.light.shadow.camera.far = maxwidth * 5;
    this.light.shadow.bias = -0.0001;
    this.light.shadow.mapSize.width = 2048;
    this.light.shadow.mapSize.height = 2048;

    // Orthographic shadow camera bounds
    const halfWidth = this.display.containerWidth / 2;
    const halfHeight = this.display.containerHeight / 2;
    const d = Math.max(halfWidth, halfHeight) * 1.05;
    this.light.shadow.camera.left = -d * 2;
    this.light.shadow.camera.right = d * 2;
    this.light.shadow.camera.top = d;
    this.light.shadow.camera.bottom = -d;
    this.scene.add(this.light);

    // Create environment map for metallic materials
    if (!this.scene.environment) {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      pmremGenerator.compileEquirectangularShader();

      // Create a simple gradient environment
      const envScene = new THREE.Scene();
      const envCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      // Create gradient background
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      const gradient = ctx.createLinearGradient(0, 0, 0, 512);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.3, '#888888');
      gradient.addColorStop(0.5, '#444444');
      gradient.addColorStop(0.7, '#222222');
      gradient.addColorStop(1, '#111111');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);

      const envTexture = new THREE.CanvasTexture(canvas);
      envTexture.mapping = THREE.EquirectangularReflectionMapping;

      this.scene.environment = pmremGenerator.fromEquirectangular(envTexture).texture;
      pmremGenerator.dispose();
      envTexture.dispose();
    }

    if (this.desk) this.scene.remove(this.desk);
    let shadowplane = new THREE.ShadowMaterial();
    shadowplane.opacity = 0.5;
    this.desk = new THREE.Mesh(
      new THREE.PlaneGeometry(
        this.display.containerWidth * POSITION.CONTAINER_SCALE,
        this.display.containerHeight * POSITION.CONTAINER_SCALE,
        1,
        1
      ),
      shadowplane
    );
    this.desk.receiveShadow = this.shadows;
    this.scene.add(this.desk);

    this.renderer.render(this.scene, this.camera);
  }

  resizeWorld() {
    const resize = () => {
      const canvas = this.renderer.domElement;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      const needResize = canvas.width !== width || canvas.height !== height;
      if (needResize) {
        this.setDimensions(
          new THREE.Vector2(
            this.container.clientWidth,
            this.container.clientHeight
          )
        );
      }
      return needResize;
    };
    const debounceResize = debounce(resize);
    window.addEventListener('resize', debounceResize);
  }

  vectorRand({ x, y }: Vector2D): Vector2D {
    let angle = (Math.random() * Math.PI) / 5 - Math.PI / 5 / 2;
    let vec = {
      x: x * Math.cos(angle) - y * Math.sin(angle),
      y: x * Math.sin(angle) + y * Math.cos(angle),
    };
    if (vec.x == 0) vec.x = 0.01;
    if (vec.y == 0) vec.y = 0.01;
    return vec;
  }

  //returns an array of vectordata objects
  getNotationVectors(notation: string, vector: Vector2D, boost: number, dist: number): any {
    let notationVectors = new DiceNotation(notation);

    for (let i in notationVectors.set) {
      const diceobj = this.DiceFactory.get(notationVectors.set[i].type);
      let numdice = notationVectors.set[i].num;
      let operator = notationVectors.set[i].op;
      let sid = notationVectors.set[i].sid;
      let gid = notationVectors.set[i].gid;
      let glvl = notationVectors.set[i].glvl;
      let func = notationVectors.set[i].func;
      let args = notationVectors.set[i].args;

      for (let k = 0; k < numdice; k++) {
        let vec = this.vectorRand(vector);

        vec.x /= dist;
        vec.y /= dist;

        let pos = {
          x: this.display.containerWidth * (vec.x > 0 ? -1 : 1) * POSITION.WALL_SCALE,
          y: this.display.containerHeight * (vec.y > 0 ? -1 : 1) * POSITION.WALL_SCALE,
          z: Math.random() * DICE.RANDOM_Z_MIN + DICE.RANDOM_Z_MAX,
        };

        let projector = Math.abs(vec.x / vec.y);
        if (projector > 1.0) pos.y /= projector;
        else pos.x *= projector;

        let velvec = this.vectorRand(vector);
        velvec.x /= dist;
        velvec.y /= dist;
        let velocity, angle, axis;

        if (diceobj.shape != 'd2') {
          velocity = {
            x: velvec.x * boost,
            y: velvec.y * boost,
            z: -10,
          };

          angle = {
            x: -(Math.random() * vec.y * 5 + diceobj.inertia * vec.y),
            y: Math.random() * vec.x * 5 + diceobj.inertia * vec.x,
            z: 0,
          };

          axis = {
            x: Math.random(),
            y: Math.random(),
            z: Math.random(),
            a: Math.random(),
          };
        } else {
          //coin flip
          velocity = {
            x: (velvec.x * boost) / 10,
            y: (velvec.y * boost) / 10,
            z: DICE.COIN_VELOCITY_Z,
          };

          angle = {
            x: DICE.COIN_ANGLE_X * diceobj.inertia,
            y: DICE.COIN_ANGLE_Y * diceobj.inertia,
            z: 0,
          };

          axis = {
            x: 1,
            y: 1,
            z: Math.random(),
            a: Math.random(),
          };
        }

        notationVectors.vectors.push({
          index: this.#dieIndex++,
          type: diceobj.type,
          op: operator,
          sid: sid,
          gid: gid,
          glvl: glvl,
          func: func,
          args: args,
          pos: pos,
          velocity: velocity,
          angle: angle,
          axis: axis,
        });
      }
    }

    return notationVectors;
  }

  // swaps dice faces to match desired result
  swapDiceFace(dicemesh: any, result: number): void {
    const diceobj = this.DiceFactory.get(dicemesh.notation.type);

    // flag this result as forced
    dicemesh.resultReason = 'forced';

    if (diceobj.shape == 'd4') {
      this.swapDiceFace_D4(dicemesh, result);
      return;
    }

    let values = diceobj.values;
    let value = parseInt(String(dicemesh.getLastValue().value));
    let resultParsed: number = parseInt(String(result));

    if (dicemesh.notation.type == 'd10' && value == 0) value = 10;
    if (dicemesh.notation.type == 'd100' && value == 0) value = 100;
    if (dicemesh.notation.type == 'd100' && value > 0 && value < 10)
      value *= 10;

    if (dicemesh.notation.type == 'd10' && resultParsed == 0) resultParsed = 10;
    if (dicemesh.notation.type == 'd100' && resultParsed == 0) resultParsed = 100;
    if (dicemesh.notation.type == 'd100' && resultParsed > 0 && resultParsed < 10)
      resultParsed *= 10;

    let valueindex = diceobj.values.indexOf(value);
    let resultindex = diceobj.values.indexOf(resultParsed);

    if (valueindex < 0 || resultindex < 0) return;
    if (valueindex == resultindex) return;

    // find material index for corresponding value -> face and swap them
    // must clone the geom before modifying it
    let geom = dicemesh.geometry.clone();

    // find list of faces that use the matching material index for the given value/result
    let geomindex_value = [];
    let geomindex_result = [];

    // it's magic but not really
    // the mesh's materials start at index 2
    let magic = DICE.MATERIAL_INDEX_DEFAULT;
    // except on d10 meshes
    if (diceobj.shape == 'd10') magic = DICE.MATERIAL_INDEX_D10;

    let material_value,
      material_result = resultindex + magic;

    //and D2 meshes have a lot more faces
    if (diceobj.shape != 'd2') {
      material_value = valueindex + magic;
      material_result = resultindex + magic;
    } else {
      material_value = valueindex + 1;
      material_result = resultindex + 1;
    }

    //and probably some third rule eventually...

    // let normals = geom.getAttribute('normal').array;
    for (var i = 0, l = geom.groups.length; i < l; ++i) {
      const face = geom.groups[i];
      const matindex = face.materialIndex;

      if (matindex == material_value) {
        geomindex_value.push(i);
        continue;
      }
      if (matindex == material_result) {
        geomindex_result.push(i);
        continue;
      }
    }

    if (geomindex_value.length <= 0 || geomindex_result.length <= 0) return;

    //swap the materials
    for (let i = 0, l = geomindex_result.length; i < l; i++) {
      geom.groups[geomindex_result[i]].materialIndex = material_value;
    }

    for (let i = 0, l = geomindex_value.length; i < l; i++) {
      geom.groups[geomindex_value[i]].materialIndex = material_result;
    }

    dicemesh.geometry = geom;
    dicemesh.result = [];
  }

  swapDiceFace_D4(dicemesh: any, result: number): void {
    const diceobj = this.DiceFactory.get(dicemesh.notation.type);
    let value = parseInt(String(dicemesh.getLastValue().value));
    const resultInt = parseInt(String(result));

    if (!(value >= 1 && value <= 4)) return;

    let num = result - value;
    let geom = dicemesh.geometry.clone();

    for (let i = 0, l = geom.groups.length; i < l; ++i) {
      const face = geom.groups[i];
      let matindex = face.materialIndex;
      if (matindex == 0) continue;

      matindex += num - 1;

      while (matindex > 4) matindex -= 4;
      while (matindex < 1) matindex += 4;

      face.materialIndex = matindex + 1;
    }
    if (num != 0) {
      if (num < 0) num += 4;
      dicemesh.material = this.DiceFactory.createMaterials(
        diceobj,
        0,
        0,
        false,
        num
      );
    }

    dicemesh.geometry = geom;
  }

  //spawns one dicemesh object from a single vectordata object
  async spawnDice(vectordata: any, reset: boolean = false): Promise<void> {
    const { pos, axis, angle, velocity } = vectordata;
    let dicemesh;

    if (!reset) {
      dicemesh = await this.DiceFactory.create(vectordata.type, this.colorData);
      if (!dicemesh) return;
      dicemesh.notation = vectordata;
      dicemesh.result = [];
      dicemesh.stopped = 0;
      dicemesh.castShadow = this.shadows;
      this.scene.add(dicemesh);
      this.diceList.push(dicemesh);
    } else {
      dicemesh = reset;
      // dicemesh.result = [];
      dicemesh.stopped = 0;
      this.world.removeBody(dicemesh.body);
    }

    dicemesh.body = new CANNON.Body({
      allowSleep: true,
      sleepSpeedLimit: PHYSICS.SLEEP_SPEED_LIMIT,
      sleepTimeLimit: PHYSICS.SLEEP_TIME_LIMIT,
      mass: dicemesh.mass,
      shape: dicemesh.geometry.cannon_shape,
      material: this.dice_body_material,
    });
    dicemesh.body.type = CANNON.Body.DYNAMIC;
    dicemesh.body.position.set(pos.x, pos.y, pos.z);
    dicemesh.body.quaternion.setFromAxisAngle(
      new CANNON.Vec3(axis.x, axis.y, axis.z),
      axis.a * Math.PI * 2
    );
    dicemesh.body.angularVelocity.set(angle.x, angle.y, angle.z);
    dicemesh.body.velocity.set(velocity.x, velocity.y, velocity.z);
    dicemesh.body.linearDamping = PHYSICS.LINEAR_DAMPING;
    dicemesh.body.angularDamping = PHYSICS.ANGULAR_DAMPING;
    dicemesh.body.diceShape = dicemesh.shape;
    dicemesh.body.sleepState = 0;

    dicemesh.body.addEventListener('collide', this.eventCollide.bind(this));

    this.world.addBody(dicemesh.body);
  }

  eventCollide({ body, target }: { body: any; target: any }): void {
    // collision events happen simultaneously for both colliding bodies
    // all this sanity checking helps limits sounds being played

    // don't play sounds if we're simulating
    if (this.#animstate == 'simulate') return;
    if (!this.sounds || !body) return;

    // let volume = parseInt(window.DiceFavorites.settings.volume.value) || 0;
    if (this.volume <= 0) return;

    let now = Date.now();
    let currentSoundType = body.mass > 0 ? 'dice' : 'table';

    // the idea here is that a dice clack should never be skipped in favor of a table sound
    // if ((don't play sounds if we played one this world step, or there hasn't been enough delay) AND 'this sound IS NOT a dice clack') then 'skip it'
    if (
      (this.lastSoundStep == body.world.stepnumber || this.lastSound > now) &&
      currentSoundType != 'dice'
    )
      return;

    // also skip if it's too early and both last sound and this sound are the same
    if (
      (this.lastSoundStep == body.world.stepnumber || this.lastSound > now) &&
      currentSoundType == 'dice' &&
      this.lastSoundType == 'dice'
    )
      return;

    if (body.mass > 0) {
      // dice to dice collision

      let speed = body.velocity.length();
      // also don't bother playing at low speeds
      if (speed < ANIMATION.MIN_SOUND_SPEED) return;

      let sound;

      if (body.diceShape === 'd2') {
        sound =
          this.sounds_dice['coin'][
          Math.floor(Math.random() * this.sounds_dice['coin'].length)
          ];
      } else {
        sound =
          this.sounds_dice[this.sound_dieMaterial][
          Math.floor(
            Math.random() * this.sounds_dice[this.sound_dieMaterial].length
          )
          ];
      }
      if (sound) {
        sound.volume = Math.min(speed / ANIMATION.SOUND_VOLUME_DIVIDER, this.volume / 100);
        sound.play().catch((error) => { });
      }
      // if (isPlaying !== undefined) {
      // 	isPlaying.then(() => {
      // 		// Autoplay started!
      // 	}).catch(error => {
      // 		// Autoplay was prevented.
      // 		// console.warn('Sounds muted by autoplay')
      // 	});
      // }
      this.lastSoundType = 'dice';
    } else {
      // dice to table collision
      let speed = target.velocity.length();
      // also don't bother playing at low speeds
      if (speed < ANIMATION.MIN_SOUND_SPEED) return;

      let surface = this.surface;

      let soundlist = this.sounds_table.get(surface);
      let sound = soundlist[Math.floor(Math.random() * soundlist.length)];
      if (sound) {
        sound.volume = Math.min(speed / ANIMATION.SOUND_VOLUME_DIVIDER, this.volume / 100);
        sound.play().catch((error) => { });
      }
      // if (isPlaying !== undefined) {
      // 	isPlaying.then(() => {
      // 		// Autoplay started!
      // 	}).catch(error => {
      // 		// Autoplay was prevented.
      // 		// console.warn('Sounds muted by autoplay')
      // 	});
      // }
      this.lastSoundType = 'table';
    }

    this.lastSoundStep = body.world.stepnumber;
    this.lastSound = now + ANIMATION.SOUND_DELAY;
  }

  checkForRethrow(dicemesh: any): boolean {
    const diceFunc = dicemesh.notation.func?.toLowerCase() || '';
    if (!diceFunc) {
      return false;
    }

    const funcdata = this.DiceFunctions?.rethrowFunctions?.[diceFunc];
    if (!funcdata?.method) {
      return false;
    }

    const diceFuncArgs = dicemesh.notation.args || '';
    return funcdata.method(dicemesh, diceFuncArgs);
  }

  throwFinished(): boolean {
    const forcedFinish = this.iteration > this.iterationLimit;
    const sleepState = CANNON.Body.SLEEPING;

    for (const dicemesh of this.diceList) {
      if (dicemesh.body.type === CANNON.Body.KINEMATIC) {
        continue;
      }

      if (dicemesh.body.sleepState < sleepState && !forcedFinish) {
        return false;
      }

      if (dicemesh.body.sleepState !== sleepState && !forcedFinish) {
        continue;
      }

      if (dicemesh.result.length === 0) {
        dicemesh.storeRolledValue(dicemesh.resultReason);
      } else if (dicemesh.result.length > 0 && dicemesh.rerolling) {
        dicemesh.rerolling = false;
        dicemesh.storeRolledValue('reroll');
      }

      const rethrow = this.checkForRethrow(dicemesh);
      if (rethrow) {
        dicemesh.rerolls += 1;
        dicemesh.rerolling = true;
        dicemesh.body.wakeUp();
        dicemesh.body.type = CANNON.Body.DYNAMIC;
        dicemesh.body.angularVelocity = new CANNON.Vec3(25, 25, 25);
        dicemesh.body.velocity = new CANNON.Vec3(0, 0, 3000);
        return false;
      }

      dicemesh.rerolling = false;
      dicemesh.body.type = CANNON.Body.KINEMATIC;
    }

    return true;
  }

  simulateThrow(): void {
    this.#animstate = 'simulate';
    this.iteration = 0;
    this.#rolling = true;
    while (!this.throwFinished()) {
      ++this.iteration;
      this.world.step(this.framerate);
    }
  }

  animateThrow(threadid: number, callback: (notationVectors: any) => void): void {
    this.#animstate = 'throw';
    let time = Date.now();
    this.#last_time = this.#last_time || time - this.framerate * 1000;
    let time_diff = (time - this.#last_time) / 1000;
    ++this.iteration;
    let neededSteps = Math.floor(time_diff / this.framerate);

    for (let i = 0; i < neededSteps; i++) {
      this.world.step(this.framerate);
      ++this.steps;
    }

    // update physics interactions visually
    for (let i in this.scene.children) {
      let interact: any = this.scene.children[i];
      if (interact.body != undefined) {
        interact.position.copy(interact.body.position);
        interact.quaternion.copy(interact.body.quaternion);
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.#last_time = this.#last_time + neededSteps * this.framerate * 1000;

    // roll finished
    if (this.#running == threadid && this.throwFinished()) {
      this.#running = false;
      this.#rolling = false;
      if (callback) callback.call(this, this.notationVectors);

      this.#running = Date.now();
      this.animateAfterThrow(this.#running);
      return;
    }

    // roll not finished, keep animating
    if (this.#running == threadid) {
      requestAnimationFrame(() => {
        this.animateThrow(threadid, callback);
      });
    }
  }

  animateSelector(threadid: number): void {
    // Check if we are still the active thread before doing anything
    if (this.#running !== threadid) return;

    this.#animstate = 'selector';
    // Do NOT set this.#running = threadid here; strictly reader.

    const time = Date.now();
    const time_diff = (time - this.#last_time) / 1000;
    this.#last_time = time;

    // Rotate dice
    this.diceList.forEach((dice, index) => {
      if (dice) {
        dice.rotation.y += 0.01;
        dice.rotation.x += 0.005;

        // Ensure they stay in place (center)
        dice.position.set(0, 0, 0);
        if (dice.body) {
          dice.body.position.set(0, 0, 0);
          dice.body.quaternion.setFromEuler(dice.rotation.x, dice.rotation.y, dice.rotation.z);
        }
      }
    });

    this.renderer.render(this.scene, this.camera);

    if (this.#running == threadid) {
      requestAnimationFrame(() => {
        this.animateSelector(threadid);
      });
    }
  }

  async showSelector(dice: string[] = ['d20']): Promise<void> {
    this.clearDice();
    this.#rolling = false;
    this.#animstate = 'selector';
    this.selector = { dice }; // Populate selector data
    this.setDimensions(this.dimensions); // Update camera for selector

    const threadid = Date.now();
    this.#running = threadid;
    this.#last_time = threadid;

    for (const type of dice) {
      // Create dummy vector data for spawn
      const vectordata = {
        type,
        pos: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        angle: { x: 0, y: 0, z: 0 },
        axis: { x: 0, y: 0, z: 0, a: 0 }
      };

      await this.spawnDice(vectordata);
    }

    this.animateSelector(threadid);
  }

  animateAfterThrow(threadid: number): void {
    this.#animstate = 'afterthrow';
    let time = Date.now();
    let time_diff = (time - this.#last_time) / 1000;
    if (time_diff > 3) time_diff = this.framerate;

    this.#running = false;
    this.#last_time = time;
    this.renderer.render(this.scene, this.camera);
    if (this.#running == threadid) {
      requestAnimationFrame(() => {
        this.animateAfterThrow(threadid);
      });
    }
  }

  startClickThrow(notation: string): any {
    // if (this.rolling) return;
    if (this.#rolling) {
      this.clearDice();
      this.#rolling = false;
    }

    let vector = {
      x: (Math.random() * 2 - 0.5) * this.display.currentWidth,
      y: -(Math.random() * 2 - 0.5) * this.display.currentHeight,
    };
    let dist = Math.sqrt(vector.x * vector.x + vector.y * vector.y) + 100;
    let boost = (Math.random() + 3) * dist * this.strength;

    const notationVectors = this.getNotationVectors(
      notation,
      vector,
      boost,
      dist
    );

    return notationVectors;
  }

  clearDice(): void {
    this.#running = false;
    let dice;
    while ((dice = this.diceList.pop())) {
      this.scene.remove(dice);
      if (dice.body) this.world.removeBody(dice.body);
    }
    this.renderer.render(this.scene, this.camera);

    setTimeout(() => {
      this.renderer.render(this.scene, this.camera);
    }, 100);
  }

  /** Alias for clearDice() for API consistency */
  clear(): void {
    this.clearDice();
  }

  getDiceResults(id?: number): DiceResult | {
    notation: string;
    sets: Array<{
      num: number;
      type: string;
      sides: number;
      rolls: DiceResult[];
      total: number;
    }>;
    modifier: number;
    total: number;
  } {
    if (id !== undefined) {
      return {
        type: this.diceList[id].shape,
        sides: parseInt(this.diceList[id].shape.substring(1)),
        id,
        ...this.diceList[id].result.at(-1),
      };
    }
    let counter = 0;
    const modifier = this.notationVectors.constant
      ? parseInt(`${this.notationVectors.op}${this.notationVectors.constant}`)
      : 0;
    let rollTotal = modifier;
    const result = {
      notation: this.notationVectors.notation,
      sets: this.notationVectors.set.map((set) => {
        const endCount = counter + set.num - 1;
        let setTotal = 0;
        const rolls = [];
        for (let index = counter; index <= endCount; index++) {
          if (this.diceList[counter].result.at(-1).reason === 'remove') {
            counter++;
            continue;
          }
          rolls.push({
            type: set.type,
            sides: parseInt(set.type.substring(1)),
            id: counter,
            ...this.diceList[counter].result.at(-1),
          });
          setTotal += this.diceList[counter].result.at(-1).value;
          counter++;
        }
        const returnSet = {
          num: set.num,
          type: set.type,
          sides: parseInt(set.type.substring(1)),
          rolls,
          total: setTotal,
        };
        rollTotal += setTotal;
        return returnSet;
      }),
      modifier,
      total: rollTotal,
    };
    return result;
  }

  async roll(notationString: string): Promise<any> {
    this.notationVectors = this.startClickThrow(notationString);
    if (this.notationVectors) {
      return new Promise((resolve, reject) => {
        this.rollDice(() => {
          const results = this.getDiceResults();
          resolve(results);
        });
      });
    }
  }

  async reroll(diceIdArray: number[]): Promise<DiceResult[]> {
    this.#rolling = true;
    this.#running = Date.now();
    this.iteration = 0;
    return new Promise((resolve, reject) => {
      diceIdArray.forEach((dieId) => {
        const dicemesh = this.diceList[dieId];
        dicemesh.rerolls += 1;
        dicemesh.rerolling = true;
        dicemesh.body.wakeUp();
        dicemesh.body.type = CANNON.Body.DYNAMIC;
        dicemesh.body.angularVelocity = new CANNON.Vec3(25, 25, 25);
        dicemesh.body.velocity = new CANNON.Vec3(0, 0, 3000);
      });
      this.animateThrow(this.#running, () => {
        const results = diceIdArray.map((dieId) => this.getDiceResults(dieId));
        resolve(results);
      });
    });
  }

  async add(notationString: string): Promise<DiceResult[]> {
    let dieCount = this.diceList.length;
    if (!dieCount) return this.roll(notationString);

    let addNotationVectors = this.startClickThrow(notationString);
    let diceIdArray = [];

    for (let i = 0, len = addNotationVectors.vectors.length; i < len; ++i) {
      await this.spawnDice(addNotationVectors.vectors[i]);
    }

    this.simulateThrow();
    this.steps = 0;
    this.iteration = 0;

    //reset dice vectors - for just the dice added
    for (let i = 0, len = addNotationVectors.vectors.length; i < len; ++i) {
      const index = dieCount + i;
      if (!this.diceList[index]) continue;

      //reset dice vectors
      await this.spawnDice(addNotationVectors.vectors[i], this.diceList[index]);
      diceIdArray.push(index);
    }

    //check forced results, fix dice faces if necessary
    if (addNotationVectors.result && addNotationVectors.result.length > 0) {
      for (let i = 0; i < addNotationVectors.result.length; i++) {
        const index = dieCount + i;
        let dicemesh = this.diceList[index];
        if (!dicemesh) continue;
        if (dicemesh.getLastValue().value == addNotationVectors.result[i])
          continue;
        this.swapDiceFace(dicemesh, addNotationVectors.result[i]);
      }
    }

    // let our vectors combine
    this.notationVectors = DiceNotation.mergeNotation(
      this.notationVectors,
      addNotationVectors
    );

    return new Promise((resolve, reject) => {
      const callback = () => {
        const results = diceIdArray.map((dieId) => this.getDiceResults(dieId));
        resolve(results);
      };

      // animate the previously simulated roll
      this.#rolling = true;
      this.#running = Date.now();
      this.#last_time = 0;
      this.animateThrow(this.#running, callback);
    });
  }

  async remove(diceIdArray: number[]): Promise<DiceResult[]> {
    return new Promise((resolve, reject) => {
      const results = [];
      diceIdArray.forEach((dieId) => {
        const mesh = this.diceList[dieId];
        if (mesh.body) this.world.removeBody(mesh.body);
        this.scene.remove(mesh);
        mesh.storeRolledValue('remove');
        results.push(this.getDiceResults(dieId));
      });

      this.renderer.render(this.scene, this.camera);
      resolve(results);
    });
  }

  async rollDice(callback: (notationVectors: any) => void): Promise<void> {
    if (this.notationVectors.error) {
      callback.call(this);
      return;
    }

    // this.camera.position.z = this.cameraHeight.far;
    this.clearDice();

    for (let i = 0, len = this.notationVectors.vectors.length; i < len; ++i) {
      await this.spawnDice(this.notationVectors.vectors[i]);
    }
    this.simulateThrow();
    this.steps = 0;
    this.iteration = 0;

    for (let i = 0, len = this.diceList.length; i < len; ++i) {
      if (!this.diceList[i]) continue;

      //reset dice vectors
      await this.spawnDice(this.notationVectors.vectors[i], this.diceList[i]);
    }

    //check forced results, fix dice faces if necessary
    if (this.notationVectors.result && this.notationVectors.result.length > 0) {
      for (let i = 0; i < this.notationVectors.result.length; i++) {
        let dicemesh = this.diceList[i];
        if (!dicemesh) continue;
        if (dicemesh.getLastValue().value == this.notationVectors.result[i])
          continue;
        this.swapDiceFace(dicemesh, this.notationVectors.result[i]);
      }
    }

    // animate the previously simulated roll
    this.#rolling = true;
    this.#running = Date.now();
    this.#last_time = 0;
    this.animateThrow(this.#running, callback);
  }
}
