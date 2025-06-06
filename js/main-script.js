import * as THREE from "three";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/controls/OrbitControls.js";
//import { VRButton } from "three/addons/webxr/VRButton.js";
//import * as Stats from "three/addons/libs/stats.module.js";
//import { GUI } from "three/addons/libs/lil-gui.module.min.js";


//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
let scene, camera, renderer, controls;
let directionalLight;
let terrainMesh;
let fieldTexture;
let skyTexture;
let skyMesh;
let moonMesh;
let ufoGroup, pointLights = [], spotLight;
let pointLightsOn = true;
let spotLightOn = true;
let moveX = 0;
let moveY = 0;


const HEIGHTMAP_URL = "https://i.postimg.cc/cJtxYwG0/37-916-7-416-13-505-505.png"

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
  scene = new THREE.Scene();
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createCamera() {
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 40, 60);
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////
function createLights() {

  // directional ligh
    directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(30, 90, 0); // tilted relative to xy
    directionalLight.castShadow = false; // controls light
    scene.add(directionalLight);
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////


function generateSkyTexture() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, "#00008B");
  gradient.addColorStop(1, "#3B1F5F");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // add 500 white dots (stars)
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = 1 + Math.random();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

function generateFieldTexture() {
  const size = 1024;
  const drawing_surface = document.createElement("canvas");
  drawing_surface.width = drawing_surface.height = size;
  const ctx = drawing_surface.getContext("2d");

  // background light green
  ctx.fillStyle = "#90ee90";
  ctx.fillRect(0, 0, size, size);

  // colors for flowers
  const colors = ["#ffffff", "#ffeb3b", "#9c27b0", "#03a9f4"];

  for (let i = 0; i < 600; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = 2 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.fill();
  }

  return new THREE.CanvasTexture(drawing_surface);
}

function loadHeightmapAndCreateTerrain(url) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = () => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, size, size);

    const imgData = ctx.getImageData(0, 0, size, size).data;

    // create a plane geometry using size - 1 vertices (so it doesnt stretch the texture)
    // 150x150 plane with 255x255 vertices
    const plane_geometry = new THREE.PlaneGeometry(150, 150, size - 1, size - 1);

    // we go trough each vertex (256x256) and set its height based on the pixel data
    // high areas -> light pixels (255)
    // low areas -> darker pixels (0) 
    for (let i = 0; i < plane_geometry.attributes.position.count; i++) {
      const x = i % size;
      const y = Math.floor(i / size);
      const pixelIndex = (y * size + x) * 4;
      const height = (imgData[pixelIndex] / 255) * 15; // scale height max 15 units
      plane_geometry.attributes.position.setZ(i, height);
    }

    // update the normals
    plane_geometry.computeVertexNormals();

    // apply the texture to the terrain 
    const material = new THREE.MeshStandardMaterial({
        map: fieldTexture,
        side: THREE.DoubleSide,
    });

    terrainMesh = new THREE.Mesh(plane_geometry, material);
    terrainMesh.rotation.x = -Math.PI / 2; // rotate to horizontal
    scene.add(terrainMesh);
    
    createCasaAlentejana(-10, -30); // Pos (x,z)

    // distribute 50 corktrees across the field
    distributeTrees(50);

  };
  image.src = url;
}

function createSkyDome(skyTexture) {
    
  const sphere_geometry = new THREE.SphereGeometry(250, 32, 32);

  const material = new THREE.MeshStandardMaterial({
  map: skyTexture,
  side: THREE.BackSide,
    });
  
  skyMesh = new THREE.Mesh(sphere_geometry, material);
  scene.add(skyMesh);
}

function createMoon() {

  window.moonMaterials = {
    lambert: new THREE.MeshLambertMaterial({
      color: 0xfff8dc,
      emissive: 0xffffee,
      emissiveIntensity: 1.5
    }),
    phong: new THREE.MeshPhongMaterial({
      color: 0xfff8dc,
      emissive: 0xffffee,
      emissiveIntensity: 1.5,
      shininess: 50
    }),
    toon: new THREE.MeshToonMaterial({
      color: 0xfff8dc,
      emissive: 0xffffee,
      emissiveIntensity: 1.5
    }),
    basic: new THREE.MeshBasicMaterial({
      color: 0xfff8dc
    })
  };

  const moon_geometry = new THREE.SphereGeometry(15, 40, 40);

  moonMesh = new THREE.Mesh(moon_geometry, window.moonMaterials.phong);

  moonMesh = new THREE.Mesh(moon_geometry, window.moonMaterials.phong);

  moonMesh.position.set(100, 80, -170);

  scene.add(moonMesh);
}

