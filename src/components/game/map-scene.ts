import * as THREE from "three";

import type { GridStyle } from "@/lib/game/constants";

/**
 * Imperative Three.js scene for the tabletop: a shaded terrain plane (grid,
 * fog-of-war and candle light are all computed in one fragment shader) plus a
 * small 3D figure per character. Kept intentionally minimal — no engine.
 */

export interface FigureState {
  id: string;
  x: number;
  y: number;
  color: string;
  onMap: boolean;
  selected: boolean;
}

export interface SceneOptions {
  cols: number;
  rows: number;
  terrainSeed: number;
  palette: number;
}

const GRID_STYLE_CODE: Record<GridStyle, number> = { square: 0, hex: 1, none: 2 };

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Fragment shader: value-noise terrain, animated ember shimmer, grid overlay,
 * discovered-area mask sampled from a data texture, and a warm candle falloff
 * around the GM cursor.
 */
const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uGrid;          // cols, rows
  uniform float uGridStyle;    // 0 square, 1 hex, 2 none
  uniform float uSeed;
  uniform float uPalette;      // 0 world, 1 city, 2 dungeon
  uniform vec2 uCandle;        // uv space
  uniform float uCandleOn;
  uniform float uFogStrength;  // 0 = GM omniscient, 1 = player view
  uniform sampler2D uFog;      // r = discovered

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21) + uSeed);
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float total = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      total += valueNoise(p) * amplitude;
      p *= 2.02;
      amplitude *= 0.5;
    }
    return total;
  }

  float squareGrid(vec2 uv) {
    vec2 cell = fract(uv * uGrid);
    vec2 d = min(cell, 1.0 - cell);
    float line = min(d.x, d.y);
    return 1.0 - smoothstep(0.0, 0.022, line);
  }

  float hexGrid(vec2 uv) {
    vec2 p = uv * uGrid * vec2(1.0, 0.8660254);
    p.x += mod(floor(p.y), 2.0) * 0.5;
    vec2 cell = fract(p) - 0.5;
    float d = max(abs(cell.x) * 0.8660254 + abs(cell.y) * 0.5, abs(cell.y));
    return 1.0 - smoothstep(0.42, 0.5, d);
  }

  void main() {
    vec2 uv = vUv;

    float elevation = fbm(uv * 6.0);
    float detail = fbm(uv * 22.0 + uTime * 0.008);

    vec3 sand   = vec3(0.30, 0.24, 0.16);
    vec3 ridge  = vec3(0.42, 0.33, 0.20);
    vec3 water  = vec3(0.10, 0.15, 0.17);
    vec3 stone  = vec3(0.22, 0.21, 0.21);
    vec3 street = vec3(0.30, 0.28, 0.26);
    vec3 deep   = vec3(0.13, 0.13, 0.16);
    vec3 pale   = vec3(0.34, 0.35, 0.38);

    vec3 lowColor  = uPalette < 0.5 ? water : (uPalette < 1.5 ? stone : deep);
    vec3 midColor  = uPalette < 0.5 ? sand  : (uPalette < 1.5 ? street : pale);
    vec3 highColor = uPalette < 0.5 ? ridge : (uPalette < 1.5 ? sand : stone);

    vec3 color = mix(lowColor, midColor, smoothstep(0.34, 0.52, elevation));
    color = mix(color, highColor, smoothstep(0.56, 0.78, elevation));
    color += (detail - 0.5) * 0.06;

    // Warm ember shimmer breathing through the cracks.
    float ember = smoothstep(0.72, 0.9, detail) * (0.5 + 0.5 * sin(uTime * 1.4 + elevation * 12.0));
    color += vec3(0.45, 0.22, 0.05) * ember * 0.22;

    // Grid overlay.
    float grid = uGridStyle < 0.5 ? squareGrid(uv) : (uGridStyle < 1.5 ? hexGrid(uv) : 0.0);
    color = mix(color, vec3(0.75, 0.66, 0.42), grid * 0.13);

    // Fog of war: sampled discovery mask, softened.
    float discovered = texture2D(uFog, uv).r;
    float hidden = (1.0 - discovered) * uFogStrength;
    color = mix(color, vec3(0.02, 0.02, 0.03), hidden * 0.94);

    // Candle carried by the Game Master's cursor.
    vec2 aspect = vec2(uGrid.x / uGrid.y, 1.0);
    float dist = length((uv - uCandle) * aspect);
    float flicker = 0.86 + 0.14 * sin(uTime * 7.3) * sin(uTime * 3.1);
    float candle = uCandleOn * flicker * smoothstep(0.42, 0.0, dist);
    color += vec3(1.0, 0.62, 0.24) * candle * 0.34;

    // Vignette for depth.
    float vignette = smoothstep(1.15, 0.35, length(uv - 0.5) * 1.6);
    color *= mix(0.55, 1.0, vignette);

    gl_FragColor = vec4(color, 1.0);
  }
