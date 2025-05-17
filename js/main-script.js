//import * as THREE from "three";
//import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/controls/OrbitControls.js";
/*import { VRButton } from "three/addons/webxr/VRButton.js";
import * as Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
*/
import { VRButton } from "https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/webxr/VRButton.js";
import * as Stats from "https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/libs/stats.module.js";
import { GUI } from "https://cdn.jsdelivr.net/npm/lil-gui@0.18.0/dist/lil-gui.esm.min.js";
//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

let scene;
let leftShoulder;
let rightShoulder;
let pectorals;
let head;
let lowerAbdomen, waist;
let leftLeg, rightLeg;
let leftFootPivot, rightFootPivot;
let cameras = {};
let activeCamera;
let renderer;
let controls;

// Liberty angles
let theta1 = 0;
let theta2 = 0;


/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0); // Cor clara de fundo
    createLights(); 

}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////

function createCameras() {
    const aspect = window.innerWidth / window.innerHeight;
    const size = 10; // Tamanho da área visível das ortogonais

    // Frontal - Eixo Z negativo
    cameras.front = new THREE.OrthographicCamera(-size*aspect, size*aspect, size, -size, 0.1, 100);
    cameras.front.position.set(0, 0, 20);
    cameras.front.lookAt(0, 0, 0);

    // Lateral - Eixo X negativo
    cameras.side = new THREE.OrthographicCamera(-size*aspect, size*aspect, size, -size, 0.1, 100);
    cameras.side.position.set(20, 0, 0);
    cameras.side.lookAt(0, 0, 0);

    // Top - Eixo Y positivo
    cameras.top = new THREE.OrthographicCamera(-size*aspect, size*aspect, size, -size, 0.1, 100);
    cameras.top.position.set(0, 20, 0);
    cameras.top.lookAt(0, 0, 0);

    // Perspective - Vista geral
    cameras.perspective = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    cameras.perspective.position.set(20, 20, 20);
    cameras.perspective.lookAt(0, 0, 0);

    activeCamera = cameras.front;
}


/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

