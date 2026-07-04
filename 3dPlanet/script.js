//Libraries
import * as THREE from 'three'
import GUI from 'lil-gui'
import { OrbitControls } from 'three/examples/jsm/Addons.js'



////////////////////Config////////////////////
// Centralised tunable values - the debug UI reads/writes directly into this object

const CONFIG = {
    stars: {
        count: 3000,
        fieldSize: 200,
        size: 0.015
    },
    planet: {
        count: 20000,
        radius: 2,
        size: 0.03,
        color: 0x44aaff,
        rotationSpeedY: 0.15,
        rotationSpeedX: 0.05
    },
    rings: {
        tiltX: 0.25,               // multiplied by PI
        flattenFactor: 0.8,
        pointSize: 0.02,
        keplerConstant: 0.6,
        bands: [
            { name: 'Inner dusty',  centerRadius: 2.75, tubeRadius: 0.18, count: 3000, color: '#d9c9a3' },
            { name: 'Main',         centerRadius: 3.3,  tubeRadius: 0.35, count: 6000, color: '#c7b280' },
            { name: 'Bright thin',  centerRadius: 3.9,  tubeRadius: 0.12, count: 2500, color: '#e8dcc0' },
            { name: 'Outer dusty',  centerRadius: 4.6,  tubeRadius: 0.45, count: 5000, color: '#9a8a6b' }
        ]
    }
}

//////////////////////////////////////////////////



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
    canvas: canvas,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

//////////////////////////////////////////////////



////////////////////Scene////////////////////

const scene = new THREE.Scene()

//////////////////////////////////////////////////



////////////////////Camera////////////////////

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 0, 10)
camera.lookAt(0, 0, 0)
scene.add(camera)

//////////////////////////////////////////////////



////////////////////Controls////////////////////

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

//////////////////////////////////////////////////



////////////////////Particle Factories////////////////////

/**
 * Creates a scattered star field points object spread through a cubic volume.
 */
function createStarField({ count, fieldSize, size })
{
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count; i++)
    {
        positions[i * 3]     = (Math.random() - 0.5) * fieldSize
        positions[i * 3 + 1] = (Math.random() - 0.5) * fieldSize
        positions[i * 3 + 2] = (Math.random() - 0.5) * fieldSize
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
        size: size,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: 0xffffff,
        sizeAttenuation: true
    })

    return new THREE.Points(geometry, material)
}

/**
 * Creates a sphere of particles (the "planet") using uniform spherical coordinates.
 */
function createPlanet({ count, radius, size, color })
{
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count; i++)
    {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos((Math.random() * 2) - 1)

        positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
        positions[i * 3 + 2] = radius * Math.cos(phi)
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
        size: size,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: color,
        sizeAttenuation: true
    })

    return new THREE.Points(geometry, material)
}

/**
 * Creates a multi-band planetary ring system as a single Points object.
 * See previous version's comments for the torus math explanation.
 * `phi` and `tubeDist` are fixed per particle, so `R` and `y` are
 * precomputed once and reused every frame in the animation loop.
 */
function createRings({ bands, flattenFactor, pointSize, keplerConstant })
{
    const totalCount = bands.reduce((sum, band) => sum + band.count, 0)

    const positions = new Float32Array(totalCount * 3)
    const colors = new Float32Array(totalCount * 3)

    const thetaStart = new Float32Array(totalCount)
    const angularSpeed = new Float32Array(totalCount)
    const orbitRadius = new Float32Array(totalCount)
    const heightFixed = new Float32Array(totalCount)

    let ptr = 0

    bands.forEach((band) =>
    {
        const bandColor = new THREE.Color(band.color)

        for (let i = 0; i < band.count; i++)
        {
            const theta = Math.random() * Math.PI * 2
            const phi = Math.random() * Math.PI * 2
            const tubeDist = band.tubeRadius * Math.sqrt(Math.random())

            const R = band.centerRadius + tubeDist * Math.cos(phi)
            const y = tubeDist * Math.sin(phi) * flattenFactor

            thetaStart[ptr] = theta
            orbitRadius[ptr] = R
            heightFixed[ptr] = y
            angularSpeed[ptr] = keplerConstant / Math.pow(band.centerRadius, 1.5)

            positions[ptr * 3]     = R * Math.cos(theta)
            positions[ptr * 3 + 1] = y
            positions[ptr * 3 + 2] = R * Math.sin(theta)

            const shade = 0.85 + Math.random() * 0.3
            colors[ptr * 3]     = bandColor.r * shade
            colors[ptr * 3 + 1] = bandColor.g * shade
            colors[ptr * 3 + 2] = bandColor.b * shade

            ptr++
        }
    })

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
        size: pointSize,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    })

    const points = new THREE.Points(geometry, material)

    return { points, totalCount, thetaStart, angularSpeed, orbitRadius, heightFixed }
}

//////////////////////////////////////////////////



////////////////////Create & Add Objects////////////////////

let stars = createStarField(CONFIG.stars)
scene.add(stars)

let planet = createPlanet(CONFIG.planet)
scene.add(planet)

let ringSystem = createRings(CONFIG.rings)
ringSystem.points.rotation.x = Math.PI * CONFIG.rings.tiltX
scene.add(ringSystem.points)

//////////////////////////////////////////////////



////////////////////Regeneration Helpers////////////////////
// Structural changes (particle count, radii, tube size) require rebuilding
// the geometry from scratch. Disposing the old geometry/material avoids
// leaking GPU memory each time the user drags a slider.

