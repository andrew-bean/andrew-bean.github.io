import { BaseStep } from '../baseStep.js';
/**
 * Step7CascadeFailures - Cascade failures to secondary endpoints
 * 
 * Grays out secondary endpoints when primary endpoint failed.
 * Implements testing hierarchy: secondary only testable if primary succeeded.
 * 
 * @extends BaseStep
 */
class Step7CascadeFailures extends BaseStep {
    constructor(svg, data, config) {
        super(svg, data, config, {
            name: "Cascade Failures",
            description: "Gray secondary endpoints when primary failed",
            duration: 800,
            index: 7,
            dependencies: [6]
        });
    }
    
    execute() {
        const allEndpoints = this.data.allEndpoints;
        
        console.log("Step 7 - Cascading failures");
        console.log("Using pre-computed trial.primarySuccess from JSON");
        
        // Color secondary endpoints: gray if primary failed, keep black if primary succeeded
        this.svg.selectAll(".endpoint-triangle")
            .filter(d => d.endpointType === 'secondary')
            .transition()
            .duration(this.duration)
            .style("fill", d => {
                // Find the trial this endpoint belongs to (use pre-computed primarySuccess from JSON)
                const program = this.data.programs[d.programIndex];
                const trial = program.trials[d.trialIndex];
                
                if (!trial.primarySuccess) {
                    return this.config.colors.endpointFailed; // Gray
                } else {
                    return this.config.colors.endpointBlack; // Black
                }
            });
        
        // Color CI lines for secondary endpoints
        this.svg.selectAll(".ci-line")
            .filter(d => d.endpointType === 'secondary')
            .transition()
            .duration(this.duration)
            .style("stroke", d => {
                // Find the trial this endpoint belongs to (use pre-computed primarySuccess from JSON)
                const program = this.data.programs[d.programIndex];
                const trial = program.trials[d.trialIndex];
                
                if (!trial.primarySuccess) {
                    return this.config.colors.ciLineFailed; // Gray
                } else {
                    return this.config.colors.ciLineBlack; // Black
                }
            });
        
        // Enable buttons and update header after animation
        setTimeout(() => {
            this.enableButtons();
            this.updateHeader(
                "Cascading failures to secondary endpoints",
                "Secondary endpoints grayed out when primary endpoint failed. This reflects the testing hierarchy. Click 'Next Step' to evaluate successful secondary endpoints."
            );
        }, 900);
    }
    
    validate() {
        if (!super.validate()) {
            return false;
        }
        
        if (!this.data.allEndpoints) {
            console.error(`${this.name}: allEndpoints not available`);
            return false;
        }
        
        if (!this.data.programs) {
            console.error(`${this.name}: programs not available`);
            return false;
        }
        
        return true;
    }
}
export { Step7CascadeFailures };