function createLights() {
    // Ambient light: soft light that illuminates everything equally
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // white light, 40% intensity
    scene.add(ambientLight);

    // Directional light: like the sun, casts shadows and creates highlights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // 80% intensity
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

function createRobot() {
  const robot = new THREE.Group(); // shared root

  const feet = createFeet(robot);
  const legs = createLegs(robot);
  const thighs = createThighs(robot);
  const lowerAbdomen = createLowerAbdomen(robot);
  const waist = createWaist();
  const pectorals = createPectorals();

  const head = createHead();
  const shoulders = createShoulders();
  const arms = createArms();

  // Optionally store references if needed
  robot.head = head;
  robot.shoulders = shoulders;
  robot.pectorals = pectorals;

  return robot;
}

function createTrailer() {
    let trailer = new THREE.Group(); // shared root

    trailer.position.set(0, -10, 0);

    const { trailerLeftLeg, trailerRightLeg } = createTrailerBody(trailer);
    trailerLeftLeg.rotation.x = Math.PI / 2;
    trailerRightLeg.rotation.x = Math.PI / 2;
    trailerLeftLeg.rotation.y= Math.PI/2 ;
    trailerRightLeg.rotation.y = -Math.PI/2 ;

    createContainer(trailer);
    return trailer;

}
/*
function createTruck() {
    let truck = createRobot();

    // Rotate truck to be horizontal
    truck.rotation.set(-Math.PI / 2, 0, Math.PI / 2);

    // Position it properly
    truck.position.set(0, -10, 0);

    truck.shoulders.leftShoulder.rotation.y = -Math.PI / 2;
    truck.shoulders.rightShoulder.rotation.y = Math.PI / 2;

    return truck;

}*/


function createFeet(robot) {

    // Foot variables
    const footLenght = 1.2;
    const footDepth = 1;
    const footHeight = 0.5;

    // Distance variables
    const distanceFeetCenter = 0.3; // Distance from leg center to inner foot face (feet position
                                    // is relative to leg)  

    const footGeometry = new THREE.BoxGeometry(footLenght, footHeight, footDepth);
    const footMaterial = new THREE.MeshStandardMaterial({ color: 0xBFA074 });

    // LEFT FOOT
    leftFootPivot = new THREE.Object3D();

    leftFootPivot.position.set(distanceFeetCenter - footLenght/2, footHeight/2, footHeight); // rotation point (center and back face aligned)

    // Create feet meshes
    const leftFootMesh = new THREE.Mesh(footGeometry, footMaterial);

    // Center the foot mesh relative to the pivot point
    leftFootMesh.position.set(0, 0, footHeight); 


    // RIGHT FOOT
    rightFootPivot = new THREE.Object3D();
    rightFootPivot.position.set(-distanceFeetCenter + footLenght/2, footHeight/2, footHeight); // rotation point (center and back face aligned)

    // Create feet meshes
    const rightFootMesh = new THREE.Mesh(footGeometry, footMaterial);
    // Center the foot mesh relative to the pivot point
    rightFootMesh.position.set(0, 0, footHeight);

    // Add mesh to pivot
    leftFootPivot.add(leftFootMesh);
    rightFootPivot.add(rightFootMesh);

    // Add pivot to robot
    robot.add(leftFootPivot);
    robot.add(rightFootPivot);

    return { leftFootPivot, rightFootPivot };

}

function createLegs(robot){

    // Leg variables
    const legHeight = 4.5;
    const legDepth = 1;
    const legLenght = 0.6;

    // Tire variables
    const tireRadius = 0.5;
    const tireHeight = 0.6;

    // Distance variables
    const distanceFeetCenterLeg = 1.1; // distance from center to leg center
    const distanceMidTire = 2.5 // distance from ground to center of mid tire
    

    const legGeometry = new THREE.BoxGeometry(legLenght, legHeight, legDepth);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0xD2B48C  });

    const tireGeometry = new THREE.CylinderGeometry(tireRadius, tireRadius, tireHeight, 32);
    const tireMaterial = new THREE.MeshStandardMaterial({ color: 0xA98F66 });

    // LEFT LEG
    leftLeg = new THREE.Object3D();
    leftLeg.position.set(-distanceFeetCenterLeg, 0, 0);
    robot.add(leftLeg);

    const leftLegMesh = new THREE.Mesh(legGeometry, legMaterial);
    leftLegMesh.position.set(0, legHeight/2, 0);

    leftLeg.add(leftLegMesh);
    leftLeg.add(leftFootPivot);

    // LEFT TIRES
    const leftTireBottom = new THREE.Mesh(tireGeometry, tireMaterial);
    leftTireBottom.rotation.z = Math.PI / 2;             // Rotate cylinder to lay flat on side
    leftTireBottom.position.set(-tireHeight/2 - legLenght/2, tireRadius, 0); 

    leftLeg.add(leftTireBottom);

    const leftTireMid = new THREE.Mesh(tireGeometry, tireMaterial);
    leftTireMid.rotation.z = Math.PI / 2;                // Rotate cylinder to lay flat on side
    leftTireMid.position.set(-tireHeight/2 - legLenght/2, distanceMidTire, 0); 

    leftLeg.add(leftTireMid);

    // RIGHT LEG
    rightLeg = new THREE.Object3D();
    rightLeg.position.set(distanceFeetCenterLeg, 0, 0);

    robot.add(rightLeg);

    // Create right leg mesh
    const rightLegMesh = new THREE.Mesh(legGeometry, legMaterial);
    rightLegMesh.position.set(0, legHeight/2, 0);

    rightLeg.add(rightLegMesh);
    rightLeg.add(rightFootPivot);

    // RIGHT TIRES
    const rightTireBottom = new THREE.Mesh(tireGeometry, tireMaterial);
    rightTireBottom.rotation.z = Math.PI / 2;               // Rotate cylinder to lay flat on side
    rightTireBottom.position.set(tireHeight/2 + legLenght/2, tireRadius, 0);

    rightLeg.add(rightTireBottom);

    const rightTireMid = new THREE.Mesh(tireGeometry, tireMaterial);
    rightTireMid.rotation.z = Math.PI / 2;                  // Rotate cylinder to lay flat on side
    rightTireMid.position.set(tireHeight/2 + legLenght/2, distanceMidTire, 0);

    rightLeg.add(rightTireMid);

    return { leftLeg, rightLeg };

}

