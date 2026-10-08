import { BaseStep } from '../baseStep.js';
/**
 * Step 10: Collapse to Programs
 * 
 * Collapses trial-level endpoints to program-level averages:
 * 1. Calculate program average effect estimates
 * 2. Fade out CI lines
 * 3. Animate trial endpoints to converge at program averages (turn black)
 * 4. Fade out old multi-panel structure
 * 5. Create new single-column centered layout
 * 6. Show program average points (larger shapes)
 */

class Step10CollapseToPrograms extends BaseStep {
    constructor(svg, data, config) {
        super(svg, data, config, {
            name: "Collapse to Programs",
            description: "Collapse trial-level results to program averages",
            duration: 2500, // Total: CI fade (600) + convergence (1200) + timeout (1300)
            index: 10,
            dependencies: [9]
        });
    }
    
    execute() {
        const nEndpoints = this.data.programs[0].trials[0].n_endpoints;
        const allEndpoints = this.data.allEndpoints;
        
        // Calculate program-level averages for each endpoint type
        const programAverages = this.calculateProgramAverages(nEndpoints);
        
        // Store program averages in data
        this.data.programAverages = programAverages;
        
        // Calculate new single-column layout (centered)
        const layoutInfo = this.calculateSingleColumnLayout(nEndpoints);
        
        // Assign target positions for program averages
        this.assignTargetPositions(programAverages, layoutInfo);
        
        // Map each trial-level endpoint to its target program average position
        this.mapEndpointsToTargets(allEndpoints, programAverages);
        
        // Create lookup map for endpoints
        const endpointMap = this.createEndpointMap(allEndpoints);
        
        // Phase 1: Fade out CI lines
        this.fadeOutCILines();
        
        // Phase 2: Animate trial-level endpoints to converge at program averages
        this.animateEndpointsToAverages(endpointMap);
        
        // Phase 3: Fade out old panel structure
        this.fadeOutOldPanels();
        
        // Phase 4: After convergence, show program averages (delayed)
        setTimeout(() => {
            this.fadeOutTrialEndpoints();
            this.drawNewPanels(nEndpoints, layoutInfo);
            this.drawProgramAveragePoints(programAverages, nEndpoints);
            
            this.updateHeader(
                "Program-level average efficacy",
                "Trial-level results collapsed to program averages. Click 'Next Step' to evaluate against TPP thresholds."
            );
            
            this.enableButtons();
        }, 1300);
    }
    
    /**
     * Calculate program-level averages for each endpoint type
     */
    calculateProgramAverages(nEndpoints) {
        const programAverages = [];
        
        this.data.programs.forEach((program, progIdx) => {
            // For primary endpoint
            const primaryEndpoints = program.trials.map(t => 
                t.endpoints.find(e => e.endpointType === 'primary')
            );
            const primaryAvg = d3.mean(primaryEndpoints, e => e.effectEstimate);
            
            programAverages.push({
                programIndex: progIdx,
                endpointType: 'primary',
                endpointIndex: 0,
                avgEffectEstimate: primaryAvg,
                programId: program.id
            });
            
            // For secondary endpoint (if exists)
            if (nEndpoints === 2) {
                const secondaryEndpoints = program.trials.map(t => 
                    t.endpoints.find(e => e.endpointType === 'secondary')
                );
                const secondaryAvg = d3.mean(secondaryEndpoints, e => e.effectEstimate);
                
                programAverages.push({
                    programIndex: progIdx,
                    endpointType: 'secondary',
                    endpointIndex: 1,
                    avgEffectEstimate: secondaryAvg,
                    programId: program.id
                });
            }
        });
        
        return programAverages;
    }
    
    /**
     * Calculate new single-column centered layout
     */
    calculateSingleColumnLayout(nEndpoints) {
        const singlePlotWidth = (this.config.width - this.config.caterpillarMargin.left - this.config.caterpillarMargin.right);
        const plotHeight = (this.config.height - this.config.caterpillarMargin.top - this.config.caterpillarMargin.bottom) / nEndpoints;
        
        // Update xScale for single column
        const xScale = d3.scaleLinear()
            .domain(this.config.effectRange)
            .range([0, singlePlotWidth - 20]);
        
        return {
            singlePlotWidth,
            plotHeight,
            xScale
        };
    }
    