function createSobreiro() {
    const sobreiro = new THREE.Group();

    window.troncoMaterials = {
      lambert: new THREE.MeshLambertMaterial({ color: 0xcc6600 }),
      phong: new THREE.MeshPhongMaterial({ color: 0xcc6600, shininess: 50 }),
      toon: new THREE.MeshToonMaterial({ color: 0xcc6600 }),
      basic: new THREE.MeshBasicMaterial({ color: 0xcc6600 })
    };

    // Tronco principal
    const troncoGeometry = new THREE.CylinderGeometry(0.7, 1, 4.5, 16);
    const tronco = new THREE.Mesh(troncoGeometry, troncoMaterials.lambert);
    tronco.position.y = 2.25;
    tronco.rotation.z = THREE.MathUtils.degToRad(15); // inclined
    const troncoMeshes = [tronco];
    sobreiro.add(tronco);

    // Ramo secundário
    const ramoSecGeometry = new THREE.CylinderGeometry(0.5, 0.6, 6, 16);
    ramoSecGeometry.translate(0, 2, 0);
    const ramoSec = new THREE.Mesh(ramoSecGeometry, troncoMaterials.lambert);
    ramoSec.position.y = 2.25;
    ramoSec.position.x = 0.6;
    ramoSec.rotation.z = THREE.MathUtils.degToRad(-30);
    troncoMeshes.push(ramoSec);
    sobreiro.add(ramoSec);

    // Ramo terciário
    const ramoTerGeometry = new THREE.CylinderGeometry(0.4, 0.5, 3, 16);
    ramoTerGeometry.translate(0, 1.5, 0);
    const ramoTer = new THREE.Mesh(ramoTerGeometry, troncoMaterials.lambert);
    ramoTer.position.y = 4.5;
    ramoTer.position.x = 1.5;
    ramoTer.rotation.z = THREE.MathUtils.degToRad(30);
    troncoMeshes.push(ramoTer);
    sobreiro.add(ramoTer);

    // Novo ramo diagonal para a esquerda no topo do tronco
    const ramoEsqTopoGeometry = new THREE.CylinderGeometry(0.4, 0.6, 4, 16);
    ramoEsqTopoGeometry.translate(0, 1.5, 0);
    const ramoEsqTopo = new THREE.Mesh(ramoEsqTopoGeometry, troncoMaterials.lambert);
    ramoEsqTopo.position.y = 4.5;
    ramoEsqTopo.position.x = -0.6;
    ramoEsqTopo.rotation.y = THREE.MathUtils.degToRad(20); // rotate 20 degrees y axis
    ramoEsqTopo.rotation.z = THREE.MathUtils.degToRad(45); // more inclined
    troncoMeshes.push(ramoEsqTopo);
    sobreiro.add(ramoEsqTopo);

    

    function criarCopa(escala, posY) {
        const copaGeometry = new THREE.SphereGeometry(1.2, 16, 16);
        const copaMaterials = {
          lambert: new THREE.MeshLambertMaterial({ color: 0x003300 }),
          phong: new THREE.MeshPhongMaterial({ color: 0x003300, shininess: 30 }),
          toon: new THREE.MeshToonMaterial({ color: 0x003300 }),
          basic: new THREE.MeshBasicMaterial({ color: 0x003300 })
        };
        const copa = new THREE.Mesh(copaGeometry, copaMaterials.lambert);
        copa.scale.set(escala[0], escala[1], escala[2]);
        copa.position.y = posY;
        copa.userData.materials = copaMaterials;
        return copa;
    }

    // Copa no ramo superior esquerdo
    const copaEsq = criarCopa([1.5, 2, 2], 4);
    ramoEsqTopo.add(copaEsq);

    // Copa no ramo secundário
    const copaSec = criarCopa([1.5, 2, 2], 6);
    ramoSec.add(copaSec);

    // Copa no ramo terciário
    const copaTer = criarCopa([1.5, 1.8, 2], 3);
    ramoTer.add(copaTer);

    sobreiro.userData.troncos = troncoMeshes;
    sobreiro.userData.copas = [copaEsq, copaSec, copaTer];

    return sobreiro;
}

