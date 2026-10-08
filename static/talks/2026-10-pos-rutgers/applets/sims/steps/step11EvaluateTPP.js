import { BaseStep } from '../baseStep.js';
/**
 * Step 11: Evaluate TPP Thresholds
 * 
 * Evaluates program averages against TPP (Target Product Profile) thresholds:
 * 1. Mark which program averages meet TPP for each endpoint type
 * 2. Store TPP status at program level
 * 3. Draw green boxes around program averages that meet TPP
 * 4. Display counts of programs meeting TPP
 */

class Step11EvaluateTPP extends BaseStep {
    constructor(svg, data, config) {
        super(svg, data, config, {
            name: "Evaluate TPP Thresholds",
            description: "Show which program averages meet TPP thresholds",
            duration: 900,
            index: 11,
            dependencies: [10]
        });
    }
    
    execute() {
        const programAverages = this.data.programAverages;
        const nEndpoints = this.data.programs[0].trials[0].n_endpoints;
        
        // Mark which programs meet TPP for each endpoint
        this.markTPPStatus(programAverages);
        
        // Store TPP status at program level for later use
        this.storeProgramTPPStatus(programAverages, nEndpoints);
        
        // Draw green TPP boxes
        this.drawTPPBoxes(programAverages, nEndpoints);
        
        // Update header after animation
        setTimeout(() => {
            const counts = this.calculateTPPCounts(programAverages, nEndpoints);
            
            this.updateHeader(
                "TPP evaluation results",
                `Green boxes indicate programs meeting TPP thresholds. Primary: ${counts.primary}/${this.data.programs.length}, Secondary: ${counts.secondary}/${this.data.programs.length}. Click 'Next Step' to expand to trial-level detail.`
            );
            
            this.enableButtons();
        }, 900);
    }
    
    /**
     * Mark which program averages meet TPP thresholds
     */
    markTPPStatus(programAverages) {
        programAverages.forEach(avg => {
            if (avg.endpointType === 'primary') {
                avg.meetsTPP = avg.avgEffectEstimate >= this.data.tppPrimary;
            } else if (avg.endpointType === 'secondary') {
                avg.meetsTPP = avg.avgEffectEstimate >= this.data.tppSecondary;
            }
        });
    }
    
    /**
     * Store TPP status at program level for later steps
     */
    storeProgramTPPStatus(programAverages, nEndpoints) {
        this.data.programs.forEach((program, progIdx) => {
            const primaryAvg = programAverages.find(
                avg => avg.programIndex === progIdx && avg.endpointType === 'primary'
            );
            program.primaryMeetsTPP = primaryAvg ? primaryAvg.meetsTPP : false;
            
            if (nEndpoints === 2) {
                const secondaryAvg = programAverages.find(
                    avg => avg.programIndex === progIdx && avg.endpointType === 'secondary'
                );
                program.secondaryMeetsTPP = secondaryAvg ? secondaryAvg.meetsTPP : false;
                
                // Program meets TPP only if both primary AND secondary meet TPP
                program.meetsTPP = program.primaryMeetsTPP && program.secondaryMeetsTPP;
            } else {
                // Single endpoint: program TPP equals primary TPP
                program.meetsTPP = program.primaryMeetsTPP;
            }
        });
    }
    
    /**
     * Draw green boxes around program averages that meet TPP
     */
    drawTPPBoxes(programAverages, nEndpoints) {
        // For primary endpoints
        const primarySuccess = programAverages.filter(a => a.endpointType === 'primary' && a.meetsTPP);
        
        this.svg.selectAll(".tpp-box-primary")
            .data(primarySuccess)
            .enter()
            .append("rect")
            .attr("class", "tpp-success-box")
            .attr("width", this.config.endpointSize * 4)
            .attr("height", this.config.endpointSize * 4)
            .attr("x", d => d.targetX - this.config.endpointSize * 2)
            .attr("y", d => d.targetY - this.config.endpointSize * 2)
            .style("fill", "none")
            .style("stroke", this.config.colors.tppBox) // Green
            .style("stroke-width", 2)
            .style("opacity", 0)
            .transition()
            .duration(800)
            .style("opacity", 1);
        
        // For secondary endpoints
        if (nEndpoints === 2) {
            const secondarySuccess = programAverages.filter(a => a.endpointType === 'secondary' && a.meetsTPP);
            
            this.svg.selectAll(".tpp-box-secondary")
                .data(secondarySuccess)
                .enter()
                .append("rect")
                .attr("class", "tpp-success-box")
                .attr("width", this.config.endpointSize * 4)
                .attr("height", this.config.endpointSize * 4)
                .attr("x", d => d.targetX - this.config.endpointSize * 2)
                .attr("y", d => d.targetY - this.config.endpointSize * 2)
                .style("fill", "none")
                .style("stroke", this.config.colors.tppBox) // Green
                .style("stroke-width", 2)
                .style("opacity", 0)
                .transition()
                .duration(800)
                .style("opacity", 1);
        }
    }
    
    /**
     * Calculate counts of programs meeting TPP
     */
    calculateTPPCounts(programAverages, nEndpoints) {
        const primaryCount = programAverages.filter(a => a.endpointType === 'primary' && a.meetsTPP).length;
        const secondaryCount = nEndpoints === 2 ? 
            programAverages.filter(a => a.endpointType === 'secondary' && a.meetsTPP).length : 0;
        
        return {
            primary: primaryCount,
            secondary: secondaryCount
        };
    }
    
    validate() {
        if (!super.validate()) return false;
        
        if (!this.data.programAverages || this.data.programAverages.length === 0) {
            this.log("Cannot evaluate TPP: No program averages available", "error");
            return false;
        }
        
        if (this.data.tppPrimary === undefined || this.data.tppSecondary === undefined) {
            this.log("Cannot evaluate TPP: TPP thresholds not defined", "error");
            return false;
        }
        
        return true;
    }
}

// Export for ES6 modules
export { Step11EvaluateTPP };
