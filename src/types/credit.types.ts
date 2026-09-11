/** What the API reports back after the free-matcha grant is attempted. */
export interface SignupBonusResult {
  /** False when this user had already been given their free matchas. */
  granted: boolean
  credits: number
}
