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

const canvas = document.querySelector('canvas.webgl');
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

const camera = new THREE.PerspectiveCamera( 35, sizes.width / sizes.height, 0.1, 100 )
camera.position.set(0, 6, 12)
camera.lookAt(0, 0, 0)
scene.add(camera)

//////////////////////////////////////////////////



////////////////////Controls////////////////////

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

//////////////////////////////////////////////////



////////////////////Textures////////////////////

const textureLoader = new THREE.TextureLoader()

//Floor
const floorAlphaTexture = textureLoader.load('./static/textures/floor/alpha.webp')
const floorColorTexture = textureLoader.load('./static/textures/floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_diff_1k.webp')
const floorARMTexture = textureLoader.load('./static/textures/floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_arm_1k.webp')
const floorNormalTexture = textureLoader.load('./static/textures/floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_nor_gl_1k.webp')
const floorDisplacementTexture = textureLoader.load('./static/textures/floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_disp_1k.webp')

floorColorTexture.colorSpace = THREE.SRGBColorSpace

floorColorTexture.repeat.set(2, 2)
floorARMTexture.repeat.set(2, 2)
floorNormalTexture.repeat.set(2, 2)
floorDisplacementTexture.repeat.set(2, )

floorColorTexture.wrapS = THREE.RepeatWrapping
floorARMTexture.wrapS = THREE.RepeatWrapping
floorNormalTexture.wrapS = THREE.RepeatWrapping
floorDisplacementTexture.wrapS = THREE.RepeatWrapping

floorColorTexture.wrapT = THREE.RepeatWrapping
floorARMTexture.wrapT = THREE.RepeatWrapping
floorNormalTexture.wrapT = THREE.RepeatWrapping
floorDisplacementTexture.wrapT = THREE.RepeatWrapping

// Wall
const wallColorTexture = textureLoader.load('./static/textures/wall/castle_brick_broken_06_1k/castle_brick_broken_06_diff_1k.webp')
const wallARMTexture = textureLoader.load('./static/textures/wall/castle_brick_broken_06_1k/castle_brick_broken_06_arm_1k.webp')
const wallNormalTexture = textureLoader.load('./static/textures/wall/castle_brick_broken_06_1k/castle_brick_broken_06_nor_gl_1k.webp')

wallColorTexture.colorSpace = THREE.SRGBColorSpace

// Roof
const roofColorTexture = textureLoader.load('./static/textures/roof/roof_slates_02_1k/roof_slates_02_diff_1k.webp')
const roofARMTexture = textureLoader.load('./static/textures/roof/roof_slates_02_1k/roof_slates_02_arm_1k.webp')
const roofNormalTexture = textureLoader.load('./static/textures/roof/roof_slates_02_1k/roof_slates_02_nor_gl_1k.webp')

roofColorTexture.colorSpace = THREE.SRGBColorSpace

roofColorTexture.repeat.set(3, 1)
roofARMTexture.repeat.set(3, 1)
roofNormalTexture.repeat.set(3, 1)

roofColorTexture.wrapS = THREE.RepeatWrapping
roofARMTexture.wrapS = THREE.RepeatWrapping
roofNormalTexture.wrapS = THREE.RepeatWrapping

//Door
const doorColorTexture = textureLoader.load('./static/textures/door/color.webp')
const doorAlphaTexture = textureLoader.load('./static/textures/door/alpha.webp')
const doorAmbientOcclusionTexture = textureLoader.load('./static/textures/door/ambientOcclusion.webp')
const doorHeightTexture = textureLoader.load('./static/textures/door/height.webp')
const doorNormalTexture = textureLoader.load('./static/textures/door/normal.webp')
const doorMetalnessTexture = textureLoader.load('./static/textures/door/metalness.webp')
const doorRoughnessTexture = textureLoader.load('./static/textures/door/roughness.webp')

doorColorTexture.colorSpace = THREE.SRGBColorSpace

//////////////////////////////////////////////////



////////////////////Objects////////////////////

//floor
const floorMaterial = new THREE.MeshPhysicalMaterial({
        // alphaMap: floorAlphaTexture,
        transparent: true,
        map: floorColorTexture,
        aoMap: floorARMTexture,
        roughnessMap: floorARMTexture,
        metalnessMap: floorARMTexture,
        normalMap: floorNormalTexture,
        displacementMap: floorDisplacementTexture,
        displacementScale: 0.1,
        displacementBias: - 0.2
});
const planeGeometry = new THREE.PlaneGeometry( 14, 10, 100, 100 );
// floorMaterial.wireframes = true
const planeMesh = new THREE.Mesh(planeGeometry, floorMaterial)
planeMesh.position.set(0, 0, 0)
planeMesh.rotateX(-Math.PI / 2);
scene.add(planeMesh)

//House
const house = new THREE.Group()

//Walls
const wallMaterial = new THREE.MeshPhysicalMaterial({
     map: wallColorTexture,
        aoMap: wallARMTexture,
        roughnessMap: wallARMTexture,
        metalnessMap: wallARMTexture,
        normalMap: wallNormalTexture
});
// wallMaterial.wireframe = true
const wallsGeometry = new THREE.BoxGeometry(4, 2, 2, 4, 4, 4)
const walls = new THREE.Mesh(wallsGeometry, wallMaterial)
walls.position.set(0, 0.86, 0)
house.add(walls)

//Roof
//Cone
const roofMaterial = new THREE.MeshPhysicalMaterial({
        map: roofColorTexture,
        aoMap: roofARMTexture,
        roughnessMap: roofARMTexture,
        metalnessMap: roofARMTexture,
        normalMap: roofNormalTexture
});
// roofMaterial.wireframe = true
const coneGeometry = new THREE.ConeGeometry( 1.4, 1, 4);
const roof = new THREE.Mesh(coneGeometry, roofMaterial);
roof.position.set(-1, 2.36, 0)
roof.rotateY(Math.PI/4)
house.add(roof);

//Right Box
const roof2Geometry = new THREE.BoxGeometry(2.2, 1, 2, 4, 4, 4)
const roof2 = new THREE.Mesh(roof2Geometry, wallMaterial)
roof2.position.set(0.9, 2.37, 0)
house.add(roof2)

//Door
const doorMaterial = new THREE.MeshPhysicalMaterial({
        map: doorColorTexture,
        transparent: true,
        alphaMap: doorAlphaTexture,
        aoMap: doorAmbientOcclusionTexture,
        displacementMap: doorHeightTexture,
        displacementScale: 0.15,
        displacementBias: -0.04,
        normalMap: doorNormalTexture,
        metalnessMap: doorMetalnessTexture,
        roughnessMap: doorRoughnessTexture
});

// doorMaterial.wireframe = true
const doorGeometry = new THREE.PlaneGeometry( 1, 1.4, 4, 4 );
const door = new THREE.Mesh(doorGeometry, doorMaterial);
door.position.set(-1, 0.7, 1.03)
// roof.rotateY(Math.PI/4)
house.add(door);

scene.add(house)
//////////////////////////////////////////////////



////////////////////Helper////////////////////

const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)
// const cameraHelper = new THREE.CameraHelper(camera)
// scene.add(cameraHelper)

//////////////////////////////////////////////////



////////////////////Lights////////////////////

const ambientLight = new THREE.AmbientLight(0xffffff, 1)
scene.add(ambientLight)

//////////////////////////////////////////////////



////////////////////Animations////////////////////
const clock = new THREE.Clock()

const tick = () =>{
    
    //Get Elaspsed Time
    const elapsedTime = clock.getElapsedTime()

    //Update Controls
    controls.update()

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
