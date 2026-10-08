import { BaseStep } from '../baseStep.js';
/**
 * Step 17: Apply Regulatory Failures
 * 
 * Applies regulatory failures to programs using pre-computed flags from JSON:
 * 1. Filter programs with regulatoryFailed flag
 * 2. Change colors: dark red for regulatory failures
 * 3. Display final counts showing all failure types
 */

class Step17RegulatoryFailures extends BaseStep {
    constructor(svg, data, config) {
        super(svg, data, config, {
            name: "Apply Regulatory Failures",
            description: "Apply regulatory failure indicators to programs",
            duration: config.durations.buttonDelay,
            index: 17,
            dependencies: [16]
        });
    }
    
    execute() {
        this.log("Using pre-determined regulatory failures from JSON");
        
        // Get regulatory-failed programs
        const regulatoryFailedPrograms = this.data.programs.filter(p => p.regulatoryFailed);
        
        this.logRegulatoryDistribution(regulatoryFailedPrograms);
        
        // Change program colors to show regulatory failures
        this.colorProgramsByRegulatory();
        
        // Update header after color transition
        setTimeout(() => {
            const counts = this.calculateCounts(regulatoryFailedPrograms);
            
            this.updateHeader(
                `Final outcomes: ${counts.tpp} TPP (green), ${counts.significant} significant (gold), ${counts.safety} safety failures (light red), ${counts.regulatory} regulatory failures (dark red), ${counts.efficacy} efficacy failures (red)`,
                `Applied ${(this.data.regulatoryFailureRate * 100).toFixed(0)}% regulatory failure rate. ${counts.greenReg} TPP and ${counts.goldReg} significant programs failed regulatory approval. Click 'Next Step' to reorder by outcome.`
            );
            
            this.enableButtons();
        }, this.config.durations.buttonDelay);
    }
    
    /**
     * Log regulatory failure distribution for debugging
     */
    logRegulatoryDistribution(regulatoryFailedPrograms) {
        console.log("Regulatory failed programs:", regulatoryFailedPrograms.length);
        console.log("  TPP + Regulatory Failed:", regulatoryFailedPrograms.filter(p => p.outcomeCategory === 'tpp_success').length);
        console.log("  Significant + Regulatory Failed:", regulatoryFailedPrograms.filter(p => p.outcomeCategory === 'significant').length);
    }
    
    /**
     * Color programs based on all failure types
     * Priority: Regulatory > Safety > TPP success > Significant > Efficacy failure
     */
    colorProgramsByRegulatory() {
        this.svg.selectAll(".program-rect")
            .transition()
            .duration(this.config.durations.fast)
            .style("fill", d => {
                if (d.regulatoryFailed) return this.config.colors.regulatoryFailure; // Dark red
                if (d.safetyFailed) return this.config.colors.safetyFailure; // Light red-orange
                if (d.outcomeCategory === 'tpp_success') return this.config.colors.tppSuccess; // Green
                if (d.outcomeCategory === 'significant') return this.config.colors.significant; // Gold
                return this.config.colors.efficacyFailure; // Red
            });
    }
    
    /**
     * Calculate counts for each outcome category
     */
    calculateCounts(regulatoryFailedPrograms) {
        return {
            tpp: this.data.programs.filter(p => p.outcomeCategory === 'tpp_success' && !p.safetyFailed && !p.regulatoryFailed).length,
            significant: this.data.programs.filter(p => p.outcomeCategory === 'significant' && !p.safetyFailed && !p.regulatoryFailed).length,
            safety: this.data.programs.filter(p => p.safetyFailed).length,
            regulatory: regulatoryFailedPrograms.length,
            efficacy: this.data.programs.filter(p => p.outcomeCategory === 'efficacy_failure').length,
            greenReg: regulatoryFailedPrograms.filter(p => p.outcomeCategory === 'tpp_success').length,
            goldReg: regulatoryFailedPrograms.filter(p => p.outcomeCategory === 'significant').length
        };
    }
    
    validate() {
        if (!super.validate()) return false;
        
        if (!this.data.programs || this.data.programs.length === 0) {
            this.log("Cannot apply regulatory failures: No program data available", "error");
            return false;
        }
        
        // Check that regulatory failure flags are defined
        const hasRegulatoryFlags = this.data.programs.every(p => p.regulatoryFailed !== undefined);
        if (!hasRegulatoryFlags) {
            this.log("Cannot apply regulatory failures: Regulatory failure flags not computed", "error");
            return false;
        }
        
        if (this.data.regulatoryFailureRate === undefined) {
            this.log("Cannot apply regulatory failures: Regulatory failure rate not defined", "error");
            return false;
        }
        
        return true;
    }
}

// Export for ES6 modules
export { Step17RegulatoryFailures };
