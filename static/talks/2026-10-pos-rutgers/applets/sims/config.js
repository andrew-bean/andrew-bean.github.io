/**
 * Configuration Module
 * Exports color constants and configuration objects for the visualization
 */

// Color Constants
export const COLORS = {
    // Program-level FINAL outcomes (kept red/green/yellow — matches the
    // production outcome grid categories; do not rebrand these).
    tppSuccess: "#00cc00",           // Green for TPP success
    significant: "#FFD700",           // Gold for statistically significant
    safetyFailure: "#FF6B6B",         // Light red-orange for safety failures
    regulatoryFailure: "#8B0000",     // Dark red for regulatory failures
    efficacyFailure: "#e74c3c",       // Red for efficacy failures
    programDefault: "#ACACAC",        // Novartis grey-light — neutral, pre-outcome program rectangles
    
    // Trial and endpoint elements (intermediate, study/endpoint level — branded)
    trialCircle: "#a5bff5",           // Illustration blue for trial circles
    primaryEndpoint: "#d38cc9",        // Illustration pink for primary endpoints
    secondaryEndpoint: "#a5bff5",      // Illustration blue for secondary endpoints
    
    // Caterpillar plot colors (intermediate — branded)
    endpointBlack: "#161616",         // Warm black for sorted endpoints
    endpointSuccess: "#ff4e00",       // Space orange for successful endpoints
    endpointFailed: "#ACACAC",         // Grey-light for failed endpoints
    
    ciLineDefault: "#484848",         // Grey-dark for CI lines
    ciLineBlack: "#161616",           // Warm black for sorted CI lines
    ciLineSuccess: "#ff4e00",         // Space orange for successful CI lines
    ciLineFailed: "#ACACAC",           // Grey-light for failed CI lines
    
    // UI elements
    axisLine: "#ACACAC",              // Grey-light for axis lines
    axisText: "#484848",              // Grey-dark for axis text
    panelLabel: "#161616",            // Warm black for panel labels
    panelBorder: "#dadada",           // Grey-lighter for panel borders
    tppBox: "#ff4e00"                 // Space orange for intermediate TPP-met highlight boxes
};

// Configuration Object
export const config = {
    // Fixed seed so simulated results are reproducible across page loads
    // (used in place of Math.random() / d3's default random source everywhere).
    seed: 20261019,
    rng: d3.randomLcg(20261019),
    
    // Dimensions - make responsive to container width
    width: Math.min(850, window.innerWidth - 80),
    height: 550,
    margin: { top: 30, right: 30, bottom: 30, left: 30 },
    
    // Element sizes - reduced by ~10% for better fit
    rectSize: 54,  // Size of program rectangles (reduced from 60)
    trialCircleRadius: 11,  // Size of trial circles (reduced from 12)
    endpointSize: 3.5,  // Size of endpoint shapes (reduced from 4)
    spacing: 9,  // Spacing between elements in grid (reduced from 10)
    
    // Animation durations (in milliseconds)
    durations: {
        fast: 400,           // Fast transitions
        standard: 800,       // Standard animation duration
        medium: 1000,        // Medium duration
        slow: 1500,          // Slow, smooth transitions
        fadeOut: 500,        // Fade out duration
        buttonDelay: 900,    // Delay before enabling buttons
        stepDelay: 400       // Delay for back button step replay
    },
    
    // Grid layout
    grid: {
        cols: 10,
        getRows: (nPrograms) => Math.ceil(nPrograms / 10)
    },
    
    // Caterpillar plot settings
    caterpillarMargin: { top: 60, right: 80, bottom: 40, left: 80 },
    effectRange: [-2, 5],  // Range for effect estimates on x-axis (adjusted for N(1.5, 1))
    ciLineWidth: 1.5,
    
    // Colors (reference to COLORS object)
    colors: COLORS
};

// Legacy property for backward compatibility
config.animationDuration = config.durations.standard;
