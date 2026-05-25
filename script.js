//Libraries
import * as THREE from 'three'
import GUI from 'lil-gui'
import { OrbitControls, RGBELoader } from 'three/examples/jsm/Addons.js'
import { TextGeometry } from 'three/examples/jsm/Addons.js'
import { FontLoader } from 'three/examples/jsm/Addons.js'
import typefaceFont from 'three/examples/fonts/helvetiker_regular.typeface.json'



/////////////////////////////////Debug////////////////////////////////

const gui = new GUI({
    width: 300,
    title: "Tweaks Menu",
    closeFolders: true
})
gui.close()

//////////////////////////////////////////////////////////////////////




///////////////////////////////Variables//////////////////////////////

const canvas = document.querySelector('canvas.webgl')
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

//////////////////////////////////////////////////////////////////////




/////////////////////////////////Rederer//////////////////////////////

const renderer = new THREE.WebGLRenderer({
    canvas:canvas,
})
renderer.setSize(sizes.width,sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))

//////////////////////////////////////////////////////////////////////




//////////////////////////////////Scene///////////////////////////////

const scene = new THREE.Scene()

//////////////////////////////////////////////////////////////////////




//////////////////////////////////Camera//////////////////////////////

const camera = new THREE.PerspectiveCamera( 75, sizes.width / sizes.height, 0.1, 100 )
// camera.position.set(-10, -0.5, -5)
// camera.position.set(-8, -0.35, -4.5)
camera.position.set(-26, -0.5, -14)
camera.lookAt(0, 0, 0)

scene.add(camera)

//////////////////////////////////////////////////////////////////////




///////////////////////////////Controls///////////////////////////////

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

//////////////////////////////////////////////////////////////////////




///////////////////////////////Enviornment////////////////////////////

//Enviornment Options
const environmentSettings = {
    environment: 'autumn_field_puresky_2k'
}

const environmentMaps = {
    'Street': './static/textures/environmentMap/2k.hdr',
    'Sky': './static/textures/environmentMap/autumn_field_puresky_2k.hdr',
    'Train Track': './static/textures/environmentMap/bloem_train_track_clear_2k.hdr',
    'Altanka': './static/textures/environmentMap/altanka_2k.hdr'
}

//Loading the Enviornement
const rgbeLoader = new RGBELoader()
let currentEnvironmentMap = null

const updateEnvironment = (path) =>
{
    rgbeLoader.load(path, (environmentMap) =>
    {
        environmentMap.mapping = THREE.EquirectangularReflectionMapping

        if(currentEnvironmentMap)
        {
            currentEnvironmentMap.dispose()
        }

        currentEnvironmentMap = environmentMap

        scene.background = environmentMap
        scene.environment = environmentMap
    })
}
updateEnvironment(environmentMaps['Sky'])

//Enviornment GUI Options
gui.add(environmentSettings, 'environment', {
    Street: 'Street',
    Sky: 'Sky',
    TrainTrack: 'Train Track',
    Altanka: 'Altanka'
})
.onChange((value) =>
{
    updateEnvironment(environmentMaps[value])
})
.name('Environment')

//////////////////////////////////////////////////////////////////////




///////////////////////////////Materials//////////////////////////////
const basicMaterial = new THREE.MeshBasicMaterial({ color: '#ff5555' })
const depthMaterial = new THREE.MeshDepthMaterial()
const lambertMaterial = new THREE.MeshLambertMaterial({ color: '#55ff55' })
const matcapMaterial = new THREE.MeshMatcapMaterial()
const normalMaterial = new THREE.MeshNormalMaterial()
const phongMaterial = new THREE.MeshPhongMaterial({ color: '#5555ff', shininess: 100 })
const physicalMaterial = new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0.5, roughness: 0.2, clearcoat: 1 })
const standardMaterial = new THREE.MeshStandardMaterial({ color: '#ffaa00', metalness: 0.7, roughness: 0.3 })
const toonMaterial = new THREE.MeshToonMaterial({ color: '#00ffcc' })

