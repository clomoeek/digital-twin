// main.js
import * as THREE from 'three';
import { GLTFLoader } from 'GLTFLoader';
import { OrbitControls } from 'OrbitControls';

// 장면(scene) 생성
const scene = new THREE.Scene();

// 카메라(camera) 생성 (PerspectiveCamera)
const camera = new THREE.PerspectiveCamera(
    75, // 시야각
    window.innerWidth / window.innerHeight, // 종횡비
    0.1, // near 클리핑 평면
    1000 // far 클리핑 평면
);
camera.position.set(0, 1, 5); // 카메라 위치 설정

// WebGLRenderer 생성 및 설정
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls 생성 (카메라를 마우스로 제어 가능하게)
const controls = new OrbitControls(camera, renderer.domElement);

// GLTFLoader를 사용해 Cube.gltf 파일 불러오기
const loader = new GLTFLoader();
loader.load(
    'Cube.gltf', // glTF 파일 경로
    (gltf) => {
        const model = gltf.scene;
        scene.add(model); // 모델을 장면에 추가
    },
    undefined,
    (error) => {
        console.error('An error occurred while loading the model', error);
    }
);

// 기본 조명 추가
const ambientLight = new THREE.AmbientLight(0xffffff, 1); // 환경광
scene.add(ambientLight);

// 창 크기 변경에 따른 카메라 및 렌더러 크기 업데이트
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 애니메이션 루프
function animate() {
    requestAnimationFrame(animate);

    // 컨트롤 업데이트
    controls.update();

    // 렌더링
    renderer.render(scene, camera);
}

animate();
