/**
 * Mixture Weight Calibration
 * 
 * Calibrates the mixture weight to match industry benchmark success rates.
 * 
 * HIERARCHICAL MODEL STRUCTURE:
 * - True treatment effect: θ ~ w·N(m₀, Σ₀) + (1-w)·N(m₁, Σ₁)
 * - Trial estimates: θ̂ᵢ | θ ~ N(θ, Sᵢ)  [conditionally independent]
 * - Marginal distribution: θ̂ᵢ ~ w·N(m₀, Sᵢ+Σ₀) + (1-w)·N(m₁, Sᵢ+Σ₁)
 * 
 * COVARIANCE STRUCTURE (within each mixture component):
 * Because all trials estimate the same θ, they are marginally correlated:
 * - Diagonal: Var(θ̂ᵢ) = Sᵢ + Σₖ  (prior variance + sampling variance)
 * - Off-diagonal: Cov(θ̂ᵢ, θ̂ⱼ) = Σₖ  (shared prior variance)
 * 
 * This creates the block covariance matrix Bₖ shown in benchmark_prior.Rmd
 */

import { MonteCarloEngine } from './monteCarloEngine.js';
import { normalCDF, alphaToZ } from './bayesianStats.js';

export class MixtureCalibration {
    constructor(state) {
        this.state = state;
        this.mcEngine = new MonteCarloEngine();
        
        // Standard trial series with operating characteristics
        // User can edit which trials to include and their alpha/beta
        this.trialSeries = [
            { phase: 'ph2a', included: true, alpha: 0.10, beta: 0.80 },
            { phase: 'ph2b', included: true, alpha: 0.05, beta: 0.80 },
            { phase: 'ph3-1', included: true, alpha: 0.025, beta: 0.90 },
            { phase: 'ph3-2', included: true, alpha: 0.025, beta: 0.90 }
        ];
        
        // Global calibration parameters
        this.params = {
            benchmarkProb: 0.15,    // Industry benchmark success rate
            mcSamples: 10000         // Monte Carlo samples
        };
        
        // Calibration results
        this.calibratedWeight = null;
        this.calibrationInfo = null;
    }
    
    /**
     * Calculate sampling variance (S_i) for a trial from Fisher information
     * @param {number} effectSize - Target effect size (m₁ - m₀)
     * @param {number} alpha - Significance level
     * @param {number} beta - Power (not type II error rate)
     * @returns {number} Sampling variance S_i
     */
    calcSamplingVariance(effectSize, alpha, beta) {
        const zAlpha = alphaToZ(alpha);
        const zBeta = alphaToZ(1 - beta);  // Convert power to z-score
        
        // Standard formula: SE² = effectSize² / (z_α + z_β)²
        // This gives the sampling variance under the alternative
        const se = Math.abs(effectSize) / (zAlpha + zBeta);
        
        return se * se;
    }
    