function createThighs(robot){

    // Thigh variables
    const thighHeight = 1; // height of the thigh
    const thighDepth = 1; // depth of the thigh
    const thighLenght = 0.6; // width of the thigh

    // Leg variable
    const heightLeg = 4.5;

    // Distance variables
    const distanceFeetCenterThigh = 1.1; // distance from center to thigh center (= leg center)


    // Create thigh geometry and mesh
    const thighGeometry = new THREE.BoxGeometry(thighLenght, thighHeight, thighDepth);
    const thighMaterial = new THREE.MeshStandardMaterial({ color: 0xBFA074 });
    const leftThighMesh = new THREE.Mesh(thighGeometry, thighMaterial);
    const rightThighMesh = new THREE.Mesh(thighGeometry, thighMaterial);


    // LEFT THIGH
    const leftThigh = new THREE.Object3D();
    leftThigh.position.set(-distanceFeetCenterThigh, heightLeg, 0); // Place thigh at top of leg (the referece point is the robot center)

    leftThighMesh.position.set(0, thighHeight/2, 0); // move mesh up to height of thigh center
    leftThigh.add(leftThighMesh);

    // Attach leg under thigh
    leftLeg.position.set(0, -heightLeg, 0);  //leg starts just below thigh

    leftThigh.add(leftLeg);
    robot.add(leftThigh);

    // RIGHT THIGH
    const rightThigh = new THREE.Object3D();
    rightThigh.position.set(distanceFeetCenterThigh, heightLeg, 0);

    rightThighMesh.position.set(0, thighHeight/2, 0);   
    rightThigh.add(rightThighMesh);

    rightLeg.position.set(0, -heightLeg, 0);    //leg starts just below thigh

    rightThigh.add(rightLeg);
    robot.add(rightThigh);

    return { leftThigh, rightThigh };

}

function createLowerAbdomen(robot) {

    // Lower Abdomen variables
    const lowerAbdomenHeight = 0.7; // height of the thigh
    const lowerAbdomenDepth = 2; // depth of the thigh
    const lowerAbdomenLenght = 2.8; // width of the thigh

    // Tire variables
    const tireRadius = 0.5; // radius of the tire
    const tireHeight = 0.6; // height of the tire


    // distance variables
    const distanceGroundAbdomen = 5.5; // distance from ground to lower abdomen base (leg height + thigh height)
    const newDepth = 0.5; // the axis was in the middle of the leg, now its in its back face


    const lowerAbdomenGeometry = new THREE.BoxGeometry(lowerAbdomenLenght, lowerAbdomenHeight, lowerAbdomenDepth);
    const lowerAbdomenMaterial = new THREE.MeshStandardMaterial({ color: 0xA87E57 });
    
    // LOWER ABDOMEN
    lowerAbdomen = new THREE.Object3D();
    lowerAbdomen.position.set(0, distanceGroundAbdomen, -newDepth);

    // Create lower abdomen mesh
    const lowerAbdomenMesh = new THREE.Mesh(lowerAbdomenGeometry, lowerAbdomenMaterial);
    lowerAbdomenMesh.position.set(0, lowerAbdomenHeight/2, 0); // raise mesh by half height to center it on the pivot

    lowerAbdomen.add(lowerAbdomenMesh);
    robot.add(lowerAbdomen);

     // Create tires for lower abdomen (same size as before)
    const tireGeometry = new THREE.CylinderGeometry(tireRadius, tireRadius, tireHeight, 32);
    const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x8B5E3C });

    // LEFT TIRE
    const leftTire = new THREE.Mesh(tireGeometry, tireMaterial);
    leftTire.rotation.z = Math.PI / 2; // Rotate cylinder to lay flat on side
    leftTire.position.set(-lowerAbdomenLenght/2 - tireHeight/2, lowerAbdomenHeight/2, tireRadius);     // Place at the center of the left tire

    lowerAbdomen.add(leftTire);

    // RIGHT TIRE
    const rightTire = new THREE.Mesh(tireGeometry, tireMaterial);
    rightTire.rotation.z = Math.PI / 2;
    rightTire.position.set(lowerAbdomenLenght/2 + tireHeight/2, lowerAbdomenHeight/2, tireRadius); // Place at the center of the right tire
    
    lowerAbdomen.add(rightTire);

    return lowerAbdomen;
}

