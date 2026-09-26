/**
 * Where the finale's mototaxi is, shared with the scene's crowds so dancers
 * step out of its way, and whether it has reached the concert — where its
 * dashboard video moves onto the stage's wall. Written every frame by
 * `MototaxiRide`.
 * @module features/cityIntro/state/mototaxiState
 */

import * as THREE from 'three'

export const mototaxiState = {
  /** World position of the mototaxi. */
  position: new THREE.Vector3(),
  /** Whether it is driving (dancers only make way while it moves). */
  active: false,
  /** Whether it has reached the end of its route, by the concert. */
  arrived: false,
}

/** Distance from the mototaxi within which dancers step aside. */
export const MOTOTAXI_CLEAR_RADIUS = 3
