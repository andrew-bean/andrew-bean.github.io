import { StepRegistry } from './stepRegistry.js';

/**
 * BaseStep - Abstract base class for visualization steps
 * 
 * Provides common interface and functionality for all visualization steps.
 * Each step represents one stage in the sequential animation of clinical program outcomes.
 * 
 * @abstract
 * @class BaseStep
 * 
 * @example
 * class Step0FloatAndGrid extends BaseStep {
 *   constructor(svg, data, config) {
 *     super(svg, data, config, {
 *       name: "Float and Grid",
 *       description: "Programs arrange into grid",
 *       duration: 1500,
 *       index: 0
 *     });
 *   }
 *   
 *   execute() {
 *     // Step-specific implementation
 *     const positions = this.dataGenerator.calculateGridPositions(this.data.programs.length);
 *     // ... animation code ...
 *     this.enableButtons();
 *   }
 * }
 */
class BaseStep {
    /**
     * Create a BaseStep instance
     * 
     * @param {d3.Selection} svg - The D3 SVG selection
     * @param {Object} data - The visualization data object (mutable, shared across steps)
     * @param {Object} config - The configuration object with dimensions, colors, durations
     * @param {Object} stepConfig - Step-specific configuration
     * @param {string} stepConfig.name - Human-readable step name (e.g., "Float and Grid")
     * @param {string} stepConfig.description - Brief description of what the step does
     * @param {number} stepConfig.duration - Primary animation duration in milliseconds
     * @param {number} stepConfig.index - Step index (0-18)
     * @param {number[]} [stepConfig.dependencies=[]] - Array of step indices this step depends on
     */
    constructor(svg, data, config, stepConfig) {
        if (new.target === BaseStep) {
            throw new TypeError("Cannot construct BaseStep instances directly - it's abstract");
        }
        
        this.svg = svg;
        this.data = data;
        this.config = config;
        
        // Step metadata
        this.name = stepConfig.name;
        this.description = stepConfig.description;
        this.duration = stepConfig.duration;
        this.index = stepConfig.index;
        this.dependencies = stepConfig.dependencies || [];
        
        // State tracking
        this.executed = false;
        this.executionTime = null;
        
        // Utility references (for convenience)
        this.colors = config.colors;
        this.durations = config.durations;
    }
    
    /**
     * Execute the step (must be implemented by subclasses)
     * 
     * This method contains the step-specific visualization logic.
     * It should:
     * 1. Perform D3 selections and data binding
     * 2. Apply transitions and animations
     * 3. Update the data object as needed
     * 4. Call this.enableButtons() when animations complete
     * 5. Call this.updateHeader() to update title and info text
     * 
     * @abstract
     * @throws {Error} If not implemented by subclass
     */
    execute() {
        throw new Error("execute() must be implemented by subclass");
    }
    
    /**
     * Revert the step (optional, for back button functionality)
     * 
     * This method should undo the visual changes made by execute().
     * If not implemented, the default behavior is to replay all steps from step 0.
     * 
     * @returns {boolean} True if step can be reverted individually, false to replay from start
     */
    revert() {
        // Default: cannot revert individually, must replay from start
        return false;
    }
    
    /**
     * Validate step preconditions
     * 
     * Check that all dependencies have been executed and data is in correct state.
     * Called automatically before execute().
     * 
     * @returns {boolean} True if step can be executed, false otherwise
     */
    validate() {
        // Check that SVG exists
        if (!this.svg || this.svg.empty()) {
            console.error(`${this.name}: SVG not initialized`);
            return false;
        }
        
        // Check that data exists
        if (!this.data) {
            console.error(`${this.name}: Data not initialized`);
            return false;
        }
        
        // Could add dependency checking here if needed
        // For now, assume sequential execution
        
        return true;
    }
    
    /**
     * Enable navigation buttons after animations complete
     * 
     * @param {number} [delay=0] - Additional delay in milliseconds before enabling
     */
    enableButtons(delay = 0) {
        setTimeout(() => {
            d3.select("#next-btn").property("disabled", false);
        }, delay);
    }
    
    /**
     * Disable navigation buttons during animations
     */
    disableButtons() {
        d3.select("#next-btn").property("disabled", true);
    }
    
    /**
     * Update header title and info text
     * Also displays explanatory text from StepRegistry if available
     * 
     * @param {string} title - Main title text (displayed in info-text below main title)
     * @param {string} info - Additional informational text
     */
    updateHeader(title, info) {
        // Don't update the main title - it stays as "Visual representation of PoS results"
        // Instead, show step-specific info in the info-text span
        d3.select("#info-text").text(title);
        
        // Step counter, matching the hurdle-diagram explainer's "X / Y" indicator.
        // Slot 1 is the outcome summary panel shown before step 0.
        d3.select("#step-counter").text(`Step ${this.index + 2} / ${StepRegistry.getTotalSteps() + 1}`);
        
        // Get and display explanation from StepRegistry
        const stepInfo = StepRegistry.getStepInfo(this.index);
        if (stepInfo && stepInfo.explanation) {
            // Apply color coding to explanation text
            const coloredText = this.applyColorCoding(stepInfo.explanation);
            d3.select("#explanation-text").html(coloredText);
            d3.select("#step-explanation").style("display", "block");
        } else {
            d3.select("#step-explanation").style("display", "none");
        }
    }
    
