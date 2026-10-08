/**
 * JSONProcessor - Handles computation, validation, and transformation of clinical trial data
 * 
 * This class encapsulates all logic for:
 * 1. Computing derived values (significance, TPP, outcomes)
 * 2. Applying failure logic (safety, regulatory)
 * 3. Preparing data for JSON export
 * 4. Validating JSON structure
 * 5. Transforming JSON back to internal format for visualization
 * 
 * @class JSONProcessor
 */
class JSONProcessor {
    /**
     * Create a JSONProcessor instance
     * @param {Object} config - Configuration object
     */
    constructor(config) {
        this.config = config;
    }
    
    // ============================================================================
    // Computation Methods
    // ============================================================================
    
    /**
     * Compute statistical significance for an endpoint
     * Significance: CI excludes 0 (ci_lower > 0)
     * 
     * @param {Object} endpoint - Endpoint with ciLower property
     * @returns {boolean} True if statistically significant
     */
    computeSignificance(endpoint) {
        return endpoint.ciLower > 0;
    }
    
    /**
     * Compute if endpoint meets TPP threshold
     * TPP: effect estimate meets or exceeds threshold
     * 
     * @param {Object} endpoint - Endpoint with effectEstimate property
     * @param {number} tppThreshold - TPP threshold value
     * @returns {boolean} True if meets TPP
     */
    computeTPP(endpoint, tppThreshold) {
        return endpoint.effectEstimate >= tppThreshold;
    }
    
    /**
     * Compute trial-level primary success (for cascading logic)
     * Primary must be significant for secondary to be testable
     * 
     * @param {Object} trial - Trial with endpoints array
     * @returns {boolean} True if primary endpoint is significant
     */
    computeTrialPrimarySuccess(trial) {
        const primaryEndpoint = trial.endpoints.find(e => e.endpointType === 'primary');
        return primaryEndpoint ? primaryEndpoint.significant : false;
    }
    
    /**
     * Compute program-level averages across trials
     * 
     * @param {Object} program - Program with trials array
     * @returns {Object} Object with avgPrimary and avgSecondary
     */
    computeProgramAverages(program) {
        const primaryEffects = program.trials.map(t => 
            t.endpoints.find(e => e.endpointType === 'primary').effectEstimate
        );
        const avgPrimary = d3.mean(primaryEffects);
        
        let avgSecondary = null;
        if (program.trials[0].endpoints.length > 1) {
            const secondaryEffects = program.trials.map(t => 
                t.endpoints.find(e => e.endpointType === 'secondary').effectEstimate
            );
            avgSecondary = d3.mean(secondaryEffects);
        }
        
        return { avgPrimary, avgSecondary };
    }
    
    /**
     * Compute program-level TPP (based on average effect across trials)
     * 
     * @param {Object} program - Program with trials array
     * @param {number} tppPrimary - TPP threshold for primary endpoint
     * @param {number} tppSecondary - TPP threshold for secondary endpoint
     * @returns {Object} Object with primaryMeetsTPP, secondaryMeetsTPP, and meetsTPP
     */
    computeProgramTPP(program, tppPrimary, tppSecondary) {
        const { avgPrimary, avgSecondary } = this.computeProgramAverages(program);
        const primaryMeetsTPP = avgPrimary >= tppPrimary;
        const secondaryMeetsTPP = avgSecondary !== null ? avgSecondary >= tppSecondary : null;
        
        // Program meets TPP only if ALL tpp_relevant endpoints meet TPP
        // Check all endpoints across all trials
        let meetsTPP = true;
        for (const trial of program.trials) {
            for (const endpoint of trial.endpoints) {
                if (endpoint.tpp_relevant && !endpoint.meetsTPP) {
                    meetsTPP = false;
                    break;
                }
            }
            if (!meetsTPP) break;
        }
        
        return {
            primaryMeetsTPP,
            secondaryMeetsTPP,
            meetsTPP
        };
    }
    
    /**
     * Compute if all endpoints are significant across all trials
     * 
     * @param {Object} program - Program with trials array
     * @returns {boolean} True if all endpoints in all trials are significant
     */
    computeIsSignificant(program) {
        return program.trials.every(trial =>
            trial.endpoints.every(endpoint => endpoint.significant)
        );
    }
    
    /**
     * Compute outcome category based on TPP and significance
     * Categories: "tpp_success", "significant", "efficacy_failure"
     * 
     * @param {Object} program - Program with meetsTPP and isSignificant properties
     * @returns {string} Outcome category
     */
    computeOutcomeCategory(program) {
        if (program.meetsTPP) return "tpp_success";
        if (program.isSignificant) return "significant";
        return "efficacy_failure";
    }
    
