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
renderer.setSize(sizes.width,sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))

//////////////////////////////////////////////////



////////////////////Scene////////////////////

const scene = new THREE.Scene()

//////////////////////////////////////////////////



////////////////////Camera////////////////////

const camera = new THREE.PerspectiveCamera( 75, sizes.width / sizes.height, 0.1, 100 )
camera.position.set(0, 0, 10)
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



////////////////////Objects////////////////////

const basicMaterial = new THREE.MeshBasicMaterial({
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
scene.add(basicMesh)

//////////////////////////////////////////////////



////////////////////Lights////////////////////

const ambientLight = new THREE.AmbientLight(0xffffff, 1)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
directionalLight.position.set(2, 2, 2)

scene.add(directionalLight)

//////////////////////////////////////////////////



////////////////////Helper////////////////////

const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)
// const cameraHelper = new THREE.CameraHelper(camera)
// scene.add(cameraHelper)

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
