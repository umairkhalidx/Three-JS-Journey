import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import GUI from 'lil-gui'

gsap.registerPlugin(ScrollTrigger)

// Reset scroll position on reload so it always starts at the top
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual'
}
window.addEventListener('beforeunload', () => {
    window.scrollTo(0, 0)
})
window.addEventListener('load', () => {
    window.scrollTo(0, 0)
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

/**
 * Loading Screen
 */
const loadingScreen = document.querySelector('.loading-screen')
const lottiePlayer = document.querySelector('lottie-player')

window.addEventListener('load', () => {
    // Add a small delay so the animation can be enjoyed
    // (since our basic scene currently loads almost instantly!)
    setTimeout(() => {
        // Freeze the animation so it doesn't loop awkwardly during the fade transition
        if (lottiePlayer) {
            lottiePlayer.pause()
        }
        loadingScreen.classList.add('fade-out')

        // Grand Entrance Animation (starts right as loading screen fades)
        gsap.to(donut.scale, {
            x: donut.userData.targetScale,
            y: donut.userData.targetScale,
            z: donut.userData.targetScale,
            duration: 3.5,
            ease: "elastic.out(1, 0.5)",
            delay: 1.2,
            onComplete: () => { donutState.hasEntered = true }
        })

        // Dramatic entrance spin
        donutSpinWrapper.rotation.y = -Math.PI
        gsap.to(donutSpinWrapper.rotation, {
            y: 0,
            duration: 4.5,
            ease: "power2.out",
            delay: 1.2
        })

    }, 2500) // 2.5 seconds delay before fading out
})

// Scene
const scene = new THREE.Scene()

/**
 * Objects - Realistic Procedural Donut Factory
 */
// Reusable geometries/materials to save memory
const doughGeometry = new THREE.TorusGeometry(1, 0.45, 32, 64)
const doughMaterial = new THREE.MeshStandardMaterial({ color: '#e0a96d', roughness: 0.7, metalness: 0.05 })

const icingGeometry = new THREE.TorusGeometry(1, 0.47, 128, 256)
const posAttribute = icingGeometry.attributes.position
const vertex = new THREE.Vector3()

// Procedurally deform the bottom half of the icing torus to simulate dripping glaze
for (let i = 0; i < posAttribute.count; i++) {
    vertex.fromBufferAttribute(posAttribute, i)

    // Only deform vertices on the bottom half (z < 0 in local space before laying flat)
    if (vertex.z < 0) {
        // Calculate the angle around the torus tube
        const angle = Math.atan2(vertex.y, vertex.x)
        // Add a sine wave displacement to create organic, uneven drips
        vertex.z = Math.max(vertex.z, -0.05 + Math.sin(angle * 12) * 0.08)
    }
    posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z)
}
icingGeometry.computeVertexNormals()

const drizzleMaterial = new THREE.MeshPhysicalMaterial({ color: '#3d1c04', roughness: 0.1, metalness: 0.1, clearcoat: 1.0 })

/**
 * Procedurally generates a wavy 3D tube for the drizzle toppings.
 * Uses a CatmullRomCurve3 path wrapped around the torus shape.
 */
const createDrizzleRing = (baseTubeAngle, waveFreq, waveAmp, thickness) => {
    const points = []
    for (let i = 0; i < 60; i++) {
        // Calculate angle around the main circle of the donut
        const angle = (i / 60) * Math.PI * 2

        // Add a sine wave displacement for an organic zig-zag pattern
        const tubeAngle = baseTubeAngle + Math.sin(angle * waveFreq) * waveAmp

        // Map the 2D path onto the thinner 3D surface of the torus (R=1, r=0.48)
        points.push(new THREE.Vector3((1 + 0.48 * Math.cos(tubeAngle)) * Math.cos(angle), (1 + 0.48 * Math.cos(tubeAngle)) * Math.sin(angle), 0.48 * Math.sin(tubeAngle)))
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), 150, thickness, 8, true)
}
const drizzleGeom1 = createDrizzleRing(Math.PI * 0.7, 4, 0.1, 0.02)
const drizzleGeom2 = createDrizzleRing(Math.PI * 0.5, 3, 0.15, 0.025)
const drizzleGeom3 = createDrizzleRing(Math.PI * 0.3, 5, 0.1, 0.02)

