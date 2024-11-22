import * as THREE from 'three'; // THREE.js 라이브러리를 가져옴
import { GLTFLoader } from 'GLTFLoader'; // GLTFLoader를 가져와 3D 모델을 로드하기 위해 사용
import { OrbitControls } from 'OrbitControls'; // OrbitControls를 가져와 카메라 조작을 가능하게 함

const scene = new THREE.Scene(); // 새로운 장면(scene) 생성

// 배경색 설정
scene.background = new THREE.Color(0x808080); // 회색 (#808080)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); // 원근 카메라 생성
camera.position.set(0, 1, 5); // 카메라 위치 설정

const renderer = new THREE.WebGLRenderer(); // WebGL 렌더러 생성
renderer.setSize(window.innerWidth, window.innerHeight); // 렌더러 크기를 윈도우 크기에 맞게 설정
document.body.appendChild(renderer.domElement); // 렌더러의 DOM 요소를 문서에 추가

const controls = new OrbitControls(camera, renderer.domElement); // 카메라를 조작할 수 있는 OrbitControls 생성

const directLight1 = new THREE.DirectionalLight(0xffffff, 1); // 첫 번째 방향성 조명 생성
scene.add(directLight1); // 조명을 장면에 추가
directLight1.position.set(0, 5, 0); // 조명의 위치 설정

const directLight2 = new THREE.DirectionalLight(0xffffff, 1); // 두 번째 방향성 조명 생성
scene.add(directLight2); // 조명을 장면에 추가
directLight2.position.set(5, 0, 0); // 조명의 위치 설정

const directLight3 = new THREE.DirectionalLight(0xffffff, 1); // 세 번째 방향성 조명 생성
scene.add(directLight3); // 조명을 장면에 추가
directLight3.position.set(0, 0, 5); // 조명의 위치 설정

let model; // 모델을 저장할 변수를 선언
const raycaster = new THREE.Raycaster(); // 레이캐스터 생성 (객체와의 교차 감지를 위해 사용)
const mouse = new THREE.Vector2(); // 마우스 위치를 저장할 Vector2 객체 생성
let previousMaterial = null; // 이전에 선택된 객체의 재질을 저장할 변수
let mouseInside = false; // 마우스가 화면 안에 있는지 여부를 나타내는 변수

const loader = new GLTFLoader(); // GLTFLoader 생성
loader.load(
    'untitled2.glb', // 로드할 3D 모델 파일 경로
    (gltf) => {
        const model = gltf.scene; // 모델을 장면(scene) 객체에서 가져옴

        const textureLoader = new THREE.TextureLoader(); // 텍스처 로더 생성
        const metalnessTexture = textureLoader.load(
            'MetalPlates014_1K-PNG_Metalness.png', // 금속 텍스처 경로
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

        scene.add(model); // 모델을 장면에 추가
    },
    undefined,
    (error) => {
        console.error('An error occurred while loading the model', error); // 모델 로딩 중 에러 발생 시 메시지 출력
    }
);

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
