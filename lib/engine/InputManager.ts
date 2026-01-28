export class InputManager {
  private canvas: HTMLCanvasElement
  private keys: {
    forward: boolean
    backward: boolean
    left: boolean
    right: boolean
    jump: boolean
    shift: boolean
  }
  private mouseDelta: { x: number; y: number }
  private mouseButtons: { left: boolean; right: boolean }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      shift: false,
    }

    this.mouseDelta = { x: 0, y: 0 }
    this.mouseButtons = { left: false, right: false }

    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)

    // Mouse events
    document.addEventListener('mousemove', this.handleMouseMove)
    document.addEventListener('mousedown', this.handleMouseDown)
    document.addEventListener('mouseup', this.handleMouseUp)

    // Pointer lock events
    document.addEventListener('pointerlockchange', this.handlePointerLockChange)
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    switch (event.code) {
      case 'KeyW':
        this.keys.forward = true
        break
      case 'KeyS':
        this.keys.backward = true
        break
      case 'KeyA':
        this.keys.left = true
        break
      case 'KeyD':
        this.keys.right = true
        break
      case 'Space':
        this.keys.jump = true
        event.preventDefault()
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.shift = true
        break
    }
  }

  private handleKeyUp = (event: KeyboardEvent) => {
    switch (event.code) {
      case 'KeyW':
        this.keys.forward = false
        break
      case 'KeyS':
        this.keys.backward = false
        break
      case 'KeyA':
        this.keys.left = false
        break
      case 'KeyD':
        this.keys.right = false
        break
      case 'Space':
        this.keys.jump = false
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.shift = false
        break
    }
  }

  private handleMouseMove = (event: MouseEvent) => {
    if (document.pointerLockElement === this.canvas) {
      this.mouseDelta.x = event.movementX
      this.mouseDelta.y = event.movementY
    }
  }

  private handleMouseDown = (event: MouseEvent) => {
    if (document.pointerLockElement === this.canvas) {
      if (event.button === 0) {
        this.mouseButtons.left = true
      } else if (event.button === 2) {
        this.mouseButtons.right = true
      }
      event.preventDefault()
    }
  }

  private handleMouseUp = (event: MouseEvent) => {
    if (event.button === 0) {
      this.mouseButtons.left = false
    } else if (event.button === 2) {
      this.mouseButtons.right = false
    }
  }

  private handlePointerLockChange = () => {
    if (document.pointerLockElement !== this.canvas) {
      console.log('Pointer lock released')
    }
  }

  // Get current key states
  getKeys() {
    return { ...this.keys }
  }

  // Get and reset mouse delta
  getMouseDelta() {
    const delta = { ...this.mouseDelta }
    this.mouseDelta = { x: 0, y: 0 }
    return delta
  }

  // Get mouse button states
  getMouseButtons() {
    return { ...this.mouseButtons }
  }

  // Reset mouse button states (call after handling clicks)
  resetMouseButtons() {
    this.mouseButtons.left = false
    this.mouseButtons.right = false
  }

  dispose() {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mousedown', this.handleMouseDown)
    document.removeEventListener('mouseup', this.handleMouseUp)
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange)
  }
}
