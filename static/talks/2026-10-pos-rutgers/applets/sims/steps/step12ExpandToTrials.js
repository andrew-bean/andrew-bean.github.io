import { BaseStep } from '../baseStep.js';
/**
 * Step 12: Expand to Trials
 * 
 * Reverses Step 10 by expanding from program-level averages back to trial-level detail:
 * 1. Fade out program-level view (panels, shapes, TPP boxes)
 * 2. Draw new multi-column caterpillar structure (trials × endpoints)
 * 3. Recreate CI lines with proper colors
 * 4. Recreate endpoint shapes with colors from statistical evaluation
 * 5. Add TPP boxes around endpoints from programs that met TPP
 * 
 * This is the most complex step in Task 4.4 - similar complexity to Step 3.
 */

class Step12ExpandToTrials extends BaseStep {
    constructor(svg, data, config) {
        super(svg, data, config, {
            name: "Expand to Trials",
            description: "Expand from program averages to trial-level detail with TPP indicators",
            duration: 1500, // Fade out (600) + setTimeout (700) + fade in (800)
            index: 12,
            dependencies: [11]
        });
    }
    
    execute() {
        const allEndpoints = this.data.allEndpoints;
        const nTrials = this.data.programs[0].n_trials;
        const nEndpoints = this.data.programs[0].trials[0].n_endpoints;
        
        // Calculate multi-column layout (same as Step 3)
        const layoutInfo = this.calculateMultiColumnLayout(nTrials, nEndpoints);
        
        // Phase 1: Fade out program-level view
        this.fadeOutProgramLevelView();
        
        // Phase 2: After fade out, draw new multi-column structure
        setTimeout(() => {
            this.drawMultiColumnPanels(nTrials, nEndpoints, layoutInfo);
            this.recreateCILines(allEndpoints, layoutInfo);
            this.recreateEndpointShapes(allEndpoints, nEndpoints, layoutInfo);
            this.drawTPPBoxes(allEndpoints, nEndpoints);
            
            this.updateHeader(
                "Trial-level results with program TPP status",
                "Green boxes indicate trials from programs that met TPP thresholds. This shows the uncertainty in individual trials even when program-level average meets target. Click 'Next Step' to return to program grid."
            );
            
            this.enableButtons();
        }, 700);
    }
    
    /**
     * Calculate multi-column layout dimensions
     */
    calculateMultiColumnLayout(nTrials, nEndpoints) {
        const plotWidth = (this.config.width - this.config.caterpillarMargin.left - this.config.caterpillarMargin.right) / nTrials;
        const plotHeight = (this.config.height - this.config.caterpillarMargin.top - this.config.caterpillarMargin.bottom) / nEndpoints;
        
        const xScale = d3.scaleLinear()
            .domain(this.config.effectRange)
            .range([0, plotWidth - 20]);
        
        return { plotWidth, plotHeight, xScale };
    }
    
    /**
     * Fade out program-level view elements
     */
    fadeOutProgramLevelView() {
        // Fade out panels
        this.svg.selectAll(".panel-border")
            .transition()
            .duration(600)
            .style("opacity", 0)
            .remove();
        
        this.svg.selectAll(".panel-label")
            .transition()
            .duration(600)
            .style("opacity", 0)
            .remove();
        
        // Fade out axes
        this.svg.selectAll(".axis-line")
            .transition()
            .duration(600)
            .style("opacity", 0)
            .remove();
        
        this.svg.selectAll(".axis-text")
            .transition()
            .duration(600)
            .style("opacity", 0)
            .remove();
        
        // Fade out program average shapes
        this.svg.selectAll(".program-avg-square")
            .transition()
            .duration(600)
            .style("opacity", 0)
            .remove();
        
        this.svg.selectAll(".program-avg-triangle")
            .transition()
            .duration(600)
            .style("opacity", 0)
            .remove();
        
        // Fade out TPP boxes
        this.svg.selectAll(".tpp-success-box")
            .transition()
            .duration(600)
            .style("opacity", 0)
            .remove();
        
        // Remove any leftover endpoint shapes
        this.svg.selectAll(".endpoint-square")
            .transition()
            .duration(600)
            .style("opacity", 0)
            .remove();
        
        this.svg.selectAll(".endpoint-triangle")
            .transition()
            .duration(600)
            .style("opacity", 0)
            .remove();
    }
    
