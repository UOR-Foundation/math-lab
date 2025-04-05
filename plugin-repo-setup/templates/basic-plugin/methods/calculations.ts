/**
 * Calculates the square of a number
 * 
 * @param value The number to square
 * @returns The square of the input value
 */
export function calculateSquare(value: number): number {
  return value * value;
}

/**
 * Calculates the cube of a number
 * 
 * @param value The number to cube
 * @returns The cube of the input value
 */
export function calculateCube(value: number): number {
  return value * value * value;
}

/**
 * Checks if a number is even
 * 
 * @param value The number to check
 * @returns True if the number is even, false otherwise
 */
export function isEven(value: number): boolean {
  return value % 2 === 0;
}

/**
 * Checks if a number is odd
 * 
 * @param value The number to check
 * @returns True if the number is odd, false otherwise
 */
export function isOdd(value: number): boolean {
  return value % 2 !== 0;
}