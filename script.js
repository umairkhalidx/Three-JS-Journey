import * as THREE from 'three';
import { Wireframe } from 'three/examples/jsm/Addons.js';
import gsap from 'gsap'
import GUI from 'lil-gui'

//Debug
const gui = new GUI({
    width: 300,
    title: 'Debug Menu',
    closeFolders: false,
})
gui.close()
const debugObject = {}

//Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

//Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color("black");
const camera = new THREE.PerspectiveCamera( 75, sizes.width/sizes.height, 0.1, 1000 );

//Rendered
const renderer = new THREE.WebGLRenderer();
const canvas = renderer.domElement;
renderer.setSize(sizes.width, sizes.height);
renderer.setAnimationLoop(animate);
renderer.domElement.id = "webgl";
document.body.appendChild(canvas);

//Objects
debugObject.color = '#ff0000'
const geometry = new THREE.BoxGeometry( 1, 1, 1, 2, 2, 2 );
const material = new THREE.MeshBasicMaterial( { /*color: 0x00ff00*/ color: debugObject.color, wireframe: true});
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );
camera.position.z = 3;

//Lil-GUI Debugging
const cubeTweaks = gui.addFolder('Cube Properties')
cubeTweaks.add(cube.position, 'x').min(- 3).max(3).step(0.01).name('x-axis')
cubeTweaks.add(cube.position, 'y').min(- 3).max(3).step(0.01).name('y-axis')
cubeTweaks.add(cube.position, 'z').min(- 3).max(3).step(0.01).name('z-axis')
cubeTweaks.add(cube, 'visible')
cubeTweaks.add(material, 'wireframe')
cubeTweaks.addColor(debugObject, 'color').onChange(() =>{
        material.color.set(debugObject.color)
    })

debugObject.subdivision=2
cubeTweaks.add(debugObject, 'subdivision').min(1).max(20).step(1).onFinishChange(() =>{
        cube.geometry.dispose()
        cube.geometry = new THREE.BoxGeometry(
            1, 1, 1,
            debugObject.subdivision, debugObject.subdivision, debugObject.subdivision
        )
    })
cubeTweaks.close()
// debugObject.spin = () =>
// {
//     gsap.to(cube.rotation, { duration: 1, y: cube.rotation.y + Math.PI * 2 })
// }
// cubeTweaks.add(debugObject, 'spin')

//Axes Helper
const axesHelper = new THREE.AxesHelper(1);
scene.add(axesHelper);

// Cursor
const cursor = {
    x: 0,
    y: 0
}
window.addEventListener('mousemove', (event) =>
{
    cursor.x = event.clientX/sizes.width - 0.5
    cursor.y = - (event.clientY/sizes.height - 0.5)
})


//Responsiveness
window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})


//Double Click Fullscreen
window.addEventListener('dblclick', () =>
{
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement

    if(!fullscreenElement)
    {
        if(canvas.requestFullscreen)
        {
            canvas.requestFullscreen()
        }
        else if(canvas.webkitRequestFullscreen)
        {
            canvas.webkitRequestFullscreen()
        }
    }
    else
    {
        if(document.exitFullscreen)
        {
            document.exitFullscreen()
        }
        else if(document.webkitExitFullscreen)
        {
            document.webkitExitFullscreen()
        }
    }
})


//Pixel Ratio
// renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


//Animations
function animate( time ) {

  cube.rotation.x = time / 5000;
  cube.rotation.y = time / 4000;
  // cube.rotation.z = time / 1000;

    camera.position.x = Math.sin(cursor.x * Math.PI * 2) * 2
    camera.position.z = Math.cos(cursor.x * Math.PI * 2) * 2
    camera.position.y = cursor.y * 3
    camera.lookAt(cube.position)

  renderer.render( scene, camera );
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

}




///////////////////////////////////////Learning Notes//////////////////////////////////

//Calculating Lengths and Distances from Objects
// console.log(cube.position.length()) //The distance between the object and the centre of the scene
// console.log(cube.position.distanceTo(camera.position))  //The distance between the object and the camera
// cube.position.normalize() //Will reduce the distance between the object and centre of the scene to 1
// cube.position.set(1,1,1) //To set x,y,z of the object using 1 line
// cube.scale.x = 3;
// cube.scale.y = 3;
// cube.scale.z = 3;

// cube.rotation.reorder("YXZ"); //Used to perform the rotation in the specified order
// cube.rotation.x = 5;
// cube.rotation.y = 4;
// cube.rotation.y = 3;

//camera.lookAt(cube.position) //Rotates the object so that it/s -z axis is facing towards the provided target.

//You can add multiple objects to a group and then apply a rotation, scale or anything else
//The transformation will apply to the entire group
// const group = new THREE.Group()
// scene.add(group)
// group.add(cube1)
// group.add(cube2)


///////////////////////////////////////ANIMATIONS/////////////////////////////////////

// const clock = new THREE.Clock()
// const tick = () =>
// {
//     const elapsedTime = clock.getElapsedTime()

//     // Update objects
//     cube.rotation.x = Math.cos(elapsedTime)
//     cube.rotation.y = Math.sin(elapsedTime)
//     renderer.render( scene, camera );
//     window.requestAnimationFrame(tick)
// }
// tick()

                      //Using GSAP
// gsap.to(mesh.position, { duration: 1, delay: 1, x: 2 })
// const tick = () =>
// {
//     // Render
//     renderer.render(scene, camera)

//     // Call tick again on the next frame
//     window.requestAnimationFrame(tick)
// }
// tick()