    /**
     * Apply safety failures (random selection based on rate)
     * Modifies programs in-place by setting safetyFailed flag
     * 
     * @param {Array} programs - Array of program objects
     * @param {number} safetyRate - Safety failure rate (0-1)
     */
    applySafetyFailures(programs, safetyRate) {
        const tppPrograms = programs.filter(p => p.outcomeCategory === "tpp_success");
        const sigPrograms = programs.filter(p => p.outcomeCategory === "significant");
        
        const nTppFail = Math.round(tppPrograms.length * safetyRate);
        const nSigFail = Math.round(sigPrograms.length * safetyRate);
        
        const shuffledTpp = [...tppPrograms].sort(() => this.config.rng() - 0.5);
        const shuffledSig = [...sigPrograms].sort(() => this.config.rng() - 0.5);
        
        shuffledTpp.slice(0, nTppFail).forEach(p => p.safetyFailed = true);
        shuffledSig.slice(0, nSigFail).forEach(p => p.safetyFailed = true);
    }
    
    /**
     * Apply regulatory failures (random selection, accounting for safety failures)
     * Modifies programs in-place by setting regulatoryFailed flag
     * 
     * @param {Array} programs - Array of program objects
     * @param {number} regulatoryRate - Regulatory failure rate (0-1)
     * @param {number} safetyRate - Safety failure rate (0-1)
     */
    applyRegulatoryFailures(programs, regulatoryRate, safetyRate) {
        const tppPrograms = programs.filter(p => 
            p.outcomeCategory === "tpp_success" && !p.safetyFailed
        );
        const sigPrograms = programs.filter(p => 
            p.outcomeCategory === "significant" && !p.safetyFailed
        );
        
        // Calculate total expected failures (safety + regulatory)
        const tppTotal = programs.filter(p => p.outcomeCategory === "tpp_success").length;
        const sigTotal = programs.filter(p => p.outcomeCategory === "significant").length;
        
        const tppExpectedSafety = tppTotal * safetyRate;
        const sigExpectedSafety = sigTotal * safetyRate;
        
        const tppExpectedTotal = Math.round(
            tppExpectedSafety + (tppTotal - tppExpectedSafety) * regulatoryRate
        );
        const sigExpectedTotal = Math.round(
            sigExpectedSafety + (sigTotal - sigExpectedSafety) * regulatoryRate
        );
        
        const tppSafetyApplied = programs.filter(p => 
            p.outcomeCategory === "tpp_success" && p.safetyFailed
        ).length;
        const sigSafetyApplied = programs.filter(p => 
            p.outcomeCategory === "significant" && p.safetyFailed
        ).length;
        
        const nTppRegFail = Math.max(0, tppExpectedTotal - tppSafetyApplied);
        const nSigRegFail = Math.max(0, sigExpectedTotal - sigSafetyApplied);
        
        const shuffledTpp = [...tppPrograms].sort(() => this.config.rng() - 0.5);
        const shuffledSig = [...sigPrograms].sort(() => this.config.rng() - 0.5);
        
        shuffledTpp.slice(0, nTppRegFail).forEach(p => p.regulatoryFailed = true);
        shuffledSig.slice(0, nSigRegFail).forEach(p => p.regulatoryFailed = true);
    }
    
    /**
     * Compute final color based on outcome and failures
     * Colors: "green", "gold", "dark_red", "light_red", "red"
     * 
     * @param {Object} program - Program with outcome and failure properties
     * @returns {string} Final color category
     */
    computeFinalColor(program) {
        if (program.outcomeCategory === "tpp_success" && 
            !program.safetyFailed && !program.regulatoryFailed) {
            return "green";
        }
        if (program.outcomeCategory === "significant" && 
            !program.safetyFailed && !program.regulatoryFailed) {
            return "gold";
        }
        if (program.regulatoryFailed) return "dark_red";
        if (program.safetyFailed) return "light_red";
        return "red";
    }
    
    // ============================================================================
    // JSON Workflow Methods
    // ============================================================================
    
