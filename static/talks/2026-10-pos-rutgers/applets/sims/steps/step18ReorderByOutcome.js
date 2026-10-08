import { BaseStep } from '../baseStep.js';
/**
 * Step 18: Reorder by Outcome Category
 * 
 * Final step: Reorders programs columnwise by outcome category:
 * 1. Group programs by final outcome (TPP → Significant → Regulatory → Safety → Efficacy)
 * 2. Calculate new grid positions in columnwise order (top-to-bottom in each column)
 * 3. Animate rectangles to new positions
 * 4. Display final outcome distribution
 */

class Step18ReorderByOutcome extends BaseStep {
    constructor(svg, data, config) {
        super(svg, data, config, {
            name: "Reorder by Outcome Category",
            description: "Sort programs by final outcome category",
            duration: 1600,
            index: 18,
            dependencies: [17]
        });
    }
    
    execute() {
        this.log("Reordering by outcome using pre-computed categories from JSON");
        
        // Categorize programs by final outcome
        const outcomeGroups = this.categorizePrograms();
        
        this.logOutcomeDistribution(outcomeGroups);
        
        // Create ordered list: green → gold → dark red → light red → red
        const orderedPrograms = this.createOrderedProgramList(outcomeGroups);
        
        // Calculate new grid positions
        this.assignNewPositions(orderedPrograms);
        
        // Animate rectangles to new positions
        this.animateToNewPositions();
        
        // Update header after animation
        setTimeout(() => {
            this.updateHeader(
                `Programs reordered by outcome: ${outcomeGroups.green.length} TPP (green), ${outcomeGroups.gold.length} significant (gold), ${outcomeGroups.darkRed.length} regulatory failures (dark red), ${outcomeGroups.lightRed.length} safety failures (light red), ${outcomeGroups.red.length} efficacy failures (red)`,
                `Complete! Programs arranged columnwise (top-to-bottom, left-to-right) by final outcome category.`
            );
            
            // Disable next button (final step)
            d3.select("#next-btn").property("disabled", true);
        }, 1600);
    }
    
    /**
     * Categorize programs by final outcome
     */
    categorizePrograms() {
        return {
            green: this.data.programs.filter(p => p.outcomeCategory === 'tpp_success' && !p.safetyFailed && !p.regulatoryFailed),
            gold: this.data.programs.filter(p => p.outcomeCategory === 'significant' && !p.safetyFailed && !p.regulatoryFailed),
            darkRed: this.data.programs.filter(p => p.regulatoryFailed),
            lightRed: this.data.programs.filter(p => p.safetyFailed && !p.regulatoryFailed),
            red: this.data.programs.filter(p => p.outcomeCategory === 'efficacy_failure')
        };
    }
    
    /**
     * Log outcome distribution for debugging
     */
    logOutcomeDistribution(groups) {
        console.log("Outcome counts:");
        console.log("  Green (TPP):", groups.green.length);
        console.log("  Gold (Significant):", groups.gold.length);
        console.log("  Dark Red (Regulatory):", groups.darkRed.length);
        console.log("  Light Red (Safety):", groups.lightRed.length);
        console.log("  Red (Efficacy):", groups.red.length);
    }
    
    /**
     * Create ordered list of programs by outcome priority
     */
    createOrderedProgramList(groups) {
        return [
            ...groups.green,
            ...groups.gold,
            ...groups.darkRed,
            ...groups.lightRed,
            ...groups.red
        ];
    }
    
    /**
     * Assign new grid positions to ordered programs
     */
    assignNewPositions(orderedPrograms) {
        const nPrograms = this.data.programs.length;
        const cols = this.config.grid.cols;
        const rows = this.config.grid.getRows(nPrograms);
        
        const cellSize = this.config.rectSize + this.config.spacing;
        const gridWidth = cols * cellSize - this.config.spacing;
        const gridHeight = rows * cellSize - this.config.spacing;
        
        const startX = (this.config.width - gridWidth) / 2;
        const startY = (this.config.height - gridHeight) / 2;
        
        // Assign new positions columnwise from left to right (top-to-bottom in each column)
        orderedPrograms.forEach((program, i) => {
            const col = Math.floor(i / rows);
            const row = i % rows;
            
            program.newPosition = {
                x: startX + col * cellSize + this.config.rectSize / 2,
                y: startY + row * cellSize + this.config.rectSize / 2
            };
        });
    }
    
    /**
     * Animate rectangles to their new positions
     */
    animateToNewPositions() {
        this.svg.selectAll(".program-rect")
            .transition()
            .duration(1500)
            .attr("x", d => d.newPosition.x - this.config.rectSize / 2)
            .attr("y", d => d.newPosition.y - this.config.rectSize / 2);
    }
    
    validate() {
        if (!super.validate()) return false;
        
        if (!this.data.programs || this.data.programs.length === 0) {
            this.log("Cannot reorder by outcome: No program data available", "error");
            return false;
        }
        
        // Check that all required flags are defined
        const hasRequiredData = this.data.programs.every(p => 
            p.outcomeCategory !== undefined &&
            p.safetyFailed !== undefined &&
            p.regulatoryFailed !== undefined
        );
        
        if (!hasRequiredData) {
            this.log("Cannot reorder by outcome: Required outcome data not computed", "error");
            return false;
        }
        
        // Check grid configuration
        if (!this.config.grid || !this.config.grid.cols || !this.config.grid.getRows) {
            this.log("Cannot reorder by outcome: Grid configuration not defined", "error");
            return false;
        }
        
        return true;
    }
}

// Export for ES6 modules
export { Step18ReorderByOutcome };
