/**
 * State Management for Bayesian Mixture Analysis
 * 
 * Centralized state management for all visualization parameters
 */

export class MixtureState {
    constructor() {
        // Panel 1: Prior
        this.mixtureWeight = 0.5;  // Will be set by calibration
        this.mu1 = 0;  // Fixed at zero
        this.mu2 = 2;  // Aligned with TPP by default
        this.priorSD = 1;
        
        // Panel 2: Likelihood
        this.obsMean = 2.2;
        this.measSD = 5;  // Fixed at 2
        this.n2 = 100;
        this.ratio2 = 1;
        
        // Panel 3: Posterior (computed)
        this.posteriorWeight = 0.5;
        this.post1 = { mean: 0, sd: 1 };
        this.post2 = { mean: 3, sd: 1 };
        
        // Panel 4: Predictive
        this.n3 = 300;
        this.ratio3 = 1;
        this.alpha = 0.025;  // significance level (p-value)
        this.effThreshold = 2;
    }
    
    /**
     * Update a single state property
     * @param {string} key - State property name
     * @param {any} value - New value
     */
    update(key, value) {
        if (this.hasOwnProperty(key)) {
            this[key] = value;
        } else {
            console.warn(`State property "${key}" does not exist`);
        }
    }
    
    /**
     * Get current state as plain object
     * @returns {Object} Current state
     */
    getState() {
        return {
            mixtureWeight: this.mixtureWeight,
            mu1: this.mu1,
            mu2: this.mu2,
            priorSD: this.priorSD,
            obsMean: this.obsMean,
            measSD: this.measSD,
            n2: this.n2,
            ratio2: this.ratio2,
            posteriorWeight: this.posteriorWeight,
            post1: { ...this.post1 },
            post2: { ...this.post2 },
            n3: this.n3,
            ratio3: this.ratio3,
            alpha: this.alpha,
            effThreshold: this.effThreshold
        };
    }
}
