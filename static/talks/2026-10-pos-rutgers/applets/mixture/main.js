/**
 * Main Entry Point for Bayesian Mixture Analysis
 * 
 * Initializes the modular ES6 architecture for the visualization
 */

import { MixtureState } from './state.js';
import { MixturePanelController } from './mixturePanelController.js';
import { MixtureUIController } from './mixtureUIController.js';
import { MixtureCalibration } from './mixtureCalibration.js';

console.log('🚀 Initializing ES6 Modular Bayesian Mixture Analysis...');

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM loaded, initializing modules...');
    
    // Create state
    const state = new MixtureState();
    console.log('📊 State initialized:', state.getState());
    
    // Create panel controller
    const panelController = new MixturePanelController(state);
    console.log('🎨 Panel controller initialized');
    
    // Create calibration module
    const calibration = new MixtureCalibration(state);
    console.log('🎯 Calibration module initialized');
    
    // Create UI controller
    const uiController = new MixtureUIController(state, panelController, calibration);
    console.log('🎛️ UI controller initialized');
    
    // Set up event listeners
    uiController.setupEventListeners();
    console.log('👂 Event listeners attached');
    
    // Initialize calibration status UI
    uiController.updateCalibrationStatusUI();
    console.log('🎯 Calibration status UI initialized');
    
    // Initial render
    panelController.updateAll();
    console.log('🖼️ Initial render complete');
    
    console.log('✅ ES6 Modular Bayesian Mixture Analysis loaded!');
    console.log('📦 Modules:', {
        MixtureState: '✓',
        MixturePanelController: '✓',
        MixtureUIController: '✓',
        MixtureCalibration: '✓'
    });
    console.log('🎯 Visualization ready');
    
    // Expose to window for debugging (optional)
    window.mixtureApp = {
        state,
        panelController,
        uiController,
        calibration
    };
});
