// three.js library를 import
import * as THREE from 'three';

// GLTFLoader를 import : 3D model을 load
import { GLTFLoader } from 'GLTFLoader';

// OrbitControls를 import : 카메라 조작을 가능하도록 함
import { OrbitControls } from 'OrbitControls';

// Dat.GUI를 import(local)
import { GUI } from './node_modules/dat.gui/build/dat.gui.module.js';



// Scene, Camera, Renderer 설정
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 10);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// 배경색 설정
scene.background = new THREE.Color(0x808080); // 회색 (#808080)


// AxesHelper(length of axis) 생성 : 축을 시각화.
// X: Red, Y: Green, Z: Blue
const axesHelper = new THREE.AxesHelper(100);

// AxesHelper를 scene에 추가함
scene.add(axesHelper);

// DAT.GUI 설정
const gui = new GUI();
const cameraFolder = gui.addFolder('Camera Position');
cameraFolder.add(camera.position, 'x', -10, 10).name('X Position');
cameraFolder.add(camera.position, 'y', -10, 10).name('Y Position');
cameraFolder.add(camera.position, 'z', -10, 10).name('Z Position');
cameraFolder.open();


// OrbitControls 추가
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();

// 간단한 큐브 추가
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Lerp 함수 정의
function lerp(start, end, t) {
  return start + (end - start) * t;
}

// 카메라가 서서히 이동하는 함수
async function smoothLookAt(targetPosition, duration = 5) {
  const startTarget = controls.target.clone(); // 시작 위치
  const startTime = performance.now(); // 시작 시간
  const endTime = startTime + duration * 1000; // 끝 시간 (ms)

  return new Promise((resolve) => {
    function animate() {
      const currentTime = performance.now();
      const elapsedTime = currentTime - startTime;
      const t = Math.min(elapsedTime / (duration * 1000), 1); // t 값 (0 ~ 1)

      // Lerp를 사용하여 controls.target 업데이트
      controls.target.set(
        lerp(startTarget.x, targetPosition.x, t),
        lerp(startTarget.y, targetPosition.y, t),
        lerp(startTarget.z, targetPosition.z, t)
      );
      controls.update(); // 업데이트 필수

      // 애니메이션 종료 조건
      if (t < 1) {
        requestAnimationFrame(animate); // 계속 보간
      } else {
        resolve(); // 완료 시 Promise 해결
      }
    }
    animate();
  });
}

// HTML 버튼 선택
const controlButton = document.getElementById('controlButton');

// 버튼 이벤트
controlButton.addEventListener('click', async () => {
  const targetPosition = new THREE.Vector3(2, 5, 0); // 목표 위치
  await smoothLookAt(targetPosition, 2); // 2초 동안 카메라 이동
  console.log('카메라가 목표 위치를 바라봅니다!');
});

// 창 크기 조절 이벤트
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 렌더링 루프
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
