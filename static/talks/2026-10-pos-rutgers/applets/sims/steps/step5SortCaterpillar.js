import { BaseStep } from '../baseStep.js';
/**
 * Step5SortCaterpillar - Sort caterpillar plots and turn black
 * 
 * Sorts endpoints within each panel by effect estimate to create
 * the classic caterpillar shape. Changes all colors to black.
 * 
 * @extends BaseStep
 */
class Step5SortCaterpillar extends BaseStep {
    constructor(svg, data, config) {
        super(svg, data, config, {
            name: "Sort Caterpillar",
            description: "Sort by effect size, create caterpillar shape",
            duration: config.durations.standard,
            index: 5,
            dependencies: [0, 1, 2, 3, 4]
        });
    }
    
    execute() {
        const allEndpoints = this.data.allEndpoints;
        const nTrials = this.data.programs[0].n_trials;
        const nEndpoints = this.data.programs[0].trials[0].n_endpoints;
        
        console.log("Step 5 - Sorting caterpillar plots");
        console.log("Panels:", nEndpoints, "endpoints x", nTrials, "trials");
        
        // Sort within each panel by effect estimate
        for (let row = 0; row < nEndpoints; row++) {
            for (let col = 0; col < nTrials; col++) {
                const panelEndpoints = allEndpoints.filter(
                    e => e.trialIndex === col && e.endpointIndex === row
                );
                
                console.log(`Panel [${row},${col}]: ${panelEndpoints.length} endpoints`);
                
                // Sort by effect estimate
                panelEndpoints.sort((a, b) => a.effectEstimate - b.effectEstimate);
                
                // Assign new y positions
                panelEndpoints.forEach((endpoint, idx) => {
                    endpoint.sortedY = endpoint.panelY + this.data.yScale(idx);
                });
            }
        }
        
        // Create lookup map for endpoints by their indices
        const endpointMap = new Map();
        allEndpoints.forEach(e => {
            const key = `${e.programIndex}-${e.trialIndex}-${e.endpointIndex}`;
            endpointMap.set(key, e);
        });
        
        // Animate CI lines to sorted positions and change color to black
        this.data.ciLines.transition()
            .duration(this.duration)
            .attr("y1", d => d.sortedY)
            .attr("y2", d => d.sortedY)
            .style("stroke", this.config.colors.ciLineBlack); // Black
        
        // Animate squares to sorted positions and change color to black
        this.svg.selectAll(".endpoint-square")
            .transition()
            .duration(this.duration)
            .attr("y", d => {
                const key = `${d.programIndex}-${d.trialIndex}-${d.endpointIndex}`;
                const endpoint = endpointMap.get(key);
                if (endpoint && endpoint.sortedY !== undefined) {
                    return endpoint.sortedY - this.config.endpointSize * 0.9;
                }
                console.warn("Square sortedY not found for:", key);
                return d.absolutePosition.y - this.config.endpointSize * 0.9;
            })
            .style("fill", this.config.colors.endpointBlack); // Black
        
        // Animate triangles to sorted positions and change color to black
        this.svg.selectAll(".endpoint-triangle")
            .transition()
            .duration(this.duration)
            .attr("points", d => {
                const key = `${d.programIndex}-${d.trialIndex}-${d.endpointIndex}`;
                const endpoint = endpointMap.get(key);
                if (endpoint && endpoint.sortedY !== undefined) {
                    const x = endpoint.caterpillarX;
                    const y = endpoint.sortedY;
                    const s = this.config.endpointSize * 1.2;
                    return `${x},${y-s} ${x-s},${y+s} ${x+s},${y+s}`;
                }
                console.warn("Triangle sortedY not found for:", key);
                const x = d.absolutePosition.x;
                const y = d.absolutePosition.y;
                const s = this.config.endpointSize * 1.2;
                return `${x},${y-s} ${x-s},${y+s} ${x+s},${y+s}`;
            })
            .style("fill", this.config.colors.endpointBlack); // Black
        
        // Enable buttons and update header after animation
        setTimeout(() => {
            this.enableButtons();
            this.updateHeader(
                "Caterpillar plots sorted by effect estimate",
                "Each panel now shows the classic 'caterpillar' shape, ordered by effect size. Click 'Next Step' to evaluate primary endpoint success."
            );
        }, this.duration + 100);
    }
    
    validate() {
        if (!super.validate()) {
            return false;
        }
        
        if (!this.data.allEndpoints) {
            console.error(`${this.name}: allEndpoints not available (run Step 3 first)`);
            return false;
        }
        
        if (!this.data.ciLines) {
            console.error(`${this.name}: CI lines not available (run Step 4 first)`);
            return false;
        }
        
        return true;
    }
}
export { Step5SortCaterpillar };