    /**
     * Assign target positions for program averages in single column
     */
    assignTargetPositions(programAverages, layoutInfo) {
        const { xScale } = layoutInfo;
        
        programAverages.forEach(avg => {
            const panelX = this.config.caterpillarMargin.left;
            const panelY = this.config.caterpillarMargin.top + avg.endpointIndex * layoutInfo.plotHeight;
            
            avg.panelX = panelX;
            avg.panelY = panelY;
            avg.targetX = panelX + xScale(avg.avgEffectEstimate);
            avg.targetY = panelY + this.data.yScale(avg.programIndex);
        });
    }
    
    /**
     * Map each trial-level endpoint to its target program average position
     */
    mapEndpointsToTargets(allEndpoints, programAverages) {
        allEndpoints.forEach(endpoint => {
            const programAvg = programAverages.find(
                avg => avg.programIndex === endpoint.programIndex && 
                       avg.endpointType === endpoint.endpointType
            );
            if (programAvg) {
                endpoint.targetX = programAvg.targetX;
                endpoint.targetY = programAvg.targetY;
            }
        });
    }
    
    /**
     * Create lookup map for endpoints by their indices
     */
    createEndpointMap(allEndpoints) {
        const endpointMap = new Map();
        allEndpoints.forEach(e => {
            const key = `${e.programIndex}-${e.trialIndex}-${e.endpointIndex}`;
            endpointMap.set(key, e);
        });
        return endpointMap;
    }
    
    /**
     * Fade out CI lines
     */
    fadeOutCILines() {
        this.data.ciLines.transition()
            .duration(600)
            .style("opacity", 0)
            .remove();
    }
    
    /**
     * Animate trial-level endpoints to converge at program averages (turn black)
     */
    animateEndpointsToAverages(endpointMap) {
        // Animate squares
        this.svg.selectAll(".endpoint-square")
            .transition()
            .duration(1200)
            .attr("x", d => {
                const key = `${d.programIndex}-${d.trialIndex}-${d.endpointIndex}`;
                const endpoint = endpointMap.get(key);
                if (endpoint && endpoint.targetX !== undefined) {
                    return endpoint.targetX - this.config.endpointSize * 0.9;
                }
                return d.absolutePosition.x - this.config.endpointSize * 0.9;
            })
            .attr("y", d => {
                const key = `${d.programIndex}-${d.trialIndex}-${d.endpointIndex}`;
                const endpoint = endpointMap.get(key);
                if (endpoint && endpoint.targetY !== undefined) {
                    return endpoint.targetY - this.config.endpointSize * 0.9;
                }
                return d.absolutePosition.y - this.config.endpointSize * 0.9;
            })
            .style("fill", this.config.colors.endpointBlack); // Black
        
        // Animate triangles
        this.svg.selectAll(".endpoint-triangle")
            .transition()
            .duration(1200)
            .attr("points", d => {
                const key = `${d.programIndex}-${d.trialIndex}-${d.endpointIndex}`;
                const endpoint = endpointMap.get(key);
                if (endpoint && endpoint.targetX !== undefined && endpoint.targetY !== undefined) {
                    const x = endpoint.targetX;
                    const y = endpoint.targetY;
                    const s = this.config.endpointSize * 1.2;
                    return `${x},${y-s} ${x-s},${y+s} ${x+s},${y+s}`;
                }
                const x = d.absolutePosition.x;
                const y = d.absolutePosition.y;
                const s = this.config.endpointSize * 1.2;
                return `${x},${y-s} ${x-s},${y+s} ${x+s},${y+s}`;
            })
            .style("fill", this.config.colors.endpointBlack); // Black
    }
    
    /**
     * Fade out old panel borders, labels, and axes
     */
    fadeOutOldPanels() {
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
    }
    
