import { BaseStep } from '../baseStep.js';
/**
 * Step9ReorderByProgram - Reorder by program ID
 * 
 * Aligns trials within each program horizontally by reordering
 * endpoints by program index instead of effect size.
 * 
 * @extends BaseStep
 */
class Step9ReorderByProgram extends BaseStep {
    constructor(svg, data, config) {
        super(svg, data, config, {
            name: "Reorder by Program",
            description: "Align trials within programs",
            duration: config.durations.standard,
            index: 9,
            dependencies: [8]
        });
    }
    
    execute() {
        const allEndpoints = this.data.allEndpoints;
        const nTrials = this.data.programs[0].n_trials;
        const nEndpoints = this.data.programs[0].trials[0].n_endpoints;
        const nPrograms = this.data.programs.length;
        
        console.log("Step 9 - Reordering by program ID");
        console.log("Programs:", nPrograms, "Trials:", nTrials, "Endpoints:", nEndpoints);
        
        // For each panel (endpoint type x trial), group endpoints by program
        // and assign y positions based on program index
        for (let row = 0; row < nEndpoints; row++) {
            for (let col = 0; col < nTrials; col++) {
                const panelEndpoints = allEndpoints.filter(
                    e => e.trialIndex === col && e.endpointIndex === row
                );
                
                console.log(`Panel [${row},${col}]: ${panelEndpoints.length} endpoints`);
                
                // Sort by program index to align trials within programs
                panelEndpoints.sort((a, b) => a.programIndex - b.programIndex);
                
                // Assign new y positions based on program order
                panelEndpoints.forEach((endpoint, idx) => {
                    endpoint.programOrderY = endpoint.panelY + this.data.yScale(idx);
                });
            }
        }
        
        // Create lookup map for endpoints by their indices
        const endpointMap = new Map();
        allEndpoints.forEach(e => {
            const key = `${e.programIndex}-${e.trialIndex}-${e.endpointIndex}`;
            endpointMap.set(key, e);
        });
        
        // Animate CI lines to program-ordered positions (keep colors)
        this.data.ciLines.transition()
            .duration(this.duration)
            .attr("y1", d => d.programOrderY)
            .attr("y2", d => d.programOrderY);
        
        // Animate squares to program-ordered positions
        this.svg.selectAll(".endpoint-square")
            .transition()
            .duration(this.duration)
            .attr("y", d => {
                const key = `${d.programIndex}-${d.trialIndex}-${d.endpointIndex}`;
                const endpoint = endpointMap.get(key);
                if (endpoint && endpoint.programOrderY !== undefined) {
                    return endpoint.programOrderY - this.config.endpointSize * 0.9;
                }
                console.warn("Square programOrderY not found for:", key);
                return d.absolutePosition.y - this.config.endpointSize * 0.9;
            });
        
        // Animate triangles to program-ordered positions
        this.svg.selectAll(".endpoint-triangle")
            .transition()
            .duration(this.duration)
            .attr("points", d => {
                const key = `${d.programIndex}-${d.trialIndex}-${d.endpointIndex}`;
                const endpoint = endpointMap.get(key);
                if (endpoint && endpoint.programOrderY !== undefined) {
                    const x = endpoint.caterpillarX;
                    const y = endpoint.programOrderY;
                    const s = this.config.endpointSize * 1.2;
                    return `${x},${y-s} ${x-s},${y+s} ${x+s},${y+s}`;
                }
                console.warn("Triangle programOrderY not found for:", key);
                const x = d.absolutePosition.x;
                const y = d.absolutePosition.y;
                const s = this.config.endpointSize * 1.2;
                return `${x},${y-s} ${x-s},${y+s} ${x+s},${y+s}`;
            });
        
        // Enable buttons and update header after animation
        setTimeout(() => {
            this.enableButtons();
            this.updateHeader(
                "Reordered by program ID",
                "Trials within each program are now aligned horizontally. Click 'Next Step' to compute program-level averages."
            );
        }, this.duration + 100);
    }
    
    validate() {
        if (!super.validate()) {
            return false;
        }
        
        if (!this.data.allEndpoints) {
            console.error(`${this.name}: allEndpoints not available`);
            return false;
        }
        
        if (!this.data.yScale) {
            console.error(`${this.name}: yScale not available`);
            return false;
        }
        
        return true;
    }
}
// Export for ES6 modules
export { Step9ReorderByProgram };