const generateSprinkles = (count, radius, length) => {
    const group = new THREE.Group()
    const geom = new THREE.CapsuleGeometry(radius, length, 4, 8)
    const colors = ['#ffffff', '#44ccff', '#ffeb3b', '#33ff33', '#ff33cc']

    // Create an array of 5 shared materials to drastically reduce memory usage
    // instead of creating hundreds of unique MeshPhysicalMaterials.
    const materials = colors.map(colorHex => new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(colorHex),
        roughness: 0.1,
        clearcoat: 1.0,
        metalness: 0.05
    }))

    for (let i = 0; i < count; i++) {
        // Randomly pick one of the 5 shared materials
        const mesh = new THREE.Mesh(geom, materials[Math.floor(Math.random() * materials.length)])

        // Randomize position across the top half of the torus
        const angle = Math.random() * Math.PI * 2
        const tubeAngle = Math.random() * Math.PI
        const R = 1, r = 0.47 // Main radius and thinner tube radius

        // Map spherical coordinates to torus surface
        mesh.position.set((R + r * Math.cos(tubeAngle)) * Math.cos(angle), (R + r * Math.cos(tubeAngle)) * Math.sin(angle), r * Math.sin(tubeAngle))

        // Calculate the surface normal vector to align the sprinkle flat against the curved dough
        const normal = new THREE.Vector3(Math.cos(tubeAngle) * Math.cos(angle), Math.cos(tubeAngle) * Math.sin(angle), Math.sin(tubeAngle)).normalize()
        mesh.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal))

        // Randomly rotate the sprinkle on its own local Z axis
        mesh.rotateZ(Math.random() * Math.PI)

        // Push the sprinkle slightly deeper into the icing so it doesn't float above it
        mesh.position.sub(normal.multiplyScalar(radius * 0.6))

        group.add(mesh)
    }
    return group
}

// Factory to create a Donut on a specific layer
const createDonut = (targetLayer) => {
    const donutGroup = new THREE.Group()

    const doughMesh = new THREE.Mesh(doughGeometry, doughMaterial)

    const donutMaterial = new THREE.MeshPhysicalMaterial({ color: '#D2A679', roughness: 0.1, metalness: 0.02, clearcoat: 1.0, clearcoatRoughness: 0.1 })
    const icingMesh = new THREE.Mesh(icingGeometry, donutMaterial)

    const chocolateToppings = generateSprinkles(150, 0.035, 0.11)
    const lemonToppings = generateSprinkles(50, 0.05, 0.15)
    lemonToppings.visible = false

    const strawberryToppings = new THREE.Group()
    strawberryToppings.add(new THREE.Mesh(drizzleGeom1, drizzleMaterial))
    strawberryToppings.add(new THREE.Mesh(drizzleGeom2, drizzleMaterial))
    strawberryToppings.add(new THREE.Mesh(drizzleGeom3, drizzleMaterial))
    strawberryToppings.visible = false
    const toppingsGroup = new THREE.Group()
    toppingsGroup.add(chocolateToppings)
    toppingsGroup.add(strawberryToppings)
    toppingsGroup.add(lemonToppings)

    donutGroup.add(doughMesh)
    donutGroup.add(icingMesh)
    donutGroup.add(toppingsGroup)

    donutGroup.rotation.x = 0.3
    donutGroup.rotation.y = -0.3

    // Set all meshes to target layer
    donutGroup.traverse(child => { if (child.isMesh) child.layers.set(targetLayer) })

    return { donut: donutGroup, donutMaterial, chocolateToppings, strawberryToppings, lemonToppings, dough: doughMesh, icing: icingMesh, toppings: toppingsGroup }
}

// 1. Create Main Donut (Layer 0)
const mainDonutData = createDonut(0)
const donutGroup = mainDonutData.donut
const donutMaterial = mainDonutData.donutMaterial
const chocolateToppings = mainDonutData.chocolateToppings
const strawberryToppings = mainDonutData.strawberryToppings
const lemonToppings = mainDonutData.lemonToppings

const dough = mainDonutData.dough
const icing = mainDonutData.icing
const toppings = mainDonutData.toppings