function createWaist(){

    // Waist variables
    const waistHeight = 1;
    const waistDepth = 2;
    const waistLenght = 2.8;

    // Abdomen variables
    const abdomenHeight = 0.7;


    // Create waist geometry and mesh
    const waistGeometry = new THREE.BoxGeometry(waistLenght, waistHeight, waistDepth);
    const waistMaterial = new THREE.MeshStandardMaterial({ color: 0x7A6C5D });

    // WAIST
    waist = new THREE.Object3D();
    waist.position.set(0, abdomenHeight + waistHeight/2, 0); // position at the center of the waist (Position waist is related to lowerAbdomen)

    // Create waist mesh
    const waistMesh = new THREE.Mesh(waistGeometry, waistMaterial);
    waistMesh.position.set(0, 0, 0); // center at waist pivot

    waist.add(waistMesh);           // Add mesh to waist
    lowerAbdomen.add(waist);        // Add waist as child of lowerAbdomen   

    return waist;

}

function createPectorals() {

    // Pectorals variables
    const pectoralsHeight = 1.5;
    const pectoralsDepth = 2;
    const pectoralsLenght = 4;

    // Waist variables
    const waistHeight = 1;


    // Create pectorals geometry and mesh
    const pectoralsGeometry = new THREE.BoxGeometry(pectoralsLenght, pectoralsHeight, pectoralsDepth);
    const pectoralsMaterial = new THREE.MeshStandardMaterial({ color: 0x6B4F2C });

    // PECTORALIS
    pectorals = new THREE.Object3D();
    pectorals.position.set(0, waistHeight/2 + pectoralsHeight/2, 0);     // Position pectorals at the center of the pectorals (Position pectorals is related to waist)

    // Create pectorals mesh
    const pectoralsMesh = new THREE.Mesh(pectoralsGeometry, pectoralsMaterial);
    pectoralsMesh.position.set(0, 0, 0); // centered at pectorals pivot

    pectorals.add(pectoralsMesh); // Add mesh to pectorals
    waist.add(pectorals);       // make it a child of waist

    return pectorals;
}

function createHead() {

    // Head variables
    const headHeight = 1;
    const headWidth = 1; 
    const headDepth = 1;

    // Pectorals variables
    const pectoralsHeight = 1.5; // height of the pectorals
    
    const yOffset = pectoralsHeight/2 + headHeight/2; // center should be at y center of head
    const zOffset = -headDepth/2;     //"The center should be aligned with the Z center of the head 
                                    //(the Z position of the pectorals was aligned with the front face of the head)."


    // Create head geometry and mesh
    const headGeometry = new THREE.BoxGeometry(headWidth, headHeight, headDepth);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xC8A165 });

    // HEAD
    head = new THREE.Object3D();
    head.position.set(0, yOffset, zOffset);

    // Create head mesh
    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    headMesh.position.set(0, 0, 0); // Centered on head pivot

    head.add(headMesh);         // Add mesh to head
    pectorals.add(head);        // make it a child of pectorals

    createEyes();
    createAntennas();

    return head;
}

function createEyes() {

    // Eye variables
    const eyeRadius = 0.15;

    // distance variables
    const distanceEyesCenter = 0.3; // distance from head center to eye center   
    const distanceEyesHeight = 0.25; // distance from center of head to eye center
    const distanceEyesDepth = 0.5; // distance center of head to eye center z


    // create eye geometry and mesh
    const eyeGeometry = new THREE.CircleGeometry(eyeRadius, 32);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x002E5D });

    // LEFT EYE
    const leftEyeMesh = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEyeMesh.position.set(-distanceEyesCenter, distanceEyesHeight, distanceEyesDepth);
    
    head.add(leftEyeMesh);

    // RIGHT EYE
    const rightEyeMesh = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEyeMesh.position.set(distanceEyesCenter, distanceEyesHeight, distanceEyesDepth);
    
    head.add(rightEyeMesh);

}

function createAntennas() {

    // Antenna variables
    const antennaLenght = 0.2;
    const antennaHeight = 0.5; 
    const antennaDepth = 1;

    // Head variables
    const headHeight = 1;
    const headLenght = 1;

    //distance variables
    const distanceAntennaHeight = antennaHeight/2 + headHeight/2; // distance from center of head to antenna center
    const distanceAntennaHeadX = headLenght/2 - antennaLenght/2; // distance from center of head to antenna center in the X axis


    // create antenna geometry and mesh
    const antennaGeometry = new THREE.BoxGeometry(antennaLenght, antennaHeight, antennaDepth);
    const antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x8B5E3C });

    // LEFT ANTENNA
    const leftAntennaMesh = new THREE.Mesh(antennaGeometry, antennaMaterial);
    leftAntennaMesh.position.set(-distanceAntennaHeadX, distanceAntennaHeight, 0);  // lateral extreme X (half head width), half antenna height up
    
    head.add(leftAntennaMesh);

    // RIGHT ANTENNA
    const rightAntennaMesh = new THREE.Mesh(antennaGeometry, antennaMaterial);
    rightAntennaMesh.position.set(distanceAntennaHeadX, distanceAntennaHeight, 0);
    
    head.add(rightAntennaMesh);

}

