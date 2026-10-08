/**
 * Bayesian Statistical Functions
 * 
 * Collection of statistical functions for Bayesian mixture analysis:
 * - Normal PDF and CDF calculations
 * - Mixture distributions
 * - Bayesian conjugate updates
 * - Standard error calculations
 */

/**
 * Standard normal probability density function
 * @param {number} x - Value to evaluate
 * @param {number} mean - Mean of the distribution
 * @param {number} sd - Standard deviation
 * @returns {number} PDF value at x
 */
export function normalPDF(x, mean, sd) {
    const z = (x - mean) / sd;
    return (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
}

/**
 * Standard normal cumulative distribution function
 * Uses jStat library for accurate CDF calculation
 * @param {number} x - Value to evaluate
 * @param {number} mean - Mean of the distribution
 * @param {number} sd - Standard deviation
 * @returns {number} CDF value at x
 */
export function normalCDF(x, mean, sd) {
    return jStat.normal.cdf(x, mean, sd);
}

/**
 * Mixture of two normal distributions PDF
 * @param {number} x - Value to evaluate
 * @param {number} weight - Weight of first component (0-1)
 * @param {number} mu1 - Mean of first component
 * @param {number} mu2 - Mean of second component
 * @param {number} sd1 - Standard deviation of first component
 * @param {number} sd2 - Standard deviation of second component
 * @returns {number} Mixture PDF value at x
 */
export function mixturePDF(x, weight, mu1, mu2, sd1, sd2) {
    return weight * normalPDF(x, mu1, sd1) + (1 - weight) * normalPDF(x, mu2, sd2);
}

/**
 * Bayesian normal-normal conjugate update
 * Updates normal prior with normal likelihood
 * @param {number} priorMean - Prior distribution mean
 * @param {number} priorSD - Prior distribution standard deviation
 * @param {number} likelihoodMean - Likelihood (observed data) mean
 * @param {number} likelihoodSD - Likelihood standard deviation
 * @returns {{mean: number, sd: number}} Posterior distribution parameters
 */
export function normalUpdate(priorMean, priorSD, likelihoodMean, likelihoodSD) {
    const priorPrec = 1 / (priorSD * priorSD);
    const likelihoodPrec = 1 / (likelihoodSD * likelihoodSD);
    const postPrec = priorPrec + likelihoodPrec;
    const postSD = Math.sqrt(1 / postPrec);
    const postMean = (priorPrec * priorMean + likelihoodPrec * likelihoodMean) / postPrec;
    return { mean: postMean, sd: postSD };
}

/**
 * Update mixture weights using Bayes' rule
 * @param {number} priorWeight - Prior weight of first component
 * @param {number} mu1 - Mean of first component
 * @param {number} mu2 - Mean of second component
 * @param {number} priorSD - Prior standard deviation
 * @param {number} likelihoodMean - Observed data mean
 * @param {number} likelihoodSD - Likelihood standard deviation
 * @returns {number} Updated weight for first component
 */
export function updateMixtureWeights(priorWeight, mu1, mu2, priorSD, likelihoodMean, likelihoodSD) {
    const likelihood1 = normalPDF(likelihoodMean, mu1, Math.sqrt(priorSD**2 + likelihoodSD**2));
    const likelihood2 = normalPDF(likelihoodMean, mu2, Math.sqrt(priorSD**2 + likelihoodSD**2));
    const marginal = priorWeight * likelihood1 + (1 - priorWeight) * likelihood2;
    const postWeight1 = (priorWeight * likelihood1) / marginal;
    return postWeight1;
}

/**
 * Calculate standard error for treatment effect
 * @param {number} measSD - Measurement standard deviation
 * @param {number} n - Sample size per arm (control group)
 * @param {number} ratio - Treatment to control ratio
 * @returns {number} Standard error
 */
export function calculateSE(measSD, n, ratio) {
    // For ratio r:1, if n is per-arm control group size
    // SE = sigma * sqrt(1/n_control + 1/n_treatment)
    const nControl = n;
    const nTreatment = n * ratio;
    return measSD * Math.sqrt(1/nControl + 1/nTreatment);
}

/**
 * Convert alpha (p-value) to z-score for one-sided test
 * @param {number} alpha - Significance level
 * @returns {number} Z-score
 */
export function alphaToZ(alpha) {
    // For a one-sided test, we need the z-score where P(Z > z) = alpha
    // This is equivalent to finding the (1-alpha) quantile
    // Using inverse normal approximation
    const p = 1 - alpha;
    const t = Math.sqrt(-2 * Math.log(1 - p));
    const c0 = 2.515517;
    const c1 = 0.802853;
    const c2 = 0.010328;
    const d1 = 1.432788;
    const d2 = 0.189269;
    const d3 = 0.001308;
    return t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
}
