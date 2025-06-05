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
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");

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

  return new THREE.CanvasTexture(canvas);
}

function loadHeightmapAndCreateTerrain(url) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, size, size);

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

    //update the normals
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

    // Distribuir 50 sobreiros pelo terreno
    distribuirSobreiros(50);

  };
  img.src = url;
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
  const moon_geometry = new THREE.SphereGeometry(10, 32, 32);

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffee,
    emissiveIntensity: 1.5,
    roughness: 0.5,
    metalness: 0.0
  });

  moonMesh = new THREE.Mesh(moon_geometry, material);

  moonMesh.position.set(100, 80, -150);

  scene.add(moonMesh);
}

function createSobreiro() {
    const sobreiro = new THREE.Group();

    const troncoMaterial = new THREE.MeshStandardMaterial({ color: 0xCC6600 });

    // Tronco principal
    const troncoGeometry = new THREE.CylinderGeometry(0.7, 1, 4.5, 16);
    const tronco = new THREE.Mesh(troncoGeometry, troncoMaterial);
    tronco.position.y = 2.25;
    tronco.rotation.z = THREE.MathUtils.degToRad(15); // inclinado
    sobreiro.add(tronco);

    // Ramo secundário
    const ramoSecGeometry = new THREE.CylinderGeometry(0.5, 0.6, 6, 16);
    ramoSecGeometry.translate(0, 2, 0);
    const ramoSec = new THREE.Mesh(ramoSecGeometry, troncoMaterial);
    ramoSec.position.y = 2.25;
    ramoSec.position.x = 0.6;
    ramoSec.rotation.z = THREE.MathUtils.degToRad(-30);
    sobreiro.add(ramoSec);

    // Ramo terciário
    const ramoTerGeometry = new THREE.CylinderGeometry(0.4, 0.5, 3, 16);
    ramoTerGeometry.translate(0, 1.5, 0);
    const ramoTer = new THREE.Mesh(ramoTerGeometry, troncoMaterial);
    ramoTer.position.y = 4.5;
    ramoTer.position.x = 1.5;
    ramoTer.rotation.z = THREE.MathUtils.degToRad(30);
    sobreiro.add(ramoTer);

    // 🌿 Novo ramo diagonal para a esquerda no topo do tronco
    const ramoEsqTopoGeometry = new THREE.CylinderGeometry(0.4, 0.6, 4, 16);
    ramoEsqTopoGeometry.translate(0, 1.5, 0);
    const ramoEsqTopo = new THREE.Mesh(ramoEsqTopoGeometry, troncoMaterial);
    ramoEsqTopo.position.y = 4.5;
    ramoEsqTopo.position.x = -0.6;
    ramoEsqTopo.rotation.y = THREE.MathUtils.degToRad(20); // gira 20 graus no Y
    ramoEsqTopo.rotation.z = THREE.MathUtils.degToRad(45); // maior inclinação
    sobreiro.add(ramoEsqTopo);


    const copaMaterial = new THREE.MeshStandardMaterial({ color: 0x003300 }); // verde-escuro

    function criarCopa(escala, posY) {
        const copaGeometry = new THREE.SphereGeometry(1.2, 16, 16);
        const copaMaterial = new THREE.MeshStandardMaterial({ color: 0x003300 });
        const copa = new THREE.Mesh(copaGeometry, copaMaterial);
        copa.scale.set(escala[0], escala[1], escala[2]);
        copa.position.y = posY;
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
    

    return sobreiro;
}

function distribuirSobreiros(n) {
  const positions = terrainMesh.geometry.attributes.position;
  const terrainSize = 150;
  const divisions = 256;

  let count = 0;

  while (count < n) {
    const sobreiro = createSobreiro();
    const posX = (Math.random() - 0.5) * 140;
    const posZ = (Math.random() - 0.5) * 140;

    // Skip if position is inside the restricted zone near the house
    if (posX >= -22 && posX <= 0 && posZ >= -54 && posZ <= -12) {
      continue;
    }

    // Convert to grid index
    const x = posX + terrainSize / 2;
    const z = posZ + terrainSize / 2;
    const iGrid = Math.floor((x / terrainSize) * (divisions - 1));
    const jGrid = Math.floor((z / terrainSize) * (divisions - 1));
    const index = jGrid * divisions + iGrid;

    const altura = positions.getZ(index);

    sobreiro.position.set(posX, altura, posZ);
    sobreiro.rotation.y = Math.random() * Math.PI * 2;

    const escala = 0.8 + Math.random() * 0.7;
    sobreiro.scale.set(escala, escala, escala);

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
  const corpoMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const corpo = new THREE.Mesh(corpoGeometry, corpoMaterial);
  corpo.position.set(0, 2.5, 0);
  casa.add(corpo);

  // ========================
  // 2. Telhado (laranja)
  // ========================
  const telhadoMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600, side: THREE.DoubleSide });
  const telhadoHeight = 1;

  // Telhado de duas águas (lado esquerdo e direito)

  const roofGeo = new THREE.PlaneGeometry(5.67, 16);

  const roofLeft = new THREE.Mesh(roofGeo, telhadoMaterial);

  roofLeft.rotation.x =  Math.PI / 2;
  roofLeft.rotation.y = -Math.PI / 4;
  
  roofLeft.position.set(2, 5 + telhadoHeight, 0);
  casa.add(roofLeft);

  const roofRight = new THREE.Mesh(roofGeo, telhadoMaterial);
  roofRight.rotation.x = Math.PI / 2;
  roofRight.rotation.y =  Math.PI / 4;
  // Posicionar no topo da casa, no lado direito (x positivo)
  roofRight.position.set(-2, 5 + telhadoHeight, 0);
  casa.add(roofRight);

  // ========================
  // 3. Triângulo frontal (branco)
  // ========================
  const triangleMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });

  // Define a triangle shape (front and back)
  const triangleShape = new THREE.Shape();
  triangleShape.moveTo(-3, 0);        // bottom left
  triangleShape.lineTo(0, 3);         // top center
  triangleShape.lineTo(3, 0);         // bottom right
  triangleShape.lineTo(-3, 0);        // close shape

  // Create geometry from the shape
  const triangleGeometry = new THREE.ShapeGeometry(triangleShape);

  // Frontal triangle
  const triangleFront = new THREE.Mesh(triangleGeometry, triangleMaterial);
  triangleFront.position.set(0, 5, 7.5);   // at top front face
  casa.add(triangleFront);

  // Back triangle
  const triangleBack = triangleFront.clone();
  triangleBack.position.z = -7.5;         // move to back
  casa.add(triangleBack);

  // ========================
  // 4. Porta (azul)
  // ========================
  const portaGeometry = new THREE.BoxGeometry(1.15, 2.5, 0.1);
  const portaMaterial = new THREE.MeshStandardMaterial({ color: 0x0077ff  });
  const porta = new THREE.Mesh(portaGeometry, portaMaterial);
  porta.position.set(3, 2, 2); 
  porta.rotation.y = Math.PI / 2;


  casa.add(porta);

  // ========================
  // 5. Janelas (azul)
  // ========================
  const janelaGeometry = new THREE.BoxGeometry(1, 1.2, 0.1);
  const janelaMaterial = new THREE.MeshStandardMaterial({ color: 0x0077ff  });

  const janela1 = new THREE.Mesh(janelaGeometry, janelaMaterial);
  janela1.position.set(3, 2.5, 6.3);
  janela1.rotation.y = Math.PI / 2;
  casa.add(janela1);

  const janela2 = janela1.clone();
  janela2.position.z = 4.3;
  casa.add(janela2);
  const janela3 = janela1.clone();
  janela3.position.z = -1.75;
  casa.add(janela3);
  const janela4 = janela1.clone();
  janela4.position.z = -6.25;
  casa.add(janela4);

  // ========================
  // 6. Faixa azul inferior
  // ========================
  const faixaGeometry = new THREE.BoxGeometry(6.01, 1, 15); // segue o corpo da casa
  const faixaMaterial = new THREE.MeshStandardMaterial({ color: 0x0077ff });
  const faixa = new THREE.Mesh(faixaGeometry, faixaMaterial);
  faixa.position.set(0, 0.4, 0);
  casa.add(faixa);

  // ========================
  // 7. Chaminé (branca com topo)
  // ========================
  const chamineBaseGeo = new THREE.BoxGeometry(1, 1.4, 2.5);
  const chamineBaseMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const chamine = new THREE.Mesh(chamineBaseGeo, chamineBaseMat);

  // Posicionada no lado esquerdo do telhado
  chamine.position.set(2.8, 5.6, -4); // ajuste fino conforme necessário
  casa.add(chamine);

  // Topo da chaminé (laranja)
  const topoChamineGeo = new THREE.BoxGeometry(1.3, 0.2, 2.8);
  const topoChamineMat = new THREE.MeshStandardMaterial({ color: 0xff6600 });
  const topoChamine = new THREE.Mesh(topoChamineGeo, topoChamineMat);
  topoChamine.position.set(0, 0.7, 0);
  chamine.add(topoChamine);

  // ========================
  // Posição da casa no terreno
  // ========================
  casa.position.set(posX, altura, posZ);
  casa.scale.set(1.2, 1.2, 1.2); // Scale 20% larger in all directions
  scene.add(casa);
}




//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions() {}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions() {}

////////////
/* UPDATE */
////////////
function update() {}

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
  controls.update();
  renderer.render(scene, camera);
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
  }
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e) {
    keysPressed[e.key] = false;
}

init();
animate();