function createShoulders() {

    // Shoulder variables
    const shoulderHeight = 0.3;
    const shoulderLength = 0.9;
    const shoulderDepth = 0.3;

    // Pectorals variables
    const pectoralsHeight = 1.5;
    const pectoralsDepth = 2;
    const pectoralsLenght = 4;

    // Distance variables
    const shoulderDistancePectoralis = 0.2; // distance from back of pectoralis to back of shoulder
    const shoulderHeightPectoralis = 0.5; // height difference between top of shoulder and top of pectoralis

    const zOffset = -pectoralsDepth/2 + shoulderDistancePectoralis + shoulderDepth/2; // shoulder shifted backward relative to pectorals (along Z)
    const yOffset = pectoralsHeight/2 - shoulderHeightPectoralis; // shoulder offset from pectorals (along Y)
    const xOffset = pectoralsLenght/2 + shoulderLength/2; // shoulder offset from pectorals (along X)


    // Create shoulder geometry and mesh
    const shoulderGeometry = new THREE.BoxGeometry(shoulderLength, shoulderHeight, shoulderDepth);
    const shoulderMaterial = new THREE.MeshStandardMaterial({ color: 0xA89F91 }); // medium gray

    // LEFT SHOULDER
    leftShoulder = new THREE.Object3D();
    leftShoulder.position.set(-xOffset, yOffset, zOffset);

    // Create left shoulder mesh
    const leftShoulderMesh = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
    leftShoulderMesh.position.set(0, 0, 0);

    leftShoulder.add(leftShoulderMesh);  // Add mesh to left shoulder
    pectorals.add(leftShoulder);     // Add left shoulder to pectorals

    // RIGHT SHOULDER
    rightShoulder = new THREE.Object3D();
    rightShoulder.position.set(xOffset, yOffset, zOffset);      // Same Y and Z offset as left shoulder, mirrored X position

    const rightShoulderMesh = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
    rightShoulderMesh.position.set(0, 0, 0);

    rightShoulder.add(rightShoulderMesh);  // Add mesh to right shoulder  
    pectorals.add(rightShoulder);   // Add right shoulder to pectorals

    return { leftShoulder, rightShoulder };
}

function createArms() {

    // Arm variables
    const armLength = 0.6;
    const armHeight = 1.5;
    const armDepth = 0.7;

    // Shoulder variables
    const shoulderHeight = 0.3;
    const shoulderLength = 0.9;
    const shoulderDepth = 0.3;

    // Distance variables
    const distanceShoulderArm = 0.2; // distance from back of shoulder to back of arm

    const zOffset = - shoulderDepth/2 -distanceShoulderArm  + armDepth/2; // arm shifted relative to shoulder (along Z)
    const xOffset = shoulderLength/2 + armLength/2; // arm offset from shoulder pivot (along X)
    const yOffset = 0.5; // height difference between the shoulder and the arm (related to the top of each object, not their center)


    // Create arm geometry and mesh
    const armGeometry = new THREE.BoxGeometry(armLength, armHeight, armDepth);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x4A4A4A });

    // LEFT ARM
    const leftArm = new THREE.Object3D();
    leftArm.position.set(-xOffset, yOffset, zOffset);

    const leftArmMesh = new THREE.Mesh(armGeometry, armMaterial);
    leftArmMesh.position.set(0, -armHeight / 2, 0);         // move mesh down so it can be centered in the y axis

    leftArm.add(leftArmMesh);
    leftShoulder.add(leftArm);

    // RIGHT ARM
    const rightArm = new THREE.Object3D();
    rightArm.position.set(xOffset, yOffset, zOffset);

    const rightArmMesh = new THREE.Mesh(armGeometry, armMaterial);
    rightArmMesh.position.set(0, -armHeight / 2, 0);        // move mesh down so it can be centered in the y axis

    rightArm.add(rightArmMesh);
    rightShoulder.add(rightArm);

    createExhaustPipes(leftArm, rightArm);
    createForearms(leftArm, rightArm);

    return { leftArm, rightArm };
}

