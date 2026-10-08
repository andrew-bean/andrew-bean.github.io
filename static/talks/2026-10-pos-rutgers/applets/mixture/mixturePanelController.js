/**
 * Mixture Panel Controller
 * 
 * Manages the visualization of 2 panels:
 * - Belief panel: prior, likelihood, and posterior overlaid on one axis
 * - Predictive panel: Phase-3 predictive distribution with success zones
 */

import { 
    normalPDF, 
    normalCDF, 
    mixturePDF, 
    normalUpdate, 
    updateMixtureWeights, 
    calculateSE,
    alphaToZ 
} from './bayesianStats.js';

export class MixturePanelController {
    constructor(state) {
        this.state = state;
        
        // Brand palette (Novartis)
        this.colors = {
            prior: '#a5bff5',       // illustration blue — "before" state
            likelihood: '#d38cc9',  // illustration pink — Phase-2 evidence
            posterior: '#ff4e00',   // space orange — combined belief (hero)
            partial: '#ff7a3a',     // muted orange — significant, below TPP
            success: '#ff4e00',     // space orange — TPP met
            predictiveLine: '#161616',
            sigLine: '#ff7a3a',
            tppLine: '#ff4e00'
        };
        
        // D3 Setup
        this.margin = { top: 8, right: 18, bottom: 30, left: 46 };
        
        // Create SVG groups for each panel (dimensions computed on first draw / resize)
        this.svgBelief = d3.select("#chart-belief").append("g");
        this.svgPredictive = d3.select("#chart-predictive").append("g");
        
        // Scales (ranges updated dynamically per panel)
        this.x = d3.scaleLinear();
        this.yBelief = d3.scaleLinear();
        this.yPredictive = d3.scaleLinear();
        
        // Shared x-axis range variables
        this.sharedXMin = -2;
        this.sharedXMax = 5;
        this.beliefYMax = 1;
        this.predictiveYMax = 1;
        
        window.addEventListener('resize', () => this.updateAll());
    }
    
    /**
     * Measure each chart container and (re)position the drawing group
     */
    measure() {
        const beliefRect = document.querySelector('#chart-belief').parentNode.getBoundingClientRect();
        const predRect = document.querySelector('#chart-predictive').parentNode.getBoundingClientRect();
        
        this.beliefWidth = beliefRect.width - this.margin.left - this.margin.right;
        this.beliefHeight = beliefRect.height - this.margin.top - this.margin.bottom;
        this.predictiveWidth = predRect.width - this.margin.left - this.margin.right;
        this.predictiveHeight = predRect.height - this.margin.top - this.margin.bottom;
        
        d3.select("#chart-belief").attr("width", beliefRect.width).attr("height", beliefRect.height);
        d3.select("#chart-predictive").attr("width", predRect.width).attr("height", predRect.height);
        
        this.svgBelief.attr("transform", `translate(${this.margin.left},${this.margin.top})`);
        this.svgPredictive.attr("transform", `translate(${this.margin.left},${this.margin.top})`);
        
        this.x.range([0, this.beliefWidth]);
        this.yBelief.range([this.beliefHeight, 0]);
        this.yPredictive.range([this.predictiveHeight, 0]);
    }
    
    /**
     * Calculate SD such that P(X > mu2 | mu1=0, sd) = 0.01
     */
    calculatePriorSD() {
        const zScore = 2.326; // For P(Z > z) = 0.01
        this.state.priorSD = this.state.mu2 / zScore;
        d3.select("#auto-sd-value").text(this.state.priorSD.toFixed(2));
    }
    
    /**
     * Update posterior distribution based on prior and likelihood
     */
    updatePosterior() {
        const likelihoodSD = calculateSE(this.state.measSD, this.state.n2, this.state.ratio2);
        
        // Update each component
        this.state.post1 = normalUpdate(this.state.mu1, this.state.priorSD, this.state.obsMean, likelihoodSD);
        this.state.post2 = normalUpdate(this.state.mu2, this.state.priorSD, this.state.obsMean, likelihoodSD);
        
        // Update mixture weights
        this.state.posteriorWeight = updateMixtureWeights(
            this.state.mixtureWeight, 
            this.state.mu1, 
            this.state.mu2, 
            this.state.priorSD, 
            this.state.obsMean, 
            likelihoodSD
        );
    }
    