function distributeTrees(n) {
  const positions = terrainMesh.geometry.attributes.position;
  const terrainSize = 150;
  const divisions = 256;

  let count = 0;
  window.allTroncoMeshes = [];
  window.allCopaMeshes = [];
  while (count < n) {
    const sobreiro = createSobreiro();
    const posX = (Math.random() - 0.5) * 140;
    const posZ = (Math.random() - 0.5) * 140;

    // skip if position is inside the restricted zone near the house
    if (posX >= -22 && posX <= 0 && posZ >= -54 && posZ <= -12) {
      continue;
    }

    // convert to grid index to get the respective height
    const x = posX + terrainSize / 2;
    const z = posZ + terrainSize / 2;
    const iGrid = Math.floor((x / terrainSize) * (divisions - 1));
    const jGrid = Math.floor((z / terrainSize) * (divisions - 1));
    const index = jGrid * divisions + iGrid;

    const height = positions.getZ(index);

    sobreiro.position.set(posX, height, posZ);
    sobreiro.rotation.y = Math.random() * Math.PI * 2; // random rotation on y axis

    const escala = 0.8 + Math.random() * 0.7;  // random scaling of the tree
    sobreiro.scale.set(escala, escala, escala);

    allTroncoMeshes.push(...sobreiro.userData.troncos);
    allCopaMeshes.push(...sobreiro.userData.copas);

    scene.add(sobreiro);
    count++;
  }
}


