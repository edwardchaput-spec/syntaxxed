// Manual fixture for comparing the Outline and Logic context-detail levels.

export interface Point {
	x: number;
	y: number;
}

/**
 * Calculates the distance between two points.
 * This comment should be stripped by both Outline and Logic.
 */
export class GeometryUtils {
	// Logic keeps this property; Outline keeps its declaration.
	private context = '2D';

	public calculateDistance(p1: Point, p2: Point): number {
		// Logic keeps this implementation; Outline removes the method body.
		const dx = p2.x - p1.x;
		const dy = p2.y - p1.y;
		console.log(`Calculating ${this.context} distance.`);
		return Math.sqrt(dx * dx + dy * dy);
	}
}