    /**
     * Calculate shared x-axis range and per-panel y-axis ranges
     */
    calculateSharedXRange() {
        const predictiveSD3 = calculateSE(this.state.measSD, this.state.n3, this.state.ratio3);
        const pred1SD = Math.sqrt(this.state.post1.sd**2 + predictiveSD3**2);
        const pred2SD = Math.sqrt(this.state.post2.sd**2 + predictiveSD3**2);
        const likelihoodSD = calculateSE(this.state.measSD, this.state.n2, this.state.ratio2);
        
        this.sharedXMin = Math.min(
            this.state.mu1 - 4*this.state.priorSD,
            this.state.mu2 - 4*this.state.priorSD,
            this.state.post1.mean - 4*pred1SD,
            this.state.post2.mean - 4*pred2SD,
            this.state.obsMean - 4*likelihoodSD,
            -2
        );
        
        this.sharedXMax = Math.max(
            this.state.mu1 + 4*this.state.priorSD,
            this.state.mu2 + 4*this.state.priorSD,
            this.state.post1.mean + 4*pred1SD,
            this.state.post2.mean + 4*pred2SD,
            this.state.obsMean + 4*likelihoodSD,
            5
        );
        
        // Calculate maximum y value for the belief panel (prior, likelihood, posterior)
        const sampleX = d3.range(this.sharedXMin, this.sharedXMax, 0.1);
        
        const priorMaxY = d3.max(sampleX, x => 
            mixturePDF(x, this.state.mixtureWeight, this.state.mu1, this.state.mu2, this.state.priorSD, this.state.priorSD)
        );
        
        const likelihoodMaxY = normalPDF(this.state.obsMean, this.state.obsMean, likelihoodSD);
        
        const posteriorMaxY = d3.max(sampleX, x => 
            mixturePDF(x, this.state.posteriorWeight, this.state.post1.mean, this.state.post2.mean, this.state.post1.sd, this.state.post2.sd)
        );
        
        this.beliefYMax = Math.max(priorMaxY, likelihoodMaxY, posteriorMaxY) * 1.1;
        
        // Maximum y value for the predictive panel (its own scale)
        const predictiveMaxY = d3.max(sampleX, x => 
            mixturePDF(x, this.state.posteriorWeight, this.state.post1.mean, this.state.post2.mean, pred1SD, pred2SD)
        );
        
        this.predictiveYMax = predictiveMaxY * 1.1;
        
        // Update scales
        this.x.domain([this.sharedXMin, this.sharedXMax]);
        this.yBelief.domain([0, this.beliefYMax]);
        this.yPredictive.domain([0, this.predictiveYMax]);
    }
    
