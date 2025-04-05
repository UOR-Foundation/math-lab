import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Three.js Utility functions for 3D visualizations
 */
export class ThreeJSManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | null = null;
  private controls: OrbitControls | null = null;
  private animationFrameId: number | null = null;
  private container: HTMLElement | null = null;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.z = 5;
  }

  /**
   * Initialize the Three.js environment
   */
  initialize(container: HTMLElement): void {
    this.container = container;
    
    // Calculate aspect ratio
    const width = container.clientWidth;
    const height = container.clientHeight;
    const aspectRatio = width / height;
    
    // Update camera
    this.camera.aspect = aspectRatio;
    this.camera.updateProjectionMatrix();
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    
    // Clear container and add renderer
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(this.renderer.domElement);
    
    // Add controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    
    // Add basic lighting
    this.addDefaultLighting();
    
    // Start animation loop
    this.startAnimationLoop();
    
    // Add resize listener
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    window.removeEventListener('resize', this.handleResize);
    
    this.controls?.dispose();
    
    // Dispose of all objects in the scene
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        }
      }
    });
    
    // Clear the scene
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
    
    this.renderer?.dispose();
    this.renderer = null;
  }

  /**
   * Get the scene object
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get the camera object
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Get the renderer object
   */
  getRenderer(): THREE.WebGLRenderer | null {
    return this.renderer;
  }

  /**
   * Add default lighting to the scene
   */
  private addDefaultLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
  }

  /**
   * Start the animation loop
   */
  private startAnimationLoop = (): void => {
    if (!this.renderer) return;
    
    const animate = (): void => {
      this.animationFrameId = requestAnimationFrame(animate);
      
      this.controls?.update();
      this.renderer?.render(this.scene, this.camera);
    };
    
    animate();
  };

  /**
   * Handle window resize
   */
  private handleResize = (): void => {
    if (!this.container || !this.renderer) return;
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  };

  /**
   * Clear all objects from the scene
   */
  clearScene(): void {
    const objectsToRemove = this.scene.children.filter(
      child => !(child instanceof THREE.Light)
    );
    
    objectsToRemove.forEach(object => {
      this.scene.remove(object);
    });
  }

  /**
   * Create a simple cube for testing
   */
  createTestCube(size = 1, color = 0x44aa88): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshPhongMaterial({ color });
    const cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);
    return cube;
  }
}

// Create a singleton instance
const threeJSManager = new ThreeJSManager();
export default threeJSManager;