function createExhaustPipes(leftArm, rightArm) {

    // Exhaust pipe variables
    const pipeRadius = 0.15;
    const pipeHeight = 1;

    // Arm variables
    const armLength = 0.6;

    // Distance variables
    const pipeYOffset = -0.5; // 0.5 below top of arm
    const pipeXOffset = armLength/2 + pipeRadius; // // distance from center of arm to center of pipe
    const pipeZOffset = 0;


    // Create exhaust pipe geometry and mesh
    const pipeGeometry = new THREE.CylinderGeometry(pipeRadius, pipeRadius, pipeHeight, 16);
    const pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x7A6C5D }); // dark gray

    // LEFT EXHAUST PIPE
    const leftPipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
    leftPipe.position.set(-pipeXOffset, pipeYOffset, pipeZOffset); // left side

    leftArm.add(leftPipe);

    // RIGHT EXHAUST PIPE
    const rightPipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
    rightPipe.position.set(pipeXOffset, pipeYOffset, pipeZOffset);

    rightArm.add(rightPipe);
}

function createForearms(leftArm, rightArm) {

    // Forearm variables
    const forearmLength = 0.6;
    const forearmHeight = 2.5;
    const forearmDepth = 0.7;

    // Arm variables
    const armHeight = 1.5;


    // Create forearm geometry and mesh
    const forearmGeometry = new THREE.BoxGeometry(forearmLength, forearmHeight, forearmDepth);
    const forearmMaterial = new THREE.MeshStandardMaterial({ color: 0x4A4A4A });

    // LEFT FOREARM
    const leftForearm = new THREE.Object3D();
    leftForearm.position.set(0, -armHeight, 0);         // positioned at bottom of arm

    const leftForearmMesh = new THREE.Mesh(forearmGeometry, forearmMaterial);
    leftForearmMesh.position.set(0, -forearmHeight / 2, 0); // center mesh below pivot

    leftForearm.add(leftForearmMesh);
    leftArm.add(leftForearm); // <- so it moves with the arm

    // RIGHT FOREARM
    const rightForearm = new THREE.Object3D();
    rightForearm.position.set(0, -1.5, 0);

    const rightForearmMesh = new THREE.Mesh(forearmGeometry, forearmMaterial);
    rightForearmMesh.position.set(0, -forearmHeight / 2, 0);

    rightForearm.add(rightForearmMesh);
    rightArm.add(rightForearm);

    return { leftForearm, rightForearm };

}

function createTrailerBody(trailer){

    // Leg variables
    const trailerHeight = 6;
    const trailerDepth = 1;
    const trailerLenght = 0.6;

    // Tire variables
    const tireRadius = 0.5;
    const tireHeight = 0.6;

    // Distance variables
    const distanceFeetCenterLeg = 1.1; // distance from center to leg center
    const distanceMidTire = 2.5 // distance from ground to center of mid tire
    

    const legGeometry = new THREE.BoxGeometry(trailerLenght, trailerHeight, trailerDepth);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0xD2B48C  });

    const tireGeometry = new THREE.CylinderGeometry(tireRadius, tireRadius, tireHeight, 32);
    const tireMaterial = new THREE.MeshStandardMaterial({ color: 0xA98F66 });

    // LEFT LEG
    const trailerLeftLeg = new THREE.Object3D();
    trailerLeftLeg.position.set(-distanceFeetCenterLeg, 0, 0);
    trailer.add(trailerLeftLeg);

    const leftLegMesh = new THREE.Mesh(legGeometry, legMaterial);
    leftLegMesh.position.set(0, trailerHeight/2, 0);
    trailerLeftLeg.add(leftLegMesh);

    // LEFT TIRES
    const leftTireBottom = new THREE.Mesh(tireGeometry, tireMaterial);
    leftTireBottom.rotation.z = Math.PI / 2;             // Rotate cylinder to lay flat on side
    leftTireBottom.position.set(-tireHeight/2 - trailerLenght/2, tireRadius, 0); 
    trailerLeftLeg.add(leftTireBottom);

    const leftTireMid = new THREE.Mesh(tireGeometry, tireMaterial);
    leftTireMid.rotation.z = Math.PI / 2;                // Rotate cylinder to lay flat on side
    leftTireMid.position.set(-tireHeight/2 - trailerLenght/2, distanceMidTire, 0); 
    trailerLeftLeg.add(leftTireMid);

    // RIGHT LEG
    const trailerRightLeg = new THREE.Object3D();
    trailerRightLeg.position.set(distanceFeetCenterLeg, 0, 0);
    trailer.add(trailerRightLeg);

    // Create right leg mesh
    const rightLegMesh = new THREE.Mesh(legGeometry, legMaterial);
    rightLegMesh.position.set(0, trailerHeight/2, 0);
    trailerRightLeg.add(rightLegMesh);


    // RIGHT TIRES
    const rightTireBottom = new THREE.Mesh(tireGeometry, tireMaterial);
    rightTireBottom.rotation.z = Math.PI / 2;               // Rotate cylinder to lay flat on side
    rightTireBottom.position.set(tireHeight/2 + trailerLenght/2, tireRadius, 0);

    trailerRightLeg.add(rightTireBottom);

    const rightTireMid = new THREE.Mesh(tireGeometry, tireMaterial);
    rightTireMid.rotation.z = Math.PI / 2;                  // Rotate cylinder to lay flat on side
    rightTireMid.position.set(tireHeight/2 + trailerLenght/2, distanceMidTire, 0);

    trailerRightLeg.add(rightTireMid);

    return { trailerLeftLeg, trailerRightLeg };

}

