import { BaseStep } from '../baseStep.js';
/**
 * Step 14: Collapse Successful Programs (TPP)
 * 
 * Collapses programs that meet TPP thresholds to solid green rectangles:
 * 1. Fade out TPP success boxes
 * 2. Change successful program rectangles to green
 * 3. Hide and remove trial circles and endpoints for successful programs
 */

class Step14CollapseSuccessful extends BaseStep {
    constructor(svg, data, config) {
        super(svg, data, config, {
            name: "Collapse Successful Programs (TPP)",
            description: "Hide detail for programs meeting TPP",
            duration: 900,
            index: 14,
            dependencies: [13]
        });
    }
    
    execute() {
        const allEndpoints = this.data.allEndpoints;
        
        // Identify successful programs
        const successfulPrograms = this.data.programs.filter(p => p.meetsTPP);
        
        // Phase 1: Fade out TPP boxes
        this.fadeOutTPPBoxes();
        
        // Phase 2: Color successful programs green
        this.colorSuccessfulPrograms();
        
        // Phase 3: Hide detail for successful programs
        this.hideSuccessfulProgramDetail(successfulPrograms, allEndpoints);
        
        // Phase 4: Update header
        setTimeout(() => {
            const successfulCount = successfulPrograms.length;
            const unsuccessfulCount = this.data.programs.length - successfulCount;
            
            this.updateHeader(
                `${successfulCount} programs meeting TPP (green), ${unsuccessfulCount} not meeting TPP (gray)`,
                `Successful programs are shown as solid green rectangles. Click 'Next Step' to identify statistically significant programs.`
            );
            
            this.enableButtons();
        }, 900);
    }
    
    /**
     * Fade out TPP success boxes
     */
    fadeOutTPPBoxes() {
        this.svg.selectAll(".tpp-success-box")
            .transition()
            .duration(600)
            .style("opacity", 0)
            .remove();
    }
    
    /**
     * Color successful programs green
     */
    colorSuccessfulPrograms() {
        this.svg.selectAll(".program-rect")
            .transition()
            .duration(this.config.durations.fast)
            .style("fill", d => {
                return d.meetsTPP ? this.config.colors.tppSuccess : this.config.colors.programDefault;
            });
    }
    
    /**
     * Hide trial circles and endpoints for successful programs
     */
    hideSuccessfulProgramDetail(successfulPrograms, allEndpoints) {
        successfulPrograms.forEach(program => {
            // Hide trial circles
            this.svg.selectAll(".trial-circle")
                .filter(d => d.programId === program.id)
                .transition()
                .duration(800)
                .style("opacity", 0)
                .remove();
            
            // Hide primary endpoint squares
            this.svg.selectAll(".trial-endpoint-square")
                .filter(d => {
                    const endpoint = allEndpoints.find(e => e.id === d.id);
                    return endpoint && endpoint.programId === program.id;
                })
                .transition()
                .duration(800)
                .style("opacity", 0)
                .remove();
            
            // Hide secondary endpoint triangles
            this.svg.selectAll(".trial-endpoint-triangle")
                .filter(d => {
                    const endpoint = allEndpoints.find(e => e.id === d.id);
                    return endpoint && endpoint.programId === program.id;
                })
                .transition()
                .duration(800)
                .style("opacity", 0)
                .remove();
        });
    }
    
    validate() {
        if (!super.validate()) return false;
        
        if (!this.data.programs || this.data.programs.length === 0) {
            this.log("Cannot collapse successful programs: No program data available", "error");
            return false;
        }
        
        if (!this.data.allEndpoints || this.data.allEndpoints.length === 0) {
            this.log("Cannot collapse successful programs: No endpoint data available", "error");
            return false;
        }
        
        return true;
    }
}

// Export for ES6 modules
export { Step14CollapseSuccessful };