function createCasaAlentejana(posX, posZ) {
  const casa = new THREE.Group();
  const altura = 10.41;

  // ========================
  // 1. Corpo da casa (branco)
  // ========================
  const corpoGeometry = new THREE.BoxGeometry(6, 5, 15);

  window.houseMaterials = {
    lambert: new THREE.MeshLambertMaterial({ color: 0xffffff }),
    phong: new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 200 }),
    toon: new THREE.MeshToonMaterial({ color: 0xffffff }),
    basic: new THREE.MeshBasicMaterial({ color: 0xffffff })
  };

  const corpo = new THREE.Mesh(corpoGeometry, houseMaterials.lambert);
  window.houseMesh = corpo;

  corpo.position.set(0, 2.5, 0);
  casa.add(corpo);

  // ========================
  // 2. Telhado (laranja)
  // ========================
  window.roofMaterials = {
    lambert: new THREE.MeshLambertMaterial({ color: 0xff6600, side: THREE.DoubleSide }),
    phong: new THREE.MeshPhongMaterial({ color: 0xff6600, shininess: 200, side: THREE.DoubleSide }),
    toon: new THREE.MeshToonMaterial({ color: 0xff6600, side: THREE.DoubleSide }),
    basic: new THREE.MeshBasicMaterial({ color: 0xff6600, side: THREE.DoubleSide })
  };

  const telhadoHeight = 1;
  const roofGeo = new THREE.PlaneGeometry(5.67, 16);

  // Lado esquerdo
  const roofLeft = new THREE.Mesh(roofGeo, roofMaterials.lambert);
  roofLeft.rotation.x = Math.PI / 2;
  roofLeft.rotation.y = -Math.PI / 4;
  roofLeft.position.set(2, 5 + telhadoHeight, 0);
  casa.add(roofLeft);

  // Lado direito
  const roofRight = new THREE.Mesh(roofGeo, roofMaterials.lambert);
  roofRight.rotation.x = Math.PI / 2;
  roofRight.rotation.y = Math.PI / 4;
  roofRight.position.set(-2, 5 + telhadoHeight, 0);
  casa.add(roofRight);

  window.roofMeshes = [roofLeft, roofRight];

  // ========================
  // 3. Triângulo frontal (branco)
  // ========================
  // (This is used to cover the sides of the roof)
  window.triangleMaterials = {
    lambert: new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
    phong: new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 200, side: THREE.DoubleSide }),
    toon: new THREE.MeshToonMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
    basic: new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  };

  const triangleShape = new THREE.Shape();
  triangleShape.moveTo(-3, 0);
  triangleShape.lineTo(0, 3);
  triangleShape.lineTo(3, 0);
  triangleShape.lineTo(-3, 0);

  const triangleGeometry = new THREE.ShapeGeometry(triangleShape);

  const triangleFront = new THREE.Mesh(triangleGeometry, triangleMaterials.lambert);
  triangleFront.position.set(0, 5, 7.5);
  const triangleBack = triangleFront.clone();
  triangleBack.position.z = -7.5;

  window.triangleFront = triangleFront;
  window.triangleBack = triangleBack;

  casa.add(triangleFront);
  casa.add(triangleBack);

  // ========================
  // 4. Porta (azul)
  // ========================
  const portaGeometry = new THREE.BoxGeometry(1.15, 2.5, 0.1);

  window.doorMaterials = {
    lambert: new THREE.MeshLambertMaterial({ color: 0x0077ff }),
    phong: new THREE.MeshPhongMaterial({ color: 0x0077ff, shininess: 200 }),
    toon: new THREE.MeshToonMaterial({ color: 0x0077ff }),
    basic: new THREE.MeshBasicMaterial({ color: 0x0077ff })
  };

  const porta = new THREE.Mesh(portaGeometry, doorMaterials.lambert);
  porta.position.set(3, 2, 2);
  porta.rotation.y = Math.PI / 2;

  window.doorMesh = porta;

  casa.add(porta);
  // ========================
  // 5. Janelas (azul)
  // ========================
  const janelaGeometry = new THREE.BoxGeometry(1, 1.2, 0.1);

  window.windowMaterials = {
    lambert: new THREE.MeshLambertMaterial({ color: 0x0077ff }),
    phong: new THREE.MeshPhongMaterial({ color: 0x0077ff, shininess: 200 }),
    toon: new THREE.MeshToonMaterial({ color: 0x0077ff }),
    basic: new THREE.MeshBasicMaterial({ color: 0x0077ff })
  };

  const janela1 = new THREE.Mesh(janelaGeometry, windowMaterials.lambert);
  janela1.position.set(3, 2.5, 6.3);
  janela1.rotation.y = Math.PI / 2;

  const janela2 = janela1.clone();
  janela2.position.z = 4.3;

  const janela3 = janela1.clone();
  janela3.position.z = -1.75;

  const janela4 = janela1.clone();
  janela4.position.z = -6.25;

  window.windowMeshes = [janela1, janela2, janela3, janela4];

  casa.add(janela1);
  casa.add(janela2);
  casa.add(janela3);
  casa.add(janela4);

  // ========================
  // 6. Faixa azul inferior
  // ========================
  const faixaGeometry = new THREE.BoxGeometry(6.01, 1, 15); // segue o corpo da casa

  window.bandMaterials = {
    lambert: new THREE.MeshLambertMaterial({ color: 0x0077ff }),
    phong: new THREE.MeshPhongMaterial({ color: 0x0077ff, shininess: 200 }),
    toon: new THREE.MeshToonMaterial({ color: 0x0077ff }),
    basic: new THREE.MeshBasicMaterial({ color: 0x0077ff })
  };

  const faixa = new THREE.Mesh(faixaGeometry, bandMaterials.lambert);
  faixa.position.set(0, 0.4, 0);

  window.bandMesh = faixa;

  casa.add(faixa);

  // ========================
  // 7. Chaminé (branca com topo)
  // ========================
  window.chamineMaterials = {
    lambert: new THREE.MeshLambertMaterial({ color: 0xffffff }),
    phong: new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 200 }),
    toon: new THREE.MeshToonMaterial({ color: 0xffffff }),
    basic: new THREE.MeshBasicMaterial({ color: 0xffffff })
  };

  window.topoChamineMaterials = {
    lambert: new THREE.MeshLambertMaterial({ color: 0xff6600 }),
    phong: new THREE.MeshPhongMaterial({ color: 0xff6600, shininess: 200 }),
    toon: new THREE.MeshToonMaterial({ color: 0xff6600 }),
    basic: new THREE.MeshBasicMaterial({ color: 0xff6600 })
  };

  // Geometria
  const chamineBaseGeo = new THREE.BoxGeometry(1, 1.4, 2.5);
  const chamine = new THREE.Mesh(chamineBaseGeo, chamineMaterials.lambert);
  window.chamineMesh = chamine;

  chamine.position.set(2.8, 5.6, -4);
  casa.add(chamine);

  // Topo
  const topoChamineGeo = new THREE.BoxGeometry(1.3, 0.2, 2.8);
  const topoChamine = new THREE.Mesh(topoChamineGeo, topoChamineMaterials.lambert);
  topoChamine.position.set(0, 0.7, 0);
  window.topoChamineMesh = topoChamine;

  chamine.add(topoChamine);

  // ========================
  // Posição da casa no terreno
  // ========================
  casa.position.set(posX, altura, posZ);
  casa.scale.set(1.2, 1.2, 1.2); // Scale 20% larger in all directions
  scene.add(casa);
}