function createContainer(trailer) {

    // Container variables
    const containerHeight = 7;
    const containerDepth = 9;
    const containerLength = 2.8;


    // Create container geometry and mesh
    const containerGeometry = new THREE.BoxGeometry(containerLength, containerHeight, containerDepth);
    const containerMaterial = new THREE.MeshStandardMaterial({ color: 0x7A6C5D });

    // CONTAINER
    const containerMesh = new THREE.Mesh(containerGeometry, containerMaterial);
    containerMesh.position.set(0, containerHeight / 2, containerDepth / 2); // Center the container mesh

    trailer.add(containerMesh);
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
function update() {
    /*
  if (leftFootPivot && rightFootPivot) {
    // Aqui você rotaciona os pés ao redor do eixo desejado, ex: Z
    leftFootPivot.rotation.x = theta1;
    rightFootPivot.rotation.x = theta1;
  }
    if (lowerAbdomen) {
    // Aqui você rotaciona os pés ao redor do eixo desejado, ex: Z
    lowerAbdomen.rotation.x = theta2;
  } */
}

/////////////
/* DISPLAY */
/////////////
function render() {
    renderer.render(scene, activeCamera);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
    createScene();
    createCameras();
    scene.add(createRobot());
    scene.add(createTrailer())
    //scene.add(createTruck());

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKeyDown);

    controls = new OrbitControls(cameras.perspective, renderer.domElement);
    controls.enabled = false; // Apenas ativa quando usar a perspetiva
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
    const aspect = window.innerWidth / window.innerHeight;

    // Atualizar ortogonais
    const size = 10;
    for (let camKey of ['front', 'side', 'top']) {
        const cam = cameras[camKey];
        cam.left = -size * aspect;
        cam.right = size * aspect;
        cam.top = size;
        cam.bottom = -size;
        cam.updateProjectionMatrix();
    }

    // Atualizar perspetiva
    cameras.perspective.aspect = aspect;
    cameras.perspective.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
    switch (e.key) {
        case '1':
            activeCamera = cameras.front;
            controls.enabled = false;
            break;
        case '2':
            activeCamera = cameras.side;
            controls.enabled = false;
            break;
        case '3':
            activeCamera = cameras.top;
            controls.enabled = false;
            break;
        case '4':
            activeCamera = cameras.perspective;
            controls.enabled = true;
            break;
        /*
        case 'q':
            theta1 = Math.min(theta1 + 0.05, Math.PI / 2);
            break;
        case 'a':
            theta1 = Math.max(theta1 - 0.05, -Math.PI / 2);
            break;
        case 'w':
            theta2 = Math.min(theta1 + 0.05, Math.PI / 2);
            break;
        case 's':
            theta2 = Math.max(theta1 + 0.05, Math.PI / 2);
        break;*/
    }
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e) {}



init();
animate();