    /**
     * Apply color coding to text based on config.colors
     * Replaces color keywords with styled spans
     * 
     * @param {string} text - Text to apply color coding to
     * @returns {string} HTML string with colored spans
     */
    applyColorCoding(text) {
        // Map of keywords to color values from config.
        const colorMap = {
            'ORANGE BOXES': this.config.colors.tppBox,
            'GOLD': this.config.colors.significant,
            'GREEN': this.config.colors.tppSuccess,
            'ORANGE': this.config.colors.endpointSuccess,
            'GRAY': this.config.colors.endpointFailed,
            'BLACK': this.config.colors.endpointBlack,
            'LIGHT RED': this.config.colors.safetyFailure,
            'DARK RED': this.config.colors.regulatoryFailure,
            'BLUE': this.config.colors.trialCircle
        };
        
        // Single-pass match, longest keyword first, so a multi-word phrase
        // (e.g. "ORANGE BOXES") isn't re-matched and double-wrapped by a
        // shorter prefix keyword (e.g. "ORANGE") in a later pass.
        const keywords = Object.keys(colorMap).sort((a, b) => b.length - a.length);
        const pattern = new RegExp(keywords.join('|'), 'g');
        
        return text.replace(pattern, match =>
            `<span style="color: ${colorMap[match]}; font-weight: bold;">${match}</span>`
        );
    }
    
    /**
     * Log step execution to console
     * 
     * @param {string} [message] - Optional additional message to log
     */
    log(message = "") {
        const separator = "=".repeat(60);
        console.log("\n" + separator);
        console.log(`▶ Step ${this.index}: ${this.name}`);
        if (message) {
            console.log(message);
        }
        console.log(separator);
    }
    
    /**
     * Run the step (wrapper that handles validation, logging, and state)
     * 
     * This is the public method that should be called to execute a step.
     * It handles validation, logging, timing, and delegates to execute().
     * 
     * @returns {boolean} True if step executed successfully
     */
    run() {
        // Validate preconditions
        if (!this.validate()) {
            console.error(`${this.name}: Validation failed, cannot execute`);
            return false;
        }
        
        // Log execution
        this.log();
        
        // Disable buttons during animation
        this.disableButtons();
        
        // Track execution time
        const startTime = performance.now();
        
        // Execute step-specific logic
        try {
            this.execute();
            this.executed = true;
            this.executionTime = performance.now() - startTime;
            return true;
        } catch (error) {
            console.error(`${this.name}: Execution failed:`, error);
            this.enableButtons();
            return false;
        }
    }
    
    /**
     * Get step metadata as object
     * 
     * @returns {Object} Step metadata
     */
    getMetadata() {
        return {
            index: this.index,
            name: this.name,
            description: this.description,
            duration: this.duration,
            dependencies: this.dependencies,
            executed: this.executed,
            executionTime: this.executionTime
        };
    }
    
    /**
     * Calculate animation delay based on total duration and timing strategy
     * 
     * @param {number} totalDuration - Total animation duration
     * @param {number} itemCount - Number of items being animated
     * @param {string} [strategy='linear'] - Timing strategy: 'linear', 'easeIn', 'easeOut'
     * @returns {Function} Delay function that takes (d, i) and returns delay in ms
     */
    createDelayFunction(totalDuration, itemCount, strategy = 'linear') {
        switch (strategy) {
            case 'linear':
                return (d, i) => (totalDuration / itemCount) * i;
            case 'easeIn':
                return (d, i) => {
                    const progress = i / itemCount;
                    return totalDuration * progress * progress;
                };
            case 'easeOut':
                return (d, i) => {
                    const progress = i / itemCount;
                    return totalDuration * (1 - (1 - progress) * (1 - progress));
                };
            default:
                return (d, i) => (totalDuration / itemCount) * i;
        }
    }
    
    /**
     * Helper to fade out and remove elements
     * Uses D3Helpers if available, otherwise direct implementation
     * 
     * @param {d3.Selection} selection - D3 selection to fade out
     * @param {number} [duration] - Fade duration (defaults to config.durations.fadeOut)
     * @returns {d3.Transition} The transition object
     */
    fadeOutAndRemove(selection, duration) {
        const dur = duration || this.config.durations.fadeOut;

        // Use D3Helpers if available
        if (typeof D3Helpers !== 'undefined') {
            return D3Helpers.fadeOutAndRemove(selection, dur);
        }

        // Fallback implementation
        return selection.transition()
            .duration(dur)
            .style("opacity", 0)
            .remove();
    }
}

// ES6 Module Export
export { BaseStep };