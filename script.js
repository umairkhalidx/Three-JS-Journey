import * as THREE from 'three'
import gsap from 'gsap'

// Reset scroll position on reload so it always starts at the top
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual'
}
window.scrollTo(0, 0)

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
    }, 1500) // 1.5 seconds delay before fading out
})

// Scene
const scene = new THREE.Scene()

/**
 * Objects - Realistic Procedural Donut Factory
 */
// Reusable geometries/materials to save memory
const doughGeometry = new THREE.TorusGeometry(1, 0.55, 32, 64)
const doughMaterial = new THREE.MeshStandardMaterial({ color: '#e0a96d', roughness: 0.7, metalness: 0.05 })

const icingGeometry = new THREE.TorusGeometry(1, 0.57, 32, 64)
const posAttribute = icingGeometry.attributes.position
const vertex = new THREE.Vector3()
for (let i = 0; i < posAttribute.count; i++) {
    vertex.fromBufferAttribute(posAttribute, i)
    if (vertex.z < 0) {
        const angle = Math.atan2(vertex.y, vertex.x)
        vertex.z = Math.max(vertex.z, -0.05 + Math.sin(angle * 12) * 0.08)
    }
    posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z)
}
icingGeometry.computeVertexNormals()

const drizzleMaterial = new THREE.MeshPhysicalMaterial({ color: '#3d1c04', roughness: 0.1, metalness: 0.1, clearcoat: 1.0 })
const createDrizzleRing = (baseTubeAngle, waveFreq, waveAmp, thickness) => {
    const points = []
    for(let i = 0; i <= 60; i++) {
        const angle = (i / 60) * Math.PI * 2
        const tubeAngle = baseTubeAngle + Math.sin(angle * waveFreq) * waveAmp
        points.push(new THREE.Vector3((1 + 0.58 * Math.cos(tubeAngle)) * Math.cos(angle), (1 + 0.58 * Math.cos(tubeAngle)) * Math.sin(angle), 0.58 * Math.sin(tubeAngle)))
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), 150, thickness, 8, true)
}
const drizzleGeom1 = createDrizzleRing(Math.PI * 0.7, 4, 0.1, 0.02)
const drizzleGeom2 = createDrizzleRing(Math.PI * 0.5, 3, 0.15, 0.025)
const drizzleGeom3 = createDrizzleRing(Math.PI * 0.3, 5, 0.1, 0.02)

const generateSprinkles = (count, radius, length) => {
    const group = new THREE.Group()
    const geom = new THREE.CapsuleGeometry(radius, length, 4, 8)
    const mat = new THREE.MeshPhysicalMaterial({ roughness: 0.1, clearcoat: 1.0, metalness: 0.05 })
    const colors = ['#ffffff', '#44ccff', '#ffeb3b', '#33ff33', '#ff33cc']
    for(let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(geom, mat.clone())
        mesh.material.color = new THREE.Color(colors[Math.floor(Math.random() * colors.length)])
        const angle = Math.random() * Math.PI * 2
        const tubeAngle = Math.random() * Math.PI
        const R = 1, r = 0.57
        mesh.position.set((R + r * Math.cos(tubeAngle)) * Math.cos(angle), (R + r * Math.cos(tubeAngle)) * Math.sin(angle), r * Math.sin(tubeAngle))
        const normal = new THREE.Vector3(Math.cos(tubeAngle) * Math.cos(angle), Math.cos(tubeAngle) * Math.sin(angle), Math.sin(tubeAngle)).normalize()
        mesh.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal))
        mesh.rotateZ(Math.random() * Math.PI)
        mesh.position.sub(normal.multiplyScalar(radius * 0.6))
        group.add(mesh)
    }
    return group
}