`;

interface Figure {
  group: THREE.Group;
  base: THREE.Mesh;
  body: THREE.Mesh;
  head: THREE.Mesh;
  ring: THREE.Mesh;
}

export class MapScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly raycaster = new THREE.Raycaster();
  private readonly groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly material: THREE.ShaderMaterial;
  private readonly candleLight: THREE.PointLight;
  private readonly figures = new Map<string, Figure>();
  private fogTexture: THREE.DataTexture;
  private options: SceneOptions;
  private frame = 0;
  private clock = new THREE.Clock();
  private disposed = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    options: SceneOptions,
  ) {
    this.options = options;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene.background = new THREE.Color(0x0d0b09);

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);

    this.fogTexture = createFogTexture(options.cols, options.rows);
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uGrid: { value: new THREE.Vector2(options.cols, options.rows) },
        uGridStyle: { value: 0 },
        uSeed: { value: options.terrainSeed },
        uPalette: { value: options.palette },
        uCandle: { value: new THREE.Vector2(-1, -1) },
        uCandleOn: { value: 1 },
        uFogStrength: { value: 0.35 },
        uFog: { value: this.fogTexture },
      },
    });

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(options.cols, options.rows, 1, 1),
      this.material,
    );
    ground.rotation.x = -Math.PI / 2;
    ground.name = "ground";
    this.scene.add(ground);

    this.scene.add(new THREE.AmbientLight(0xffe6c0, 0.35));
    const key = new THREE.DirectionalLight(0xffd9a0, 0.85);
    key.position.set(-6, 14, 8);
    this.scene.add(key);

    this.candleLight = new THREE.PointLight(0xffb066, 0, 14, 2);
    this.candleLight.position.set(0, 2.2, 0);
    this.scene.add(this.candleLight);

    this.resize();
    this.loop();
  }

  private loop = (): void => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.loop);
    this.material.uniforms["uTime"]!.value = this.clock.getElapsedTime();
    this.renderer.render(this.scene, this.camera);
  };

  resize(): void {
    const { clientWidth, clientHeight } = this.canvas;
    if (clientWidth === 0 || clientHeight === 0) return;
    this.renderer.setSize(clientWidth, clientHeight, false);
    this.camera.aspect = clientWidth / clientHeight;

    const { cols, rows } = this.options;
    const span = Math.max(cols, rows * 1.35);
    this.camera.position.set(0, span * 0.82, rows * 0.62);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
  }

  setOptions(options: SceneOptions): void {
    const gridChanged = options.cols !== this.options.cols || options.rows !== this.options.rows;
    this.options = options;
    this.material.uniforms["uSeed"]!.value = options.terrainSeed;
    this.material.uniforms["uPalette"]!.value = options.palette;
    if (gridChanged) {
      this.material.uniforms["uGrid"]!.value.set(options.cols, options.rows);
      const ground = this.scene.getObjectByName("ground") as THREE.Mesh | undefined;
      if (ground) {
        ground.geometry.dispose();
        ground.geometry = new THREE.PlaneGeometry(options.cols, options.rows, 1, 1);
      }
      this.fogTexture.dispose();
      this.fogTexture = createFogTexture(options.cols, options.rows);
      this.material.uniforms["uFog"]!.value = this.fogTexture;
      this.resize();
    }
  }

  setGridStyle(style: GridStyle): void {
    this.material.uniforms["uGridStyle"]!.value = GRID_STYLE_CODE[style];
  }

  /** 0 = GM sees everything, 1 = players see only discovered ground. */
  setFogStrength(strength: number): void {
    this.material.uniforms["uFogStrength"]!.value = strength;
  }

  setDiscovered(cells: Iterable<[number, number]>): void {
    const { cols, rows } = this.options;
    const data = this.fogTexture.image.data as Uint8Array;
    data.fill(0);
    for (const [cx, cy] of cells) {
      if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
      data[cy * cols + cx] = 255;
    }
    this.fogTexture.needsUpdate = true;
  }

  setCandle(uvX: number, uvY: number, enabled: boolean): void {
    this.material.uniforms["uCandle"]!.value.set(uvX, uvY);
    this.material.uniforms["uCandleOn"]!.value = enabled ? 1 : 0;
    this.candleLight.intensity = enabled ? 26 : 0;
    const { cols, rows } = this.options;
    this.candleLight.position.set(uvX * cols - cols / 2, 2.4, (1 - uvY) * rows - rows / 2);
  }

  syncFigures(figures: FigureState[]): void {
    const seen = new Set<string>();
    for (const state of figures) {
      seen.add(state.id);
      let figure = this.figures.get(state.id);
      if (!figure) {
        figure = createFigure(state.color);
        this.figures.set(state.id, figure);
        this.scene.add(figure.group);
      }
      applyFigure(figure, state, this.options);
    }
    for (const [id, figure] of this.figures) {
      if (seen.has(id)) continue;
      this.scene.remove(figure.group);
      disposeFigure(figure);
      this.figures.delete(id);
    }
  }

  /** Grid coordinates under a client point, via a ray against the ground plane. */
  clientToGrid(clientX: number, clientY: number): { x: number; y: number } | null {
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.groundPlane, hit)) return null;
    return { x: hit.x + this.options.cols / 2, y: hit.z + this.options.rows / 2 };
  }

  /** Screen position (px, relative to the canvas) of a grid coordinate. */
  gridToClient(x: number, y: number): { left: number; top: number } {
    const rect = this.canvas.getBoundingClientRect();
    const vector = new THREE.Vector3(
      x - this.options.cols / 2,
      0.9,
      y - this.options.rows / 2,
    ).project(this.camera);
    return {
      left: ((vector.x + 1) / 2) * rect.width,
      top: ((1 - vector.y) / 2) * rect.height,
    };
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    for (const figure of this.figures.values()) disposeFigure(figure);
    this.figures.clear();
    this.material.dispose();
    this.fogTexture.dispose();
    this.renderer.dispose();
  }
}

function createFogTexture(cols: number, rows: number): THREE.DataTexture {
  const texture = new THREE.DataTexture(
    new Uint8Array(cols * rows),
    cols,
    rows,
    THREE.RedFormat,
    THREE.UnsignedByteType,
  );
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function createFigure(color: string): Figure {
  const group = new THREE.Group();
  const tint = new THREE.Color(color);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.46, 0.12, 24),
    new THREE.MeshStandardMaterial({ color: 0x2a231b, metalness: 0.3, roughness: 0.65 }),
  );
  base.position.y = 0.06;

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.22, 0.42, 6, 14),
    new THREE.MeshStandardMaterial({ color: tint, metalness: 0.35, roughness: 0.42 }),
  );
  body.position.y = 0.52;

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 18, 14),
    new THREE.MeshStandardMaterial({ color: 0xd9c7a6, roughness: 0.8 }),
  );
  head.position.y = 0.95;

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.62, 32),
    new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0 }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;

  group.add(base, body, head, ring);
  return { group, base, body, head, ring };
}

function applyFigure(figure: Figure, state: FigureState, options: SceneOptions): void {
  figure.group.visible = state.onMap;
  figure.group.position.set(state.x - options.cols / 2, 0, state.y - options.rows / 2);
  const ringMaterial = figure.ring.material as THREE.MeshBasicMaterial;
  ringMaterial.opacity = state.selected ? 0.85 : 0.22;
  const bodyMaterial = figure.body.material as THREE.MeshStandardMaterial;
  bodyMaterial.color.set(state.color);
  bodyMaterial.emissive.set(state.selected ? state.color : 0x000000);
  bodyMaterial.emissiveIntensity = state.selected ? 0.35 : 0;
}

function disposeFigure(figure: Figure): void {
  for (const mesh of [figure.base, figure.body, figure.head, figure.ring]) {
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  }
}
