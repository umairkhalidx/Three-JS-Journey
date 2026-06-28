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
 * Objects - Simple Donut
 */
// Geometry: Optimized segments for performance (32 radial, 64 tubular is smooth but fast)
const donutGeometry = new THREE.TorusGeometry(1, 0.4, 32, 64)

// Material: MeshPhysicalMaterial for a realistic glossy glazed look without heavy textures
const donutMaterial = new THREE.MeshPhysicalMaterial({
    color: '#ffb3c6', // Pink glaze
    roughness: 0.15,
    metalness: 0.05,
    clearcoat: 1.0, // Gives it a shiny coated look
    clearcoatRoughness: 0.1
})

const donut = new THREE.Mesh(donutGeometry, donutMaterial)

// Position and scale based on screen size
const setDonutPosition = () => {
    if (window.innerWidth < 768) {
        donut.position.x = 0
        donut.position.y = -0.5 // Moved a little bit more up on mobile
        donut.userData.baseY = -0.5 // Store base Y for animation
        donut.scale.set(0.6, 0.6, 0.6) // Decreased size
    } else {
        donut.position.x = 2
        donut.position.y = 0.0 // Moved a little bit more up on desktop
        donut.userData.baseY = 0.0 // Store base Y for animation
        donut.scale.set(0.8, 0.8, 0.8) // Decreased size
    }
}
setDonutPosition()

// Initial rotation
donut.rotation.x = Math.PI * 0.2
scene.add(donut)

/**
 * UI Interactions
 */
const flavors = document.querySelectorAll('.flavor')
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

        // 3. Determine animation direction
        const slideOutX = index > currentIndex ? -6 : 10;
        const teleportX = index > currentIndex ? 8 : -4;
        const centerX = window.innerWidth < 768 ? 0 : 2; // Target center position based on screen size

        // Slide Out Animation
        gsap.to(donut.position, {
            x: slideOutX,
            duration: 0.6,
            ease: "power2.in",
            onComplete: () => {
                // Change color instantly while offscreen
                donutMaterial.color.copy(newColor)

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
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
directionalLight.position.set(2, 2, 2)
scene.add(directionalLight)

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
    const elapsedTime = currentTime / 1000 // Convert to seconds

    // Animate Donut
    if (!isDragging && !isAnimating) {
        // Slow auto-spin when not interacting
        donut.rotation.y += 0.003
    }

    // Add a very subtle floating effect around its responsive base position
    const baseY = donut.userData.baseY !== undefined ? donut.userData.baseY : 0
    donut.position.y = baseY + Math.sin(elapsedTime * 1.5) * 0.05 

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()