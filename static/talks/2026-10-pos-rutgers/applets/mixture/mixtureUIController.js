/**
 * Mixture UI Controller
 * 
 * Handles all UI interactions and form input events
 */

export class MixtureUIController {
    constructor(state, panelController, calibration) {
        this.state = state;
        this.panelController = panelController;
        this.calibration = calibration;
        
        // Track calibration state
        this.isCalibrated = false;
        this.lastCalibrationParams = null;
    }
    
    /**
     * Get current calibration-relevant parameters
     */
    getCurrentCalibrationParams() {
        return {
            mu2: this.state.mu2,
            benchmarkProb: this.calibration.params.benchmarkProb,
            trialSeries: JSON.stringify(this.calibration.trialSeries)
        };
    }
    
    /**
     * Check if calibration is still valid
     */
    checkCalibrationStatus() {
        if (!this.lastCalibrationParams) {
            return false;
        }
        
        const current = this.getCurrentCalibrationParams();
        
        // Debug logging
        console.log('Checking calibration status:');
        console.log('Current:', current);
        console.log('Last:', this.lastCalibrationParams);
        console.log('mu2 match:', current.mu2 === this.lastCalibrationParams.mu2);
        console.log('benchmarkProb match:', current.benchmarkProb === this.lastCalibrationParams.benchmarkProb);
        console.log('trialSeries match:', current.trialSeries === this.lastCalibrationParams.trialSeries);
        
        const isValid = (
            current.mu2 === this.lastCalibrationParams.mu2 &&
            current.benchmarkProb === this.lastCalibrationParams.benchmarkProb &&
            current.trialSeries === this.lastCalibrationParams.trialSeries
        );
        
        console.log('Is calibrated:', isValid);
        
        return isValid;
    }
    
    /**
     * Update calibration status UI
     */
    updateCalibrationStatusUI() {
        const isCalibrated = this.checkCalibrationStatus();
        const btn = d3.select("#calibrate-btn");
        const statusBadge = d3.select("#calibration-status-badge");
        const statusText = d3.select("#calibration-status-text");
        
        if (isCalibrated) {
            // Calibrated - neutral grey, no action needed
            btn.style("background", "#888888")
               .style("cursor", "default")
               .classed("calibrated", true)
               .classed("needs-calibration", false);
            statusBadge.text("✓");
            statusText.text("Calibrated");
        } else {
            // Needs calibration - space orange call-to-action
            btn.style("background", "#ff4e00")
               .style("cursor", "pointer")
               .classed("calibrated", false)
               .classed("needs-calibration", true);
            statusBadge.text("❌");
            statusText.text("Not calibrated");
        }
        
        this.isCalibrated = isCalibrated;
    }
    
    /**
     * Mark calibration as invalid (params changed)
     */
    invalidateCalibration() {
        this.updateCalibrationStatusUI();
    }
    
    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Panel 1 controls: Prior Distribution
        
        // μ₂ alignment checkbox
        d3.select("#mu2-align-tpp").on("change", () => {
            const isAligned = d3.select("#mu2-align-tpp").node().checked;
            
            if (isAligned) {
                // Hide manual controls
                d3.select("#mu2-manual-controls").style("display", "none");
                
                // Set μ₂ to current TPP value
                this.state.mu2 = this.state.effThreshold;
                d3.select("#mu2-aligned-value").text(this.state.mu2.toFixed(2));
            } else {
                // Show manual controls
                d3.select("#mu2-manual-controls").style("display", "block");
                
                // Set slider to current μ₂ value
                d3.select("#mu2").property("value", this.state.mu2);
                d3.select("#mu2-value").text(this.state.mu2.toFixed(2));
            }
            
            this.invalidateCalibration();
            this.panelController.updateAll();
        });
        
        // μ₂ manual slider
        d3.select("#mu2").on("input", () => {
            this.state.mu2 = +d3.select("#mu2").node().value;
            d3.select("#mu2-value").text(this.state.mu2.toFixed(2));
            this.invalidateCalibration();
            this.panelController.updateAll();
        });
        
        // Panel 2 controls: Likelihood
        d3.select("#obs-mean").on("input", () => {
            this.state.obsMean = +d3.select("#obs-mean").node().value;
            d3.select("#obs-mean-value").text(this.state.obsMean.toFixed(2));
            this.panelController.updateAll();
        });
        
        d3.select("#n2").on("input", () => {
            this.state.n2 = +d3.select("#n2").node().value;
            d3.select("#n2-value").text(this.state.n2);
            this.panelController.updateAll();
        });
        
        // ratio2 removed - fixed to 1:1
        // d3.select("#ratio2").on("change", () => {
        //     this.state.ratio2 = +d3.select("#ratio2").node().value;
        //     this.panelController.updateAll();
        // });
        
        // Panel 4 controls: Predictive
        d3.select("#n3").on("input", () => {
            this.state.n3 = +d3.select("#n3").node().value;
            d3.select("#n3-value").text(this.state.n3);
            this.panelController.updateAll();
        });
        
        // ratio3 removed - fixed to 1:1
        // d3.select("#ratio3").on("change", () => {
        //     this.state.ratio3 = +d3.select("#ratio3").node().value;
        //     this.panelController.updateAll();
        // });
        
        // Significance level is fixed at 0.025 (one-sided) to match standard Phase-3 design.
        
        d3.select("#eff-threshold").on("input", () => {
            this.state.effThreshold = +d3.select("#eff-threshold").node().value;
            d3.select("#eff-threshold-value").text(this.state.effThreshold.toFixed(2));
            
            // If μ₂ is aligned with TPP, update it
            const isAligned = d3.select("#mu2-align-tpp").node().checked;
            if (isAligned) {
                this.state.mu2 = this.state.effThreshold;
                d3.select("#mu2-aligned-value").text(this.state.mu2.toFixed(2));
                this.invalidateCalibration();
            }
            
            this.panelController.updateAll();
        });
        
        // Calibration controls
        d3.select("#benchmark-prob").on("input", () => {
            const value = +d3.select("#benchmark-prob").node().value;
            d3.select("#benchmark-prob-value").text((value * 100).toFixed(1) + "%");
            this.calibration.setCalibrationParams({ benchmarkProb: value });
            this.invalidateCalibration();
        });
        
        d3.select("#calibrate-btn").on("click", () => {
            this.handleCalibrate();
        });
    }
    
    /**
     * Handle calibration button click
     */
    handleCalibrate() {
        // Don't recalibrate if already calibrated
        if (this.checkCalibrationStatus()) {
            return;
        }
        
        // Disable button and show loading
        const btn = d3.select("#calibrate-btn");
        btn.property("disabled", true).text("Calibrating...");
        
        // Run calibration (with small delay for UI update)
        setTimeout(() => {
            this.calibration.calibrateWeight();
            
            // Apply to state and update visualization
            this.calibration.applyToState();
            this.panelController.updateAll();
            
            // Save calibration parameters
            this.lastCalibrationParams = this.getCurrentCalibrationParams();
            
            // Update status UI
            this.updateCalibrationStatusUI();
            
            // Re-enable button
            btn.property("disabled", false).text("Calibrate Prior to Benchmark");
        }, 50);
    }
}
