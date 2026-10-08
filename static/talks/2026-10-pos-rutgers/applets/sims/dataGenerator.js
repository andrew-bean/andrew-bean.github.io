/**
 * DataGenerator Module - Generates hierarchical clinical trial simulation data
 * 
 * Implements a two-level hierarchical model:
 * 1. Program-level means drawn from bivariate normal distribution
 * 2. Study-level outcomes drawn from program-level means
 */

export class DataGenerator {
    /**
     * Create a DataGenerator instance
     * @param {Object} config - Configuration object with width, height, grid settings
     */
    constructor(config) {
        this.config = config;
    }
    
    /**
     * Generate correlated bivariate normal random variables
     * Uses Cholesky decomposition: if Z ~ N(0, I), then μ + L*Z ~ N(μ, Σ)
     * where L*L' = Σ (Cholesky decomposition)
     * 
     * @param {number} mean1 - Mean of first variable
     * @param {number} mean2 - Mean of second variable
     * @param {number} sd1 - Standard deviation of first variable
     * @param {number} sd2 - Standard deviation of second variable
     * @param {number} rho - Correlation coefficient between variables (-1 to 1)
     * @returns {Array<number>} Array of [x1, x2] correlated random variables
     */
    generateBivariateNormal(mean1, mean2, sd1, sd2, rho) {
        // Generate two independent standard normal random variables
        const randomNormal = d3.randomNormal.source(this.config.rng);
        const z1 = randomNormal(0, 1)();
        const z2 = randomNormal(0, 1)();
        
        // Cholesky decomposition for correlation matrix
        // Σ = [sd1^2, rho*sd1*sd2; rho*sd1*sd2, sd2^2]
        // L = [sd1, 0; rho*sd2, sd2*sqrt(1-rho^2)]
        const x1 = mean1 + sd1 * z1;
        const x2 = mean2 + rho * sd2 * z1 + sd2 * Math.sqrt(1 - rho * rho) * z2;
        
        return [x1, x2];
    }
    
    /**
     * Generate random hierarchical clinical trial data
     * 
     * Structure:
     * - Programs: Top level, each with program-level mean
     * - Trials: Multiple trials per program
     * - Endpoints: Primary and/or secondary endpoints per trial
     * 
     * @param {number} nPrograms - Number of programs to generate
     * @param {number} nTrialsPerProgram - Number of trials per program
     * @param {number} nEndpointsPerTrial - Number of endpoints per trial (1 or 2)
     * @param {number} globalMean - Global population mean for effect estimates
     * @param {number} programSD - Between-program standard deviation
     * @param {number} programCorr - Correlation between primary/secondary at program level
     * @param {number} studySD - Within-program (between-study) standard deviation
     * @param {number} studyCorr - Correlation between primary/secondary at study level
     * @returns {Object} Data object with programs array
     */
    generate(nPrograms, nTrialsPerProgram, nEndpointsPerTrial, globalMean, programSD, programCorr, studySD, studyCorr) {
        const programs = [];
        const standardError = 0.5;
        
        for (let i = 0; i < nPrograms; i++) {
            // Step 1: Generate program-level mean for (primary, secondary)
            let programMeanPrimary, programMeanSecondary;
            
            if (nEndpointsPerTrial === 2) {
                // Draw correlated program means
                [programMeanPrimary, programMeanSecondary] = this.generateBivariateNormal(
                    globalMean, globalMean, programSD, programSD, programCorr
                );
            } else {
                // Single endpoint: just primary
                programMeanPrimary = d3.randomNormal.source(this.config.rng)(globalMean, programSD)();
                programMeanSecondary = null;
            }
            
            const trials = [];
            
            for (let j = 0; j < nTrialsPerProgram; j++) {
                const endpoints = [];
                
                if (nEndpointsPerTrial === 1) {
                    // Single endpoint: draw from program mean
                    const effectEstimate = d3.randomNormal.source(this.config.rng)(programMeanPrimary, studySD)();
                    const ciLower = effectEstimate - 1.96 * standardError;
                    const ciUpper = effectEstimate + 1.96 * standardError;
                    const statSig = ciLower > 0;
                    
                    endpoints.push({
                        id: `endpoint_${i}_${j}_0`,
                        endpointType: 'primary',
                        effectEstimate: effectEstimate,
                        ciLower: ciLower,
                        ciUpper: ciUpper,
                        standardError: standardError,
                        statistically_significant: statSig,
                        tpp_relevant: true
                    });
                } else {
                    // Step 2: Draw study-level outcomes from program-level means
                    const [primary, secondary] = this.generateBivariateNormal(
                        programMeanPrimary, programMeanSecondary, studySD, studySD, studyCorr
                    );
                    
                    // Primary endpoint
                    const primaryCiLower = primary - 1.96 * standardError;
                    const primaryCiUpper = primary + 1.96 * standardError;
                    const primaryStatSig = primaryCiLower > 0;
                    
                    endpoints.push({
                        id: `endpoint_${i}_${j}_0`,
                        endpointType: 'primary',
                        effectEstimate: primary,
                        ciLower: primaryCiLower,
                        ciUpper: primaryCiUpper,
                        standardError: standardError,
                        statistically_significant: primaryStatSig,
                        tpp_relevant: true
                    });
                    
                    // Secondary endpoint
                    const secondaryCiLower = secondary - 1.96 * standardError;
                    const secondaryCiUpper = secondary + 1.96 * standardError;
                    const secondaryStatSig = secondaryCiLower > 0;
                    
                    endpoints.push({
                        id: `endpoint_${i}_${j}_1`,
                        endpointType: 'secondary',
                        effectEstimate: secondary,
                        ciLower: secondaryCiLower,
                        ciUpper: secondaryCiUpper,
                        standardError: standardError,
                        statistically_significant: secondaryStatSig,
                        tpp_relevant: true
                    });
                }
                
                trials.push({
                    id: `trial_${i}_${j}`,
                    n_endpoints: nEndpointsPerTrial,
                    endpoints: endpoints
                });
            }
            
            programs.push({
                id: `program_${i}`,
                n_trials: nTrialsPerProgram,
                programMeanPrimary: programMeanPrimary,
                programMeanSecondary: programMeanSecondary,
                trials: trials
            });
        }
        
        return { programs: programs };
    }
    
    /**
     * Calculate grid positions for program rectangles
     * 
     * Arranges programs in a centered grid layout based on configured
     * columns and spacing
     * 
     * @param {number} nPrograms - Number of programs to arrange
     * @returns {Array<Object>} Array of {x, y} position objects (center coordinates)
     */
    calculateGridPositions(nPrograms) {
        // For a tight grid, calculate based on number of programs
        const cols = this.config.grid.cols;
        const rows = this.config.grid.getRows(nPrograms);
        
        const cellSize = this.config.rectSize + this.config.spacing;
        const gridWidth = cols * cellSize - this.config.spacing;
        const gridHeight = rows * cellSize - this.config.spacing;
        
        const startX = (this.config.width - gridWidth) / 2;
        const startY = (this.config.height - gridHeight) / 2;
        
        const positions = [];
        
        for (let i = 0; i < nPrograms; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            
            positions.push({
                x: startX + col * cellSize + this.config.rectSize / 2,
                y: startY + row * cellSize + this.config.rectSize / 2
            });
        }
        
        return positions;
    }
}
