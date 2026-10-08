import { BaseStep } from '../baseStep.js';
/**
 * Step6EvaluatePrimary - Evaluate primary endpoints
 * 
 * Colors primary endpoints based on statistical significance:
 * - Gold = statistically significant (CI excludes 0)
 * - Gray = not significant
 * 
 * @extends BaseStep
 */
class Step6EvaluatePrimary extends BaseStep {
    constructor(svg, data, config) {
        super(svg, data, config, {
            name: "Evaluate Primary Endpoints",
            description: "Color primary endpoints by statistical significance",
            duration: 800,
            index: 6,
            dependencies: [0, 1, 2, 3, 4, 5]
        });
    }
    
    execute() {
        const allEndpoints = this.data.allEndpoints;
        const primaryEndpoints = allEndpoints.filter(e => e.endpointType === 'primary');
        
        // Create lookup map for endpoints by their indices
        const endpointMap = new Map();
        allEndpoints.forEach(e => {
            const key = `${e.programIndex}-${e.trialIndex}-${e.endpointIndex}`;
            endpointMap.set(key, e);
        });
        
        console.log("Step 6 - Evaluating primary endpoints");
        console.log("Total endpoints:", allEndpoints.length);
        console.log("Primary endpoints:", primaryEndpoints.length);
        
        // Color primary endpoints based on pre-computed statistical significance
        this.svg.selectAll(".endpoint-square")
            .filter(d => d.endpointType === 'primary')
            .transition()
            .duration(this.duration)
            .style("fill", d => {
                const key = `${d.programIndex}-${d.trialIndex}-${d.endpointIndex}`;
                const endpoint = endpointMap.get(key);
                if (endpoint && endpoint.significant) {
                    return this.config.colors.endpointSuccess; // Gold
                } else {
                    return this.config.colors.endpointFailed; // Gray
                }
            });
        
        // Color CI lines for primary endpoints
        this.svg.selectAll(".ci-line")
            .filter(d => d.endpointType === 'primary')
            .transition()
            .duration(this.duration)
            .style("stroke", d => {
                if (d.significant) {
                    return this.config.colors.ciLineSuccess; // Gold
                } else {
                    return this.config.colors.ciLineFailed; // Gray
                }
            });
        
        // Enable buttons after animation
        setTimeout(() => {
            this.enableButtons();
            this.updateHeader(
                "Primary endpoint results",
                "Golden = statistically significant primary endpoint. Gray = failed primary. Click 'Next Step' to cascade failures to secondary endpoints."
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
        
        return true;
    }
}
export { Step6EvaluatePrimary };
