import { BaseStep } from '../baseStep.js';
/**
 * Step3CaterpillarPlots - Create caterpillar plot structure
 * 
 * Transforms from grid layout to caterpillar plot grid.
 * Creates panels for each trial × endpoint combination with axes.
 * 
 * @extends BaseStep
 */
class Step3CaterpillarPlots extends BaseStep {
    /**
     * Create Step3 instance
     * 
     * @param {d3.Selection} svg - The D3 SVG selection
     * @param {Object} data - The visualization data object
     * @param {Object} config - The configuration object
     */
    constructor(svg, data, config) {
        super(svg, data, config, {
            name: "Create Caterpillar Plots",
            description: "Transform to caterpillar plot grid structure",
            duration: config.durations.fadeOut,
            index: 3,
            dependencies: [0, 1, 2]
        });
    }
    
    /**
     * Execute the step
     * 
     * Fades out grid elements, calculates caterpillar layout,
     * draws panel borders, labels, and axes.
     */
    execute() {
        // Hide legend
        d3.select("#legend").style("display", "none");
        
        // Fade out program rectangles and trial circles
        this.svg.selectAll(".program-rect")
            .transition()
            .duration(this.config.durations.fadeOut)
            .style("opacity", 0);
        
        this.svg.selectAll(".trial-circle")
            .transition()
            .duration(this.config.durations.fadeOut)
            .style("opacity", 0);
        
        // Calculate caterpillar plot layout
        const nTrials = this.data.programs[0].n_trials;
        const nEndpoints = this.data.programs[0].trials[0].n_endpoints;
        const nPrograms = this.data.programs.length;
        
        // Create grid: rows = endpoints, columns = trials
        const plotWidth = (this.config.width - this.config.caterpillarMargin.left - this.config.caterpillarMargin.right) / nTrials;
        const plotHeight = (this.config.height - this.config.caterpillarMargin.top - this.config.caterpillarMargin.bottom) / nEndpoints;
        
        // Create scale for x-axis (effect estimates)
        const xScale = d3.scaleLinear()
            .domain(this.config.effectRange)
            .range([0, plotWidth - 20]);
        
        // Create scale for y-axis (programs, initially by original order)
        const yScale = d3.scaleLinear()
            .domain([0, nPrograms - 1])
            .range([10, plotHeight - 20]);
        
        // Prepare endpoint data with positions
        const allEndpoints = [];
        this.data.programs.forEach((program, progIdx) => {
            program.trials.forEach((trial, trialIdx) => {
                trial.endpoints.forEach((endpoint, endpointIdx) => {
                    const panelCol = trialIdx;
                    const panelRow = endpointIdx;
                    
                    const panelX = this.config.caterpillarMargin.left + panelCol * plotWidth;
                    const panelY = this.config.caterpillarMargin.top + panelRow * plotHeight;
                    
                    const x = panelX + xScale(endpoint.effectEstimate);
                    const y = panelY + yScale(progIdx);  // Initially ordered by program index
                    
                    allEndpoints.push({
                        ...endpoint,
                        programId: program.id,
                        programIndex: progIdx,
                        trialIndex: trialIdx,
                        endpointIndex: endpointIdx,
                        panelX: panelX,
                        panelY: panelY,
                        caterpillarX: x,
                        caterpillarY: y,
                        currentAbsolutePosition: endpoint.absolutePosition
                    });
                });
            });
        });
        
        // Store for next steps
        this.data.allEndpoints = allEndpoints;
        this.data.xScale = xScale;
        this.data.yScale = yScale;
        this.data.plotWidth = plotWidth;
        this.data.plotHeight = plotHeight;
        
        // Draw panel borders and labels
        this.drawPanels(nTrials, nEndpoints, plotWidth, plotHeight, xScale);
        
        // Enable buttons after fade out completes
        this.enableButtons(600);
        
        // Update header
        this.updateHeader(
            `Caterpillar plot grid: ${nTrials} trials × ${nEndpoints} endpoints`,
            "Grid layout prepared. Click 'Next Step' to animate endpoints into position."
        );
    }
    
