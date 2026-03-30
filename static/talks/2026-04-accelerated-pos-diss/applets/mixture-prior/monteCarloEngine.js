/**
 * Monte Carlo Engine for Multivariate Normal Calculations
 * (Identical to mixture/ version — needed for weight calibration)
 */

export class MonteCarloEngine {
    constructor() {
        this.cache = new Map();
    }

    randn() {
        const u1 = Math.random();
        const u2 = Math.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }

    choleskyDecomposition(matrix) {
        const n = matrix.length;
        const L = Array(n).fill(0).map(() => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j <= i; j++) {
                let sum = 0;
                for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k];
                L[i][j] = i === j
                    ? Math.sqrt(matrix[i][i] - sum)
                    : (matrix[i][j] - sum) / L[j][j];
            }
        }
        return L;
    }

    matrixVectorMultiply(matrix, vector) {
        return matrix.map(row => row.reduce((s, v, j) => s + v * vector[j], 0));
    }

    sampleMultivariateNormal(mean, L) {
        const z = mean.map(() => this.randn());
        const sample = this.matrixVectorMultiply(L, z);
        return sample.map((v, i) => v + mean[i]);
    }

    multivariateNormalCDF({ mean, cov, threshold, nSamples = 10000 }) {
        const key = JSON.stringify({ mean, cov, threshold, nSamples });
        if (this.cache.has(key)) return this.cache.get(key);

        const L = this.choleskyDecomposition(cov);
        let count = 0;
        for (let i = 0; i < nSamples; i++) {
            const s = this.sampleMultivariateNormal(mean, L);
            if (s.every((v, j) => v >= threshold[j])) count++;
        }
        const probability = count / nSamples;
        const standardError = Math.sqrt(probability * (1 - probability) / nSamples);
        const result = { probability, standardError };
        this.cache.set(key, result);
        return result;
    }

    clearCache() { this.cache.clear(); }
}