// Wrappers for independent animation layers
const donutSpinWrapper = new THREE.Group()
donutSpinWrapper.add(donutGroup)

const donutTiltWrapper = new THREE.Group()
donutTiltWrapper.add(donutSpinWrapper)

const donut = new THREE.Group() // Position wrapper
donut.add(donutTiltWrapper)
donut.scale.set(0, 0, 0) // Hide initially behind loading screen
scene.add(donut)

const donutState = { isSpinning: true, hasEntered: false }

// Apply default rotation to the main donut geometry
donutGroup.rotation.x = 0
donutGroup.rotation.y = -0.4 // Facing slightly left

/**
 * Responsive calculations for precise multi-resolution alignment.
 * Calculates the exact physical width of the camera's view plane at z=0.
 */
const getWidthAtZ0 = () => {
    const vFov = 35 * Math.PI / 180
    const heightAtZ0 = 2 * Math.tan(vFov / 2) * 6 // 6 is camera.position.z
    return heightAtZ0 * (window.innerWidth / window.innerHeight)
}

// Position and scale based on screen size (Main Donut)
const setDonutPosition = () => {
    const widthAtZ0 = getWidthAtZ0()
    const scaleFactor = window.innerWidth / 1440 // Reference desktop width

    // Keep the donut locked to the right side of the screen proportionally
    donut.userData.section1X = widthAtZ0 * 0.22
    donut.userData.section1Y = -0.15 * scaleFactor

    if (window.scrollY < window.innerHeight / 2) {
        donut.position.x = donut.userData.section1X
        donut.position.y = donut.userData.section1Y
        donut.userData.baseY = donut.userData.section1Y
    }

    const scale = 0.8 * scaleFactor
    donut.userData.targetScale = scale

    // Only snap the scale instantly if the entrance animation has finished
    if (donutState.hasEntered) {
        donut.scale.set(scale, scale, scale)
    }
}
setDonutPosition()

// 2. Create UI Donuts (Layers 1, 2, 3)
const uiDonuts = []
const flavorHexes = ['#D2A679', '#FFB6C1', '#FFF59D']
for (let i = 0; i < 3; i++) {
    const uiData = createDonut(i + 1)
    uiData.donutMaterial.color.set(flavorHexes[i])
    uiData.chocolateToppings.visible = (i === 0)
    uiData.strawberryToppings.visible = (i === 1)
    uiData.lemonToppings.visible = (i === 2)

    // Reset rotation so the UI donuts face perfectly straight towards the camera
    uiData.donut.rotation.set(0, 0, 0)

    uiDonuts.push(uiData.donut)
    scene.add(uiData.donut)
}

/**
 * UI Interactions
 */
const flavors = document.querySelectorAll('.flavor')
const heroTitle = document.querySelector('.hero-content h1')
let isAnimating = false
let currentIndex = 0 // Track current flavor index

