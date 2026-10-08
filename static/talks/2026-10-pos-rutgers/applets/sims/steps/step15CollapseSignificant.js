import { BaseStep } from '../baseStep.js';
/**
 * Step 15: Collapse Significant Programs
 * 
 * Uses pre-computed outcome categories to classify programs:
 * 1. Change rectangle colors based on outcome category (TPP/Significant/Failure)
 * 2. Hide trial circles and endpoints for significant programs
 * 3. Hide trial circles and endpoints for failure programs
 * 4. Display outcome distribution
 */

class Step15CollapseSignificant extends BaseStep {
    constructor(svg, data, config) {
        super(svg, data, config, {
            name: "Collapse Significant Programs",
            description: "Hide detail for significant and failed programs",
            duration: config.durations.buttonDelay,
            index: 15,
            dependencies: [14]
        });
    }
    
    execute() {
        const allEndpoints = this.data.allEndpoints;
        
        this.log("Using pre-computed outcome categories from JSON");
        this.logOutcomeDistribution();
        
        // Get programs by outcome category
        const significantPrograms = this.data.programs.filter(p => p.outcomeCategory === 'significant');
        const failurePrograms = this.data.programs.filter(p => p.outcomeCategory === 'efficacy_failure');
        
        // Phase 1: Color programs by outcome category
        this.colorProgramsByOutcome();
        
        // Phase 2: Hide detail for significant programs
        this.hideProgramDetail(significantPrograms, allEndpoints, 800);
        
        // Phase 3: Hide detail for failure programs
        this.hideProgramDetail(failurePrograms, allEndpoints, this.config.durations.fast);
        
        // Phase 4: Update header
        setTimeout(() => {
            const counts = this.calculateOutcomeCounts();
            
            this.updateHeader(
                `${counts.tpp} TPP success (green), ${counts.significant} statistically significant (gold), ${counts.failure} efficacy failures (red)`,
                `Green = TPP achieved. Gold = All endpoints statistically significant but TPP not met. Red = Efficacy failures (at least one endpoint not significant). Click 'Next Step' for safety evaluation.`
            );
            
            this.enableButtons();
        }, this.config.durations.buttonDelay);
    }
    
    /**
     * Log outcome distribution for debugging
     */
    logOutcomeDistribution() {
        const distribution = {
            tppSuccess: this.data.programs.filter(p => p.outcomeCategory === 'tpp_success').length,
            significant: this.data.programs.filter(p => p.outcomeCategory === 'significant').length,
            failure: this.data.programs.filter(p => p.outcomeCategory === 'efficacy_failure').length
        };
        
        console.log("Outcome distribution:");
        console.log("  TPP Success:", distribution.tppSuccess);
        console.log("  Significant:", distribution.significant);
        console.log("  Efficacy Failure:", distribution.failure);
    }
    
    /**
     * Color program rectangles based on outcome category
     */
    colorProgramsByOutcome() {
        this.svg.selectAll(".program-rect")
            .transition()
            .duration(this.config.durations.fast)
            .style("fill", d => {
                if (d.outcomeCategory === 'tpp_success') return this.config.colors.tppSuccess; // Green
                if (d.outcomeCategory === 'significant') return this.config.colors.significant; // Gold
                return this.config.colors.efficacyFailure; // Red
            });
    }
    
    /**
     * Hide trial circles and endpoints for specified programs
     */
    hideProgramDetail(programs, allEndpoints, duration) {
        programs.forEach(program => {
            // Hide trial circles
            this.svg.selectAll(".trial-circle")
                .filter(d => d.programId === program.id)
                .transition()
                .duration(duration)
                .style("opacity", 0)
                .remove();
            
            // Hide primary endpoint squares
            this.svg.selectAll(".trial-endpoint-square")
                .filter(d => {
                    const endpoint = allEndpoints.find(e => e.id === d.id);
                    return endpoint && endpoint.programId === program.id;
                })
                .transition()
                .duration(duration)
                .style("opacity", 0)
                .remove();
            
            // Hide secondary endpoint triangles
            this.svg.selectAll(".trial-endpoint-triangle")
                .filter(d => {
                    const endpoint = allEndpoints.find(e => e.id === d.id);
                    return endpoint && endpoint.programId === program.id;
                })
                .transition()
                .duration(duration)
                .style("opacity", 0)
                .remove();
        });
    }
    
    /**
     * Calculate counts for each outcome category
     */
    calculateOutcomeCounts() {
        return {
            tpp: this.data.programs.filter(p => p.outcomeCategory === 'tpp_success').length,
            significant: this.data.programs.filter(p => p.outcomeCategory === 'significant').length,
            failure: this.data.programs.filter(p => p.outcomeCategory === 'efficacy_failure').length
        };
    }
    
    validate() {
        if (!super.validate()) return false;
        
        if (!this.data.programs || this.data.programs.length === 0) {
            this.log("Cannot collapse significant programs: No program data available", "error");
            return false;
        }
        
        if (!this.data.allEndpoints || this.data.allEndpoints.length === 0) {
            this.log("Cannot collapse significant programs: No endpoint data available", "error");
            return false;
        }
        
        // Check that outcome categories are defined
        const hasOutcomes = this.data.programs.every(p => p.outcomeCategory !== undefined);
        if (!hasOutcomes) {
            this.log("Cannot collapse significant programs: Outcome categories not computed", "error");
            return false;
        }
        
        return true;
    }
}

// Export for ES6 modules
export { Step15CollapseSignificant };
