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

  // Directional light at an angle (simulating sunlight)
    directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(30, 90, 0); // Tilted relative to xOy plane
    directionalLight.castShadow = false; // Controls light
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

  // Add stars as white dots
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

  // Background light green
  ctx.fillStyle = "#90ee90";
  ctx.fillRect(0, 0, size, size);

  // Draw flowers using different colors
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

    // Create plane geometry with the same resolution as the image
    const geometry = new THREE.PlaneGeometry(150, 150, size - 1, size - 1);

    // Adjust vertex heights from heightmap grayscale values
    for (let i = 0; i < geometry.attributes.position.count; i++) {
      const x = i % size;
      const y = Math.floor(i / size);
      const pixelIndex = (y * size + x) * 4;
      const height = (imgData[pixelIndex] / 255) * 15; // scale height max 15 units
      geometry.attributes.position.setZ(i, height);
    }

    geometry.computeVertexNormals();

    // Apply field texture to the terrain
    const material = new THREE.MeshStandardMaterial({
        map: fieldTexture,
        side: THREE.DoubleSide,
    });

    terrainMesh = new THREE.Mesh(geometry, material);
    terrainMesh.rotation.x = -Math.PI / 2; // rotate to horizontal
    scene.add(terrainMesh);
  };
  img.src = url;
}

function createSkyDome(skyTexture) {
    
  const geometry = new THREE.SphereGeometry(250, 32, 32);
  /*
  const material = new THREE.MeshBasicMaterial({
    map: skyTexture,
    side: THREE.BackSide,
  });*/
  const material = new THREE.MeshStandardMaterial({
  map: skyTexture,
  side: THREE.BackSide,
    });
  
  skyMesh = new THREE.Mesh(geometry, material);
  scene.add(skyMesh);
}

function createMoon() {
  const geometry = new THREE.SphereGeometry(10, 32, 32);

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffee,
    emissiveIntensity: 1.5,
    roughness: 0.5,
    metalness: 0.0
  });

  moonMesh = new THREE.Mesh(geometry, material);

  // Position the moon in the sky
  moonMesh.position.set(100, 80, -150);

  scene.add(moonMesh);
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
  controls.maxDistance = 250;    // Stay within the sky dome radius
  controls.update();

  fieldTexture = generateFieldTexture();
  skyTexture = generateSkyTexture();
  createSkyDome(skyTexture);

  // Load heightmap and create terrain
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
    terrainMesh.material.map = fieldTexture;
  } else if (e.key === "2") {
    terrainMesh.material.map = skyTexture;
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