flavors.forEach((flavor, index) => {
    flavor.addEventListener('click', () => {
        if (isAnimating) return
        if (index === currentIndex) return // Don't animate if clicking same flavor

        isAnimating = true

        // 1. Update active UI class
        flavors.forEach(f => f.classList.remove('active'))
        flavor.classList.add('active')

        // 2. Get the new color from data attribute
        const newColorHex = flavor.dataset.color
        const newColor = new THREE.Color(newColorHex)

        // 3. Determine animation direction (responsive to aspect ratio)
        const widthAtZ0 = getWidthAtZ0()
        const slideOutX = index > currentIndex ? -(widthAtZ0 * 0.8) : (widthAtZ0 * 0.8);
        const teleportX = index > currentIndex ? (widthAtZ0 * 0.8) : -(widthAtZ0 * 0.8);
        const centerX = widthAtZ0 * 0.22; // Always lock to the same layout position

        // 4. Background and Accent Colors matching the flavors
        const bgColors = [
            { main: '#dcbfa6', glow: '#fdf8f4', accent: '#4A2511' }, // Brown (Deep Cocoa)
            { main: '#f4b8c2', glow: '#ffe6ea', accent: '#90203F' }, // Pink (Deep Berry)
            { main: '#f7e28f', glow: '#fffced', accent: '#8A6D00' }  // Yellow (Deep Gold)
        ]

        // 5. Flavor Names
        const flavorNames = [
            "Chocolate<br>Heaven",
            "Strawberry<br>Bliss",
            "Banana<br>Delight"
        ]

        // Animate background and accent color transition smoothly
        gsap.to(document.body, {
            '--bg-main': bgColors[index].main,
            '--bg-glow': bgColors[index].glow,
            '--accent-color': bgColors[index].accent,
            duration: 1.0,
            ease: "power2.inOut"
        })

        // Animate 3D Box Colors
        gsap.to(boxMaterial.color, {
            r: new THREE.Color(bgColors[index].main).r,
            g: new THREE.Color(bgColors[index].main).g,
            b: new THREE.Color(bgColors[index].main).b,
            duration: 1.0,
            ease: "power2.inOut"
        })
        gsap.to(ribbonMaterial.color, {
            r: new THREE.Color(bgColors[index].accent).r,
            g: new THREE.Color(bgColors[index].accent).g,
            b: new THREE.Color(bgColors[index].accent).b,
            duration: 1.0,
            ease: "power2.inOut"
        })

        // Fade out and change title text
        gsap.to(heroTitle, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                heroTitle.innerHTML = flavorNames[index]
                gsap.to(heroTitle, { opacity: 1, duration: 0.5 })
            }
        })

        // Slide Out Animation
        gsap.to(donut.position, {
            x: slideOutX,
            duration: 0.6,
            ease: "power2.in",
            onComplete: () => {
                // Change color instantly while offscreen
                donutMaterial.color.copy(newColor)

                // Reset rotation to default so the incoming donut faces perfectly forward
                donutGroup.rotation.set(0, -0.4, 0)
                donutTiltWrapper.rotation.set(0, 0, 0)
                donutSpinWrapper.rotation.x = 0
                donutSpinWrapper.rotation.y = 0

                // Toggle topping visibility based on selected flavor index
                // 0: Brown (Chocolate Toppings), 1: Pink (Strawberry Drizzles), 2: Yellow (Lemon Big Sprinkles)
                chocolateToppings.visible = index === 0
                strawberryToppings.visible = index === 1
                lemonToppings.visible = index === 2

                // Update the tiny donut inside the box!
                boxDonutData.donutMaterial.color.copy(newColor)
                boxDonutData.chocolateToppings.visible = index === 0
                boxDonutData.strawberryToppings.visible = index === 1
                boxDonutData.lemonToppings.visible = index === 2

                // Teleport offscreen to the opposite side
                donut.position.x = teleportX

                // Slide In Animation
                gsap.to(donut.position, {
                    x: centerX, // Back to responsive center
                    duration: 0.8,
                    ease: "power2.out",
                    onComplete: () => {
                        isAnimating = false
                        currentIndex = index // Update tracker
                    }
                })
            }
        })

        // Add a fun spin while it slides (spins in direction of slide)
        const spinDirection = index > currentIndex ? 1 : -1;
        gsap.to(donutSpinWrapper.rotation, {
            z: donutSpinWrapper.rotation.z + Math.PI * 2 * spinDirection,
            duration: 1.4,
            ease: "power2.inOut"
        })
    })
})

/**
 * 3D Donut Box
 */
const donutBox = new THREE.Group()

// Create a cute polka dot pattern canvas
const patternCanvas = document.createElement('canvas')
patternCanvas.width = 256
patternCanvas.height = 256
const ctx = patternCanvas.getContext('2d')

// Background (white, will be tinted by the material color)
ctx.fillStyle = '#ffffff'
ctx.fillRect(0, 0, 256, 256)

// Polka dots (slightly darker so they show up beautifully tinted)
ctx.fillStyle = '#e0e0e0'
const dotRadius = 24
const spacing = 85
for (let y = 0; y <= 256 + spacing; y += spacing) {
    for (let x = 0; x <= 256 + spacing; x += spacing) {
        // Offset alternating rows for a nice staggered polka dot pattern
        const offsetX = (Math.round(y / spacing) % 2 === 0) ? 0 : spacing / 2
        ctx.beginPath()
        ctx.arc(x + offsetX, y, dotRadius, 0, Math.PI * 2)
        ctx.fill()
    }
}

