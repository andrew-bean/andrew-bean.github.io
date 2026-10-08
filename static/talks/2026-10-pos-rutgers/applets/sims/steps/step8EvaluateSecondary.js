import { BaseStep } from '../baseStep.js';
/**
 * Step8EvaluateSecondary - Evaluate secondary endpoints
 * 
 * Colors secondary endpoints by statistical significance, but only
 * for trials where primary endpoint succeeded (testable secondary).
 * 
 * @extends BaseStep
 */
class Step8EvaluateSecondary extends BaseStep {
    constructor(svg, data, config) {
        super(svg, data, config, {
            name: "Evaluate Secondary Endpoints",
            description: "Color testable secondary endpoints by significance",
            duration: 800,
            index: 8,
            dependencies: [6, 7]
        });
    }
    
    execute() {
        const allEndpoints = this.data.allEndpoints;
        
        console.log("Step 8 - Evaluating secondary endpoints");
        console.log("Using pre-computed significance and testability from JSON");
        
        // Color secondary endpoints that are testable (primary succeeded)
        this.svg.selectAll(".endpoint-triangle")
            .filter(d => {
                if (d.endpointType !== 'secondary') return false;
                
                // Only process if primary succeeded (use pre-computed primarySuccess from JSON)
                const program = this.data.programs[d.programIndex];
                const trial = program.trials[d.trialIndex];
                return trial.primarySuccess;
            })
            .transition()
            .duration(this.duration)
            .style("fill", d => {
                // Use pre-computed significance from JSON
                if (d.significant) {
                    return this.config.colors.endpointSuccess; // Gold
                } else {
                    return this.config.colors.endpointFailed; // Gray
                }
            });
        
        // Color CI lines for secondary endpoints that are testable
        this.svg.selectAll(".ci-line")
            .filter(d => {
                if (d.endpointType !== 'secondary') return false;
                
                // Only process if primary succeeded (use pre-computed primarySuccess from JSON)
                const program = this.data.programs[d.programIndex];
                const trial = program.trials[d.trialIndex];
                return trial.primarySuccess;
            })
            .transition()
            .duration(this.duration)
            .style("stroke", d => {
                // Use pre-computed significance from JSON
                if (d.significant) {
                    return this.config.colors.ciLineSuccess; // Gold
                } else {
                    return this.config.colors.ciLineFailed; // Gray
                }
            });
        
        // Enable buttons and update header after animation
        setTimeout(() => {
            this.enableButtons();
            this.updateHeader(
                "Secondary endpoint results",
                "Secondary endpoints evaluated only when primary succeeded. Golden = success, Gray = failure. Click 'Next Step' to reorder by program."
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
export { Step8EvaluateSecondary };
