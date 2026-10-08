import { BaseStep } from '../baseStep.js';
/**
 * Step4AnimateEndpoints - Animate endpoints to caterpillar positions
 * 
 * Moves endpoint shapes and creates CI lines, animating them from
 * trial positions to caterpillar plot positions.
 * 
 * @extends BaseStep
 */
class Step4AnimateEndpoints extends BaseStep {
    constructor(svg, data, config) {
        super(svg, data, config, {
            name: "Animate to Caterpillar",
            description: "Animate endpoints to caterpillar plot positions",
            duration: config.durations.standard,
            index: 4,
            dependencies: [0, 1, 2, 3]
        });
    }
    
    execute() {
        const allEndpoints = this.data.allEndpoints;
        const xScale = this.data.xScale;
        
        console.log("Step 4 - animating endpoints");
        console.log("Number of endpoints:", allEndpoints.length);
        console.log("Sample endpoint:", allEndpoints[0]);
        console.log("Current position:", allEndpoints[0].currentAbsolutePosition);
        console.log("Target position:", allEndpoints[0].caterpillarX, allEndpoints[0].caterpillarY);
        
        // Create lookup map for endpoints by their indices
        const endpointMap = new Map();
        allEndpoints.forEach(e => {
            const key = `${e.programIndex}-${e.trialIndex}-${e.endpointIndex}`;
            endpointMap.set(key, e);
        });
        
        console.log("Endpoint map size:", endpointMap.size);
        
        // Create confidence intervals
        const ciLines = this.svg.selectAll(".ci-line")
            .data(allEndpoints)
            .enter()
            .append("line")
            .attr("class", "ci-line")
            .attr("x1", d => d.currentAbsolutePosition.x)
            .attr("x2", d => d.currentAbsolutePosition.x)
            .attr("y1", d => d.currentAbsolutePosition.y)
            .attr("y2", d => d.currentAbsolutePosition.y)
            .style("opacity", 0);
        
        console.log("CI lines created:", ciLines.size());
        
        // Store CI lines for sorting step
        this.data.ciLines = ciLines;
        
        // Animate CI lines to caterpillar positions
        ciLines.transition()
            .duration(this.duration)
            .style("opacity", 0.7)
            .attr("x1", d => d.panelX + xScale(d.ciLower))
            .attr("x2", d => d.panelX + xScale(d.ciUpper))
            .attr("y1", d => d.caterpillarY)
            .attr("y2", d => d.caterpillarY);
        
        // Move squares
        const squares = this.svg.selectAll(".endpoint-square");
        console.log("Squares found:", squares.size());
        
        squares.transition()
            .duration(this.duration)
            .attr("x", d => {
                const key = `${d.programIndex}-${d.trialIndex}-${d.endpointIndex}`;
                const endpoint = endpointMap.get(key);
                if (endpoint) {
                    return endpoint.caterpillarX - this.config.endpointSize * 0.9;
                }
                return d.absolutePosition.x - this.config.endpointSize * 0.9;
            })
            .attr("y", d => {
                const key = `${d.programIndex}-${d.trialIndex}-${d.endpointIndex}`;
                const endpoint = endpointMap.get(key);
                if (endpoint) {
                    return endpoint.caterpillarY - this.config.endpointSize * 0.9;
                }
                return d.absolutePosition.y - this.config.endpointSize * 0.9;
            });
        
        // Move triangles
        const triangles = this.svg.selectAll(".endpoint-triangle");
        console.log("Triangles found:", triangles.size());
        
        triangles.transition()
            .duration(this.duration)
            .attr("points", d => {
                const key = `${d.programIndex}-${d.trialIndex}-${d.endpointIndex}`;
                const endpoint = endpointMap.get(key);
                if (endpoint) {
                    const x = endpoint.caterpillarX;
                    const y = endpoint.caterpillarY;
                    const s = this.config.endpointSize * 1.2;
                    return `${x},${y-s} ${x-s},${y+s} ${x+s},${y+s}`;
                }
                const x = d.absolutePosition.x;
                const y = d.absolutePosition.y;
                const s = this.config.endpointSize * 1.2;
                return `${x},${y-s} ${x-s},${y+s} ${x+s},${y+s}`;
            });
        
        // Enable buttons after animation
        this.enableButtons(this.duration + 100);
        
        // Update header
        const nPrograms = this.data.programs.length;
        const nTrials = this.data.programs[0].n_trials;
        const nEndpoints = this.data.programs[0].trials[0].n_endpoints;
        
        this.updateHeader(
            `Caterpillar plots: ${nPrograms} simulations × ${nTrials} trials × ${nEndpoints} endpoints`,
            "Each panel shows effect estimates with 95% CIs. Click 'Next Step' to sort by effect size."
        );
    }
    
    validate() {
        if (!super.validate()) {
            return false;
        }
        
        if (!this.data.allEndpoints) {
            console.error(`${this.name}: allEndpoints not available (run Step 3 first)`);
            return false;
        }
        
        return true;
    }
}
export { Step4AnimateEndpoints };
