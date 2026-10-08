import { BaseStep } from '../baseStep.js';
/**
 * Step 16: Apply Safety Failures
 * 
 * Applies safety failures to programs using pre-computed flags from JSON:
 * 1. Filter programs with safetyFailed flag
 * 2. Change colors: light red for safety failures
 * 3. Display counts showing impact on TPP and significant programs
 */

class Step16SafetyFailures extends BaseStep {
    constructor(svg, data, config) {
        super(svg, data, config, {
            name: "Apply Safety Failures",
            description: "Apply safety failure indicators to programs",
            duration: config.durations.buttonDelay,
            index: 16,
            dependencies: [15]
        });
    }
    
    execute() {
        this.log("Using pre-determined safety failures from JSON");
        
        // Get safety-failed programs
        const safetyFailedPrograms = this.data.programs.filter(p => p.safetyFailed);
        
        this.logSafetyDistribution(safetyFailedPrograms);
        
        // Change program colors to show safety failures
        this.colorProgramsBySafety();
        
        // Update header after color transition
        setTimeout(() => {
            const counts = this.calculateCounts(safetyFailedPrograms);
            
            this.updateHeader(
                `After safety: ${counts.tpp} TPP (green), ${counts.significant} significant (gold), ${counts.safety} safety failures (light red), ${counts.efficacy} efficacy failures (red)`,
                `Applied ${(this.data.safetyFailureRate * 100).toFixed(0)}% safety failure rate. ${counts.greenSafety} TPP and ${counts.goldSafety} significant programs failed safety. Click 'Next Step' for regulatory evaluation.`
            );
            
            this.enableButtons();
        }, this.config.durations.buttonDelay);
    }
    
    /**
     * Log safety failure distribution for debugging
     */
    logSafetyDistribution(safetyFailedPrograms) {
        console.log("Safety failed programs:", safetyFailedPrograms.length);
        console.log("  TPP + Safety Failed:", safetyFailedPrograms.filter(p => p.outcomeCategory === 'tpp_success').length);
        console.log("  Significant + Safety Failed:", safetyFailedPrograms.filter(p => p.outcomeCategory === 'significant').length);
    }
    
    /**
     * Color programs based on safety failure status
     * Priority: Safety failure > TPP success > Significant > Efficacy failure
     */
    colorProgramsBySafety() {
        this.svg.selectAll(".program-rect")
            .transition()
            .duration(this.config.durations.fast)
            .style("fill", d => {
                if (d.safetyFailed) return this.config.colors.safetyFailure; // Light red-orange
                if (d.outcomeCategory === 'tpp_success') return this.config.colors.tppSuccess; // Green
                if (d.outcomeCategory === 'significant') return this.config.colors.significant; // Gold
                return this.config.colors.efficacyFailure; // Red
            });
    }
    
    /**
     * Calculate counts for each outcome category
     */
    calculateCounts(safetyFailedPrograms) {
        return {
            tpp: this.data.programs.filter(p => p.outcomeCategory === 'tpp_success' && !p.safetyFailed).length,
            significant: this.data.programs.filter(p => p.outcomeCategory === 'significant' && !p.safetyFailed).length,
            safety: safetyFailedPrograms.length,
            efficacy: this.data.programs.filter(p => p.outcomeCategory === 'efficacy_failure').length,
            greenSafety: safetyFailedPrograms.filter(p => p.outcomeCategory === 'tpp_success').length,
            goldSafety: safetyFailedPrograms.filter(p => p.outcomeCategory === 'significant').length
        };
    }
    
    validate() {
        if (!super.validate()) return false;
        
        if (!this.data.programs || this.data.programs.length === 0) {
            this.log("Cannot apply safety failures: No program data available", "error");
            return false;
        }
        
        // Check that safety failure flags are defined
        const hasSafetyFlags = this.data.programs.every(p => p.safetyFailed !== undefined);
        if (!hasSafetyFlags) {
            this.log("Cannot apply safety failures: Safety failure flags not computed", "error");
            return false;
        }
        
        if (this.data.safetyFailureRate === undefined) {
            this.log("Cannot apply safety failures: Safety failure rate not defined", "error");
            return false;
        }
        
        return true;
    }
}

// Export for ES6 modules
export { Step16SafetyFailures };