//All Materials
const materials = [
    { name: 'Basic', material: basicMaterial },
    { name: 'Depth', material: depthMaterial },
    { name: 'Lambert', material: lambertMaterial },
    { name: 'Matcap', material: matcapMaterial },
    { name: 'Normal', material: normalMaterial },
    { name: 'Phong', material: phongMaterial },
    { name: 'Physical', material: physicalMaterial },
    { name: 'Standard', material: standardMaterial },
    { name: 'Toon', material: toonMaterial }
]

//////////////////////////////////////////////////////////////////////




////////////////////////////////Geometries///////////////////////////////

// Geometry Settings
const geometrySettings = {
    geometry: 'Torus'
}


// Geometry Options
const geometries = {
    Torus: new THREE.TorusGeometry(3, 1.2, 64, 128),
    Sphere: new THREE.SphereGeometry(3.4, 64, 64),
    Cube: new THREE.BoxGeometry(5, 5, 5),
    TorusKnot: new THREE.TorusKnotGeometry(2.4, 0.7, 128, 32),
    Capsule: new THREE.CapsuleGeometry(1.5, 3, 8, 16),
    Cone: new THREE.ConeGeometry(3, 6, 64),
    Cylinder: new THREE.CylinderGeometry(2.5, 2.5, 6, 64),
    Dodecahedron: new THREE.DodecahedronGeometry(3.2),
    Icosahedron: new THREE.IcosahedronGeometry(3.2, 0),
    Octahedron: new THREE.OctahedronGeometry(3.2),
    Tetrahedron: new THREE.TetrahedronGeometry(3.5),
    Circle: new THREE.CircleGeometry(3.5, 64),
    Ring: new THREE.RingGeometry(2.5, 4, 64),
    Plane: new THREE.PlaneGeometry(7, 7)
}

//Lathe Geometry
const lathePoints = []
for(let i = 0; i < 10; i++)
{
    lathePoints.push(
        new THREE.Vector2(
            Math.sin(i * 0.2) * 2 + 1.5,
            (i - 5) * 0.5
        )
    )
}
geometries.Lathe = new THREE.LatheGeometry(lathePoints, 64)

//Tube Geometry
const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4, 0, 0),
    new THREE.Vector3(-2, 2, 0),
    new THREE.Vector3(2, 2, 0),
    new THREE.Vector3(4, 0, 0)
])
geometries.Tube = new THREE.TubeGeometry(curve, 64, 0.8, 20, false)

//Extrude Geometry
const shape = new THREE.Shape()
shape.absarc(0, 0, 3.5, 0, Math.PI * 2, false)

const extrudeSettings = {
    depth: 3,
    bevelEnabled: true,
    bevelThickness: 0.5,
    bevelSize: 0.5,
    bevelSegments: 6
}
geometries.Extrude = new THREE.ExtrudeGeometry(shape, extrudeSettings)

//Shape Geometry
const heartShape = new THREE.Shape()
const x = 0
const y = 0
heartShape.moveTo(x + 0, y + 2)
heartShape.bezierCurveTo(x + 2, y + 4, x + 4, y + 2, x + 0, y - 2)
heartShape.bezierCurveTo(x - 4, y + 2, x - 2, y + 4, x + 0, y + 2)

geometries.Shape= new THREE.ShapeGeometry(heartShape)


//Geometry
const geometry = geometries.Torus


//Cleanup
const updateGeometry = (newGeometry) =>
{
    const meshes = [
        basicMesh,
        depthMesh,
        lambertMesh,
        matcapMesh,
        normalMesh,
        phongMesh,
        physicalMesh,
        standardMesh,
        toonMesh
    ]

    meshes.forEach((mesh) =>
    {
        mesh.geometry.dispose()
        mesh.geometry = newGeometry
    })
}


//Geometry GUI Options
gui.add(geometrySettings, 'geometry', [
    'Torus',
    'Sphere',
    'Cube',
    'TorusKnot',
    'Capsule',
    'Cone',
    'Cylinder',
    'Dodecahedron',
    'Icosahedron',
    'Octahedron',
    'Tetrahedron',
    'Circle',
    'Ring',
    'Plane',
    'Lathe',
    'Tube',
    'Extrude',
    'Shape'
])
.onChange((value) =>
{
    updateGeometry(geometries[value])
})
.name('Geometry')

/////////////////////////////////////////////////////////////////////



////////////////////////////////Objects///////////////////////////////