// Factory to create a Donut on a specific layer
const createDonut = (targetLayer) => {
    const donutGroup = new THREE.Group()

    const dough = new THREE.Mesh(doughGeometry, doughMaterial)
    donutGroup.add(dough)

    const donutMaterial = new THREE.MeshPhysicalMaterial({ color: '#D2A679', roughness: 0.1, metalness: 0.02, clearcoat: 1.0, clearcoatRoughness: 0.1 })
    const icing = new THREE.Mesh(icingGeometry, donutMaterial)
    donutGroup.add(icing)

    const chocolateToppings = generateSprinkles(150, 0.025, 0.08)
    donutGroup.add(chocolateToppings)

    const lemonToppings = generateSprinkles(50, 0.05, 0.15)
    lemonToppings.visible = false
    donutGroup.add(lemonToppings)

    const strawberryToppings = new THREE.Group()
    strawberryToppings.add(new THREE.Mesh(drizzleGeom1, drizzleMaterial))
    strawberryToppings.add(new THREE.Mesh(drizzleGeom2, drizzleMaterial))
    strawberryToppings.add(new THREE.Mesh(drizzleGeom3, drizzleMaterial))
    strawberryToppings.visible = false
    donutGroup.add(strawberryToppings)

    // Set all meshes to target layer
    donutGroup.traverse(child => { if(child.isMesh) child.layers.set(targetLayer) })
    
    scene.add(donutGroup)

    return { donut: donutGroup, donutMaterial, chocolateToppings, strawberryToppings, lemonToppings }
}

// 1. Create Main Donut (Layer 0)
const mainData = createDonut(0)
const donut = mainData.donut
const donutMaterial = mainData.donutMaterial
const chocolateToppings = mainData.chocolateToppings
const strawberryToppings = mainData.strawberryToppings
const lemonToppings = mainData.lemonToppings

// Apply default tilt rotation to the main donut only
donut.rotation.x = Math.PI * 0.2

// Responsive calculations for precise multi-resolution alignment
const getWidthAtZ0 = () => {
    const vFov = 35 * Math.PI / 180
    const heightAtZ0 = 2 * Math.tan(vFov / 2) * 6
    return heightAtZ0 * (window.innerWidth / window.innerHeight)
}

// Position and scale based on screen size (Main Donut)
const setDonutPosition = () => {
    const widthAtZ0 = getWidthAtZ0()
    const scaleFactor = window.innerWidth / 1440 // Reference desktop width
    
    donut.position.x = widthAtZ0 * 0.22
    donut.position.y = -0.15 * scaleFactor
    donut.userData.baseY = -0.15 * scaleFactor
    
    const scale = 0.8 * scaleFactor
    donut.scale.set(scale, scale, scale)
}
setDonutPosition()

// 2. Create UI Donuts (Layers 1, 2, 3)
const uiDonuts = []
const flavorHexes = ['#D2A679', '#FFB6C1', '#FFF59D']
for(let i = 0; i < 3; i++) {
    const uiData = createDonut(i + 1)
    uiData.donutMaterial.color.set(flavorHexes[i])
    uiData.chocolateToppings.visible = (i === 0)
    uiData.strawberryToppings.visible = (i === 1)
    uiData.lemonToppings.visible = (i === 2)
    uiDonuts.push(uiData.donut)
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
                
                // Toggle topping visibility based on selected flavor index
                // 0: Brown (Chocolate Toppings), 1: Pink (Strawberry Drizzles), 2: Yellow (Lemon Big Sprinkles)
                chocolateToppings.visible = index === 0
                strawberryToppings.visible = index === 1
                lemonToppings.visible = index === 2

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
        gsap.to(donut.rotation, {
            z: donut.rotation.z + Math.PI * 2 * spinDirection,
            duration: 1.4,
            ease: "power2.inOut"
        })
    })
})

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
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

        // Rotate the donut directly (spinning it in place)
        donut.rotation.y += deltaX * 0.01
        donut.rotation.x += deltaY * 0.01

        previousMousePosition = { x: event.clientX, y: event.clientY }
    }
})

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true, // Make background transparent so CSS background shows
    antialias: true // Smoother edges for realism
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

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
    if (!isDragging && !isAnimating) {
        donut.rotation.y += 0.18 * (deltaTime / 1000)
    }
    const baseY = donut.userData.baseY !== undefined ? donut.userData.baseY : 0
    donut.position.y = baseY + Math.sin(elapsedTime * 1.5) * 0.05 

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
        const rect = el.getBoundingClientRect()
        // Account for scroll offset since canvas is position: absolute
        const canvasLeft = rect.left + window.scrollX
        const canvasBottom = sizes.height - (rect.bottom + window.scrollY)

        // Only render if visible on screen
        if(rect.width > 0 && rect.height > 0) {
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