    /**
     * Draw panel borders, labels, and axes
     * 
     * @param {number} nTrials - Number of trials
     * @param {number} nEndpoints - Number of endpoints per trial
     * @param {number} plotWidth - Width of each panel
     * @param {number} plotHeight - Height of each panel
     * @param {d3.Scale} xScale - X-axis scale
     */
    drawPanels(nTrials, nEndpoints, plotWidth, plotHeight, xScale) {
        for (let row = 0; row < nEndpoints; row++) {
            for (let col = 0; col < nTrials; col++) {
                const panelX = this.config.caterpillarMargin.left + col * plotWidth;
                const panelY = this.config.caterpillarMargin.top + row * plotHeight;
                
                // Panel border
                this.svg.append("rect")
                    .attr("class", "panel-border")
                    .attr("x", panelX)
                    .attr("y", panelY)
                    .attr("width", plotWidth)
                    .attr("height", plotHeight)
                    .attr("fill", "none")
                    .attr("stroke", this.config.colors.panelBorder)
                    .attr("stroke-width", 1);
                
                // Column label (trial)
                if (row === 0) {
                    this.svg.append("text")
                        .attr("class", "panel-label")
                        .attr("x", panelX + plotWidth / 2)
                        .attr("y", panelY - 10)
                        .attr("text-anchor", "middle")
                        .text(`Trial ${col + 1}`);
                }
                
                // Row label (endpoint)
                if (col === 0) {
                    this.svg.append("text")
                        .attr("class", "panel-label")
                        .attr("x", panelX - 10)
                        .attr("y", panelY + plotHeight / 2)
                        .attr("text-anchor", "end")
                        .attr("dominant-baseline", "middle")
                        .text(row === 0 ? "Primary" : "Secondary");
                }
                
                // X-axis line at bottom of panel
                const axisY = panelY + plotHeight - 15;
                this.svg.append("line")
                    .attr("class", "axis-line")
                    .attr("x1", panelX + 10)
                    .attr("x2", panelX + plotWidth - 10)
                    .attr("y1", axisY)
                    .attr("y2", axisY)
                    .attr("stroke", this.config.colors.panelLabel)
                    .attr("stroke-width", 1.5);
                
                // X-axis ticks and labels
                this.drawAxisTicks(panelX, axisY, xScale, row, nEndpoints);
                
                // Zero line (vertical)
                const zeroX = panelX + xScale(0);
                this.svg.append("line")
                    .attr("class", "axis-line")
                    .attr("x1", zeroX)
                    .attr("x2", zeroX)
                    .attr("y1", panelY + 5)
                    .attr("y2", panelY + plotHeight - 20)
                    .attr("stroke-dasharray", "2,2");
            }
        }
    }
    
    /**
     * Draw x-axis ticks and labels
     * 
     * @param {number} panelX - Panel x position
     * @param {number} axisY - Axis y position
     * @param {d3.Scale} xScale - X-axis scale
     * @param {number} row - Current row index
     * @param {number} nEndpoints - Total number of endpoints
     */
    drawAxisTicks(panelX, axisY, xScale, row, nEndpoints) {
        const tickValues = [-2, -1, 0, 1, 2, 3, 4, 5];
        
        tickValues.forEach(tickVal => {
            if (tickVal >= this.config.effectRange[0] && tickVal <= this.config.effectRange[1]) {
                const tickX = panelX + xScale(tickVal);
                
                // Tick mark
                this.svg.append("line")
                    .attr("class", "axis-line")
                    .attr("x1", tickX)
                    .attr("x2", tickX)
                    .attr("y1", axisY)
                    .attr("y2", axisY + 5)
                    .attr("stroke", this.config.colors.panelLabel)
                    .attr("stroke-width", 1);
                
                // Tick label (only show on bottom row)
                if (row === nEndpoints - 1) {
                    this.svg.append("text")
                        .attr("class", "axis-text")
                        .attr("x", tickX)
                        .attr("y", axisY + 15)
                        .attr("text-anchor", "middle")
                        .text(tickVal);
                }
            }
        });
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
        
        // Check that endpoints have absolute positions (from Step 2)
        const firstEndpoint = this.data.programs[0].trials[0].endpoints[0];
        if (!firstEndpoint.absolutePosition) {
            console.error(`${this.name}: Endpoints missing absolute positions (run Step 2 first)`);
            return false;
        }
        
        return true;
    }
}
// Export for ES6 modules (if needed)
export { Step3CaterpillarPlots };
