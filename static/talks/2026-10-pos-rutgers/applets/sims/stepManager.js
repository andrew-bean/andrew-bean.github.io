/**
 * StepManager - Centralized step execution and state management
 * 
 * Manages the lifecycle and orchestration of all 19 visualization steps.
 * Handles step instantiation, execution, navigation (next/back), and replay.
 */
class StepManager {
    constructor(svg, data, config, dataGenerator, jsonProcessor) {
        this.svg = svg;
        this.data = data;
        this.config = config;
        this.dataGenerator = dataGenerator;
        this.jsonProcessor = jsonProcessor;
        this.currentStep = -1; // -1 = no step executed yet
        this.steps = []; // Will hold step instances (lazy initialization)
    }
    
    /**
     * Execute a specific step
     * @param {number} stepNum - Step number to execute (0-18)
     */
    execute(stepNum) {
        if (stepNum < 0 || stepNum > 18) {
            console.error(`Invalid step number: ${stepNum}. Must be between 0 and 18.`);
            return;
        }
        
        // Log step execution using StepRegistry if available
        console.log("\n" + "=".repeat(60));
        if (typeof StepRegistry !== 'undefined') {
            console.log(`▶ ${StepRegistry.getStepName(stepNum)}`);
            const info = StepRegistry.getStepInfo(stepNum);
            if (info) {
                console.log(`  ${info.description}`);
            }
        } else {
            console.log(`▶ Step ${stepNum}`);
        }
        console.log("=".repeat(60));
        
        // Create and execute the appropriate step
        const step = this.createStep(stepNum);
        if (step) {
            step.run();
            this.currentStep = stepNum;
        } else {
            console.error(`Failed to create step ${stepNum}`);
        }
    }
    
    /**
     * Create a step instance based on step number
     * @param {number} stepNum - Step number (0-18)
     * @returns {BaseStep|null} Step instance or null if invalid
     */
    createStep(stepNum) {
        switch(stepNum) {
            case 0:
                return new Step0FloatAndGrid(this.svg, this.data, this.config, this.dataGenerator);
            case 1:
                return new Step1SplitIntoTrials(this.svg, this.data, this.config);
            case 2:
                return new Step2SplitIntoEndpoints(this.svg, this.data, this.config);
            case 3:
                return new Step3CaterpillarPlots(this.svg, this.data, this.config);
            case 4:
                return new Step4AnimateEndpoints(this.svg, this.data, this.config);
            case 5:
                return new Step5SortCaterpillar(this.svg, this.data, this.config);
            case 6:
                return new Step6EvaluatePrimary(this.svg, this.data, this.config);
            case 7:
                return new Step7CascadeFailures(this.svg, this.data, this.config);
            case 8:
                return new Step8EvaluateSecondary(this.svg, this.data, this.config);
            case 9:
                return new Step9ReorderByProgram(this.svg, this.data, this.config);
            case 10:
                return new Step10CollapseToPrograms(this.svg, this.data, this.config);
            case 11:
                return new Step11EvaluateTPP(this.svg, this.data, this.config);
            case 12:
                return new Step12ExpandToTrials(this.svg, this.data, this.config);
            case 13:
                return new Step13RegroupToGrid(this.svg, this.data, this.config);
            case 14:
                return new Step14CollapseSuccessful(this.svg, this.data, this.config);
            case 15:
                return new Step15CollapseSignificant(this.svg, this.data, this.config);
            case 16:
                return new Step16SafetyFailures(this.svg, this.data, this.config);
            case 17:
                return new Step17RegulatoryFailures(this.svg, this.data, this.config);
            case 18:
                return new Step18ReorderByOutcome(this.svg, this.data, this.config);
            default:
                console.error(`Unknown step number: ${stepNum}`);
                return null;
        }
    }
    
    /**
     * Execute the next step
     */
    next() {
        if (this.currentStep < 18) {
            this.execute(this.currentStep + 1);
        } else {
            console.log("Already at final step (18)");
        }
    }
    
    /**
     * Go back one step (replay from step 0 to currentStep - 1)
     */
    back() {
        if (this.currentStep > 0) {
            this.replay(this.currentStep - 1);
        } else {
            console.log("Already at first step (0)");
        }
    }
    
    /**
     * Replay visualization from step 0 to target step
     * @param {number} targetStep - Final step to replay to (0-18)
     */
    replay(targetStep) {
        if (targetStep < 0 || targetStep > 18) {
            console.error(`Invalid target step: ${targetStep}`);
            return;
        }
        
        console.log("\n" + "=".repeat(60));
        console.log(`⟲ REPLAY: Replaying steps 0 through ${targetStep}`);
        console.log("=".repeat(60));
        
        // Re-initialize SVG
        initializeSVG();
        
        // Disable buttons during replay
        d3.select("#next-btn").property("disabled", true);
        d3.select("#back-btn").property("disabled", true);
        
        // Execute steps 0 through targetStep with delays
        let currentReplayStep = 0;
        
        const replayNext = () => {
            if (currentReplayStep <= targetStep) {
                this.execute(currentReplayStep);
                currentReplayStep++;
                
                // Continue to next step after a short delay
                if (currentReplayStep <= targetStep) {
                    setTimeout(replayNext, this.config.durations.stepDelay || 100);
                } else {
                    // Replay complete - re-enable buttons
                    console.log("\n" + "=".repeat(60));
                    console.log(`⟲ REPLAY COMPLETE at step ${targetStep}`);
                    console.log("=".repeat(60));
                    
                    // Enable appropriate buttons
                    d3.select("#next-btn").property("disabled", targetStep >= 18);
                    d3.select("#back-btn").property("disabled", targetStep <= 0);
                }
            }
        };
        
        replayNext();
    }
    
    /**
     * Get metadata for a specific step
     * @param {number} stepNum - Step number (0-18)
     * @returns {Object|null} Step metadata object or null if invalid
     */
    getStepMetadata(stepNum) {
        if (stepNum < 0 || stepNum > 18) {
            return null;
        }
        
        // Use StepRegistry if available, otherwise return basic info
        const metadata = {
            number: stepNum,
            isCurrent: stepNum === this.currentStep,
            isCompleted: stepNum < this.currentStep
        };
        
        if (typeof StepRegistry !== 'undefined') {
            const registryInfo = StepRegistry.getStepInfo(stepNum);
            if (registryInfo) {
                Object.assign(metadata, registryInfo);
            }
        }
        
        return metadata;
    }
    
    /**
     * Get current step number
     * @returns {number} Current step number (-1 if no step executed)
     */
    getCurrentStep() {
        return this.currentStep;
    }
    
    /**
     * Get total number of steps
     * @returns {number} Total steps (19)
     */
    getTotalSteps() {
        return 19;
    }
    
    /**
     * Check if at first step
     * @returns {boolean} True if at step 0 or no steps executed
     */
    isAtStart() {
        return this.currentStep <= 0;
    }
    
    /**
     * Check if at last step
     * @returns {boolean} True if at step 18
     */
    isAtEnd() {
        return this.currentStep >= 18;
    }
}

// ES6 module export
export { StepManager };
