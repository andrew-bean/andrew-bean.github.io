/**
 * D3Helpers - Utility functions for common D3 patterns (ES6 Module)
 * 
 * Provides static helper methods for frequently-used D3 operations:
 * - Element removal with fade-out animations
 * - Color setting with optional transitions
 * - Sub-unit removal (trial circles and endpoint shapes)
 * - Endpoint lookup map creation for fast access
 * 
 * @class D3Helpers
 */
export class D3Helpers {
    /**
     * Fade out and remove a D3 selection
     * Common pattern: transition opacity to 0, then remove from DOM
     * 
     * @param {d3.Selection} selection - D3 selection to fade out and remove
     * @param {number} duration - Duration of fade-out animation in milliseconds
     * @returns {d3.Transition} D3 transition object
     * 
     * @example
     * D3Helpers.fadeOutAndRemove(svg.selectAll(".old-elements"), 600);
     */
    static fadeOutAndRemove(selection, duration) {
        return selection.transition()
            .duration(duration)
            .style("opacity", 0)
            .remove();
    }
    
    /**
     * Set fill color with optional transition
     * If duration > 0, applies transition; otherwise sets immediately
     * 
     * @param {d3.Selection} selection - D3 selection to color
     * @param {string|Function} colorFn - Color value or function returning color
     * @param {number} [duration=0] - Duration of transition in milliseconds (0 = immediate)
     * @returns {d3.Selection|d3.Transition} D3 selection or transition
     * 
     * @example
     * // Immediate color change
     * D3Helpers.setFillColor(squares, "#FFD700");
     * 
     * // With transition
     * D3Helpers.setFillColor(squares, d => d.color, 800);
     */
    static setFillColor(selection, colorFn, duration = 0) {
        const s = duration > 0 ? 
            selection.transition().duration(duration) : 
            selection;
        return s.style("fill", colorFn);
    }
    
    /**
     * Set stroke color with optional transition
     * If duration > 0, applies transition; otherwise sets immediately
     * 
     * @param {d3.Selection} selection - D3 selection to color
     * @param {string|Function} colorFn - Color value or function returning color
     * @param {number} [duration=0] - Duration of transition in milliseconds (0 = immediate)
     * @returns {d3.Selection|d3.Transition} D3 selection or transition
     * 
     * @example
     * // Immediate stroke change
     * D3Helpers.setStrokeColor(ciLines, "#999");
     * 
     * // With transition
     * D3Helpers.setStrokeColor(ciLines, d => d.significant ? "#FFD700" : "#999", 800);
     */
    static setStrokeColor(selection, colorFn, duration = 0) {
        const s = duration > 0 ? 
            selection.transition().duration(duration) : 
            selection;
        return s.style("stroke", colorFn);
    }
    
    /**
     * Remove sub-units (trial circles and endpoint shapes) for specific programs
     * Used in Steps 14-15 when collapsing programs to show only rectangles
     * 
     * @param {d3.Selection} svg - SVG selection containing the elements
     * @param {Array<string>} programIds - Array of program IDs to remove sub-units for
     * @param {Array<Object>} allEndpoints - Array of all endpoint objects for lookup
     * @param {number} [duration=600] - Duration of fade-out animation in milliseconds
     * 
     * @example
     * // Remove sub-units for successful programs
     * const successIds = data.programs
     *     .filter(p => p.outcomeCategory === 'tpp_success')
     *     .map(p => p.id);
     * D3Helpers.removeSubUnits(svg, successIds, data.allEndpoints, 800);
     */
    static removeSubUnits(svg, programIds, allEndpoints, duration = 600) {
        // Hide and remove trial circles
        svg.selectAll(".trial-circle")
            .filter(d => programIds.includes(d.programId))
            .transition()
            .duration(duration)
            .style("opacity", 0)
            .remove();
        
        // Hide and remove primary endpoint squares
        svg.selectAll(".trial-endpoint-square")
            .filter(d => {
                const endpoint = allEndpoints.find(e => e.id === d.id);
                return endpoint && programIds.includes(endpoint.programId);
            })
            .transition()
            .duration(duration)
            .style("opacity", 0)
            .remove();
        
        // Hide and remove secondary endpoint triangles
        svg.selectAll(".trial-endpoint-triangle")
            .filter(d => {
                const endpoint = allEndpoints.find(e => e.id === d.id);
                return endpoint && programIds.includes(endpoint.programId);
            })
            .transition()
            .duration(duration)
            .style("opacity", 0)
            .remove();
    }
    
    /**
     * Create endpoint lookup map for fast access by indices
     * Useful for Steps 12-15 where endpoints need to be looked up frequently
     * 
     * @param {Array<Object>} allEndpoints - Array of endpoint objects
     * @returns {Map<string, Object>} Map with keys like "0-1-0" (program-trial-endpoint) → endpoint object
     * 
     * @example
     * const endpointMap = D3Helpers.createEndpointLookupMap(data.allEndpoints);
     * const endpoint = endpointMap.get(`${programIndex}-${trialIndex}-${endpointIndex}`);
     */
    static createEndpointLookupMap(allEndpoints) {
        const map = new Map();
        allEndpoints.forEach(endpoint => {
            const key = `${endpoint.programIndex}-${endpoint.trialIndex}-${endpoint.endpointIndex}`;
            map.set(key, endpoint);
        });
        return map;
    }
    
    /**
     * Flatten program data to create allEndpoints array with indices
     * Useful for creating the flat endpoint list needed by visualization steps
     * 
     * @param {Array<Object>} programs - Array of program objects
     * @returns {Array<Object>} Flat array of endpoints with programIndex, trialIndex, endpointIndex
     * 
     * @example
     * const allEndpoints = D3Helpers.flattenEndpoints(data.programs);
     * allEndpoints.forEach(e => console.log(e.programIndex, e.trialIndex, e.endpointIndex));
     */
    static flattenEndpoints(programs) {
        const allEndpoints = [];
        
        programs.forEach((program, programIndex) => {
            program.trials.forEach((trial, trialIndex) => {
                trial.endpoints.forEach((endpoint, endpointIndex) => {
                    allEndpoints.push({
                        ...endpoint,
                        programId: program.id,
                        programIndex: programIndex,
                        trialIndex: trialIndex,
                        trialId: trial.trialId,
                        endpointIndex: endpointIndex,
                        // Create unique ID if not present
                        id: endpoint.id || `endpoint_${programIndex}_${trialIndex}_${endpointIndex}`
                    });
                });
            });
        });
        
        return allEndpoints;
    }
    
    /**
     * Create allTrials array with absolute positions
     * Useful for Steps 1-5 where trials need position information
     * 
     * @param {Array<Object>} programs - Array of program objects (must have gridPosition and trials)
     * @returns {Array<Object>} Flat array of trials with position information
     * 
     * @example
     * const allTrials = D3Helpers.flattenTrials(data.programs);
     * circles.data(allTrials).attr("cx", d => d.absolutePosition.x);
     */
    static flattenTrials(programs) {
        const allTrials = [];
        
        programs.forEach(program => {
            program.trials.forEach(trial => {
                allTrials.push({
                    ...trial,
                    programId: program.id,
                    programIndex: programs.indexOf(program),
                    programGridPosition: program.gridPosition,
                    absolutePosition: trial.absolutePosition || trial.localPosition
                });
            });
        });
        
        return allTrials;
    }
}
