import { BaseStep } from '../baseStep.js';
/**
 * Step 13: Regroup to Grid
 * 
 * Returns endpoints from caterpillar plots back to program grid positions:
 * 1. Fade out caterpillar plot elements (panels, axes, CI lines, TPP boxes)
 * 2. Bring back program rectangles and trial circles
 * 3. Animate endpoint shapes back to grid positions with outcome colors
 * 4. Add TPP boxes around programs that met TPP thresholds
 */

class Step13RegroupToGrid extends BaseStep {
    constructor(svg, data, config) {
        super(svg, data, config, {
            name: "Regroup to Grid",
            description: "Return endpoints to program grid with outcome colors",
            duration: config.animationDuration + 900,
            index: 13,
            dependencies: [12]
        });
    }
    
    execute() {
        const allEndpoints = this.data.allEndpoints;
        
        // Phase 1: Fade out caterpillar elements
        this.fadeOutCaterpillarElements();
        
        // Phase 2: Bring back grid structure
        this.restoreGridStructure();
        
        // Phase 3: Move endpoints back to grid positions
        const endpointMap = this.createEndpointMap(allEndpoints);
        this.animateEndpointsToGrid(endpointMap);
        
        // Phase 4: Update header (delayed)
        setTimeout(() => {
            const tppCount = this.data.programs.filter(p => p.meetsTPP).length;
            
            this.updateHeader(
                "Trial outcomes regrouped by program",
                `Endpoint results shown in original program grid. Golden = success, Gray = failure. Green boxes = programs meeting TPP (${tppCount}/${this.data.programs.length}). Click 'Next Step' to collapse successful programs.`
            );
            
            this.enableButtons();
        }, this.config.animationDuration + 900);
    }
    
    /**
     * Fade out caterpillar plot elements
     */
    fadeOutCaterpillarElements() {
        // Fade out panel borders and labels
        this.svg.selectAll(".panel-border")
            .transition()
            .duration(500)
            .style("opacity", 0)
            .remove();
        
        this.svg.selectAll(".panel-label")
            .transition()
            .duration(500)
            .style("opacity", 0)
            .remove();
        
        // Fade out axes
        this.svg.selectAll(".axis-line")
            .transition()
            .duration(500)
            .style("opacity", 0)
            .remove();
        
        this.svg.selectAll(".axis-text")
            .transition()
            .duration(500)
            .style("opacity", 0)
            .remove();
        
        // Fade out CI lines
        this.svg.selectAll(".ci-line")
            .transition()
            .duration(800)
            .style("opacity", 0)
            .remove();
        
        // Keep TPP boxes - they will move with endpoints
    }
    
    /**
     * Bring back program rectangles and trial circles
     */
    restoreGridStructure() {
        // Show program rectangles
        this.svg.selectAll(".program-rect")
            .transition()
            .duration(800)
            .style("opacity", 1);
        
        // Show trial circles
        this.svg.selectAll(".trial-circle")
            .transition()
            .duration(800)
            .style("opacity", 0.9);
    }
    
    /**
     * Create lookup map for endpoints
     */
    createEndpointMap(allEndpoints) {
        const endpointMap = new Map();
        allEndpoints.forEach(e => {
            const key = `${e.programIndex}-${e.trialIndex}-${e.endpointIndex}`;
            endpointMap.set(key, e);
        });
        return endpointMap;
    }
    
    /**
     * Animate endpoint shapes back to grid positions with outcome colors
     */
    animateEndpointsToGrid(endpointMap) {
        // Move squares back to grid positions
        this.svg.selectAll(".trial-endpoint-square")
            .transition()
            .duration(this.config.animationDuration)
            .attr("x", d => {
                const key = `${d.programIndex}-${d.trialIndex}-${d.endpointIndex}`;
                const endpoint = endpointMap.get(key);
                if (endpoint && endpoint.currentAbsolutePosition) {
                    return endpoint.currentAbsolutePosition.x - this.config.endpointSize * 0.9;
                }
                return d.absolutePosition.x - this.config.endpointSize * 0.9;
            })
            .attr("y", d => {
                const key = `${d.programIndex}-${d.trialIndex}-${d.endpointIndex}`;
                const endpoint = endpointMap.get(key);
                if (endpoint && endpoint.currentAbsolutePosition) {
                    return endpoint.currentAbsolutePosition.y - this.config.endpointSize * 0.9;
                }
                return d.absolutePosition.y - this.config.endpointSize * 0.9;
            });
        
        // Move triangles back to grid positions
        this.svg.selectAll(".trial-endpoint-triangle")
            .transition()
            .duration(this.config.animationDuration)
            .attr("points", d => {
                const key = `${d.programIndex}-${d.trialIndex}-${d.endpointIndex}`;
                const endpoint = endpointMap.get(key);
                if (endpoint && endpoint.currentAbsolutePosition) {
                    const x = endpoint.currentAbsolutePosition.x;
                    const y = endpoint.currentAbsolutePosition.y;
                    const s = this.config.endpointSize * 1.2;
                    return `${x},${y-s} ${x-s},${y+s} ${x+s},${y+s}`;
                }
                const x = d.absolutePosition.x;
                const y = d.absolutePosition.y;
                const s = this.config.endpointSize * 1.2;
                return `${x},${y-s} ${x-s},${y+s} ${x+s},${y+s}`;
            });
        
        // Move TPP boxes back to grid positions with endpoints
        this.svg.selectAll(".tpp-success-box")
            .transition()
            .duration(this.config.animationDuration)
            .attr("x", d => {
                const key = `${d.programIndex}-${d.trialIndex}-${d.endpointIndex}`;
                const endpoint = endpointMap.get(key);
                if (endpoint && endpoint.currentAbsolutePosition) {
                    return endpoint.currentAbsolutePosition.x - this.config.endpointSize * 1.5;
                }
                return d.absolutePosition.x - this.config.endpointSize * 1.5;
            })
            .attr("y", d => {
                const key = `${d.programIndex}-${d.trialIndex}-${d.endpointIndex}`;
                const endpoint = endpointMap.get(key);
                if (endpoint && endpoint.currentAbsolutePosition) {
                    return endpoint.currentAbsolutePosition.y - this.config.endpointSize * 1.5;
                }
                return d.absolutePosition.y - this.config.endpointSize * 1.5;
            });
    }
    
    validate() {
        if (!super.validate()) return false;
        
        if (!this.data.allEndpoints || this.data.allEndpoints.length === 0) {
            this.log("Cannot regroup to grid: No endpoint data available", "error");
            return false;
        }
        
        if (!this.data.programs || this.data.programs.length === 0) {
            this.log("Cannot regroup to grid: No program data available", "error");
            return false;
        }
        
        return true;
    }
}

// Export for ES6 modules
export { Step13RegroupToGrid };