    /**
     * Prepare JSON data with all computed values
     * This is the main entry point for the JSON workflow
     * 
     * @param {Object} data - Raw data from DataGenerator
     * @param {Object} params - Parameters object with TPP thresholds and failure rates
     * @returns {Object} JSON-formatted data with all computed values
     */
    prepare(data, params) {
        console.log("Computing derived values for JSON export...");
        
        // First, compute all derived values
        data.programs.forEach(program => {
            // Compute significance for all endpoints
            program.trials.forEach(trial => {
                trial.endpoints.forEach(endpoint => {
                    endpoint.significant = this.computeSignificance(endpoint);
                    const tppThreshold = endpoint.endpointType === 'primary' 
                        ? params.tppPrimary 
                        : params.tppSecondary;
                    endpoint.meetsTPP = this.computeTPP(endpoint, tppThreshold);
                });
                
                // Compute trial-level primary success
                trial.primarySuccess = this.computeTrialPrimarySuccess(trial);
                
                // Compute testability for endpoints
                trial.endpoints.forEach(endpoint => {
                    endpoint.testable = endpoint.endpointType === 'primary' 
                        ? true 
                        : trial.primarySuccess;
                });
            });
            
            // Compute program-level values
            const averages = this.computeProgramAverages(program);
            program.programAvgPrimary = averages.avgPrimary;
            program.programAvgSecondary = averages.avgSecondary;
            
            const tppResults = this.computeProgramTPP(program, params.tppPrimary, params.tppSecondary);
            program.primaryMeetsTPP = tppResults.primaryMeetsTPP;
            program.secondaryMeetsTPP = tppResults.secondaryMeetsTPP;
            program.meetsTPP = tppResults.meetsTPP;
            
            program.isSignificant = this.computeIsSignificant(program);
            program.outcomeCategory = this.computeOutcomeCategory(program);
            program.isFailure = program.outcomeCategory === "efficacy_failure";
            
            // Initialize failure flags
            program.safetyFailed = false;
            program.regulatoryFailed = false;
        });
        
        console.log("Applying safety and regulatory failures...");
        
        // Apply safety and regulatory failures
        this.applySafetyFailures(data.programs, params.safetyFailureRate);
        this.applyRegulatoryFailures(data.programs, params.regulatoryFailureRate, params.safetyFailureRate);
        
        // Compute final colors
        data.programs.forEach(program => {
            program.finalColor = this.computeFinalColor(program);
        });
        
        console.log("Building JSON structure...");
        
        // Transform to JSON schema
        const jsonData = {
            metadata: {
                n_programs: data.programs.length,
                n_trials_per_program: data.programs[0].n_trials,
                n_endpoints_per_trial: data.programs[0].trials[0].n_endpoints,
                global_mean: params.globalMean,
                program_sd: params.programSD,
                program_corr: params.programCorr,
                study_sd: params.studySD,
                study_corr: params.studyCorr,
                tpp_primary: params.tppPrimary,
                tpp_secondary: params.tppSecondary,
                safety_failure_rate: params.safetyFailureRate,
                regulatory_failure_rate: params.regulatoryFailureRate,
                generated_at: new Date().toISOString()
            },
            programs: data.programs.map(program => ({
                id: program.id,
                program_mean_primary: program.programMeanPrimary,
                program_mean_secondary: program.programMeanSecondary,
                program_avg_primary: program.programAvgPrimary,
                program_avg_secondary: program.programAvgSecondary,
                primary_meets_tpp: program.primaryMeetsTPP,
                secondary_meets_tpp: program.secondaryMeetsTPP,
                meets_tpp: program.meetsTPP,
                outcome_category: program.outcomeCategory,
                is_significant: program.isSignificant,
                is_failure: program.isFailure,
                safety_failed: program.safetyFailed,
                regulatory_failed: program.regulatoryFailed,
                final_color: program.finalColor,
                trials: program.trials.map((trial, trialIdx) => ({
                    trial_id: trialIdx,
                    primary_success: trial.primarySuccess,
                    endpoints: trial.endpoints.map((endpoint, endpointIdx) => ({
                        endpoint_type: endpoint.endpointType,
                        endpoint_index: endpointIdx,
                        effect_estimate: endpoint.effectEstimate,
                        ci_lower: endpoint.ciLower,
                        ci_upper: endpoint.ciUpper,
                        standard_error: endpoint.standardError,
                        statistically_significant: endpoint.significant,
                        meets_tpp: endpoint.meetsTPP,
                        tpp_relevant: endpoint.tpp_relevant,
                        testable: endpoint.testable
                    }))
                }))
            }))
        };
        
        // Validate structure before returning
        try {
            this.validate(jsonData);
            console.log("JSON structure validation passed");
        } catch (error) {
            console.error("JSON validation failed:", error);
            throw error;
        }
        
        return jsonData;
    }
    