// 1. BASIC
const basicMesh = new THREE.Mesh(geometry, basicMaterial)
basicMesh.position.set(0, 4, 32)
scene.add(basicMesh)

// 2. DEPTH
const depthMesh = new THREE.Mesh(geometry, depthMaterial)
depthMesh.position.set(6, 4, 22)
scene.add(depthMesh)

// 3. LAMBERT
const lambertMesh = new THREE.Mesh(geometry, lambertMaterial)
lambertMesh.position.set(10, 4, 12)
scene.add(lambertMesh)

// 4. MATCAP
const matcapMesh = new THREE.Mesh(geometry, matcapMaterial)
matcapMesh.position.set(16, 4, 4)
scene.add(matcapMesh)

// 5. NORMAL
const normalMesh = new THREE.Mesh(geometry, normalMaterial)
normalMesh.position.set(21, 4, -5)
scene.add(normalMesh)

// 6. PHONG
const phongMesh = new THREE.Mesh(geometry, phongMaterial)
phongMesh.position.set(26, 4, -16)
scene.add(phongMesh)

// 7. PHYSICAL
const physicalMesh = new THREE.Mesh(geometry, physicalMaterial)
physicalMesh.position.set(16, -6, 0)
scene.add(physicalMesh)

// 8. STANDARD
const standardMesh = new THREE.Mesh(geometry, standardMaterial)
standardMesh.position.set(12, -6, 9)
scene.add(standardMesh)

// 9. TOON
const toonMesh = new THREE.Mesh(geometry, toonMaterial)
toonMesh.position.set(8, -6, 18)
scene.add(toonMesh)

//Material GUI Controls
const materialFolder = gui.addFolder('Material')

// BASIC
const basicFolder = materialFolder.addFolder('Basic Mesh')
basicFolder.add(basicMesh.position, 'x', -100, 100, 0.1)
basicFolder.add(basicMesh.position, 'y', -100, 100, 0.1)
basicFolder.add(basicMesh.position, 'z', -100, 100, 0.1)

// DEPTH
const depthFolder = materialFolder.addFolder('Depth Mesh')
depthFolder.add(depthMesh.position, 'x', -100, 100, 0.1)
depthFolder.add(depthMesh.position, 'y', -100, 100, 0.1)
depthFolder.add(depthMesh.position, 'z', -100, 100, 0.1)

// LAMBERT
const lambertFolder = materialFolder.addFolder('Lambert Mesh')
lambertFolder.add(lambertMesh.position, 'x', -100, 100, 0.1)
lambertFolder.add(lambertMesh.position, 'y', -100, 100, 0.1)
lambertFolder.add(lambertMesh.position, 'z', -100, 100, 0.1)

// MATCAP
const matcapFolder = materialFolder.addFolder('Matcap Mesh')
matcapFolder.add(matcapMesh.position, 'x', -100, 100, 0.1)
matcapFolder.add(matcapMesh.position, 'y', -100, 100, 0.1)
matcapFolder.add(matcapMesh.position, 'z', -100, 100, 0.1)

// NORMAL
const normalFolder = materialFolder.addFolder('Normal Mesh')
normalFolder.add(normalMesh.position, 'x', -100, 100, 0.1)
normalFolder.add(normalMesh.position, 'y', -100, 100, 0.1)
normalFolder.add(normalMesh.position, 'z', -100, 100, 0.1)

// PHONG
const phongFolder = materialFolder.addFolder('Phong Mesh')
phongFolder.add(phongMesh.position, 'x', -100, 100, 0.1)
phongFolder.add(phongMesh.position, 'y', -100, 100, 0.1)
phongFolder.add(phongMesh.position, 'z', -100, 100, 0.1)

// PHYSICAL
const physicalFolder = materialFolder.addFolder('Physical Mesh')
physicalFolder.add(physicalMesh.position, 'x', -100, 100, 0.1)
physicalFolder.add(physicalMesh.position, 'y', -100, 100, 0.1)
physicalFolder.add(physicalMesh.position, 'z', -100, 100, 0.1)

// STANDARD
const standardFolder = materialFolder.addFolder('Standard Mesh')
standardFolder.add(standardMesh.position, 'x', -100, 100, 0.1)
standardFolder.add(standardMesh.position, 'y', -100, 100, 0.1)
standardFolder.add(standardMesh.position, 'z', -100, 100, 0.1)