const patternTexture = new THREE.CanvasTexture(patternCanvas)
patternTexture.wrapS = THREE.RepeatWrapping
patternTexture.wrapT = THREE.RepeatWrapping
patternTexture.repeat.set(2, 2) // Repeat the pattern on the box

const boxMaterial = new THREE.MeshStandardMaterial({
    color: '#dcbfa6', // Default Brown
    map: patternTexture, // Add the cute pattern!
    roughness: 0.8, // Matte cardboard
    metalness: 0.1
})
const ribbonMaterial = new THREE.MeshStandardMaterial({
    color: '#4A2511', // Default Accent
    roughness: 0.4, // Slightly shiny ribbon
    metalness: 0.2
})
const glassMaterial = new THREE.MeshPhysicalMaterial({
    roughness: 0.1,
    transmission: 0.9,
    thickness: 0.5,
    color: 0xffffff,
    transparent: true,
    opacity: 0.6
})
const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 1.0,
    roughness: 0.2
})

// Base of the box
const boxBaseGeom = new THREE.BoxGeometry(2.5, 1, 2.5)
const boxBase = new THREE.Mesh(boxBaseGeom, boxMaterial)

// Inner dark box to simulate being hollow
const boxInnerGeom = new THREE.BoxGeometry(2.35, 1.01, 2.35)
const boxInnerMat = new THREE.MeshStandardMaterial({ color: 0x2a160a, roughness: 0.9 })
const boxInner = new THREE.Mesh(boxInnerGeom, boxInnerMat)

// The Donut Inside!
const boxDonutData = createDonut(0)
const boxDonut = boxDonutData.donut
// Flatten the donut so it lays flat in the box
boxDonut.rotation.set(Math.PI / 2, 0, 0)
boxDonut.position.y = 0.25 // Raised so it isn't swallowed by the dark false bottom now that it's thinner!
boxDonut.scale.set(0.65, 0.65, 0.65)

// Lid Frame
const lidFrame1Geom = new THREE.BoxGeometry(2.6, 0.1, 0.4)
const lidF1 = new THREE.Mesh(lidFrame1Geom, boxMaterial)
lidF1.position.set(0, 0.55, -1.1)

const lidF2 = new THREE.Mesh(lidFrame1Geom, boxMaterial)
lidF2.position.set(0, 0.55, 1.1)

const lidFrame2Geom = new THREE.BoxGeometry(0.4, 0.1, 1.8)
const lidF3 = new THREE.Mesh(lidFrame2Geom, boxMaterial)
lidF3.position.set(-1.1, 0.55, 0)

const lidF4 = new THREE.Mesh(lidFrame2Geom, boxMaterial)
lidF4.position.set(1.1, 0.55, 0)

// Glass Window
const windowGeom = new THREE.BoxGeometry(1.8, 0.05, 1.8)
const boxWindow = new THREE.Mesh(windowGeom, glassMaterial)
boxWindow.position.set(0, 0.55, 0)

// Ribbons over the window
const ribbon1Geom = new THREE.BoxGeometry(2.65, 0.12, 0.4)
const ribbon1 = new THREE.Mesh(ribbon1Geom, ribbonMaterial)
ribbon1.position.y = 0.55

const ribbon2Geom = new THREE.BoxGeometry(0.4, 0.12, 2.65)
const ribbon2 = new THREE.Mesh(ribbon2Geom, ribbonMaterial)
ribbon2.position.y = 0.55

donutBox.add(boxBase, boxInner, boxDonut, lidF1, lidF2, lidF3, lidF4, boxWindow, ribbon1, ribbon2)
donutBox.scale.set(0.65, 0.65, 0.65) // Decrease the size of the box

donutBox.children.forEach(child => child.layers.enable(0)) // Enable lights

// User data for GSAP animation
donutBox.userData = {
    baseX: 10, // Start way off-screen to the right
    baseY: -4,
    rotX: 0.4, // Tilted forward slightly to see the lid
    rotY: -0.6 // Angled
}

scene.add(donutBox)

