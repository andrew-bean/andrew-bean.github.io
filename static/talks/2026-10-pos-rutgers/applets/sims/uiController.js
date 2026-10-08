/**
 * UIController - Centralized UI interaction and event handling
 * 
 * Manages all user interactions including button clicks, form inputs,
 * and orchestrates the initialization workflow.
 */
import { renderOutcomeSummary } from './outcomeSummary.js';

class UIController {
    constructor(config, dataGenerator, jsonProcessor) {
        this.config = config;
        this.dataGenerator = dataGenerator;
        this.jsonProcessor = jsonProcessor;
        this.stepManager = null;
        this.svg = null;
        this.data = null;
        this.showingSummary = false;
        
        this.setupEventHandlers();
    }
    
    /**
     * Set up all event handlers for buttons
     */
    setupEventHandlers() {
        d3.select("#next-btn").on("click", () => this.handleNext());
        d3.select("#reset-btn").on("click", () => this.handleReset());
    }
    
    /**
     * Run the data generation → JSON workflow and show the outcome summary.
     * Called automatically once on load (no Initialize button).
     */
    async start() {
        try {
            // Step 1: Collect and validate parameters
            const params = this.getFormInputs();
            this.validateInputs(params);
            
            // Step 2: Log workflow start
            this.logWorkflowStart(params);
            
            // Step 3: Generate data
            console.log("\n[Step 1/5] Generating raw data...");
            const rawData = this.dataGenerator.generate(
                params.nPrograms, 
                params.nTrials, 
                params.nEndpoints, 
                params.globalMean,
                params.programSD, 
                params.programCorr, 
                params.studySD, 
                params.studyCorr
            );
            console.log("  ✓ Generated", rawData.programs.length, "programs");
            
            // Step 4: Prepare JSON with computed values
            console.log("\n[Step 2/5] Preparing JSON with computed values...");
            const jsonData = this.jsonProcessor.prepare(rawData, params);
            console.log("  ✓ JSON prepared");
            
            // Step 5: Transform JSON back to internal format
            console.log("\n[Step 3/5] Transforming JSON to internal format...");
            this.data = this.jsonProcessor.transform(jsonData);
            console.log("  ✓ Data ready for visualization");
            
            // Step 6: Show the final-outcome summary panel first
            console.log("\n[Step 4/5] Rendering outcome summary...");
            this.showSummary();
            
            this.logWorkflowComplete();
            
        } catch (error) {
            console.error("❌ Initialization failed:", error);
            alert(`Initialization failed: ${error.message}`);
        }
    }
    
    /**
     * Handle Next button click
     */
    handleNext() {
        if (this.showingSummary) {
            this.showingSummary = false;
            this.enterStepFlow();
            return;
        }
        if (this.stepManager) {
            d3.select("#next-btn").property("disabled", true);
            this.stepManager.next();
        }
    }
    
    /**
     * Handle Reset button click: jump straight back to the summary panel
     * (step 1), regardless of which step is currently showing.
     */
    handleReset() {
        this.showSummary();
    }
    
    /**
     * Render the final-outcome summary panel (resembling @pos/viz's
     * outcomeGrid), shown before step 0 on first load.
     */
    showSummary() {
        this.showingSummary = true;
        this.stepManager = null;
        this.svg = null;
        
        d3.select("#visualization").selectAll("svg, .outcome-summary").remove();
        
        const container = d3.select("#visualization")
            .insert("div", "#step-explanation")
            .attr("class", "outcome-summary");
        renderOutcomeSummary(container, this.data.programs, this.config);
        
        d3.select("#info-text").text("Final outcome of the Smart PoS simulation");
        d3.select("#explanation-text").text(
            "Each square is one equally-likely simulated program outcome. Click Next to see how Smart PoS builds this result, step by step."
        );
        d3.select("#step-explanation").style("display", "block");
        
        d3.select("#step-counter").text(`Step 1 / ${StepRegistry.getTotalSteps() + 1}`);
        d3.select("#next-btn").property("disabled", false);
    }
    
    /**
     * Leave the summary panel: reuse its coloured rectangles (same SVG, same
     * grid) and shuffle them into step 0's layout, turning them gray, instead
     * of rebuilding the visualization from scratch.
     */
    enterStepFlow() {
        const positions = this.dataGenerator.calculateGridPositions(this.data.programs.length);
        this.data.programs.forEach((program, i) => {
            program.gridPosition = positions[i];
        });
        
        // Promote the summary's <svg> to a direct child of #visualization
        // (matching initializeSVG()'s normal structure) and drop its legend.
        const summaryContainer = d3.select("#visualization").select(".outcome-summary");
        const svgNode = summaryContainer.select("svg").node();
        d3.select("#visualization").node().insertBefore(svgNode, document.getElementById("step-explanation"));
        summaryContainer.remove();
        this.svg = d3.select(svgNode);
        
        if (typeof window !== 'undefined') {
            window.svg = this.svg;
            window.data = this.data;
        }
        
        // Shuffle the existing coloured rectangles into step 0's positions
        this.svg.selectAll(".program-rect")
            .transition()
            .duration(this.config.durations.slow)
            .attr("x", d => d.gridPosition.x - this.config.rectSize / 2)
            .attr("y", d => d.gridPosition.y - this.config.rectSize / 2)
            .style("fill", this.config.colors.programDefault);
        
        // Create the StepManager, marking step 0 as already complete (its usual
        // fall-from-top entrance is replaced by the shuffle above).
        this.stepManager = new StepManager(
            this.svg, 
            this.data, 
            this.config, 
            this.dataGenerator, 
            this.jsonProcessor
        );
        this.stepManager.currentStep = 0;
        
        if (typeof window !== 'undefined') {
            window.stepManager = this.stepManager;
        }
        
        const step0Info = StepRegistry.getStepInfo(0);
        d3.select("#info-text").text(`${this.data.programs.length} equally plausible outcomes for this program`);
        d3.select("#explanation-text").html(step0Info.explanation);
        d3.select("#step-explanation").style("display", "block");
        d3.select("#step-counter").text(`Step 2 / ${StepRegistry.getTotalSteps() + 1}`);
        
        setTimeout(() => {
            d3.select("#next-btn").property("disabled", false);
        }, this.config.durations.slow);
    }
    
