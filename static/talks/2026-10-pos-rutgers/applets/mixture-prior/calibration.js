/**
 * Mixture Weight Calibration
 * Calibrates the mixture weight so that the induced PoS through
 * a standard trial series matches an industry benchmark.
 *
 * Simplified from mixture/mixtureCalibration.js — same core maths,
 * standalone interface (no MixtureState dependency).
 */

import { MonteCarloEngine } from './monteCarloEngine.js';
import { alphaToZ } from './bayesianStats.js';

export class Calibration {
    constructor() {
        this.mc = new MonteCarloEngine();
        this.trialSeries = [
            { phase: 'ph2a',  included: true, alpha: 0.10,  beta: 0.80 },
            { phase: 'ph2b',  included: true, alpha: 0.05,  beta: 0.80 },
            { phase: 'ph3-1', included: true, alpha: 0.025, beta: 0.90 },
            { phase: 'ph3-2', included: true, alpha: 0.025, beta: 0.90 },
        ];
        this.benchmarkProb = 0.15;
        this.mcSamples = 10000;
        this.result = null;
    }

    /* ---- helpers ---- */

    samplingVariance(effectSize, alpha, beta) {
        const z = alphaToZ(alpha) + alphaToZ(1 - beta);
        const se = Math.abs(effectSize) / z;
        return se * se;
    }

    marginalCov(sampVar, priorVar) {
        const n = sampVar.length;
        return Array.from({ length: n }, (_, i) =>
            Array.from({ length: n }, (_, j) =>
                i === j ? sampVar[i] + priorVar : priorVar
            )
        );
    }

    /* ---- public API ---- */

    /** Update one trial row.  updates = [{index, field, value}, …] */
    updateTrialSeries(updates) {
        for (const { index, field, value } of updates) {
            if (this.trialSeries[index]) this.trialSeries[index][field] = value;
        }
        this.mc.clearCache();
    }

    /**
     * Calibrate mixture weight for the given mu2 (= TPP) and priorSD.
     * Returns {weight, probability, benchmark, components, elapsed, params}.
     */
    calibrate(mu2, priorSD) {
        const t0 = performance.now();
        const included = this.trialSeries.filter(t => t.included);
        if (!included.length) throw new Error('At least one trial must be included');

        const m0 = 0;
        const effectSize = mu2 - m0;
        const sigma2 = priorSD ** 2;

        const sv = included.map(t => this.samplingVariance(effectSize, t.alpha, t.beta));
        const B0 = this.marginalCov(sv, sigma2);
        const B1 = this.marginalCov(sv, sigma2);
        const a0 = included.map(() => m0);
        const a1 = included.map(() => mu2);
        const thresh = included.map((t, i) =>
            m0 + Math.sqrt(sv[i]) * alphaToZ(t.alpha)
        );

        const rNull = this.mc.multivariateNormalCDF({ mean: a0, cov: B0, threshold: thresh, nSamples: this.mcSamples });
        const rTPP  = this.mc.multivariateNormalCDF({ mean: a1, cov: B1, threshold: thresh, nSamples: this.mcSamples });

        const raw = (this.benchmarkProb - rTPP.probability) /
                    (rNull.probability - rTPP.probability);
        const weight = Math.max(0.001, Math.min(0.999, raw));
        const prob = weight * rNull.probability + (1 - weight) * rTPP.probability;

        this.result = {
            weight,
            probability: prob,
            benchmark: this.benchmarkProb,
            components: { null: rNull.probability, tpp: rTPP.probability },
            elapsed: performance.now() - t0,
            params: { includedTrials: included },
        };
        return this.result;
    }
}