    /**
     * Fade out trial-level endpoints after convergence
     */
    fadeOutTrialEndpoints() {
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
     * Draw new single-column panel borders and labels
     */
    drawNewPanels(nEndpoints, layoutInfo) {
        const { singlePlotWidth, plotHeight, xScale } = layoutInfo;
        
        for (let row = 0; row < nEndpoints; row++) {
            const panelX = this.config.caterpillarMargin.left;
            const panelY = this.config.caterpillarMargin.top + row * plotHeight;
            
            // Panel border
            this.svg.append("rect")
                .attr("class", "panel-border")
                .attr("x", panelX)
                .attr("y", panelY)
                .attr("width", singlePlotWidth)
                .attr("height", plotHeight)
                .attr("fill", "none")
                .attr("stroke", this.config.colors.panelBorder)
                .attr("stroke-width", 1)
                .style("opacity", 0)
                .transition()
                .duration(500)
                .style("opacity", 1);
            
            // Row label (endpoint)
            this.svg.append("text")
                .attr("class", "panel-label")
                .attr("x", panelX + singlePlotWidth / 2)
                .attr("y", panelY - 10)
                .attr("text-anchor", "middle")
                .text(row === 0 ? "Primary Endpoint (Program Average)" : "Secondary Endpoint (Program Average)")
                .style("opacity", 0)
                .transition()
                .duration(500)
                .style("opacity", 1);
            
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
        
        // Draw single X-axis at the very bottom
        this.drawXAxis(nEndpoints, layoutInfo);
    }
    
    /**
     * Draw X-axis with ticks and labels at bottom
     */
    drawXAxis(nEndpoints, layoutInfo) {
        const { singlePlotWidth, plotHeight, xScale } = layoutInfo;
        const panelX = this.config.caterpillarMargin.left;
        const axisY = this.config.caterpillarMargin.top + (nEndpoints * plotHeight) - 15;
        
        // X-axis line
        this.svg.append("line")
            .attr("class", "axis-line")
            .attr("x1", panelX + 10)
            .attr("x2", panelX + singlePlotWidth - 10)
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
                
                // Tick label
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
        });
    }
    
    /**
     * Draw program average points (larger than trial-level)
     */
    drawProgramAveragePoints(programAverages, nEndpoints) {
        const primaryAverages = programAverages.filter(a => a.endpointType === 'primary');
        const secondaryAverages = programAverages.filter(a => a.endpointType === 'secondary');
        
        // Primary endpoint squares (larger)
        this.svg.selectAll(".program-avg-square")
            .data(primaryAverages)
            .enter()
            .append("rect")
            .attr("class", "endpoint-square")
            .attr("width", this.config.endpointSize * 2.5)
            .attr("height", this.config.endpointSize * 2.5)
            .attr("x", d => d.targetX - this.config.endpointSize * 1.25)
            .attr("y", d => d.targetY - this.config.endpointSize * 1.25)
            .style("fill", this.config.colors.endpointBlack) // Black
            .style("opacity", 0)
            .transition()
            .duration(800)
            .style("opacity", 1);
        
        // Secondary endpoint triangles (larger)
        if (nEndpoints === 2) {
            this.svg.selectAll(".program-avg-triangle")
                .data(secondaryAverages)
                .enter()
                .append("polygon")
                .attr("class", "endpoint-triangle")
                .attr("points", d => {
                    const x = d.targetX;
                    const y = d.targetY;
                    const s = this.config.endpointSize * 1.8;
                    return `${x},${y-s} ${x-s},${y+s} ${x+s},${y+s}`;
                })
                .style("fill", this.config.colors.endpointBlack) // Black
                .style("opacity", 0)
                .transition()
                .duration(800)
                .style("opacity", 1);
        }
    }
    
    validate() {
        if (!super.validate()) return false;
        
        if (!this.data.programs || this.data.programs.length === 0) {
            this.log("Cannot collapse to programs: No program data available", "error");
            return false;
        }
        
        if (!this.data.allEndpoints || this.data.allEndpoints.length === 0) {
            this.log("Cannot collapse to programs: No endpoint data available", "error");
            return false;
        }
        
        if (!this.data.yScale) {
            this.log("Cannot collapse to programs: yScale not defined", "error");
            return false;
        }
        
        return true;
    }
}

// Export for ES6 modules
export { Step10CollapseToPrograms };
