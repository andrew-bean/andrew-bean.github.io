/**
 * Bayesian Statistical Functions (shared utilities)
 * Subset needed for prior construction + calibration.
 */

export function normalPDF(x, mean, sd) {
    const z = (x - mean) / sd;
    return (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
}

export function normalCDF(x, mean, sd) {
    return jStat.normal.cdf(x, mean, sd);
}

export function mixturePDF(x, weight, mu1, mu2, sd1, sd2) {
    return weight * normalPDF(x, mu1, sd1) + (1 - weight) * normalPDF(x, mu2, sd2);
}

export function alphaToZ(alpha) {
    const p = 1 - alpha;
    const t = Math.sqrt(-2 * Math.log(1 - p));
    const c0 = 2.515517, c1 = 0.802853, c2 = 0.010328;
    const d1 = 1.432788, d2 = 0.189269, d3 = 0.001308;
    return t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
}