    /**
     * Initialize or re-initialize the SVG canvas
     */
    initializeSVG() {
        // Remove the SVG and/or the outcome-summary panel, preserve step-explanation
        d3.select("#visualization").selectAll("svg, .outcome-summary").remove();
        
        this.svg = d3.select("#visualization")
            .append("svg")
            .attr("width", this.config.width)
            .attr("height", this.config.height);
        
        // Sync with global variable (for backward compatibility)
        if (typeof window !== 'undefined') {
            window.svg = this.svg;
        }
    }
    
    /**
     * Get form input values
     * @returns {Object} Object containing all form parameters
     */
    getFormInputs() {
        return {
            nPrograms: +d3.select("#n-programs").property("value"),
            nTrials: +d3.select("#n-trials").property("value"),
            nEndpoints: +d3.select("#n-endpoints").property("value"),
            globalMean: +d3.select("#global-mean").property("value"),
            programSD: +d3.select("#program-sd").property("value"),
            programCorr: +d3.select("#program-corr").property("value"),
            studySD: +d3.select("#study-sd").property("value"),
            studyCorr: +d3.select("#study-corr").property("value"),
            tppPrimary: +d3.select("#tpp-primary").property("value"),
            tppSecondary: +d3.select("#tpp-secondary").property("value"),
            safetyFailureRate: +d3.select("#safety-failure-rate").property("value"),
            regulatoryFailureRate: +d3.select("#regulatory-failure-rate").property("value")
        };
    }
    
    /**
     * Validate input parameters
     * @param {Object} params - Parameters to validate
     * @throws {Error} If validation fails
     */
    validateInputs(params) {
        // Validate number of programs
        if (!Number.isInteger(params.nPrograms) || params.nPrograms < 1 || params.nPrograms > 100) {
            throw new Error("Number of programs must be an integer between 1 and 100");
        }
        
        // Validate number of trials
        if (!Number.isInteger(params.nTrials) || params.nTrials < 1 || params.nTrials > 10) {
            throw new Error("Number of trials must be an integer between 1 and 10");
        }
        
        // Validate number of endpoints
        if (!Number.isInteger(params.nEndpoints) || params.nEndpoints < 1 || params.nEndpoints > 10) {
            throw new Error("Number of endpoints must be an integer between 1 and 10");
        }
        
        // Validate standard deviations
        if (params.programSD <= 0) {
            throw new Error("Program SD must be positive");
        }
        if (params.studySD <= 0) {
            throw new Error("Study SD must be positive");
        }
        
        // Validate correlations
        if (Math.abs(params.programCorr) > 1) {
            throw new Error("Program correlation must be between -1 and 1");
        }
        if (Math.abs(params.studyCorr) > 1) {
            throw new Error("Study correlation must be between -1 and 1");
        }
        
        // Validate TPP thresholds
        if (params.tppPrimary <= 0) {
            throw new Error("TPP Primary threshold must be positive");
        }
        if (params.tppSecondary <= 0) {
            throw new Error("TPP Secondary threshold must be positive");
        }
        
        // Validate failure rates
        if (params.safetyFailureRate < 0 || params.safetyFailureRate > 1) {
            throw new Error("Safety failure rate must be between 0 and 1");
        }
        if (params.regulatoryFailureRate < 0 || params.regulatoryFailureRate > 1) {
            throw new Error("Regulatory failure rate must be between 0 and 1");
        }
        
        return true;
    }
    
    /**
     * Log workflow start
     * @param {Object} params - Parameters being used
     */
    logWorkflowStart(params) {
        console.log("=".repeat(80));
        console.log("INITIALIZE: Starting JSON round-trip workflow");
        console.log("=".repeat(80));
        console.log("Parameters:");
        console.log("  Programs:", params.nPrograms, "Trials:", params.nTrials, "Endpoints:", params.nEndpoints);
        console.log("  Global mean:", params.globalMean, "Program SD:", params.programSD, "Program ρ:", params.programCorr);
        console.log("  Study SD:", params.studySD, "Study ρ:", params.studyCorr);
        console.log("  TPP Primary:", params.tppPrimary, "TPP Secondary:", params.tppSecondary);
        console.log("  Safety failure rate:", params.safetyFailureRate, "Regulatory failure rate:", params.regulatoryFailureRate);
    }
    
    /**
     * Log workflow completion
     */
    logWorkflowComplete() {
        console.log("  ✓ Visualization started");
        console.log("=".repeat(80));
        console.log("Visualization initialized successfully!");
        console.log("=".repeat(80));
    }
    
    /**
     * Get current step manager (for testing/debugging)
     * @returns {StepManager|null} Current step manager instance
     */
    getStepManager() {
        return this.stepManager;
    }
    
    /**
     * Get current data (for testing/debugging)
     * @returns {Object|null} Current visualization data
     */
    getData() {
        return this.data;
    }
    
    /**
     * Get current SVG (for testing/debugging)
     * @returns {Object|null} Current D3 SVG selection
     */
    getSVG() {
        return this.svg;
    }
}

// ES6 module export
export { UIController };