    /**
     * Build marginal covariance matrix B_k for trial estimates
     * Implements the hierarchical structure from benchmark_prior.Rmd
     * 
     * @param {Array<number>} samplingVariances - S_i for each trial
     * @param {number} priorVariance - Σ_k (variance of mixture component k)
     * @returns {Array<Array<number>>} Covariance matrix B_k
     */
    buildMarginalCovariance(samplingVariances, priorVariance) {
        const n = samplingVariances.length;
        const cov = Array(n).fill(0).map(() => Array(n).fill(0));
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    // Diagonal: S_i + Σ_k
                    cov[i][j] = samplingVariances[i] + priorVariance;
                } else {
                    // Off-diagonal: Σ_k (trials correlated via shared θ)
                    cov[i][j] = priorVariance;
                }
            }
        }
        
        return cov;
    }
    
    /**
     * Calculate predictive probability of success using Monte Carlo
     * Implements the marginal distribution mixture from benchmark_prior.Rmd
     * Simulates all included trials jointly (ph2a, ph2b, ph3-1, ph3-2, etc.)
     * 
     * @param {number} weight - Mixture weight for null component (w)
     * @returns {Object} {probability, standardError, components}
     */
    calcPredictiveProbability(weight) {
        // Effect sizes from prior components
        const m0 = this.state.mu1;  // Null effect (typically 0)
        const m1 = this.state.mu2;  // TPP effect
        const effectSize = m1 - m0;
        
        // Prior variances (diagonal elements of Σ₀ and Σ₁)
        const sigma0Sq = this.state.priorSD ** 2;
        const sigma1Sq = this.state.priorSD ** 2;
        
        // Get included trials only
        const includedTrials = this.trialSeries.filter(t => t.included);
        const nTrials = includedTrials.length;
        
        if (nTrials === 0) {
            throw new Error('At least one trial must be included in calibration');
        }
        
        // Calculate sampling variance S_i for each trial based on its alpha/beta
        const samplingVariances = includedTrials.map(trial => 
            this.calcSamplingVariance(effectSize, trial.alpha, trial.beta)
        );
        
        // Build marginal covariance matrices B₀ and B₁
        // All trials estimate same θ, so off-diagonals = Σ_k
        const B0 = this.buildMarginalCovariance(samplingVariances, sigma0Sq);
        const B1 = this.buildMarginalCovariance(samplingVariances, sigma1Sq);
        
        // Mean vectors a₀ and a₁ (same mean for all trials within component)
        const a0 = Array(nTrials).fill(m0);
        const a1 = Array(nTrials).fill(m1);
        
        // Critical values t*_i for each trial i: t*ᵢ = m₀ + √Sᵢ · z_{1-αᵢ}
        const threshold = includedTrials.map((trial, i) => {
            const zCrit = alphaToZ(trial.alpha);
            return m0 + Math.sqrt(samplingVariances[i]) * zCrit;
        });
        
        // Monte Carlo estimation: P(all θ̂ᵢ > t*ᵢ | component k)
        const resultNull = this.mcEngine.multivariateNormalCDF({
            mean: a0,
            cov: B0,
            threshold: threshold,
            nSamples: this.params.mcSamples
        });
        
        const resultTPP = this.mcEngine.multivariateNormalCDF({
            mean: a1,
            cov: B1,
            threshold: threshold,
            nSamples: this.params.mcSamples
        });
        
        // Mixture probability: p̃ᵥ = w·P(success|null) + (1-w)·P(success|TPP)
        const probability = weight * resultNull.probability + 
                          (1 - weight) * resultTPP.probability;
        
        // Combined standard error
        const standardError = Math.sqrt(
            weight**2 * resultNull.standardError**2 +
            (1 - weight)**2 * resultTPP.standardError**2
        );
        
        return {
            probability,
            standardError,
            components: {
                null: resultNull.probability,
                tpp: resultTPP.probability
            },
            diagnostics: {
                nTrials,
                includedPhases: includedTrials.map(t => t.phase),
                samplingVariances,
                threshold,
                m0, m1, effectSize
            }
        };
    }
    
    /**
     * Calibrate mixture weight to match benchmark probability
     * 
     * Since p̃_w = w·P(success|null) + (1-w)·P(success|TPP) is linear in w,
     * we can solve directly: w = (target - p_tpp) / (p_null - p_tpp)
     * 
     * No numerical iteration needed!
     * 
     * @returns {Object} Calibration results
     */
    calibrateWeight() {
        const startTime = performance.now();
        
        // Get included trials
        const includedTrials = this.trialSeries.filter(t => t.included);
        const nTrials = includedTrials.length;
        
        if (nTrials === 0) {
            throw new Error('At least one trial must be included in calibration');
        }
        
        // Effect sizes from prior components
        const m0 = this.state.mu1;  // Null effect
        const m1 = this.state.mu2;  // TPP effect
        const effectSize = m1 - m0;
        
        // Prior variances
        const sigma0Sq = this.state.priorSD ** 2;
        const sigma1Sq = this.state.priorSD ** 2;
        
        // Calculate sampling variance S_i for each trial
        const samplingVariances = includedTrials.map(trial => 
            this.calcSamplingVariance(effectSize, trial.alpha, trial.beta)
        );
        
        // Build covariance matrices
        const B0 = this.buildMarginalCovariance(samplingVariances, sigma0Sq);
        const B1 = this.buildMarginalCovariance(samplingVariances, sigma1Sq);
        
        // Mean vectors
        const a0 = Array(nTrials).fill(m0);
        const a1 = Array(nTrials).fill(m1);
        
        // Critical values for each trial
        const threshold = includedTrials.map((trial, i) => {
            const zCrit = alphaToZ(trial.alpha);
            return m0 + Math.sqrt(samplingVariances[i]) * zCrit;
        });
        
        // Monte Carlo: P(all trials significant | component k)
        const resultNull = this.mcEngine.multivariateNormalCDF({
            mean: a0,
            cov: B0,
            threshold: threshold,
            nSamples: this.params.mcSamples
        });
        
        const resultTPP = this.mcEngine.multivariateNormalCDF({
            mean: a1,
            cov: B1,
            threshold: threshold,
            nSamples: this.params.mcSamples
        });
        
        const p_null = resultNull.probability;
        const p_tpp = resultTPP.probability;
        const target = this.params.benchmarkProb;
        
        // Linear interpolation: w = (target - p_tpp) / (p_null - p_tpp)
        const weight = (target - p_tpp) / (p_null - p_tpp);
        
        // Clamp to valid range [0, 1]
        const finalWeight = Math.max(0.001, Math.min(0.999, weight));
        
        // Verify achieved probability
        const finalProb = finalWeight * p_null + (1 - finalWeight) * p_tpp;
        
        // Combined standard error
        const standardError = Math.sqrt(
            finalWeight**2 * resultNull.standardError**2 +
            (1 - finalWeight)**2 * resultTPP.standardError**2
        );
        
        const endTime = performance.now();
        const elapsed = endTime - startTime;
        
        // Store results
        this.calibratedWeight = finalWeight;
        this.calibrationInfo = {
            weight: finalWeight,
            probability: finalProb,
            benchmark: target,
            error: Math.abs(finalProb - target),
            standardError: standardError,
            components: {
                null: p_null,
                tpp: p_tpp
            },
            converged: true,  // Always "converges" since it's analytical
            iterations: 1,     // Only one evaluation needed
            elapsed,
            params: {
                includedTrials: includedTrials,
                benchmarkProb: target,
                mcSamples: this.params.mcSamples
            },
            diagnostics: {
                nTrials,
                includedPhases: includedTrials.map(t => t.phase),
                samplingVariances,
                threshold,
                m0, m1, effectSize,
                rawWeight: weight,  // Before clamping
                clamped: weight !== finalWeight
            }
        };
        
        return this.calibrationInfo;
    }
    
    /**
     * Update trial series (phase, included, alpha, beta)
     */
    updateTrialSeries(updates) {
        // updates is array of {index, field, value}
        updates.forEach(({index, field, value}) => {
            if (this.trialSeries[index]) {
                this.trialSeries[index][field] = value;
            }
        });
        
        // Clear cache when trial series changes
        this.mcEngine.clearCache();
    }
    
    /**
     * Get current trial series
     */
    getTrialSeries() {
        return [...this.trialSeries];
    }
    
    /**
     * Update calibration parameters
     */
    setCalibrationParams(params) {
        Object.assign(this.params, params);
        
        // Clear cache when parameters change
        this.mcEngine.clearCache();
    }
    
    /**
     * Get current calibration parameters
     */
    getCalibrationParams() {
        return { ...this.params };
    }
    
    /**
     * Apply calibrated weight to state
     */
    applyToState() {
        if (this.calibratedWeight !== null) {
            this.state.mixtureWeight = this.calibratedWeight;
            return true;
        }
        return false;
    }
}