    /**
     * Validate JSON structure (structural checks only, trust values)
     * 
     * @param {Object} jsonData - JSON data to validate
     * @returns {boolean} True if valid
     * @throws {Error} If validation fails
     */
    validate(jsonData) {
        // Basic structural validation (not value validation)
        if (!jsonData.metadata) throw new Error("Missing metadata");
        if (!jsonData.programs) throw new Error("Missing programs array");
        
        // Check metadata has required fields
        const requiredMetadata = [
            'n_programs', 'n_trials_per_program', 'n_endpoints_per_trial',
            'tpp_primary', 'tpp_secondary', 'safety_failure_rate', 
            'regulatory_failure_rate'
        ];
        requiredMetadata.forEach(field => {
            if (jsonData.metadata[field] === undefined) {
                throw new Error(`Missing metadata.${field}`);
            }
        });
        
        // Check programs structure
        if (!Array.isArray(jsonData.programs)) {
            throw new Error("programs must be an array");
        }
        
        jsonData.programs.forEach((program, i) => {
            if (program.id === undefined) throw new Error(`Program ${i} missing id`);
            if (!program.trials || !Array.isArray(program.trials)) {
                throw new Error(`Program ${i} has no trials array`);
            }
            
            program.trials.forEach((trial, j) => {
                if (trial.trial_id === undefined) {
                    throw new Error(`Program ${i} trial ${j} missing trial_id`);
                }
                if (!trial.endpoints || !Array.isArray(trial.endpoints)) {
                    throw new Error(`Program ${i} trial ${j} has no endpoints array`);
                }
                
                trial.endpoints.forEach((endpoint, k) => {
                    const requiredEndpoint = [
                        'endpoint_type', 'effect_estimate', 'ci_lower', 'ci_upper',
                        'statistically_significant', 'meets_tpp'
                    ];
                    requiredEndpoint.forEach(field => {
                        if (endpoint[field] === undefined) {
                            throw new Error(
                                `Program ${i} trial ${j} endpoint ${k} missing ${field}`
                            );
                        }
                    });
                });
            });
        });
        
        return true;
    }
    
    /**
     * Transform JSON structure to internal format for visualization
     * 
     * @param {Object} jsonData - JSON data to transform
     * @returns {Object} Data in internal format ready for visualization
     */
    transform(jsonData) {
        console.log("Transforming JSON to internal format...");
        
        const data = {
            programs: jsonData.programs.map(program => ({
                id: program.id,
                n_trials: program.trials.length,
                
                // Program-level means (from data generation)
                programMeanPrimary: program.program_mean_primary,
                programMeanSecondary: program.program_mean_secondary,
                
                // Program-level averages (computed from trials)
                programAvgPrimary: program.program_avg_primary,
                programAvgSecondary: program.program_avg_secondary,
                
                // TPP indicators
                primaryMeetsTPP: program.primary_meets_tpp,
                secondaryMeetsTPP: program.secondary_meets_tpp,
                meetsTPP: program.meets_tpp,
                
                // Outcome indicators
                outcomeCategory: program.outcome_category,
                isSignificant: program.is_significant,
                isFailure: program.is_failure,
                
                // Failure indicators
                safetyFailed: program.safety_failed,
                regulatoryFailed: program.regulatory_failed,
                
                // Final color
                finalColor: program.final_color,
                
                // Trials
                trials: program.trials.map(trial => ({
                    trialId: trial.trial_id,
                    programId: program.id,
                    n_endpoints: trial.endpoints.length,
                    primarySuccess: trial.primary_success,
                    endpoints: trial.endpoints.map(endpoint => ({
                        endpointType: endpoint.endpoint_type,
                        endpointIndex: endpoint.endpoint_index,
                        effectEstimate: endpoint.effect_estimate,
                        ciLower: endpoint.ci_lower,
                        ciUpper: endpoint.ci_upper,
                        standardError: endpoint.standard_error,
                        significant: endpoint.statistically_significant,
                        meetsTPP: endpoint.meets_tpp,
                        tpp_relevant: endpoint.tpp_relevant,
                        testable: endpoint.testable
                    }))
                }))
            })),
            
            // Metadata
            tppPrimary: jsonData.metadata.tpp_primary,
            tppSecondary: jsonData.metadata.tpp_secondary,
            safetyFailureRate: jsonData.metadata.safety_failure_rate,
            regulatoryFailureRate: jsonData.metadata.regulatory_failure_rate
        };
        
        console.log("Transformation complete. Data ready for visualization.");
        
        return data;
    }
    
    /**
     * Export JSON data to file (downloads to user's Downloads folder)
     * 
     * @param {Object} jsonData - JSON data to export
     * @param {string} filename - Filename for the download
     * @returns {Promise<Object>} The exported JSON data
     */
    async export(jsonData, filename) {
        console.log("Exporting JSON to file:", filename);
        
        const jsonString = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonString], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log("JSON data exported. Summary:");
        console.log(`  - Programs: ${jsonData.programs.length}`);
        console.log(`  - TPP Success: ${jsonData.programs.filter(p => p.outcome_category === 'tpp_success').length}`);
        console.log(`  - Significant: ${jsonData.programs.filter(p => p.outcome_category === 'significant').length}`);
        console.log(`  - Efficacy Failure: ${jsonData.programs.filter(p => p.outcome_category === 'efficacy_failure').length}`);
        console.log(`  - Safety Failures: ${jsonData.programs.filter(p => p.safety_failed).length}`);
        console.log(`  - Regulatory Failures: ${jsonData.programs.filter(p => p.regulatory_failed).length}`);
        
        return jsonData;
    }
}

// ES6 module export
export { JSONProcessor };
