import { BaseStep } from '../baseStep.js';
/**
 * Step1SplitIntoTrials - Split programs into trials
 * 
 * Shows trial circles appearing inside program rectangles.
 * Calculates positions for 1-3 trials within each program.
 * 
 * @extends BaseStep
 */
class Step1SplitIntoTrials extends BaseStep {
    /**
     * Create Step1 instance
     * 
     * @param {d3.Selection} svg - The D3 SVG selection
     * @param {Object} data - The visualization data object
     * @param {Object} config - The configuration object
     */
    constructor(svg, data, config) {
        super(svg, data, config, {
            name: "Split into Trials",
            description: "Programs split into individual trials",
            duration: config.durations.standard,
            index: 1,
            dependencies: [0]
        });
    }
    
    /**
     * Execute the step
     * 
     * Calculates positions for trial circles within program rectangles
     * and animates their appearance.
     */
    execute() {
        // Calculate positions for trial circles within each program rectangle
        this.data.programs.forEach(program => {
            const nTrials = program.n_trials;
            
            // Position circles within the rectangle (adjusted for better spacing)
            if (nTrials === 1) {
                program.trials[0].localPosition = { x: 0, y: 0 };
            } else if (nTrials === 2) {
                program.trials[0].localPosition = { x: -13, y: 0 };
                program.trials[1].localPosition = { x: 13, y: 0 };
            } else if (nTrials === 3) {
                program.trials[0].localPosition = { x: -15, y: -8 };
                program.trials[1].localPosition = { x: 15, y: -8 };
                program.trials[2].localPosition = { x: 0, y: 10 };
            }
            
            // Calculate absolute positions
            program.trials.forEach(trial => {
                trial.absolutePosition = {
                    x: program.gridPosition.x + trial.localPosition.x,
                    y: program.gridPosition.y + trial.localPosition.y
                };
            });
        });
        
        // Flatten all trials for drawing
        const allTrials = [];
        this.data.programs.forEach(program => {
            program.trials.forEach(trial => {
                allTrials.push({
                    ...trial,
                    programId: program.id,
                    programIndex: this.data.programs.indexOf(program)
                });
            });
        });
        
        // Create circles for trials inside rectangles
        const circles = this.svg.selectAll(".trial-circle")
            .data(allTrials)
            .enter()
            .append("circle")
            .attr("class", "trial-circle")
            .attr("r", this.config.trialCircleRadius)
            .attr("cx", d => d.absolutePosition.x)
            .attr("cy", d => d.absolutePosition.y)
            .style("opacity", 0);
        
        // Animate circles appearing
        circles.transition()
            .duration(this.duration)
            .style("opacity", 1);
        
        // Store circles reference for next step
        this.data.trialCircles = circles;
        
        // Enable buttons after animation
        this.enableButtons(this.config.durations.buttonDelay);
        
        // Update header
        this.updateHeader(
            `Programs split into ${this.data.programs[0].n_trials} trial(s) each`,
            `Each circle represents one clinical trial. ${allTrials.length} total trials across ${this.data.programs.length} programs.`
        );
    }
    
    /**
     * Validate step preconditions
     * 
     * @returns {boolean} True if validation passes
     */
    validate() {
        if (!super.validate()) {
            return false;
        }
        
        if (!this.data.programs || this.data.programs.length === 0) {
            console.error(`${this.name}: No programs in data`);
            return false;
        }
        
        if (!this.data.programs[0].gridPosition) {
            console.error(`${this.name}: Programs missing grid positions (run Step 0 first)`);
            return false;
        }
        
        return true;
    }
}
// Export for ES6 modules (if needed)
export { Step1SplitIntoTrials };