function createUFO() {
  ufoGroup = new THREE.Group();

  // corpo da nave (esfera achatada)
  const baseGeometry = new THREE.SphereGeometry(5, 32, 32);
  baseGeometry.scale(1, 0.3, 1);

  window.ufoBaseMaterials = {
    lambert: new THREE.MeshLambertMaterial({ color: 0x888888 }),
    phong: new THREE.MeshPhongMaterial({ color: 0x888888, shininess: 200 }),
    toon: new THREE.MeshToonMaterial({ color: 0x888888 }),
    basic: new THREE.MeshBasicMaterial({color: 0x888888 })
  };

  const baseMesh = new THREE.Mesh(baseGeometry, ufoBaseMaterials.lambert);
  window.ufoBaseMesh = baseMesh;

  ufoGroup.add(baseMesh);

  // cockpit (calote esférica transparente)
  const cockpitGeometry = new THREE.SphereGeometry(2, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);

  window.cockpitMaterials = {
    lambert: new THREE.MeshLambertMaterial({ color: 0x66ccff, transparent: true, opacity: 0.7 }),
    phong: new THREE.MeshPhongMaterial({ color: 0x66ccff, transparent: true, opacity: 0.7, shininess: 200 }),
    toon: new THREE.MeshToonMaterial({ color: 0x66ccff, transparent: true, opacity: 0.7 }),
    basic: new THREE.MeshBasicMaterial({ color: 0x66ccff, transparent: true, opacity: 0.7 })
  };

  const cockpitMesh = new THREE.Mesh(cockpitGeometry, cockpitMaterials.lambert);
  cockpitMesh.position.y = 1.2;
  window.cockpitMesh = cockpitMesh;

  ufoGroup.add(cockpitMesh);

  // pequenas esferas com luzes pontuais na base
  const bulbGeometry = new THREE.SphereGeometry(0.3, 16, 16);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * 3.5;
    const z = Math.sin(angle) * 3.5;

    const bulb = new THREE.Mesh(bulbGeometry, new THREE.MeshStandardMaterial({ color: 0xffff00 }));
    bulb.position.set(x, -1.2, z);
    ufoGroup.add(bulb);

    const light = new THREE.PointLight(0xffff88, 1, 10);
    light.position.set(x, -1.2, z);
    pointLights.push(light);
    ufoGroup.add(light);
  }

  // cilindro com spotlight no centro da base
  const cylinderGeometry = new THREE.CylinderGeometry(0.4, 0.8, 0.3, 16);
  const cylinderMaterial = new THREE.MeshStandardMaterial({ color: 0x3333ff });
  const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
  cylinder.position.set(0, -1.4, 0);
  ufoGroup.add(cylinder);

  spotLight = new THREE.SpotLight(0x0fffff, 10, 50, Math.PI / 6, 0.4, 0.8);
  spotLight.position.set(0, 0, 0);
  spotLight.target.position.set(0, -5, 0);
  ufoGroup.add(spotLight);
  ufoGroup.add(spotLight.target);
  ufoGroup.position.set(-15, 35, -35);
  scene.add(ufoGroup);
}


////////////
/* UPDATE */
////////////
function update() {
  controls.update();
  if (ufoGroup) {
    // movimento da nave com as setas
    ufoGroup.position.x += moveX;
    ufoGroup.position.z += moveY;
    ufoGroup.rotation.y += 0.02; // rotação contínua sobre o seu eixo de simetria (y)
  }
}

/////////////
/* DISPLAY */
/////////////
function render() {
  renderer.render(scene, camera);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
  createScene();
  createCamera();
  createLights();
  createMoon();
  createUFO();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement); 
  controls.target.set(0, 0, 0);
  controls.maxDistance = 250;    // stay within the sky dome radius)
  controls.update();

  fieldTexture = generateFieldTexture();
  skyTexture = generateSkyTexture();
  createSkyDome(skyTexture);

  loadHeightmapAndCreateTerrain(HEIGHTMAP_URL);

  window.addEventListener("resize", onResize);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
}



