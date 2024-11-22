// three.js library를 import
import * as THREE from 'three';

// GLTFLoader를 import : 3D model을 load
import { GLTFLoader } from 'GLTFLoader';

// OrbitControls를 import : 카메라 조작을 가능하도록 함
import { OrbitControls } from 'OrbitControls';

// Dat.GUI를 import(local)
import { GUI } from './node_modules/dat.gui/build/dat.gui.module.js';

// 새로운 scene 생성
const scene = new THREE.Scene();

// 배경색 설정
scene.background = new THREE.Color(0x808080); // 회색 (#808080)

// perspective 카메라 생성
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// 카메라 위치 설정
camera.position.set(0, 1, 5);

// WebGL renderer 생성 : scene과 camera를 받아서 실제 보여지는 이미지를 생성
const renderer = new THREE.WebGLRenderer();

// renderer 크기를 윈도우 크기에 맞게 설정
renderer.setSize(window.innerWidth, window.innerHeight);

// html 문서의 body요소에 three.js renderer의 DOM 요소를 추가
// DOM(document object model)은 HTML, XML 문서의 구조화된 표현이며,
// 웹 브라우저가 문서를 표현하고 접근 및 조작할 수 있도록 제공하는 프로그래밍 인터페이스이다.
document.body.appendChild(renderer.domElement);


// AxesHelper(length of axis) 생성 : 축을 시각화.
// X: Red, Y: Green, Z: Blue
const axesHelper = new THREE.AxesHelper(100);

// AxesHelper를 scene에 추가함
scene.add(axesHelper);

// 카메라를 조작할 수 있는 OrbitControls 생성
const controls = new OrbitControls(camera, renderer.domElement); 


// AbientLight(color, intensity) 생성 : 전역으로 빛을 발산, 그림자 X
const ambientLight = new THREE.AmbientLight(0xffffff, 5);

// AbientLight을 scene에 추가하고 위치를 설정
scene.add(ambientLight);
ambientLight.position.set(0, 0, 0);


// DirectionalLight(color, intensity) 생성 : 방향성 광원, 그림자 O
const directLight1 = new THREE.DirectionalLight(0xffffff, 3);

// DirectionalLight scene에 추가하고 위치를 설정
scene.add(directLight1);
directLight1.position.set(0, 10, 0);


// ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ 아래 내용은 추가로 정리 필요 ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※

// 모델을 저장할 변수 선언
let model;


// GLTFLoader 생성
const loader = new GLTFLoader(); 

// glb load 시작
loader.load(

    // load 할 3d model file 경로 설정
    './assets/untitled2.glb', (glb) => {

        const model = glb.scene; // 모델을 장면(scene) 객체에서 가져옴

        // TextureLoader를 생성
        const textureLoader = new THREE.TextureLoader();

        // texture load 시작
        const metalnessTexture = textureLoader.load(
            // load 할 texture file 경로 설정
            './assets/MetalPlates014_1K-PNG_Metalness.png',
            () => console.log("success"), // 성공 시 콘솔에 메시지 출력
            undefined,
            (error) => console.log("error", error) // 에러 발생 시 콘솔에 메시지 출력
        );

        model.traverse((child) => { // 모델의 모든 자식 객체를 순회
            if (child.isMesh) { // 자식이 메쉬일 경우
                child.material.metalnessMap = metalnessTexture; // 메탈맵 텍스처 설정
                child.material.metalness = 0.8; // 메탈 재질 값 설정
                child.material.needsUpdate = true; // 재질 업데이트 필요 설정
            }
        });

        // 모델을 scene에 추가
        scene.add(model);
    },
    undefined,
    (error) => {
        console.error('An error occurred while loading the model', error); // 모델 로딩 중 에러 발생 시 메시지 출력
    }
);


// DAT.GUI 설정
const gui = new GUI();
const cameraFolder = gui.addFolder('Camera Position');
cameraFolder.add(camera.position, 'x', -10, 10).name('X Position');
cameraFolder.add(camera.position, 'y', -10, 10).name('Y Position');
cameraFolder.add(camera.position, 'z', -10, 10).name('Z Position');
cameraFolder.open();

// Raycaster 생성 : 객체와의 교차 감지
const raycaster = new THREE.Raycaster();

