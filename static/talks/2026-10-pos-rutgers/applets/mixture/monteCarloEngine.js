/**
 * Monte Carlo Engine for Multivariate Normal Calculations
 * 
 * Provides Monte Carlo estimation of multivariate normal CDF
 * for weight calibration in mixture models
 */

export class MonteCarloEngine {
    constructor() {
        this.cache = new Map();
        this.rngSeed = null;
    }
    
    /**
     * Standard normal random number generator (Box-Muller transform)
     * @returns {number} Random sample from N(0,1)
     */
    randn() {
        const u1 = Math.random();
        const u2 = Math.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }
    
    /**
     * Cholesky decomposition of a positive definite matrix
     * @param {Array<Array<number>>} matrix - Symmetric positive definite matrix
     * @returns {Array<Array<number>>} Lower triangular matrix L such that matrix = L * L^T
     */
    choleskyDecomposition(matrix) {
        const n = matrix.length;
        const L = Array(n).fill(0).map(() => Array(n).fill(0));
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j <= i; j++) {
                let sum = 0;
                for (let k = 0; k < j; k++) {
                    sum += L[i][k] * L[j][k];
                }
                
                if (i === j) {
                    L[i][j] = Math.sqrt(matrix[i][i] - sum);
                } else {
                    L[i][j] = (matrix[i][j] - sum) / L[j][j];
                }
            }
        }
        
        return L;
    }
    
    /**
     * Matrix-vector multiplication: result = matrix * vector
     * @param {Array<Array<number>>} matrix 
     * @param {Array<number>} vector 
     * @returns {Array<number>} Result vector
     */
    matrixVectorMultiply(matrix, vector) {
        return matrix.map(row => 
            row.reduce((sum, val, j) => sum + val * vector[j], 0)
        );
    }
    
    /**
     * Generate a sample from multivariate normal distribution
     * @param {Array<number>} mean - Mean vector
     * @param {Array<Array<number>>} L - Cholesky decomposition of covariance
     * @returns {Array<number>} Sample vector
     */
    sampleMultivariateNormal(mean, L) {
        const n = mean.length;
        const z = Array(n).fill(0).map(() => this.randn());
        const sample = this.matrixVectorMultiply(L, z);
        return sample.map((val, i) => val + mean[i]);
    }
    
    /**
     * Estimate P(X >= threshold) for multivariate normal using Monte Carlo
     * @param {Object} params
     * @param {Array<number>} params.mean - Mean vector
     * @param {Array<Array<number>>} params.cov - Covariance matrix
     * @param {Array<number>} params.threshold - Threshold vector
     * @param {number} params.nSamples - Number of Monte Carlo samples
     * @returns {Object} {probability, standardError}
     */
    multivariateNormalCDF(params) {
        const { mean, cov, threshold, nSamples = 10000 } = params;
        
        // Create cache key
        const cacheKey = JSON.stringify({ mean, cov, threshold, nSamples });
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        // Cholesky decomposition
        const L = this.choleskyDecomposition(cov);
        
        // Monte Carlo estimation
        let count = 0;
        for (let i = 0; i < nSamples; i++) {
            const sample = this.sampleMultivariateNormal(mean, L);
            
            // Check if all components exceed thresholds
            const allAbove = sample.every((val, j) => val >= threshold[j]);
            if (allAbove) count++;
        }
        
        const probability = count / nSamples;
        const standardError = Math.sqrt(probability * (1 - probability) / nSamples);
        
        const result = { probability, standardError };
        this.cache.set(cacheKey, result);
        
        return result;
    }
    
    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
    }
    
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}