// TOON
const toonFolder = materialFolder.addFolder('Toon Mesh')
toonFolder.add(toonMesh.position, 'x', -100, 100, 0.1)
toonFolder.add(toonMesh.position, 'y', -100, 100, 0.1)
toonFolder.add(toonMesh.position, 'z', -100, 100, 0.1)

//////////////////////////////////////////////////////////////////////




/////////////////////////////////Lights///////////////////////////////

const ambientLight = new THREE.AmbientLight(0xffffff, 1)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
directionalLight.position.set(2, 2, 2)

scene.add(directionalLight)

//////////////////////////////////////////////////////////////////////




//////////////////////////////////Textures////////////////////////////

const textureLoader = new THREE.TextureLoader()
const matcapTexture = textureLoader.load('./static/textures/matcaps/1.png')
matcapMaterial.matcap = matcapTexture

//////////////////////////////////////////////////////////////////////



/////////////////////////////////Fonts////////////////////////////////
const fonts = []
const fontFolders = []
const fontFolder = gui.addFolder('Fonts')

const fontLoader = new FontLoader()

function createText({
    text,
    fontPath,
    size,
    depth,
    position,
    rotation,
    folderName
})
{
    fontLoader.load(fontPath, (font) =>
    {
        const geometry = new TextGeometry(text, {
            font: font,
            size: size,
            depth: depth,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelOffset: 0,
            bevelSegments: 5
        })

        const material = new THREE.MeshMatcapMaterial({
            map: matcapTexture
        })

        const mesh = new THREE.Mesh(geometry, material)

        geometry.center()

        mesh.position.set(position.x, position.y, position.z)

        mesh.rotation.set(rotation.x, rotation.y, rotation.z)

        scene.add(mesh)

        fonts.push(mesh)

        // GUI
        const folder = fontFolder.addFolder(folderName)

        folder.add(mesh.position, 'x', -100, 100, 0.1)
        folder.add(mesh.position, 'y', -100, 100, 0.1)
        folder.add(mesh.position, 'z', -100, 100, 0.1)
    })
}

const degToRad = (deg) => deg * Math.PI / 180

createText({
    text: 'Mesh Materials in Three.js',
    fontPath: './static/fonts/helvetiker_regular.typeface.json',
    size: 6,
    depth: 0.5,
    position: { x: 18, y: 25, z: 12 },
    rotation: { x: 0, y: -2.0, z: degToRad(0.8) },
    folderName: 'Title Text'
})

createText({
    text: 'Documentation',
    fontPath: './static/fonts/helvetiker_regular.typeface.json',
    size: 0.3,
    depth: 0,
    position: { x: -20, y: -3, z: -16 },
    rotation: { x: 0, y: -2.0, z: degToRad(-2) },
    folderName: 'Documentation Text'
})

/////////////////////////////////////////////////////////////////////




/////////////////////////////////Animations///////////////////////////
const clock = new THREE.Clock()

const tick = () =>{
    
    //Get Elaspsed Time
    const elapsedTime = clock.getElapsedTime()

    //Update Controls
    controls.update()

    //Rotate Objects
    // scene.children.forEach((child) =>
    // {
    //     if(child instanceof THREE.Mesh && !child.userData.isFont)
    //     {
    //         child.rotation.y += 0.01
    //         child.rotation.x += 0.005
    //     }
    // })
    const rotatingMeshes = [
    basicMesh,
    depthMesh,
    lambertMesh,
    matcapMesh,
    normalMesh,
    phongMesh,
    physicalMesh,
    standardMesh,
    toonMesh
]
rotatingMeshes.forEach((mesh) =>
{
    mesh.rotation.y += 0.01
    mesh.rotation.x += 0.005
})

    //Rerender the scene
    renderer.render(scene,camera)
    // console.log(camera.position.x,camera.position.y,camera.position.z)

    //Request Animation
    window.requestAnimationFrame(tick)

}
tick()

//////////////////////////////////////////////////////////////////////




/////////////////////////////Event Listners//////////////////////////
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

//////////////////////////////////////////////////////////////////////