/**
 * Lights - Studio Setup
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4) // Softer ambient
const keyLight = new THREE.DirectionalLight(0xffffff, 2.5)
keyLight.position.set(5, 5, 5)
const rimLight = new THREE.DirectionalLight(0xffffff, 3.0)
rimLight.position.set(-5, 5, -5)
const fillLight = new THREE.DirectionalLight(0xffffff, 1.0)
fillLight.position.set(-5, -2, 5)

// Enable lights on all 4 layers
const lights = [ambientLight, keyLight, rimLight, fillLight]
lights.forEach(light => {
    light.layers.enable(0)
    light.layers.enable(1)
    light.layers.enable(2)
    light.layers.enable(3)
    scene.add(light)
})

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update donut position for responsiveness
    setDonutPosition()

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)) // Reduced from 2 for better performance
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 6
scene.add(camera)

// Custom Drag Controls (Keeps donut strictly in place!)
let isDragging = false
let previousMousePosition = { x: 0, y: 0 }

canvas.addEventListener('mousedown', (event) => {
    isDragging = true
    previousMousePosition = { x: event.clientX, y: event.clientY }
})

window.addEventListener('mouseup', () => {
    isDragging = false
})

window.addEventListener('mousemove', (event) => {
    if (isDragging) {
        const deltaX = event.clientX - previousMousePosition.x
        const deltaY = event.clientY - previousMousePosition.y

        if (donutState.isSpinning) {
            // Rotate the hero donut wrappers
            donutSpinWrapper.rotation.y += deltaX * 0.01
            donutTiltWrapper.rotation.x += deltaY * 0.01

            // Clamp the vertical tilt
            donutTiltWrapper.rotation.x = Math.max(-2.1, Math.min(0.85, donutTiltWrapper.rotation.x))
        } else {
            // Drag the 3D Box in Section 4!
            donutBox.userData.rotY += deltaX * 0.01
            donutBox.userData.rotX += deltaY * 0.01

            // Optionally clamp the box tilt so it doesn't flip completely upside down
            donutBox.userData.rotX = Math.max(-1.0, Math.min(1.5, donutBox.userData.rotX))
        }

        previousMousePosition = { x: event.clientX, y: event.clientY }
    }
})

/**
 * ScrollTrigger Animations (Section 2 Exploded Anatomy)
 */

// Utility to find the nearest equivalent angle for smooth GSAP rotational transitions
// This prevents wild multi-spins if the user drags the donut heavily before scrolling
const getNearestAngle = (currentAngle, targetAngle) => {
    let diff = (targetAngle - currentAngle) % (Math.PI * 2)
    if (diff > Math.PI) diff -= Math.PI * 2
    if (diff < -Math.PI) diff += Math.PI * 2
    return currentAngle + diff
}

// Timeline 1: The Transition (Laying Flat)
const tl1 = gsap.timeline({
    scrollTrigger: {
        trigger: ".section-2",
        start: "top bottom", // Starts when section-2 enters viewport from bottom
        end: "top top",      // Ends when section-2 hits top
        scrub: true,
        invalidateOnRefresh: true,
        onEnter: () => {
            donutState.isSpinning = false

            // Instantly hide the scroll indicator
            gsap.to(".scroll-indicator", { opacity: 0, duration: 0.3 })

            // Smoothly transition from whatever random orientation the user dragged/spun it to
            // using getNearestAngle to ensure it takes the shortest path and doesn't spin wildly
            gsap.to(donutGroup.rotation, {
                x: getNearestAngle(donutGroup.rotation.x, -Math.PI / 2),
                y: getNearestAngle(donutGroup.rotation.y, 0),
                z: getNearestAngle(donutGroup.rotation.z, 0),
                duration: 1.2,
                ease: "power2.inOut",
                overwrite: "auto"
            })

            gsap.to(donutSpinWrapper.rotation, {
                x: getNearestAngle(donutSpinWrapper.rotation.x, 0),
                y: getNearestAngle(donutSpinWrapper.rotation.y, 0),
                z: getNearestAngle(donutSpinWrapper.rotation.z, 0),
                duration: 1.2,
                ease: "power2.inOut",
                overwrite: "auto"
            })

            // Reset the vertical drag tilt back to 0
            gsap.to(donutTiltWrapper.rotation, {
                x: getNearestAngle(donutTiltWrapper.rotation.x, 0),
                duration: 1.2,
                ease: "power2.inOut",
                overwrite: "auto"
            })
        },
        onLeaveBack: () => {
            donutState.isSpinning = true

            // Instantly show the scroll indicator again
            gsap.to(".scroll-indicator", { opacity: 0.7, duration: 0.3 })

            // Smoothly return to the default orientation when scrolling back up
            gsap.to(donutGroup.rotation, {
                x: getNearestAngle(donutGroup.rotation.x, 0),
                y: getNearestAngle(donutGroup.rotation.y, -0.4),
                z: getNearestAngle(donutGroup.rotation.z, 0),
                duration: 1.2,
                ease: "power2.inOut",
                overwrite: "auto"
            })
        }
    }
})