// 마우스 위치를 저장할 Vector2 객체 생성
const mouse = new THREE.Vector2();


let previousMaterial = null; // 이전에 선택된 객체의 재질을 저장할 변수
let mouseInside = false; // 마우스가 화면 안에 있는지 여부를 나타내는 변수
let colorTransitionFactor = 0; // 색상 전환 보간을 위한 변수
let colorTransitionDirection = 1; // 색상 전환 방향: 1은 빨간색으로, -1은 원래 색상으로
let targetColor = new THREE.Color(0xff0000); // 목표 색상 (빨간색)

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1; // 마우스 x 좌표를 정규화된 장치 좌표로 변환
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1; // 마우스 y 좌표를 정규화된 장치 좌표로 변환
    mouseInside = true; // 마우스가 화면 안에 있음을 설정
}

function onMouseOut() {
    mouseInside = false; // 마우스가 화면 밖으로 나가면 false로 설정
    if (previousMaterial) {
        colorTransitionDirection = -1; // 색상이 원래 색으로 돌아가도록 설정
    }
}

function checkIntersections() {
    if (!mouseInside) return; // 마우스가 화면 안에 없으면 함수 종료

    raycaster.setFromCamera(mouse, camera); // 마우스 위치를 기준으로 레이 설정

    const intersectableObjects = []; // 교차 감지를 할 객체들을 담을 배열
    scene.traverse((child) => { // 장면의 모든 객체를 순회
        if (child.isMesh) { // 객체가 메쉬일 경우
            intersectableObjects.push(child); // 배열에 추가
        }
    });

    const intersects = raycaster.intersectObjects(intersectableObjects); // 객체들과의 교차 여부를 확인
    if (intersects.length > 0) {
        const intersected = intersects[0].object; // 교차된 첫 번째 객체를 가져옴
        if (intersected.isMesh) { // 객체가 메쉬일 경우
            if (previousMaterial !== intersected.material) { // 이전에 선택된 재질과 다를 경우
                if (previousMaterial) {
                    colorTransitionDirection = -1; // 색상이 원래 색으로 돌아가도록 설정
                }
                previousMaterial = intersected.material; // 현재 객체의 재질을 저장
                previousMaterial.originalColor = previousMaterial.color.clone(); // 원래 색상을 복제하여 저장
                colorTransitionDirection = 1; // 색상이 빨간색으로 바뀌도록 설정
                colorTransitionFactor = 0; // 보간 변수 초기화
            }
        }
    } else if (previousMaterial) {
        colorTransitionDirection = -1; // 교차된 객체가 없으면 색상이 원래 색으로 돌아가도록 설정
    }
}

function animate() {
    requestAnimationFrame(animate); // 매 프레임마다 animate 함수 호출

    if (previousMaterial) {
        colorTransitionFactor += colorTransitionDirection * 0.05; // 색상 보간 속도
        colorTransitionFactor = Math.max(0, Math.min(1, colorTransitionFactor)); // 0과 1 사이로 값을 제한

        previousMaterial.color.lerp(
            colorTransitionDirection === 1 ? targetColor : previousMaterial.originalColor,
            colorTransitionFactor
        ); // 색상을 보간하여 전환

        if (colorTransitionFactor === 0 || colorTransitionFactor === 1) {
            if (colorTransitionDirection === -1) {
                previousMaterial = null; // 색상이 원래 색으로 돌아오면 재질 해제
            }
        }
    }

    checkIntersections(); // 객체와의 교차 감지
    controls.update(); // 카메라 컨트롤 업데이트
    renderer.render(scene, camera); // 장면을 렌더링
}

animate(); // 애니메이션 시작

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; // 카메라의 종횡비를 윈도우 크기에 맞게 설정
    camera.updateProjectionMatrix(); // 카메라 투영 행렬 업데이트
    renderer.setSize(window.innerWidth, window.innerHeight); // 렌더러 크기를 윈도우 크기에 맞게 설정
});

window.addEventListener('mousemove', onMouseMove); // 마우스 움직임 이벤트 리스너 추가
window.addEventListener('mouseout', onMouseOut); // 마우스가 화면 밖으로 나가는 이벤트 리스너 추가
