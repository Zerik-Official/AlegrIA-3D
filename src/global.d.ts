/**
 * Global type augmentations for React Three Fiber.
 * @module global
 */
import '@react-three/fiber'

declare global {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface IntrinsicElements {}
  }
}