    /**
     * Draw multi-column panel structure with borders, labels, and axes
     */
    drawMultiColumnPanels(nTrials, nEndpoints, layoutInfo) {
        const { plotWidth, plotHeight, xScale } = layoutInfo;
        
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
                    .attr("stroke-width", 1)
                    .style("opacity", 0)
                    .transition()
                    .duration(500)
                    .style("opacity", 1);
                
                // Column label (trial) - only on first row
                if (row === 0) {
                    this.svg.append("text")
                        .attr("class", "panel-label")
                        .attr("x", panelX + plotWidth / 2)
                        .attr("y", panelY - 10)
                        .attr("text-anchor", "middle")
                        .text(`Trial ${col + 1}`)
                        .style("opacity", 0)
                        .transition()
                        .duration(500)
                        .style("opacity", 1);
                }
                
                // Row label (endpoint) - only on first column
                if (col === 0) {
                    this.svg.append("text")
                        .attr("class", "panel-label")
                        .attr("x", panelX - 10)
                        .attr("y", panelY + plotHeight / 2)
                        .attr("text-anchor", "end")
                        .attr("alignment-baseline", "middle")
                        .text(row === 0 ? "Primary" : "Secondary")
                        .style("opacity", 0)
                        .transition()
                        .duration(500)
                        .style("opacity", 1);
                }
                
                this.drawPanelAxis(panelX, panelY, plotWidth, plotHeight, xScale, row, nEndpoints);
            }
        }
    }
    
    /**
     * Draw X-axis, ticks, and zero line for a panel
     */
    drawPanelAxis(panelX, panelY, plotWidth, plotHeight, xScale, row, nEndpoints) {
        const axisY = panelY + plotHeight - 15;
        
        // X-axis line
        this.svg.append("line")
            .attr("class", "axis-line")
            .attr("x1", panelX + 10)
            .attr("x2", panelX + plotWidth - 10)
            .attr("y1", axisY)
            .attr("y2", axisY)
            .attr("stroke", this.config.colors.panelLabel)
            .attr("stroke-width", 1.5)
            .style("opacity", 0)
            .transition()
            .duration(500)
            .style("opacity", 1);
        
        // X-axis ticks and labels
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
                    .attr("stroke-width", 1)
                    .style("opacity", 0)
                    .transition()
                    .duration(500)
                    .style("opacity", 1);
                
                // Tick label (only show on bottom row)
                if (row === nEndpoints - 1) {
                    this.svg.append("text")
                        .attr("class", "axis-text")
                        .attr("x", tickX)
                        .attr("y", axisY + 15)
                        .attr("text-anchor", "middle")
                        .text(tickVal)
                        .style("opacity", 0)
                        .transition()
                        .duration(500)
                        .style("opacity", 1);
                }
            }
        });
        
        // Zero line (vertical)
        const zeroX = panelX + xScale(0);
        this.svg.append("line")
            .attr("class", "axis-line")
            .attr("x1", zeroX)
            .attr("x2", zeroX)
            .attr("y1", panelY + 5)
            .attr("y2", panelY + plotHeight - 20)
            .attr("stroke-dasharray", "2,2")
            .style("opacity", 0)
            .transition()
            .duration(500)
            .style("opacity", 1);
    }
    
    /**
     * Recreate confidence interval lines with proper colors
     */
    recreateCILines(allEndpoints, layoutInfo) {
        const { xScale } = layoutInfo;
        
        const ciLines = this.svg.selectAll(".ci-line")
            .data(allEndpoints)
            .enter()
            .append("line")
            .attr("class", "ci-line")
            .style("stroke", d => this.getCIColor(d))
            .style("stroke-width", 2)
            .attr("x1", d => d.panelX + xScale(d.ciLower))
            .attr("x2", d => d.panelX + xScale(d.ciUpper))
            .attr("y1", d => d.programOrderY)
            .attr("y2", d => d.programOrderY)
            .style("opacity", 0)
            .transition()
            .duration(800)
            .style("opacity", 0.7);
        
        // Store CI lines in data
        this.data.ciLines = ciLines;
    }
    
    /**
     * Get CI line color based on endpoint type and significance
     */
    getCIColor(endpoint) {
        const program = this.data.programs[endpoint.programIndex];
        const trial = program.trials[endpoint.trialIndex];
        
        if (endpoint.endpointType === 'primary') {
            return endpoint.significant ? this.config.colors.significant : this.config.colors.endpointFailed;
        } else {
            // Secondary endpoint
            if (!trial.primarySuccess) {
                return this.config.colors.endpointFailed;
            } else if (endpoint.significant) {
                return this.config.colors.significant;
            } else {
                return this.config.colors.endpointFailed;
            }
        }
    }
    
    /**
     * Recreate endpoint shapes (squares and triangles) with proper colors
     */
    recreateEndpointShapes(allEndpoints, nEndpoints, layoutInfo) {
        const primaryEndpoints = allEndpoints.filter(e => e.endpointType === 'primary');
        const secondaryEndpoints = allEndpoints.filter(e => e.endpointType === 'secondary');
        
        this.log(`Creating endpoint shapes: ${primaryEndpoints.length} primary, ${secondaryEndpoints.length} secondary`);
        
        // Primary squares
        const primarySquares = this.svg.selectAll(".trial-endpoint-square")
            .data(primaryEndpoints)
            .enter()
            .append("rect")
            .attr("class", "endpoint-square trial-endpoint-square")
            .style("fill", d => d.significant ? this.config.colors.significant : this.config.colors.endpointFailed)
            .attr("width", this.config.endpointSize * 1.8)
            .attr("height", this.config.endpointSize * 1.8)
            .attr("x", d => d.caterpillarX - this.config.endpointSize * 0.9)
            .attr("y", d => d.programOrderY - this.config.endpointSize * 0.9)
            .style("opacity", 0);
        
        primarySquares.transition()
            .duration(800)
            .style("opacity", 1);
        
        // Secondary triangles
        if (nEndpoints === 2) {
            const secondaryTriangles = this.svg.selectAll(".trial-endpoint-triangle")
                .data(secondaryEndpoints)
                .enter()
                .append("polygon")
                .attr("class", "endpoint-triangle trial-endpoint-triangle")
                .style("fill", d => this.getSecondaryColor(d))
                .attr("points", d => {
                    const x = d.caterpillarX;
                    const y = d.programOrderY;
                    const s = this.config.endpointSize * 1.2;
                    return `${x},${y-s} ${x-s},${y+s} ${x+s},${y+s}`;
                })
                .style("opacity", 0);
            
            secondaryTriangles.transition()
                .duration(800)
                .style("opacity", 1);
        }
    }
    
    /**
     * Get secondary endpoint color based on primary success and significance
     */
    getSecondaryColor(endpoint) {
        const program = this.data.programs[endpoint.programIndex];
        const trial = program.trials[endpoint.trialIndex];
        
        if (!trial.primarySuccess) {
            return this.config.colors.endpointFailed;
        } else if (endpoint.significant) {
            return this.config.colors.significant;
        } else {
            return this.config.colors.endpointFailed;
        }
    }
    
    /**
     * Draw TPP boxes around endpoints from programs that met TPP
     */
    drawTPPBoxes(allEndpoints, nEndpoints) {
        // Filter endpoints from programs that meet overall TPP
        const endpointsWithTPP = allEndpoints.filter(e => {
            const program = this.data.programs[e.programIndex];
            return program.meetsTPP;
        });
        
        // Primary endpoints
        const primaryWithTPP = endpointsWithTPP.filter(e => e.endpointType === 'primary');
        
        this.svg.selectAll(".tpp-box-trial-primary")
            .data(primaryWithTPP)
            .enter()
            .append("rect")
            .attr("class", "tpp-success-box")
            .attr("width", this.config.endpointSize * 3)
            .attr("height", this.config.endpointSize * 3)
            .attr("x", d => d.caterpillarX - this.config.endpointSize * 1.5)
            .attr("y", d => d.programOrderY - this.config.endpointSize * 1.5)
            .style("fill", "none")
            .style("stroke", this.config.colors.tppBox) // Green
            .style("stroke-width", 2)
            .style("opacity", 0)
            .transition()
            .duration(800)
            .style("opacity", 1);
        
        // Secondary endpoints
        if (nEndpoints === 2) {
            const secondaryWithTPP = endpointsWithTPP.filter(e => e.endpointType === 'secondary');
            
            this.svg.selectAll(".tpp-box-trial-secondary")
                .data(secondaryWithTPP)
                .enter()
                .append("rect")
                .attr("class", "tpp-success-box")
                .attr("width", this.config.endpointSize * 3)
                .attr("height", this.config.endpointSize * 3)
                .attr("x", d => d.caterpillarX - this.config.endpointSize * 1.5)
                .attr("y", d => d.programOrderY - this.config.endpointSize * 1.5)
                .style("fill", "none")
                .style("stroke", this.config.colors.tppBox) // Green
                .style("stroke-width", 2)
                .style("opacity", 0)
                .transition()
                .duration(800)
                .style("opacity", 1);
        }
    }
    
    validate() {
        if (!super.validate()) return false;
        
        if (!this.data.allEndpoints || this.data.allEndpoints.length === 0) {
            this.log("Cannot expand to trials: No endpoint data available", "error");
            return false;
        }
        
        if (!this.data.programs || this.data.programs.length === 0) {
            this.log("Cannot expand to trials: No program data available", "error");
            return false;
        }
        
        return true;
    }
}

// Export for ES6 modules
export { Step12ExpandToTrials };
