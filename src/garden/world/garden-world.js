import * as T from "three";

// Original, deterministic scene. Every delivered frame comes from this world.
export const FRAME_COUNT = 360;
export const SCREEN = { x: 0, y: 2.22, z: -4.35, width: 1.8, height: 1.125 };
const palette = { paper: 0xf1ecdf, moss: 0x6c7951, lightMoss: 0x889366,
  wood: 0x87583c, edge: 0x533b2d, red: 0xa94d36, roof: 0x414e47, stone: 0x8b9184 };
function randomGenerator(seed = 76) {
  return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
}
export function createGarden(canvas, width = 1600, height = 900) {
  const rand = randomGenerator();
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene();
  scene.background = new T.Color(palette.paper);
  scene.fog = new T.Fog(palette.paper, 35, 100);
  const camera = new T.PerspectiveCamera(42, width / height, .025, 160);
  scene.add(new T.HemisphereLight(0xfff5de, 0x657c75, 1.7));
  const sun = new T.DirectionalLight(0xffe3b2, 2.8);
  sun.position.set(-12, 22, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 70 });
  sun.shadow.bias = -.00015;
  sun.shadow.normalBias = .025;
  sun.shadow.radius = 3;
  scene.add(sun);
  const fill = new T.DirectionalLight(0xdcece5, .7);
  fill.position.set(8, 8, -12); scene.add(fill);
  const roomLight = new T.PointLight(0xffd7a1, 13, 9, 2);
  roomLight.position.set(0, 3.45, -3.4); scene.add(roomLight);
  const materials = new Map();
  function mat(color, roughness = .9) {
    const key = `${color}-${roughness}`;
    if (!materials.has(key)) materials.set(key, new T.MeshStandardMaterial({ color, roughness }));
    return materials.get(key);
  }
  function mesh(geometry, material, position, scale = [1, 1, 1], parent = scene) {
    const item = new T.Mesh(geometry, material);
    item.position.set(...position); item.scale.set(...scale);
    item.castShadow = true; item.receiveShadow = true; parent.add(item); return item;
  }
  const boxGeometry = new T.BoxGeometry(1, 1, 1);
  const stoneGeometry = new T.IcosahedronGeometry(1, 1);
  const sphereGeometry = new T.SphereGeometry(1, 16, 10);
  function box(p, s, color, parent) { return mesh(boxGeometry, mat(color), p, s, parent); }
  function rock(p, s, color = palette.stone) {
    const item = mesh(stoneGeometry, mat(color), p, s);
    item.rotation.set(rand(), rand() * 6, rand()); return item;
  }
  function rod(a, b, radius, color, endRadius = radius, parent = scene) {
    const start = new T.Vector3(...a), end = new T.Vector3(...b), difference = end.clone().sub(start);
    const item = mesh(new T.CylinderGeometry(endRadius, radius, difference.length(), 9), mat(color),
      start.add(end).multiplyScalar(.5).toArray(), [1, 1, 1], parent);
    item.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), difference.normalize()); return item;
  }
  // Layered floating rock, with a quiet moss plateau rather than a single sphere.
  rock([0, -3.9, 0], [8.3, 3.8, 9.3], 0x697568).rotation.set(0, 0, 0);
  rock([-.8, -5.6, .8], [4.8, 4, 5.5], 0x7a8170).rotation.set(0, .3, 0);
  const ground = mesh(new T.CylinderGeometry(1, .94, 1, 72), mat(palette.moss), [0, -.2, 0], [8.15, .8, 9.1]);
  ground.rotation.y = .15;
  for (let i = 0; i < 65; i++) {
    const angle = i / 65 * Math.PI * 2, r = 7.2 + rand() * .9;
    const x = Math.cos(angle) * r, z = Math.sin(angle) * r * 1.12;
    rock([x, -.35 - rand() * 1.1, z], [.65 + rand(), .6 + rand(), .7 + rand()], i % 3 ? 0x849078 : 0xa3a58c);
    mesh(sphereGeometry, mat(i % 2 ? palette.moss : palette.lightMoss), [x, .2, z], [.8, .35, .8]);
  }
  // Pond under the bridge, a thin stone rim, lilies and ripples.
  const pond = mesh(new T.CylinderGeometry(1, 1, .06, 80), mat(0x568f88, .24), [.2, .24, 5], [5.3, 1, 2.7]);
  pond.receiveShadow = true;
  for (let i = 0; i < 42; i++) {
    const a = i / 42 * Math.PI * 2;
    rock([.2 + Math.cos(a) * 5.3, .32, 5 + Math.sin(a) * 2.65], [.32 + rand() * .3, .2, .32 + rand() * .3], 0xa1a48c);
  }
  for (let i = 0; i < 13; i++) {
    const x = (rand() - .5) * 8, z = 4 + rand() * 2;
    if (Math.abs(x) < 1.5) continue;
    const lily = mesh(new T.CircleGeometry(.18 + rand() * .2, 24, .2, 5.8), mat(0x709078), [x, .283, z]);
    lily.rotation.x = -Math.PI / 2;
    const ripple = mesh(new T.TorusGeometry(.35 + rand() * .3, .009, 4, 48), mat(0xbed0b5), [x, .28, z]);
    ripple.rotation.x = Math.PI / 2; ripple.castShadow = false;
  }
  // An actual arched bridge: individual planks, continuous curved handrails.
  function arch(z) { return .65 + Math.sin((z - 2.5) / 5.3 * Math.PI) * .72; }
  for (let i = 0; i < 32; i++) {
    const z = 2.5 + i / 31 * 5.3;
    const plank = box([0, arch(z), z], [2.55, .13, .154], i % 3 ? 0xa77750 : 0x936448);
    plank.rotation.x = -Math.atan(Math.cos((z - 2.5) / 5.3 * Math.PI) * .72 * Math.PI / 5.3);
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      const z = 2.5 + i / 8 * 5.3;
      box([side * 1.35, arch(z) + .5, z], [.13, 1.05, .13], palette.red);
      box([side * 1.35, arch(z) + 1.08, z], [.23, .09, .23], 0xc47450);
    }
    for (const level of [.42, .93]) {
      const points = Array.from({ length: 40 }, (_, i) => {
        const z = 2.5 + i / 39 * 5.3; return new T.Vector3(side * 1.35, arch(z) + level, z);
      });
      mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points), 80, .075, 7, false), mat(palette.red), [0, 0, 0]);
    }
  }
  // Stepping stones lead from bridge to the open workshop.
  for (let i = 0; i < 8; i++) {
    const stone = mesh(new T.CylinderGeometry(.55, .6, .13, 8), mat(0xb4b09a), [(i % 2 ? .13 : -.13), .31 + i * .035, 2.1 - i * .43], [1.7, 1, .65]);
    stone.rotation.y = .12 * i;
  }
  // Timber pavilion. Entrance is deliberately clear along the camera path.
  box([0, .46, -3.65], [6.2, .35, 5.7], palette.edge);
  for (let i = 0; i < 25; i++) box([-2.95 + i * .245, .66, -3.65], [.232, .07, 5.7], i % 4 ? 0xae8257 : 0xbb9268);
  for (const x of [-2.8, 2.8]) for (const z of [-1.1, -6.1]) {
    box([x, 2.35, z], [.22, 3.5, .22], palette.wood);
    box([x, 4.04, z], [.36, .22, .38], palette.edge);
  }
  for (const z of [-1.1, -6.1]) {
    box([0, 3.95, z], [6.2, .26, .26], palette.wood);
    rod([-2.7, 3.35, z], [-2.05, 3.93, z], .075, palette.edge);
    rod([2.7, 3.35, z], [2.05, 3.93, z], .075, palette.edge);
  }
  // Back shoji screen and side lattice with warm translucent-looking paper.
  box([0, 2.3, -6.35], [5.6, 3.15, .09], 0xddd2ac);
  for (let i = 0; i < 12; i++) box([-2.75 + i * .5, 2.3, -6.27], [.045, 3.16, .055], palette.wood);
  for (let i = 0; i < 7; i++) box([0, .83 + i * .48, -6.25], [5.55, .035, .05], palette.wood);
  for (const x of [-2.82, 2.82]) {
    box([x, 1.65, -4.9], [.08, 1.9, 2.5], 0xc9bd97);
    for (let i = 0; i < 6; i++) box([x, 2.3, -6.05 + i * .46], [.13, 3.1, .035], palette.wood);
    for (let i = 0; i < 5; i++) box([x, .9 + i * .56, -4.9], [.13, .035, 2.5], palette.wood);
  }
  // Curved roof ribs with individual tiles; upper silhouette has upturned eaves.
  const roofSection = (side, x) => 5.3 - x * .52 + .055 * x * x;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 24; i++) {
      const z = -6.85 + i * .275;
      const pts = Array.from({ length: 16 }, (_, j) => {
        const x = j / 15 * 3.5; return new T.Vector3(side * x, roofSection(side, x), z);
      });
      mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 20, .095, 7, false), mat(i % 2 ? 0x4d5d55 : 0x3e4f48), [0, 0, 0]);
    }
    // Solid sloped strips prevent light leaks between the roof ribs.
    for (let j = 0; j < 16; j++) {
      const x = (j + .5) / 16 * 3.5;
      const tile = box([side * x, roofSection(side, x) - .07, -3.7], [.25, .13, 6.6], palette.roof);
      tile.rotation.z = side * Math.atan(-.52 + .11 * x);
    }
    box([side * 3.5, roofSection(side, 3.5) - .18, -3.7], [.18, .25, 6.8], palette.wood);
  }
  rod([0, 5.34, -7], [0, 5.34, -.25], .16, palette.roof);
  // Desk and small, deliberately placed details.
  box([0, 1.54, -4.05], [3.85, .13, 1.55], 0xa47b53);
  for (const x of [-1.6, 1.6]) for (const z of [-3.5, -4.62]) box([x, 1.08, z], [.13, .92, .13], palette.wood);
  for (let i = 0; i < 8; i++) box([0, 1.609, -4.73 + i * .195], [3.83, .006, .009], 0x8e694a);
  const laptop = new T.Group(); scene.add(laptop);
  box([0, 1.65, -3.98], [1.96, .055, 1.08], 0x797c73, laptop);
  box([0, 1.683, -3.93], [1.72, .012, .57], 0x373f38, laptop);
  for (let row = 0; row < 5; row++) for (let col = 0; col < 13; col++)
    box([-.77 + col * .128, 1.698, -4.16 + row * .1], [.106, .009, .072], 0x92968b, laptop);
  box([0, 1.688, -3.56], [.55, .008, .22], 0xa0a59a, laptop);
  box([0, SCREEN.y, SCREEN.z - .045], [1.95, 1.28, .055], 0x303c36, laptop);
  const screenMaterial = new T.MeshBasicMaterial({ color: 0x18231f, toneMapped: false });
  mesh(new T.PlaneGeometry(SCREEN.width, SCREEN.height), screenMaterial, [0, SCREEN.y, SCREEN.z], [1, 1, 1], laptop);
  // Books, notebook, pencil, ceramic cup, potted fern.
  for (let i = 0; i < 3; i++) box([1.35, 1.66 + i * .085, -4.33], [.58, .065, .75], [0x687761, 0xc5b289, 0x8d5542][i]);
  box([-1.12, 1.64, -3.86], [.64, .035, .66], 0xdfd3b5);
  rod([-1.36, 1.68, -3.65], [-.97, 1.68, -4.0], .018, palette.red);
  const mug = mesh(new T.CylinderGeometry(.13, .1, .22, 24), mat(0xc5c4a6), [-1.15, 1.75, -4.42]);
  mesh(new T.CylinderGeometry(.11, .11, .003, 24), mat(0x453c2b), [-1.15, 1.862, -4.42]);
  const handle = mesh(new T.TorusGeometry(.095, .022, 8, 20), mat(0xc5c4a6), [-1.3, 1.76, -4.42]);
  handle.rotation.y = Math.PI / 2;
  function plant(x, y, z, scale = 1) {
    mesh(new T.CylinderGeometry(.22 * scale, .17 * scale, .37 * scale, 20), mat(0xb09b7a), [x, y + .18 * scale, z]);
    for (let i = 0; i < 10; i++) {
      const a = i * 2.4, h = .5 + rand() * .4;
      rod([x, y + .3 * scale, z], [x + Math.cos(a) * .38 * scale, y + h * scale, z + Math.sin(a) * .38 * scale], .01 * scale, 0x5d704a);
      const leaf = mesh(sphereGeometry, mat(i % 2 ? 0x5b7953 : 0x7e9461), [x + Math.cos(a) * .28 * scale, y + h * scale, z + Math.sin(a) * .28 * scale], [.08 * scale, .26 * scale, .045 * scale]);
      leaf.rotation.set(Math.sin(a) * .7, a, Math.cos(a) * .7);
    }
  }
  plant(2.2, .72, -5.6, 1.4);
  plant(1.6, 1.63, -4.57, .5);
  // Paper lantern, glowing softly under the timber roof.
  rod([1.25, 4.55, -2.2], [1.25, 3.55, -2.2], .015, palette.edge);
  mesh(sphereGeometry, new T.MeshStandardMaterial({ color: 0xeed6a2, emissive: 0xd99c48, emissiveIntensity: .24 }), [1.25, 3.37, -2.2], [.34, .4, .34]);
  for (let i = 0; i < 10; i++) {
    const y = 3.04 + i * .073, radius = .34 * Math.sqrt(Math.max(0, 1 - ((y - 3.37) / .4) ** 2));
    const ring = mesh(new T.TorusGeometry(radius, .007, 5, 40), mat(0xab976e), [1.25, y, -2.2]); ring.rotation.x = Math.PI / 2;
  }
  // Old cherry tree: branching trunk and many small blossoms, not billboard art.
  const blooms = [];
  function branch(a, direction, length, radius, depth) {
    const b = a.map((v, i) => v + direction[i] * length);
    rod(a, b, radius, 0x6c5941, radius * .58);
    if (!depth) { blooms.push(b); return; }
    for (let i = 0; i < 3; i++) {
      const angle = rand() * Math.PI * 2;
      const vector = new T.Vector3(direction[0] * .5 + Math.cos(angle) * .65, .3 + rand() * .6, direction[2] * .5 + Math.sin(angle) * .65).normalize();
      branch(b, vector.toArray(), length * (.63 + rand() * .17), radius * .58, depth - 1);
    }
  }
  branch([-4.3, .4, -.1], [.18, .97, -.13], 2.8, .48, 3);
  branch([-3.9, 2.9, -.4], [-.75, .55, .24], 2.3, .25, 3);
  branch([-3.9, 2.9, -.4], [.25, .5, .77], 2.4, .23, 3);
  for (let i = 0; i < 7; i++) {
    const a = i * Math.PI * 2 / 7;
    rod([-4.3, .65, -.1], [-4.3 + Math.cos(a) * 1.7, .23, -.1 + Math.sin(a) * 1.7], .19, 0x6c5941, .055);
  }
  const blossomGeometry = new T.IcosahedronGeometry(1, 1);
  const flowers = new T.InstancedMesh(blossomGeometry, mat(0xf0c7b4), blooms.length * 42);
  const dummy = new T.Object3D(), color = new T.Color();
  let flowerIndex = 0;
  for (const p of blooms) for (let i = 0; i < 42; i++) {
    const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * .78;
    dummy.position.set(p[0] + Math.cos(a) * r, p[1] + (rand() - .5) * .75, p[2] + Math.sin(a) * r);
    const size = .12 + rand() * .19;
    dummy.scale.set(size, size * .6, size); dummy.rotation.set(rand(), rand(), rand()); dummy.updateMatrix();
    flowers.setMatrixAt(flowerIndex, dummy.matrix);
    color.setHSL(.025 + rand() * .025, .25 + rand() * .18, .66 + rand() * .22);
    flowers.setColorAt(flowerIndex++, color);
  }
  flowers.castShadow = true; flowers.receiveShadow = true; scene.add(flowers);
  // Grass tufts / little wildflowers around the route, instanced for export speed.
  const grasses = new T.InstancedMesh(new T.ConeGeometry(.08, .45, 4), mat(0x647950), 550);
  for (let i = 0; i < 550; i++) {
    let x = (rand() - .5) * 15, z = (rand() - .5) * 16;
    if (Math.abs(x) < 3.2 && z < 2.5 || z > 2.5 && z < 7.8 && Math.abs(x) < 5.6) x = (x < 0 ? -1 : 1) * (5.7 + rand() * 1.4);
    dummy.position.set(x, .35, z); dummy.scale.setScalar(.5 + rand()); dummy.rotation.set(0, rand() * 6, (rand() - .5) * .3); dummy.updateMatrix();
    grasses.setMatrixAt(i, dummy.matrix);
  }
  grasses.castShadow = true; scene.add(grasses);
  for (let i = 0; i < 35; i++) {
    const x = (i % 2 ? -1 : 1) * (2 + rand() * 4), z = -rand() * 2 + 1.5;
    rock([x, .45, z], [.2 + rand() * .3, .3 + rand() * .2, .3], 0x939980);
  }
  // A small folded-paper fox anchored at the bridge entrance.
  const fox = new T.Group(); fox.position.set(-1.95, .43, 7.4); fox.rotation.y = -.3; scene.add(fox);
  mesh(new T.ConeGeometry(.24, .64, 4), mat(0xbf673b), [0, .35, 0], [1, 1, 1], fox);
  mesh(new T.OctahedronGeometry(.25), mat(0xd28349), [0, .75, -.08], [1, .85, 1.1], fox);
  for (const x of [-.14, .14]) mesh(new T.ConeGeometry(.09, .27, 3), mat(0xc47743), [x, .97, -.05], [1, 1, 1], fox);
  const tail = mesh(new T.ConeGeometry(.18, .65, 4), mat(0xd18d56), [.27, .3, .1], [1, 1, 1], fox); tail.rotation.z = -.95;
  for (const x of [-.09, .09]) mesh(sphereGeometry, mat(0x293b2f), [x, .79, .13], [.023, .024, .025], fox);
  // Stone lanterns frame the bridge and entrance, not the camera corridor.
  for (const [x, z] of [[2.25, 2], [-2.15, 2], [3.9, 7.2]]) {
    box([x, .44, z], [.6, .18, .6], 0x9a9c85);
    box([x, .86, z], [.2, .75, .2], 0x949a83);
    box([x, 1.2, z], [.55, .1, .55], 0xafae93);
    box([x, 1.46, z], [.36, .4, .36], 0xd4bd85);
    for (const a of [-1, 1]) for (const b of [-1, 1]) box([x + a * .22, 1.47, z + b * .22], [.075, .45, .075], 0x878f7d);
    const cap = mesh(new T.ConeGeometry(.51, .28, 4), mat(0x828b77), [x, 1.83, z]); cap.rotation.y = Math.PI / 4;
  }
  // Distant islands, softened by atmosphere and kept out of the near camera route.
  for (const [x, y, z, s] of [[-24, -2, -25, 4], [25, 0, -38, 6], [-32, -5, 3, 3], [18, -7, -10, 2]]) {
    rock([x, y - 3, z], [s, s * 1.5, s], 0xa4b1a0);
    mesh(sphereGeometry, mat(0xabb9a0), [x, y, z], [s, .6, s]);
    for (let i = 0; i < 5; i++) mesh(new T.ConeGeometry(.5, 3 + rand() * 2, 7), mat(0x7f9685), [x + (rand() - .5) * s, y + 1.2, z + (rand() - .5) * s]);
  }

  // Soft cloud banks sit below the island. This is an original procedural texture.
  const cloudCanvas = document.createElement("canvas"); cloudCanvas.width = 512; cloudCanvas.height = 256;
  const cloudContext = cloudCanvas.getContext("2d");
  for (let i = 0; i < 28; i++) {
    const x = 70 + rand() * 370, y = 95 + rand() * 55, radius = 30 + rand() * 65;
    const gradient = cloudContext.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, "rgba(255,253,243,.36)"); gradient.addColorStop(1, "rgba(255,253,243,0)");
    cloudContext.fillStyle = gradient; cloudContext.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  const cloudTexture = new T.CanvasTexture(cloudCanvas); cloudTexture.colorSpace = T.SRGBColorSpace;
  const cloudMaterial = new T.SpriteMaterial({ map: cloudTexture, transparent: true, depthWrite: false, toneMapped: false, opacity: .85 });
  for (const [x, y, z, size] of [[-10, -6, 2, 35], [13, -5, -4, 32], [0, -9, 12, 38], [-15, -4, -30, 40]]) {
    const cloud = new T.Sprite(cloudMaterial); cloud.position.set(x, y, z); cloud.scale.set(size, size / 2, 1); scene.add(cloud);
  }

  // Centripetal splines interpolate position and target continuously.
  const portrait = width < height;
  const points = [
    [portrait ? 27 : 19, portrait ? 23 : 16, portrait ? 38 : 27],
    [10, 9, 20], [2.8, 4.5, 13], [.1, 2.9, 7.9],
    [0, 2.7, 3.4], [0, 2.55, -.5], [0, 2.26, -2.5], [0, SCREEN.y, -3.7],
  ].map(p => new T.Vector3(...p));
  const targets = [[-4, 1, 0], [-1, 1.2, 0], [0, 1.5, 0], [0, 1.8, -2.8],
    [0, 2.1, -4.35], [0, SCREEN.y, -4.35], [0, SCREEN.y, -4.35], [0, SCREEN.y, -4.35]].map(p => new T.Vector3(...p));
  const path = new T.CatmullRomCurve3(points, false, "centripetal");
  const aim = new T.CatmullRomCurve3(targets, false, "centripetal");
  const corners = [[-SCREEN.width / 2, SCREEN.y + SCREEN.height / 2, SCREEN.z],
    [SCREEN.width / 2, SCREEN.y + SCREEN.height / 2, SCREEN.z],
    [SCREEN.width / 2, SCREEN.y - SCREEN.height / 2, SCREEN.z],
    [-SCREEN.width / 2, SCREEN.y - SCREEN.height / 2, SCREEN.z]].map(p => new T.Vector3(...p));
  function render(progress) {
    const p = T.MathUtils.clamp(progress, 0, 1);
    // Ease the overall departure/arrival without stopping at each waypoint.
    const t = p * p * (3 - 2 * p);
    camera.position.copy(path.getPoint(t)); camera.lookAt(aim.getPoint(t)); camera.updateMatrixWorld();
    renderer.render(scene, camera);
    return corners.map(c => { const v = c.clone().project(camera); return [(v.x + 1) / 2, (1 - v.y) / 2]; });
  }
  render(0);
  return { render, renderer, scene, camera,
    dispose() {
      const geometries = new Set(), allMaterials = new Set();
      scene.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) allMaterials.add(o.material); });
      geometries.forEach(g => g.dispose()); allMaterials.forEach(m => m.dispose()); renderer.dispose();
      cloudTexture.dispose();
    } };
}
