import * as THREE from 'three'
import { GLTFLoader } from 'GLTFLoader'
import { RectAreaLightUniformsLib } from 'RectAreaLightUniformsLib'

document.addEventListener('DOMContentLoaded', () => {
  initThree()
})

function initThree() {
  const model = document.querySelector('.canvas')

  const scene = new THREE.Scene()
  scene.background = null

  RectAreaLightUniformsLib.init()

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 3000)
  camera.position.set(0, 3.2, 24)
  camera.lookAt(0, 2.6, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15

  model.appendChild(renderer.domElement)

  function updateRendererSize() {
    const rect = model.getBoundingClientRect()
    renderer.setSize(rect.width, rect.height)
    camera.aspect = rect.width / rect.height
    camera.updateProjectionMatrix()
  }

  updateRendererSize()
  window.addEventListener('resize', updateRendererSize)

  const bagGroup = new THREE.Group()
  scene.add(bagGroup)
  const baseRotationY = -1.85
  const baseRotationX = 0.03

  bagGroup.rotation.y = baseRotationY
  bagGroup.rotation.x = baseRotationX

  const loader = new GLTFLoader()

  loader.load(
    'bag.glb',
    function (gltf) {
      const bag = gltf.scene

      bag.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true

          if (child.material) {
            child.material.roughness = 0.85
            child.material.metalness = 0
          }
        }
      })

      const box = new THREE.Box3().setFromObject(bag)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())

      bag.position.sub(center)

      const targetHeight = 17
      const scale = targetHeight / size.y
      bag.scale.setScalar(scale)

      bag.position.y += 1.2

      bagGroup.add(bag)

      console.log('Модель загружена успешно')
    },
    function (xhr) {
      console.log(((xhr.loaded / xhr.total) * 100).toFixed(2) + '% loaded')
    },
    function (error) {
      console.error('Ошибка загрузки модели', error)
    }
  )
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9c6ff, 1))
  scene.add(new THREE.AmbientLight(0xf7f3ff, 0.1))

  const keyLight = new THREE.DirectionalLight(0xffffff, 3.8)
  keyLight.position.set(6, 9, 9)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(2048, 2048)
  scene.add(keyLight)

  const fillLight = new THREE.RectAreaLight(0xe7ddff, 5.5, 10, 4)
  fillLight.position.set(5, 4, 8)
  fillLight.lookAt(0, 2, 0)
  scene.add(fillLight)

  const purpleLight = new THREE.PointLight(0xcbb5ff, 4.5, 30)
  purpleLight.position.set(5, -2, 5)
  scene.add(purpleLight)

  const rimLight = new THREE.DirectionalLight(0xdfe8ff, 2.4)
  rimLight.position.set(6, 6, -8)
  scene.add(rimLight)

  const mousePosition = { x: 0, y: 0 }

  function updateMousePosition(event) {
    const rect = renderer.domElement.getBoundingClientRect()
    mousePosition.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mousePosition.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  renderer.domElement.addEventListener('mousemove', updateMousePosition)

  function animate() {
    requestAnimationFrame(animate)

    const targetRotationY = baseRotationY + mousePosition.x * 0.22
    const targetRotationX = baseRotationX + mousePosition.y * 0.05

    bagGroup.rotation.y += (targetRotationY - bagGroup.rotation.y) * 0.08
    bagGroup.rotation.x += (targetRotationX - bagGroup.rotation.x) * 0.08

    renderer.render(scene, camera)
  }

  animate()
}
