// ==UserScript==
// @name         Resolution switcher - BANC
// @namespace    Neuroglancer.BANC
// @version      2025-07-26
// @description  Switches image resolution based on zoom level. 1px/4px for zoom <= 2, and 1px/2px for zoom > 2.
// @author       Krzysztof Kruk (updated by Gemini)
// @match        https://spelunker.cave-explorer.org/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=cave-explorer.org
// @grant        none
// ==/UserScript==

/* global viewer */

(function() {
  'use strict';

  // --- Constants ---
  const HIGH_RES = 1;
  const LOW_RES_ZOOMED_IN = 2; // Low-res value when zoomFactor > 2
  const LOW_RES_ZOOMED_OUT = 4; // Low-res value when zoomFactor <= 2
  const ZOOM_THRESHOLD = 2;
  const LS_VAR_NAME = 'kk-image-resolution';
  const LAYER_NAME = 'BANC EM';

  let resButton;

  // --- Core Functions ---

  /**
   * Gets the current resolution value from localStorage.
   */
  function getStoredValue() {
    return parseInt(localStorage.getItem(LS_VAR_NAME), 10) || HIGH_RES;
  }

  /**
   * Sets the resolution on the layer, updates the button text, and saves to localStorage.
   * This is the single source of truth for changing the resolution state.
   */
  function setValue(val) {
    const layer = viewer.layerManager.getLayerByName(LAYER_NAME)?.layer_;
    if (layer) {
      layer.sliceViewRenderScaleTarget.value = val;
    }
    updateButton(val);
    localStorage.setItem(LS_VAR_NAME, val);
  }

  /**
   * Updates the button's text content.
   */
  function updateButton(val) {
    if (resButton) {
      resButton.textContent = val + 'px';
    }
  }


  // --- Event Handlers ---

  /**
   * Handles the click event on the resolution button.
   * Toggles between HIGH_RES and the appropriate LOW_RES based on the current zoom.
   */
  function handleResolutionToggle() {
    const zoom = viewer.navigationState.zoomFactor.value;
    const appropriateLowRes = zoom > ZOOM_THRESHOLD ? LOW_RES_ZOOMED_IN : LOW_RES_ZOOMED_OUT;
    const currentRes = getStoredValue();

    const newRes = currentRes === HIGH_RES ? appropriateLowRes : HIGH_RES;
    setValue(newRes);
  }

  /**
   * Handles the zoom factor change event.
   * Automatically adjusts the low-resolution setting when crossing the zoom threshold.
   */
  function handleZoomChange() {
    const currentRes = getStoredValue();

    // If we are in high-res mode, do nothing. Let the user decide when to switch.
    if (currentRes === HIGH_RES) {
      return;
    }

    const zoom = viewer.navigationState.zoomFactor.value;
    const newAppropriateLowRes = zoom > ZOOM_THRESHOLD ? LOW_RES_ZOOMED_IN : LOW_RES_ZOOMED_OUT;

    // If the current low-res setting is no longer correct for the new zoom level, update it.
    if (currentRes !== newAppropriateLowRes) {
      setValue(newAppropriateLowRes);
    }
  }


  // --- Initialization ---

  /**
   * Creates the button and adds it to the Neuroglancer UI.
   */
  function addButton() {
    resButton = document.createElement('button');
    updateButton(getStoredValue()); // Set initial button text

    const topBar = document.getElementsByClassName('neuroglancer-viewer-top-row')[0];
    const target = document.getElementsByClassName('neuroglancer-annotation-tool-status')[0];
    topBar.insertBefore(resButton, target);

    resButton.addEventListener('click', handleResolutionToggle);
  }

  /**
   * Polls until the Neuroglancer viewer, UI, and layer are ready, then initializes the script.
   */
  const checkForViewerReady = setInterval(() => {
    // Check that the UI, viewer state, and target layer are all available
    if (
      document.getElementsByClassName('neuroglancer-viewer-top-row').length &&
      viewer?.navigationState?.zoomFactor?.changed &&
      viewer?.layerManager?.getLayerByName(LAYER_NAME)?.layer_
    ) {
      clearInterval(checkForViewerReady);

      // 1. Create the UI button
      addButton();

      // 2. Set the initial resolution value from localStorage
      setValue(getStoredValue());

      // 3. Add listener to react to zoom changes
      viewer.navigationState.zoomFactor.changed.add(handleZoomChange);

      console.log('BANC Resolution Switcher (Zoom Aware) loaded.');
    }
  }, 100); // Check every 100ms

})();
