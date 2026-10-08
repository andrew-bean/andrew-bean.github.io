/**
 * StepRegistry - Centralized step metadata and documentation
 * 
 * Provides static methods to access information about all visualization steps.
 * Used for documentation, UI generation, and step validation.
 */
class StepRegistry {
    /**
     * Get detailed information about a specific step
     * @param {number} stepNum - Step number (0-18)
     * @returns {Object|null} Step information object or null if invalid
     */
    static getStepInfo(stepNum) {
        const stepInfo = {
            0: {
                name: "Float and Grid",
                description: "Programs enter from top and arrange into grid layout",
                explanation: "Each gray rectangle represents a drug development program at the start of Phase-3. In Smart PoS we produce detailed simulations of the outcomes of these programs: both Phase-3 clinical outcomes and regulatory outcomes. This interactive visualization explains the details of the program simulations. Click next step to begin.",
                duration: "medium",
                category: "structure",
                creates: ["program rectangles", "grid layout"],
                modifies: [],
                dependencies: []
            },
            1: {
                name: "Split into Trials",
                description: "Show trials as circles within each program rectangle",
                explanation: "Each program may run multiple Phase-3 clinical trials. The blue circles represent individual trials. In Smart PoS we simulate the outcome of each of these individually.",
                duration: "medium",
                category: "structure",
                creates: ["trial circles"],
                modifies: ["program rectangles"],
                dependencies: [0]
            },
            2: {
                name: "Split into Endpoints",
                description: "Show endpoints as shapes (squares/triangles) within each trial",
                explanation: "Phast-3 success may require evidence of treatment effect on 1 or more endpoints. We simulate the outcome of each trial on each key endpoint (1-2). These are represented as the shapes inside the trial circles: in this case, pink squares for a primary endpoint, and blue triangles for a key secondary endpoint.",
                duration: "medium",
                category: "structure",
                creates: ["endpoint shapes (primary/secondary)"],
                modifies: ["trial circles"],
                dependencies: [0, 1]
            },
            3: {
                name: "Create Caterpillar Plots",
                description: "Transform to caterpillar plot structure with panels and axes",
                explanation: "Smart PoS results are heavily driven by simulations of the estimated treatment effect: we simulate treatment effects and the outcome of significance testing for each endpoint in each trial, repeatedly across simulated programs.",
                duration: "fast",
                category: "structure",
                creates: ["caterpillar panels", "axes", "reference lines"],
                modifies: ["layout"],
                dependencies: [0, 1, 2]
            },
            4: {
                name: "Animate to Positions",
                description: "Move endpoints to their caterpillar plot positions with CI lines",
                explanation: "Here are representative simulations of the estimated effects. In actual practice we do this 40,000 times.",
                duration: "standard",
                category: "layout",
                creates: ["CI lines"],
                modifies: ["endpoint positions"],
                dependencies: [0, 1, 2, 3]
            },
            5: {
                name: "Sort Caterpillar",
                description: "Sort endpoints by effect size and turn them black",
                explanation: "Variability in the estimated effects is driven by benchmark success rates and by phase-2 data (or expert elicitation), as part of Step 2 of Smart PoS, as well as the phase-3 sample size.",
                duration: "standard",
                category: "layout",
                creates: [],
                modifies: ["endpoint order", "endpoint colors"],
                dependencies: [0, 1, 2, 3, 4]
            },
            6: {
                name: "Evaluate Primary",
                description: "Color primary endpoints by statistical significance (gold/gray)",
                explanation: "We evaluate each simulated outcome of the primary endpoint for statistical significance. ORANGE indicates the confidence interval excludes zero (statistically significant benefit). GRAY means the result is not statistically significant. This is the first hurdle for program-level success.",
                duration: "standard",
                category: "analysis",
                creates: [],
                modifies: ["primary endpoint colors", "CI line colors"],
                dependencies: [0, 1, 2, 3, 4, 5]
            },
            7: {
                name: "Cascade Failures",
                description: "Gray out secondary endpoints when primary failed",
                explanation: "Many programs employ hierarchical testing: if the primary endpoint fails, secondary endpoints cannot be formally tested.",
                duration: "standard",
                category: "analysis",
                creates: [],
                modifies: ["secondary endpoint colors"],
                dependencies: [0, 1, 2, 3, 4, 5, 6]
            },
            8: {
                name: "Evaluate Secondary",
                description: "Color testable secondary endpoints by significance (gold/gray)",
                explanation: "For trials in which the primary endpoint was significant, secondary endpoints are now evaluated. ORANGE = statistically significant, GRAY = not significant.",
                duration: "standard",
                category: "analysis",
                creates: [],
                modifies: ["testable secondary endpoint colors", "CI line colors"],
                dependencies: [0, 1, 2, 3, 4, 5, 6, 7]
            },
            9: {
                name: "Reorder by Program",
                description: "Align endpoints by program, grouping trials from same program",
                explanation: "However, in many programs, statistical significance alone is insufficient evidence of efficacy to attain market access. To accomplish full success, the Target Product Profile (TPP) must also be met.",
                duration: "standard",
                category: "layout",
                creates: [],
                modifies: ["endpoint order"],
                dependencies: [0, 1, 2, 3, 4, 5, 6, 7, 8]
            },
            10: {
                name: "Collapse to Programs",
                description: "Aggregate to program-level averages, hide trial-level detail",
                explanation: "When there are multiple trials, we compute program-level averages of the treatment effect on each endpoint to determine if the TPP was met.",
                duration: "slow",
                category: "aggregation",
                creates: ["program average shapes", "program CI lines"],
                modifies: ["visibility"],
                dependencies: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
            },
            11: {
                name: "Evaluate TPP",
                description: "Show programs meeting Target Product Profile thresholds (green boxes)",
                explanation: "ORANGE BOXES indicate programs where ALL endpoints meet their TPP thresholds. These simulated programs may be on a path to success.",
                duration: "standard",
                category: "analysis",
                creates: ["TPP boxes"],
                modifies: ["program annotations"],
                dependencies: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            },
            12: {
                name: "Expand to Trials",
                description: "Return to trial-level detail with TPP status indicators",
                explanation: "We have now repeatedly simulated the key efficacy outcomes for each endpoint in each trial.",
                duration: "slow",
                category: "structure",
                creates: ["multi-column trial panels", "TPP boxes at trial level"],
                modifies: ["layout", "visibility"],
                dependencies: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
            },
            13: {
                name: "Regroup to Grid",
                description: "Return endpoints to program grid with outcome colors",
                explanation: "Now we return to the program-level view. Which programs were successful? We know about efficacy.",
                duration: "standard",
                category: "layout",
                creates: [],
                modifies: ["endpoint positions", "layout"],
                dependencies: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            },
            14: {
                name: "Collapse Successful",
                description: "Hide detail for TPP-successful programs (show as green rectangles)",
                explanation: "Programs meeting TPP (green rectangles) have achieved full efficacy success.",
                duration: "standard",
                category: "aggregation",
                creates: [],
                modifies: ["program colors", "visibility"],
                dependencies: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
            },
            15: {
                name: "Collapse Significant",
                description: "Hide detail for significant/failed programs, color by outcome",
                explanation: "Others in GOLD may demonstrate statistical significance without meeting the TPP. They may have approval potential, but commercial prospects are lower.",
                duration: "standard",
                category: "aggregation",
                creates: [],
                modifies: ["program colors", "visibility"],
                dependencies: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
            },
            16: {
                name: "Safety Failures",
                description: "Apply safety failure indicators (light red color)",
                explanation: "Some programs with promising efficacy may fail due to safety concerns. LIGHT RED indicates programs that met their efficacy goals but had unacceptable safety issues emerge. This is based on historical industry rates of safety failure in Phase-3.",
                duration: "fast",
                category: "analysis",
                creates: [],
                modifies: ["program colors"],
                dependencies: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
            },
            17: {
                name: "Regulatory Failures",
                description: "Apply regulatory failure indicators (dark red color)",
                explanation: "Beyond safety, some programs may fail regulatory review for other reasons (manufacturing issues, data quality, alignment on endpoints, etc.). DARK RED indicates programs that achieved efficacy goals but failed regulatory approval. The rates of these failures depend on qualitative team judgements and on historical benchmark submission success rates.",
                duration: "fast",
                category: "analysis",
                creates: [],
                modifies: ["program colors"],
                dependencies: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
            },
            18: {
                name: "Reorder by Outcome",
                description: "Sort programs columnwise by final outcome category",
                explanation: "This is the final outcome of Smart PoS. GREEN = successful programs (approved with the TPP met). GOLD = approved but below TPP. LIGHT/DARK RED = failed despite efficacy. RED = failed efficacy.",
                duration: "slow",
                category: "layout",
                creates: [],
                modifies: ["program positions"],
                dependencies: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
            }
        };
        
        return stepInfo[stepNum] || null;
    }
    
