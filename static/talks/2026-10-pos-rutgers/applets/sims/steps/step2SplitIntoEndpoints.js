import { BaseStep } from '../baseStep.js';
/**
 * Step2SplitIntoEndpoints - Split trials into endpoints
 * 
 * Shows endpoint shapes (squares for primary, triangles for secondary)
 * appearing inside trial circles.
 * 
 * @extends BaseStep
 */
class Step2SplitIntoEndpoints extends BaseStep {
    /**
     * Create Step2 instance
     * 
     * @param {d3.Selection} svg - The D3 SVG selection
     * @param {Object} data - The visualization data object
     * @param {Object} config - The configuration object
     */
    constructor(svg, data, config) {
        super(svg, data, config, {
            name: "Split into Endpoints",
            description: "Trials split into primary and secondary endpoints",
            duration: 800,
            index: 2,
            dependencies: [0, 1]
        });
    }
    
    /**
     * Execute the step
     * 
     * Calculates positions for endpoint shapes within trial circles
     * and animates their appearance. Shows legend.
     */
    execute() {
        // Calculate positions for endpoint shapes within each trial circle
        const allEndpoints = [];
        
        this.data.programs.forEach((program, progIdx) => {
            program.trials.forEach((trial, trialIdx) => {
                const nEndpoints = trial.n_endpoints;
                
                trial.endpoints.forEach((endpoint, k) => {
                    let localOffset = { x: 0, y: 0 };
                    
                    // Position shapes within the circle (tighter spacing)
                    if (nEndpoints === 1) {
                        localOffset = { x: 0, y: 0 };
                    } else if (nEndpoints === 2) {
                        localOffset = k === 0 ? { x: -3.5, y: 0 } : { x: 3.5, y: 0 };
                    }
                    
                    const absolutePosition = {
                        x: trial.absolutePosition.x + localOffset.x,
                        y: trial.absolutePosition.y + localOffset.y
                    };
                    
                    // Store absolute position back to endpoint
                    endpoint.absolutePosition = absolutePosition;
                    endpoint.programIndex = progIdx;
                    endpoint.trialIndex = trialIdx;
                    endpoint.endpointIndex = k;
                    
                    allEndpoints.push({
                        ...endpoint,
                        trialId: trial.id,
                        trialPosition: trial.absolutePosition,
                        localOffset: localOffset
                    });
                });
            });
        });
        
        console.log("Total endpoints:", allEndpoints.length);
        console.log("Sample endpoint with position:", allEndpoints[0]);
        
        // Show legend
        d3.select("#legend").style("display", "flex");
        
        // Create endpoint shapes
        // Squares for primary endpoints
        const squares = this.svg.selectAll(".endpoint-square")
            .data(allEndpoints.filter(e => e.endpointType === 'primary'))
            .enter()
            .append("rect")
            .attr("class", "endpoint-square")
            .attr("width", 0)
            .attr("height", 0)
            .attr("x", d => d.absolutePosition.x)
            .attr("y", d => d.absolutePosition.y)
            .style("opacity", 0);
        
        // Triangles for secondary endpoints
        const triangles = this.svg.selectAll(".endpoint-triangle")
            .data(allEndpoints.filter(e => e.endpointType === 'secondary'))
            .enter()
            .append("polygon")
            .attr("class", "endpoint-triangle")
            .attr("points", d => {
                const x = d.absolutePosition.x;
                const y = d.absolutePosition.y;
                return `${x},${y} ${x},${y} ${x},${y}`;
            })
            .style("opacity", 0);
        
        // Animate squares appearing (smaller size)
        squares.transition()
            .duration(this.duration)
            .style("opacity", 1)
            .attr("width", this.config.endpointSize * 1.8)
            .attr("height", this.config.endpointSize * 1.8)
            .attr("x", d => d.absolutePosition.x - this.config.endpointSize * 0.9)
            .attr("y", d => d.absolutePosition.y - this.config.endpointSize * 0.9);
        
        // Animate triangles appearing (smaller size)
        triangles.transition()
            .duration(this.duration)
            .style("opacity", 1)
            .attr("points", d => {
                const x = d.absolutePosition.x;
                const y = d.absolutePosition.y;
                const s = this.config.endpointSize * 1.2;
                return `${x},${y-s} ${x-s},${y+s} ${x+s},${y+s}`;
            });
        
        // Enable buttons after animation
        this.enableButtons(900);
        
        // Update header
        this.updateHeader(
            `${allEndpoints.length} endpoint results`,
            "Trials have split into endpoints. See legend below. Click 'Next Step' to continue."
        );
    }
    
    /**
     * Validate step preconditions
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
        
        // Check that trials have absolute positions (from Step 1)
        const firstTrial = this.data.programs[0].trials[0];
        if (!firstTrial.absolutePosition) {
            console.error(`${this.name}: Trials missing absolute positions (run Step 1 first)`);
            return false;
        }
        
        return true;
    }
}
// Export for ES6 modules (if needed)
export { Step2SplitIntoEndpoints };
