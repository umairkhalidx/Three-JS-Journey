//Libraries
import * as THREE from 'three'
import GUI from 'lil-gui'
import { OrbitControls } from 'three/examples/jsm/Addons.js'



////////////////////Debug////////////////////

const gui = new GUI({
    width: 300,
    title: "Tweaks Menu",
    closeFolders: true
})
gui.close()

//////////////////////////////////////////////////



////////////////////Variables////////////////////

const canvas = document.querySelector('canvas.webgl')
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

//////////////////////////////////////////////////



////////////////////Renderer////////////////////

const renderer = new THREE.WebGLRenderer({
    canvas:canvas,
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width,sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))

//////////////////////////////////////////////////



////////////////////Scene////////////////////

const scene = new THREE.Scene()

//////////////////////////////////////////////////



////////////////////Camera////////////////////

const camera = new THREE.PerspectiveCamera( 75, sizes.width / sizes.height, 0.1, 100 )
camera.position.set(- 8, 4, 8)
camera.lookAt(0, 0, 0)
scene.add(camera)

//////////////////////////////////////////////////



////////////////////Controls////////////////////

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

//////////////////////////////////////////////////



////////////////////Textures////////////////////

const textureLoader = new THREE.TextureLoader()

// Wall
const colorTexture = textureLoader.load('./static/textures/laminatedFloor/laminate_floor_02_diff_1k.jpg')
const armTexture = textureLoader.load('./static/textures/laminatedFloor/laminate_floor_02_arm_1k.jpg')
const normalTexture = textureLoader.load('./static/textures/laminatedFloor/laminate_floor_02_nor_gl_1k.jpg')
const displacementTexture = textureLoader.load('./static/textures/laminatedFloor/laminate_floor_02_disp_1k.jpg')

colorTexture.colorSpace = THREE.SRGBColorSpace

//////////////////////////////////////////////////



////////////////////Floor////////////////////
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({
        color: '#444444',
        metalness: 0,
        roughness: 0.5
    })
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
floor.position.y = -3
scene.add(floor)

//////////////////////////////////////////////////



////////////////////Objects////////////////////

const basicMaterial = new THREE.MeshPhysicalMaterial({
    map: colorTexture,
    aoMap: armTexture,
    roughnessMap: armTexture,
    metalnessMap: armTexture,
    normalMap: normalTexture,
    displacementMap: displacementTexture,
    displacementScale: 0.3,
    displacementBias: - 0.2,
 })
const TorusKnot = new THREE.TorusGeometry(2.4, 0.7, 128, 32)
const basicMesh = new THREE.Mesh(TorusKnot, basicMaterial)
basicMesh.position.set(0, 0, 0)
basicMesh.receiveShadow = true
scene.add(basicMesh)

//////////////////////////////////////////////////



////////////////////Lights////////////////////

const ambientLight = new THREE.AmbientLight(0xffffff, 2.4)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
directionalLight.shadow.radius = 10
scene.add(directionalLight)

//////////////////////////////////////////////////



////////////////////Helper////////////////////

const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)
// const cameraHelper = new THREE.CameraHelper(camera)
// scene.add(cameraHelper)
const lighthelper = new THREE.CameraHelper(directionalLight.shadow.camera, 5);
scene.add(lighthelper);

//////////////////////////////////////////////////



////////////////////Animations////////////////////
const clock = new THREE.Clock()

const tick = () =>{
    
    //Get Elaspsed Time
    const elapsedTime = clock.getElapsedTime()

    //Update Controls
    controls.update()

    //Animate the objects
    basicMesh.rotation.y += 0.01
    basicMesh.rotation.x += 0.005

    //Rerender the scene
    renderer.render(scene,camera)

    //Request Animation
    window.requestAnimationFrame(tick)

}
tick()

//////////////////////////////////////////////////



////////////////////Event Listners////////////////////
window.addEventListener("resize", () =>{

    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    //Update Camera
    camera.aspect = sizes.width/sizes.height
    camera.updateProjectionMatrix()

    //Update Controls
    controls.update()

    //Update Renderer
    renderer.setSize(sizes.width,sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))

} )

//////////////////////////////////////////////////
