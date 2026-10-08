import { BaseStep } from '../baseStep.js';
/**
 * Step0FloatAndGrid - Initial step that arranges programs in grid
 * 
 * Programs float in from random positions and arrange themselves into a grid layout.
 * Each program is represented by a rectangle.
 * 
 * @extends BaseStep
 * 
 * @example
 * const step0 = new Step0FloatAndGrid(svg, data, config, dataGenerator);
 * step0.run();
 */
class Step0FloatAndGrid extends BaseStep {
    /**
     * Create Step0 instance
     * 
     * @param {d3.Selection} svg - The D3 SVG selection
     * @param {Object} data - The visualization data object
     * @param {Object} config - The configuration object
     * @param {DataGenerator} dataGenerator - DataGenerator instance for position calculations
     */
    constructor(svg, data, config, dataGenerator) {
        super(svg, data, config, {
            name: "Float and Grid",
            description: "Programs arrange into grid layout",
            duration: config.durations.standard,
            index: 0,
            dependencies: []
        });
        
        this.dataGenerator = dataGenerator;
    }
    
    /**
     * Execute the step
     * 
     * Calculates grid positions, creates rectangle elements, and animates them
     * from random starting positions to their grid positions.
     */
    execute() {
        // Calculate grid positions using DataGenerator
        const positions = this.dataGenerator.calculateGridPositions(this.data.programs.length);
        
        // Add grid positions to data
        this.data.programs.forEach((program, i) => {
            program.gridPosition = positions[i];
        });
        
        // Create rectangles starting from random positions
        const rects = this.svg.selectAll(".program-rect")
            .data(this.data.programs)
            .enter()
            .append("rect")
            .attr("class", "program-rect")
            .attr("width", this.config.rectSize)
            .attr("height", this.config.rectSize)
            .attr("x", d => this.config.rng() * this.config.width - this.config.rectSize / 2)
            .attr("y", -this.config.rectSize)
            .style("opacity", 0);
        
        // Animate entrance to grid positions
        rects.transition()
            .duration(this.duration)
            .delay((d, i) => i * 20)
            .style("opacity", 1)
            .attr("x", d => d.gridPosition.x - this.config.rectSize / 2)
            .attr("y", d => d.gridPosition.y - this.config.rectSize / 2);
        
        // Calculate total animation time
        const totalAnimationTime = this.duration + (this.data.programs.length * 20) + 100;
        
        // Enable buttons after animations complete
        this.enableButtons(totalAnimationTime);
        
        // Update header
        this.updateHeader(
            `${this.data.programs.length} equally plausible outcomes for this program`,
            "Each rectangle represents a clinical development program in Phase-3. Click 'Next Step' to see individual trials."
        );
    }
    
    /**
     * Validate step preconditions
     * 
     * Ensures programs data exists before execution
     * 
     * @returns {boolean} True if validation passes
     */
    validate() {
        if (!super.validate()) {
            return false;
        }
        
        if (!this.data.programs || this.data.programs.length === 0) {
            console.error(`${this.name}: No programs in data`);
            return false;
        }
        
        return true;
    }
}

// Export for ES6 modules
export { Step0FloatAndGrid };