/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
  requestAnimationFrame(animate);
  update();
  render();
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
const keysPressed = {};
function onKeyDown(e) {
  if (keysPressed[e.key]) return;
  keysPressed[e.key] = true;

  if (e.key === "1") {
    terrainMesh.material.map = generateFieldTexture();
  } else if (e.key === "2") {
    skyMesh.material.map = generateSkyTexture();
  } else if (e.key.toLowerCase() === "d") {
    directionalLight.visible = !directionalLight.visible;
  } else if (e.key.toLowerCase() === "p") {
    pointLightsOn = !pointLightsOn;
    pointLights.forEach(light => light.visible = pointLightsOn);
  } else if (e.key.toLowerCase() === "s") {
    spotLightOn = !spotLightOn;
    spotLight.visible = spotLightOn;
  } else if (e.key === 'ArrowLeft') {
    moveY = -0.5;
  } else if (e.key === 'ArrowRight') {
    moveY = 0.5;
  } else if (e.key === 'ArrowUp') {
    moveX = 0.5;
  } else if (e.key === 'ArrowDown') {
    moveX = -0.5;
  } else if (e.key.toLowerCase() === 'q') {
    moonMesh.material = moonMaterials.lambert;
    ufoBaseMesh.material = ufoBaseMaterials.lambert;
    cockpitMesh.material = cockpitMaterials.lambert;
    houseMesh.material = houseMaterials.lambert;
    roofMeshes.forEach(roof => roof.material = roofMaterials.lambert);
    triangleFront.material = triangleMaterials.lambert;
    triangleBack.material = triangleMaterials.lambert;
    doorMesh.material = doorMaterials.lambert;
    windowMeshes.forEach(w => w.material = windowMaterials.lambert);
    bandMesh.material = bandMaterials.lambert;
    chamineMesh.material = chamineMaterials.lambert;
    topoChamineMesh.material = topoChamineMaterials.lambert;
    allTroncoMeshes.forEach(m => m.material = troncoMaterials.lambert);
    allCopaMeshes.forEach(copa => copa.material = copa.userData.materials.lambert);
  } else if (e.key.toLowerCase() === 'w') {
    moonMesh.material = moonMaterials.pong;
    ufoBaseMesh.material = ufoBaseMaterials.phong;
    cockpitMesh.material = cockpitMaterials.phong;
    houseMesh.material = houseMaterials.phong;
    roofMeshes.forEach(roof => roof.material = roofMaterials.phong);
    triangleFront.material = triangleMaterials.phong;
    triangleBack.material = triangleMaterials.phong;
    doorMesh.material = doorMaterials.phong;
    windowMeshes.forEach(w => w.material = windowMaterials.phong);
    bandMesh.material = bandMaterials.phong;
    chamineMesh.material = chamineMaterials.phong;
    topoChamineMesh.material = topoChamineMaterials.phong;
    allTroncoMeshes.forEach(m => m.material = troncoMaterials.phong);
    allCopaMeshes.forEach(copa => copa.material = copa.userData.materials.phong);
  } else if (e.key.toLowerCase() === 'e') {
    moonMesh.material = moonMaterials.toon;
    ufoBaseMesh.material = ufoBaseMaterials.toon;
    cockpitMesh.material = cockpitMaterials.toon;
    houseMesh.material = houseMaterials.toon;
    roofMeshes.forEach(roof => roof.material = roofMaterials.toon);
    triangleFront.material = triangleMaterials.toon;
    triangleBack.material = triangleMaterials.toon;
    doorMesh.material = doorMaterials.toon;
    windowMeshes.forEach(w => w.material = windowMaterials.toon);
    bandMesh.material = bandMaterials.toon;
    chamineMesh.material = chamineMaterials.toon;
    topoChamineMesh.material = topoChamineMaterials.toon;
    allTroncoMeshes.forEach(m => m.material = troncoMaterials.toon);
    allCopaMeshes.forEach(copa => copa.material = copa.userData.materials.toon);
  } else if (e.key.toLowerCase() === 'r') {
    moonMesh.material = moonMaterials.basic;
    ufoBaseMesh.material = ufoBaseMaterials.basic;
    cockpitMesh.material = cockpitMaterials.basic;
    houseMesh.material = houseMaterials.toon;
    roofMeshes.forEach(roof => roof.material = roofMaterials.basic);
    triangleFront.material = triangleMaterials.basic;
    triangleBack.material = triangleMaterials.basic;
    doorMesh.material = doorMaterials.basic;
    windowMeshes.forEach(w => w.material = windowMaterials.basic);
    bandMesh.material = bandMaterials.basic;
    chamineMesh.material = chamineMaterials.basic;
    topoChamineMesh.material = topoChamineMaterials.basic;
    allTroncoMeshes.forEach(m => m.material = troncoMaterials.basic);
    allCopaMeshes.forEach(copa => copa.material = copa.userData.materials.basic);
  }
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e) {
    keysPressed[e.key] = false;

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight')
      moveY = 0;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown')
      moveX = 0;
}

init();
animate();
