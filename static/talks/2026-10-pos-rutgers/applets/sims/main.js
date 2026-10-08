/**
 * Main Entry Point for ES6 Modular Clinical Outcomes Visualization
 * 
 * This module serves as the entry point for the modular version of the visualization.
 * It imports all necessary modules and initializes the application.
 */

// Import core utilities and configuration
import { COLORS, config } from './config.js';
import { DataGenerator } from './dataGenerator.js';
import { JSONProcessor } from './jsonProcessor.js';
import { D3Helpers } from './d3Helpers.js';
import { BaseStep } from './baseStep.js';
import { StepManager } from './stepManager.js';
import { StepRegistry } from './stepRegistry.js';
import { UIController } from './uiController.js';

// Import all 19 step classes
import { Step0FloatAndGrid } from './steps/step0FloatAndGrid.js';
import { Step1SplitIntoTrials } from './steps/step1SplitIntoTrials.js';
import { Step2SplitIntoEndpoints } from './steps/step2SplitIntoEndpoints.js';
import { Step3CaterpillarPlots } from './steps/step3CaterpillarPlots.js';
import { Step4AnimateEndpoints } from './steps/step4AnimateEndpoints.js';
import { Step5SortCaterpillar } from './steps/step5SortCaterpillar.js';
import { Step6EvaluatePrimary } from './steps/step6EvaluatePrimary.js';
import { Step7CascadeFailures } from './steps/step7CascadeFailures.js';
import { Step8EvaluateSecondary } from './steps/step8EvaluateSecondary.js';
import { Step9ReorderByProgram } from './steps/step9ReorderByProgram.js';
import { Step10CollapseToPrograms } from './steps/step10CollapseToPrograms.js';
import { Step11EvaluateTPP } from './steps/step11EvaluateTPP.js';
import { Step12ExpandToTrials } from './steps/step12ExpandToTrials.js';
import { Step13RegroupToGrid } from './steps/step13RegroupToGrid.js';
import { Step14CollapseSuccessful } from './steps/step14CollapseSuccessful.js';
import { Step15CollapseSignificant } from './steps/step15CollapseSignificant.js';
import { Step16SafetyFailures } from './steps/step16SafetyFailures.js';
import { Step17RegulatoryFailures } from './steps/step17RegulatoryFailures.js';
import { Step18ReorderByOutcome } from './steps/step18ReorderByOutcome.js';

/**
 * Initialize the application
 * Sets up the SVG, creates instances of all controllers, and sets up event handlers
 */
function initializeApp() {
    console.log('🚀 Initializing ES6 Modular Clinical Outcomes Visualization...');
    
    // Make step classes globally available for StepManager
    window.Step0FloatAndGrid = Step0FloatAndGrid;
    window.Step1SplitIntoTrials = Step1SplitIntoTrials;
    window.Step2SplitIntoEndpoints = Step2SplitIntoEndpoints;
    window.Step3CaterpillarPlots = Step3CaterpillarPlots;
    window.Step4AnimateEndpoints = Step4AnimateEndpoints;
    window.Step5SortCaterpillar = Step5SortCaterpillar;
    window.Step6EvaluatePrimary = Step6EvaluatePrimary;
    window.Step7CascadeFailures = Step7CascadeFailures;
    window.Step8EvaluateSecondary = Step8EvaluateSecondary;
    window.Step9ReorderByProgram = Step9ReorderByProgram;
    window.Step10CollapseToPrograms = Step10CollapseToPrograms;
    window.Step11EvaluateTPP = Step11EvaluateTPP;
    window.Step12ExpandToTrials = Step12ExpandToTrials;
    window.Step13RegroupToGrid = Step13RegroupToGrid;
    window.Step14CollapseSuccessful = Step14CollapseSuccessful;
    window.Step15CollapseSignificant = Step15CollapseSignificant;
    window.Step16SafetyFailures = Step16SafetyFailures;
    window.Step17RegulatoryFailures = Step17RegulatoryFailures;
    window.Step18ReorderByOutcome = Step18ReorderByOutcome;
    
    // Create instances
    const dataGenerator = new DataGenerator(config);
    const jsonProcessor = new JSONProcessor(config);
    
    // Make globally available for backward compatibility
    window.dataGenerator = dataGenerator;
    window.jsonProcessor = jsonProcessor;
    window.config = config;
    window.COLORS = COLORS;
    window.StepManager = StepManager;
    window.StepRegistry = StepRegistry;
    window.D3Helpers = D3Helpers;
    
    // Create UIController which will handle initialization
    const uiController = new UIController(config, dataGenerator, jsonProcessor);
    window.uiController = uiController;
    
    // StepManager.replay() calls this bare global to rebuild the SVG canvas
    window.initializeSVG = () => uiController.initializeSVG();
    
    // Set up event handlers for buttons
    uiController.setupEventHandlers();
    
    console.log('✅ ES6 Module Architecture Loaded!');
    console.log('📦 Modules:', {
        config: '✓',
        DataGenerator: '✓',
        JSONProcessor: '✓',
        D3Helpers: '✓',
        BaseStep: '✓',
        StepManager: '✓',
        StepRegistry: '✓',
        UIController: '✓',
        Steps: '19 classes loaded'
    });
    console.log('🎯 Auto-starting visualization...');
    
    // Auto-run: no Initialize button — show the outcome summary immediately
    uiController.start();
    
    return {
        config,
        COLORS,
        dataGenerator,
        jsonProcessor,
        uiController,
        D3Helpers,
        BaseStep,
        StepManager,
        StepRegistry
    };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

export { initializeApp };