    /**
     * Get total number of steps
     * @returns {number} Total number of steps (19)
     */
    static getTotalSteps() {
        return 19;
    }
    
    /**
     * Get all step information as an array
     * @returns {Array} Array of step info objects
     */
    static getAllSteps() {
        const steps = [];
        for (let i = 0; i < this.getTotalSteps(); i++) {
            steps.push({
                number: i,
                ...this.getStepInfo(i)
            });
        }
        return steps;
    }
    
    /**
     * Get steps by category
     * @param {string} category - Category to filter by ("structure", "layout", "analysis", "aggregation")
     * @returns {Array} Array of step info objects in that category
     */
    static getStepsByCategory(category) {
        return this.getAllSteps().filter(step => step.category === category);
    }
    
    /**
     * Get step name for display
     * @param {number} stepNum - Step number (0-18)
     * @returns {string} Formatted step name (e.g., "Step 0: Float and Grid")
     */
    static getStepName(stepNum) {
        const info = this.getStepInfo(stepNum);
        if (!info) return `Step ${stepNum}: Unknown`;
        return `Step ${stepNum}: ${info.name}`;
    }
    
    /**
     * Get step duration category
     * @param {number} stepNum - Step number (0-18)
     * @returns {string|null} Duration category ("fast", "standard", "medium", "slow") or null
     */
    static getStepDuration(stepNum) {
        const info = this.getStepInfo(stepNum);
        return info ? info.duration : null;
    }
    
    /**
     * Check if a step depends on another step
     * @param {number} stepNum - Step number to check
     * @param {number} dependencyNum - Potential dependency step number
     * @returns {boolean} True if stepNum depends on dependencyNum
     */
    static hasDependency(stepNum, dependencyNum) {
        const info = this.getStepInfo(stepNum);
        if (!info || !info.dependencies) return false;
        return info.dependencies.includes(dependencyNum);
    }
    
    /**
     * Get all categories
     * @returns {Array} Array of unique category names
     */
    static getCategories() {
        return ["structure", "layout", "analysis", "aggregation"];
    }
    
    /**
     * Validate step number
     * @param {number} stepNum - Step number to validate
     * @returns {boolean} True if step number is valid (0-18)
     */
    static isValidStep(stepNum) {
        return Number.isInteger(stepNum) && stepNum >= 0 && stepNum < this.getTotalSteps();
    }
}

// ES6 module export
export { StepRegistry };