// Move to center
tl1.fromTo(donut.position, {
    x: () => donut.userData.section1X
}, {
    x: 0,
    ease: "power2.inOut"
}, 0)

// Move vertically to the bottom of the viewport so the dough is already at its lowest position
tl1.to(donut.userData, {
    baseY: -1.0,
    ease: "power2.inOut"
}, 0)

// Transition background patterns smoothly
tl1.to(".bg-stripes", { opacity: 0, ease: "none" }, 0)
tl1.to(".bg-dots", { opacity: 1, ease: "none" }, 0)



// Timeline 2: The Explosion (Pinned in Section 2)
const tl2 = gsap.timeline({
    scrollTrigger: {
        trigger: ".section-2",
        start: "top top",
        end: "+=400%", // Pins for 400% of viewport height (matches animation steps)
        scrub: true,
        pin: true
    }
})

// 1. Sprinkles move up
tl2.to(toppings.position, {
    z: 2.4, // Increased to compensate for the lower base position
    ease: "power1.inOut",
    duration: 0.5
}, 0.0)

// 2. Sprinkles text appears AFTER sprinkles finish moving
tl2.to(".anatomy-sprinkles", {
    opacity: 1,
    y: 0,
    ease: "power1.out",
    duration: 0.5
}, 0.5)

// 3. Frosting moves up AFTER sprinkles text appears
tl2.to(icing.position, {
    z: 1.2, // Increased so frosting sits higher up
    ease: "power1.inOut",
    duration: 0.5
}, 1.0)

// 4. Frosting text appears AFTER frosting finishes moving
tl2.to(".anatomy-icing", {
    opacity: 1,
    y: 0,
    ease: "power1.out",
    duration: 0.5
}, 1.5)

// 5. Dough text appears (dough no longer drops, it's already at the bottom)
tl2.to(".anatomy-dough", {
    opacity: 1,
    y: 0,
    ease: "power1.out",
    duration: 0.5
}, 2.0)

// Timeline 3: Scroll out of view for Section 3
const tl3 = gsap.timeline({
    scrollTrigger: {
        trigger: ".section-3",
        start: "top bottom", // Starts when section-3 enters viewport
        end: "top top",      // Ends when section-3 fills the screen
        scrub: true
    }
})

tl3.to(donut.userData, {
    baseY: 4, // Move donut up and off the screen synchronously with the scroll
    ease: "none"
}, 0)

// Timeline 4: Horizontal Scroll in Section 3
const tl4 = gsap.timeline({
    scrollTrigger: {
        trigger: ".section-3",
        start: "top top", // Starts when section-3 fills the viewport
        end: "+=300%",    // Pin for 300% of viewport height (since there are 3 panels)
        scrub: true,
        pin: true
    }
})

tl4.to(".horizontal-scroll-container", {
    xPercent: -66.6666, // Move left by 66.66% of the container's width (300vw), which translates it exactly 200vw
    ease: "none"
})

// Timeline 5: Section 4 - Slide the 3D Box in horizontally once
const tl5 = gsap.timeline({
    scrollTrigger: {
        trigger: ".section-4",
        start: "top 15%", // Starts when section 4 is 85% into the viewport
        once: true, // Only trigger this once, preventing the scroll lock from running again
        toggleActions: "play none none none", // Play once, never reverse
        onEnter: () => {
            // Disable scroll temporarily so the user doesn't miss the box appearance
            // Using event listeners instead of overflow: hidden to prevent layout shifting and lag!
            const blockScroll = (e) => e.preventDefault()
            window.addEventListener('wheel', blockScroll, { passive: false })
            window.addEventListener('touchmove', blockScroll, { passive: false })

            setTimeout(() => {
                window.removeEventListener('wheel', blockScroll)
                window.removeEventListener('touchmove', blockScroll)
            }, 2500) // Increased to match the slower animation
        }
    }
})