    /**
     * Draw the belief-updating panel: prior, likelihood, and posterior overlaid
     * on a shared axis (mathematically valid since, under conjugate normal
     * updating, the likelihood viewed as a function of the parameter has the
     * same functional form as a normal density).
     */
    drawBeliefPanel() {
        const svg = this.svgBelief;
        svg.selectAll("*").remove();
        
        const likelihoodSD = calculateSE(this.state.measSD, this.state.n2, this.state.ratio2);
        
        const data = d3.range(this.sharedXMin, this.sharedXMax, 0.05).map(x => ({
            x: x,
            prior: mixturePDF(x, this.state.mixtureWeight, this.state.mu1, this.state.mu2, this.state.priorSD, this.state.priorSD),
            likelihood: normalPDF(x, this.state.obsMean, likelihoodSD),
            posterior: mixturePDF(x, this.state.posteriorWeight, this.state.post1.mean, this.state.post2.mean, this.state.post1.sd, this.state.post2.sd)
        }));
        
        // Grid
        svg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${this.beliefHeight})`)
            .call(d3.axisBottom(this.x).tickSize(-this.beliefHeight).tickFormat(""));
        
        svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(this.yBelief).tickSize(-this.beliefWidth).tickFormat(""));
        
        const line = key => d3.line()
            .x(d => this.x(d.x))
            .y(d => this.yBelief(d[key]));
        
        // Prior (secondary — the "before" state)
        svg.append("path")
            .datum(data)
            .attr("class", "density-line")
            .attr("d", line("prior"))
            .attr("stroke", this.colors.prior)
            .attr("stroke-width", 2);
        
        // Likelihood (Phase-2 evidence)
        svg.append("path")
            .datum(data)
            .attr("class", "density-line")
            .attr("d", line("likelihood"))
            .attr("stroke", this.colors.likelihood)
            .attr("stroke-width", 2);
        
        // Posterior (solid, primary — the combined belief)
        svg.append("path")
            .datum(data)
            .attr("class", "density-line")
            .attr("d", line("posterior"))
            .attr("stroke", this.colors.posterior)
            .attr("stroke-width", 3);
        
        // Axes
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${this.beliefHeight})`)
            .call(d3.axisBottom(this.x));
        
        svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(this.yBelief).tickFormat(""));
        
        // Labels
        svg.append("text")
            .attr("transform", `translate(${this.beliefWidth/2},${this.beliefHeight + 28})`)
            .style("text-anchor", "middle")
            .style("font-size", "11px")
            .text("Treatment Effect");
        
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -36)
            .attr("x", -this.beliefHeight/2)
            .style("text-anchor", "middle")
            .style("font-size", "11px")
            .text("Density");
        
        // Legend
        d3.select("#belief-legend").html(`
            <span class="legend-item" style="color:${this.colors.prior}"><span class="legend-swatch"></span>Prior</span>
            <span class="legend-item" style="color:${this.colors.likelihood}"><span class="legend-swatch"></span>Likelihood (Phase-2 data)</span>
            <span class="legend-item" style="color:${this.colors.posterior}"><span class="legend-swatch"></span>Posterior</span>
        `);
    }
    
    /**
     * Draw the Phase-3 predictive distribution panel
     */
    drawPredictivePanel() {
        const svg = this.svgPredictive;
        svg.selectAll("*").remove();
        
        // Phase 3 predictive SE
        const predictiveSD3 = calculateSE(this.state.measSD, this.state.n3, this.state.ratio3);
        
        // Predictive distribution components
        const pred1SD = Math.sqrt(this.state.post1.sd**2 + predictiveSD3**2);
        const pred2SD = Math.sqrt(this.state.post2.sd**2 + predictiveSD3**2);
        
        const data = d3.range(this.sharedXMin, this.sharedXMax, 0.05).map(x => ({
            x: x,
            y: mixturePDF(x, this.state.posteriorWeight, this.state.post1.mean, this.state.post2.mean, pred1SD, pred2SD)
        }));
        
        // Calculate thresholds
        const zScore = alphaToZ(this.state.alpha);
        const sigThresholdValue = zScore * predictiveSD3;
        const effThresholdValue = this.state.effThreshold;
        
        // Calculate probabilities
        const pExceedSig1 = 1 - normalCDF(sigThresholdValue, this.state.post1.mean, pred1SD);
        const pExceedSig2 = 1 - normalCDF(sigThresholdValue, this.state.post2.mean, pred2SD);
        const pExceedSig = this.state.posteriorWeight * pExceedSig1 + (1 - this.state.posteriorWeight) * pExceedSig2;
        
        const pExceedEff1 = 1 - normalCDF(effThresholdValue, this.state.post1.mean, pred1SD);
        const pExceedEff2 = 1 - normalCDF(effThresholdValue, this.state.post2.mean, pred2SD);
        const pExceedEff = this.state.posteriorWeight * pExceedEff1 + (1 - this.state.posteriorWeight) * pExceedEff2;
        
        // Grid
        svg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${this.predictiveHeight})`)
            .call(d3.axisBottom(this.x).tickSize(-this.predictiveHeight).tickFormat(""));
        
        svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(this.yPredictive).tickSize(-this.predictiveWidth).tickFormat(""));
        
        // Colored areas based on thresholds (no shading below significance)
        const area = d3.area()
            .x(d => this.x(d.x))
            .y0(this.predictiveHeight)
            .y1(d => this.yPredictive(d.y));
        
        // Between significance and TPP
        const dataPartial = data.filter(d => d.x >= sigThresholdValue && d.x < effThresholdValue);
        svg.append("path")
            .datum(dataPartial)
            .attr("d", area)
            .attr("fill", this.colors.partial)
            .attr("opacity", 0.45);
        
        // Above TPP
        const dataSuccess = data.filter(d => d.x >= effThresholdValue);
        svg.append("path")
            .datum(dataSuccess)
            .attr("d", area)
            .attr("fill", this.colors.success)
            .attr("opacity", 0.45);
        
        // Main line
        const line = d3.line()
            .x(d => this.x(d.x))
            .y(d => this.yPredictive(d.y));
        
        svg.append("path")
            .datum(data)
            .attr("class", "density-line")
            .attr("d", line)
            .attr("stroke", this.colors.predictiveLine);
        
        // Threshold lines
        svg.append("line")
            .attr("class", "threshold-line")
            .attr("x1", this.x(sigThresholdValue))
            .attr("x2", this.x(sigThresholdValue))
            .attr("y1", 0)
            .attr("y2", this.predictiveHeight)
            .attr("stroke", this.colors.sigLine);
        
        svg.append("line")
            .attr("class", "threshold-line")
            .attr("x1", this.x(effThresholdValue))
            .attr("x2", this.x(effThresholdValue))
            .attr("y1", 0)
            .attr("y2", this.predictiveHeight)
            .attr("stroke", this.colors.tppLine);
        
        // Threshold labels
        svg.append("text")
            .attr("x", this.x(sigThresholdValue))
            .attr("y", this.predictiveHeight + 13)
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .style("fill", this.colors.sigLine)
            .style("font-weight", "bold")
            .text(`Sig: ${sigThresholdValue.toFixed(2)}`);
        
        svg.append("text")
            .attr("x", this.x(effThresholdValue))
            .attr("y", this.predictiveHeight + 13)
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .style("fill", this.colors.tppLine)
            .style("font-weight", "bold")
            .text(`TPP: ${effThresholdValue.toFixed(2)}`);
        
        // Axes
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${this.predictiveHeight})`)
            .call(d3.axisBottom(this.x));
        
        svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(this.yPredictive).tickFormat(""));
        
        // Labels
        svg.append("text")
            .attr("transform", `translate(${this.predictiveWidth/2},${this.predictiveHeight + 28})`)
            .style("text-anchor", "middle")
            .style("font-size", "11px")
            .text("Predicted Treatment Effect");
        
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -36)
            .attr("x", -this.predictiveHeight/2)
            .style("text-anchor", "middle")
            .style("font-size", "11px")
            .text("Predictive Density");
        
        // Legend
        d3.select("#predictive-legend").html(`
            <span class="legend-item" style="color:${this.colors.partial}"><span class="legend-swatch" style="background:${this.colors.partial}"></span>Significant, below TPP</span>
            <span class="legend-item" style="color:${this.colors.success}"><span class="legend-swatch" style="background:${this.colors.success}"></span>Above TPP</span>
        `);
        
        // Stats table (overlaid top-left of the predictive panel), rounded to nearest integer %
        const roundPct = p => Math.round(p * 100);
        d3.select("#predictive-stats").html(`
            <table>
                <thead><tr><th>Outcome</th><th>Prob.</th></tr></thead>
                <tbody>
                    <tr><td>Significant</td><td class="stat-value">${roundPct(pExceedSig)}%</td></tr>
                    <tr><td>Exceeds TPP</td><td class="stat-value">${roundPct(pExceedEff)}%</td></tr>
                </tbody>
            </table>
        `);
    }
    
    /**
     * Update all panels
     */
    updateAll() {
        this.calculatePriorSD();
        this.updatePosterior();
        this.measure();
        this.calculateSharedXRange();
        this.drawBeliefPanel();
        this.drawPredictivePanel();
    }
}