function regenerateStars()
{
    scene.remove(stars)
    stars.geometry.dispose()
    stars.material.dispose()

    stars = createStarField(CONFIG.stars)
    scene.add(stars)
}

function regeneratePlanet()
{
    scene.remove(planet)
    planet.geometry.dispose()
    planet.material.dispose()

    planet = createPlanet(CONFIG.planet)
    scene.add(planet)
}

function regenerateRings()
{
    scene.remove(ringSystem.points)
    ringSystem.points.geometry.dispose()
    ringSystem.points.material.dispose()

    ringSystem = createRings(CONFIG.rings)
    ringSystem.points.rotation.x = Math.PI * CONFIG.rings.tiltX
    scene.add(ringSystem.points)
}

//////////////////////////////////////////////////



////////////////////Lights////////////////////

const ambientLight = new THREE.AmbientLight(0xffffff, 1)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
directionalLight.position.set(2, 2, 2)

scene.add(directionalLight)

//////////////////////////////////////////////////



////////////////////Debug UI////////////////////

// --- Planet folder ---
const planetFolder = gui.addFolder('Planet')

planetFolder.add(CONFIG.planet, 'count', 1000, 50000, 500)
    .name('Particle count')
    .onFinishChange(regeneratePlanet) // expensive - only rebuild once the user releases the slider

planetFolder.add(CONFIG.planet, 'radius', 0.5, 5, 0.1)
    .name('Radius')
    .onFinishChange(regeneratePlanet)

planetFolder.add(CONFIG.planet, 'size', 0.005, 0.1, 0.005)
    .name('Particle size')
    .onChange((value) => { planet.material.size = value })

planetFolder.addColor(CONFIG.planet, 'color')
    .name('Color')
    .onChange((value) => { planet.material.color.set(value) })

planetFolder.add(CONFIG.planet, 'rotationSpeedY', -1, 1, 0.01)
    .name('Spin speed Y')

planetFolder.add(CONFIG.planet, 'rotationSpeedX', -1, 1, 0.01)
    .name('Spin speed X')


// --- Stars folder ---
const starsFolder = gui.addFolder('Stars')

starsFolder.add(CONFIG.stars, 'count', 500, 10000, 100)
    .name('Star count')
    .onFinishChange(regenerateStars)

starsFolder.add(CONFIG.stars, 'fieldSize', 50, 400, 10)
    .name('Field size')
    .onFinishChange(regenerateStars)

starsFolder.add(CONFIG.stars, 'size', 0.005, 0.05, 0.001)
    .name('Star size')
    .onChange((value) => { stars.material.size = value })


// --- Rings: global folder ---
const ringsFolder = gui.addFolder('Rings')

ringsFolder.add(CONFIG.rings, 'tiltX', 0, 1, 0.01)
    .name('Tilt (x PI)')
    .onChange((value) => { ringSystem.points.rotation.x = Math.PI * value })

ringsFolder.add(CONFIG.rings, 'flattenFactor', 0, 1.5, 0.01)
    .name('Flatten factor')
    .onFinishChange(regenerateRings) // baked into particle Y positions - needs rebuild

ringsFolder.add(CONFIG.rings, 'pointSize', 0.005, 0.08, 0.001)
    .name('Particle size')
    .onChange((value) => { ringSystem.points.material.size = value })

ringsFolder.add(CONFIG.rings, 'keplerConstant', 0, 2, 0.01)
    .name('Orbit speed')
    .onFinishChange(regenerateRings) // baked into per-particle angularSpeed - needs rebuild


// --- Rings: one folder per band ---
CONFIG.rings.bands.forEach((band, index) =>
{
    const bandFolder = ringsFolder.addFolder(band.name)

    bandFolder.add(band, 'centerRadius', 2.2, 6, 0.05)
        .name('Center radius')
        .onFinishChange(regenerateRings)

    bandFolder.add(band, 'tubeRadius', 0.02, 0.8, 0.01)
        .name('Tube thickness')
        .onFinishChange(regenerateRings)

    bandFolder.add(band, 'count', 200, 12000, 100)
        .name('Particle count')
        .onFinishChange(regenerateRings)

    bandFolder.addColor(band, 'color')
        .name('Color')
        .onFinishChange(regenerateRings)
})

gui.close()

//////////////////////////////////////////////////



////////////////////Animations////////////////////

const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    controls.update()

    // Spin the planet
    planet.rotation.y = elapsedTime * CONFIG.planet.rotationSpeedY
    planet.rotation.x = elapsedTime * CONFIG.planet.rotationSpeedX

    // Keplerian ring motion - read live from ringSystem so a regenerated
    // ring mesh (new geometry/arrays) is picked up automatically next frame
    const { totalCount, thetaStart, angularSpeed, orbitRadius, heightFixed } = ringSystem
    const ringPositionAttribute = ringSystem.points.geometry.attributes.position
    const ringPositionArray = ringPositionAttribute.array

    for (let i = 0; i < totalCount; i++)
    {
        const theta = thetaStart[i] + elapsedTime * angularSpeed[i]
        const R = orbitRadius[i]
        const base = i * 3

        ringPositionArray[base] = R * Math.cos(theta)
        ringPositionArray[base + 1] = heightFixed[i]
        ringPositionArray[base + 2] = R * Math.sin(theta)
    }
    ringPositionAttribute.needsUpdate = true

    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}
tick()

//////////////////////////////////////////////////



////////////////////Event Listners////////////////////

window.addEventListener("resize", () =>
{
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    controls.update()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

//////////////////////////////////////////////////