tl5.to(donutBox.userData, {
    baseX: 1.8, // Slide to the right side of the screen
    rotY: Math.PI * 2 - 0.4, // Elegant spin as it slides in
    duration: 2.5, // Slowed down from 1.5s to 2.5s
    ease: "power3.out"
}, 0)

// Timeline 6: Section 4 - Scrub vertical position so it scrolls with the page
const tl6 = gsap.timeline({
    scrollTrigger: {
        trigger: ".section-4",
        start: "top bottom", // Top of section hits bottom of screen
        end: "bottom top",   // Bottom of section hits top of screen
        scrub: true
    }
})

tl6.to(donutBox.userData, {
    baseY: 4, // Slide the box UP in perfect sync with the DOM scrolling
    ease: "none"
}, 0)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true, // Make background transparent so CSS background shows
    antialias: true // Smoother edges for realism
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)) // Reduced from 2 for better performance

/**
 * Animate
 */
let previousTime = performance.now()

const tick = () => {
    const currentTime = performance.now()
    const deltaTime = currentTime - previousTime
    previousTime = currentTime
    const elapsedTime = currentTime / 1000 // Convert to seconds

    // Animate Main Donut (Frame-rate independent)
    // Auto-spin main donut
    if (!isDragging && donutState.isSpinning) {
        donutSpinWrapper.rotation.y += 0.18 * (deltaTime / 1000)
    }
    const baseY = donut.userData.baseY !== undefined ? donut.userData.baseY : 0
    donut.position.y = baseY + Math.sin(elapsedTime * 1.5) * 0.05

    // Animate 3D Box
    donutBox.position.x = donutBox.userData.baseX
    donutBox.position.y = donutBox.userData.baseY + Math.sin(elapsedTime * 1.2) * 0.05
    donutBox.rotation.x = donutBox.userData.rotX
    donutBox.rotation.y = donutBox.userData.rotY

    // Auto-clear must be false for scissor rendering multiple viewports
    renderer.autoClear = false
    renderer.clear()

    // 1. Render Main Scene (Layer 0)
    camera.layers.set(0)
    renderer.setScissorTest(false)
    renderer.setViewport(0, 0, sizes.width, sizes.height)
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.render(scene, camera)

    // 2. Render UI Donuts (Layers 1, 2, 3)
    renderer.setScissorTest(true)

    flavors.forEach((el, index) => {
        // Since we are only doing DOM reads and NO DOM writes in this loop,
        // calling getBoundingClientRect does NOT cause layout thrashing and is very fast!
        // This instantly supports CSS hover states, transforms, and transitions!
        const rect = el.getBoundingClientRect()
        const top = rect.top
        const bottom = rect.bottom

        // Only render if visible on screen (frustum culling)
        if (rect.width > 0 && rect.height > 0 && bottom > 0 && top < sizes.height) {
            const canvasLeft = rect.left
            const canvasBottom = sizes.height - bottom

            renderer.setViewport(canvasLeft, canvasBottom, rect.width, rect.height)
            renderer.setScissor(canvasLeft, canvasBottom, rect.width, rect.height)

            // Temporarily set camera aspect to match the HTML box
            camera.aspect = rect.width / rect.height
            camera.updateProjectionMatrix()

            camera.layers.set(index + 1)
            // UI donuts remain static and fixed facing forward to match the reference design

            renderer.render(scene, camera)
        }
    })

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

/**
 * Prevent Browser Zooming
 */
window.addEventListener('wheel', (e) => {
    // Disable Ctrl+Scroll or Trackpad pinch zoom
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
    }
}, { passive: false })

window.addEventListener('touchmove', (e) => {
    // Disable multi-touch pinch zoom on mobile
    if (e.touches.length > 1) {
        e.preventDefault()
    }
}, { passive: false })

/**
 * Smooth scroll to top for footer links
 */
document.querySelectorAll('a[href="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});