// ==UserScript==
// @name         Resolution switcher - BANC
// @namespace    Neuroglancer.BANC
// @version      2025-07-23
// @description  Switches the image resolution/quality between 1px and 4px
// @author       Krzysztof Kruk
// @match        https://spelunker.cave-explorer.org/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=cave-explorer.org
// @grant        none
// ==/UserScript==

/* global viewer */

(function() {
  'use strict';

  const HIGH_RES = 1
  const LOW_RES = 4
  const LS_VAR_NAME = 'kk-image-resolution'

  const checkForTopRow = setInterval(() => {
    if (!document.getElementsByClassName('neuroglancer-viewer-top-row').length) {
      return
    }

    clearInterval(checkForTopRow)
    addButton()
  }, 50)

  function getValue() {
    return parseInt(localStorage.getItem(LS_VAR_NAME), 10) || HIGH_RES
  }

  function setValue(val) {
    viewer.layerManager.getLayerByName('BANC EM').layer_.sliceViewRenderScaleTarget.value = val
    updateButton(val)
    localStorage.setItem(LS_VAR_NAME, val || HIGH_RES)
  }

  let currentValue = getValue()
  let resButton

  function updateButton(val) {
    resButton.textContent = val + 'px'
  }

  function addButton() {
    resButton = document.createElement('button')
    updateButton(currentValue)

    const topBar = document.getElementsByClassName('neuroglancer-viewer-top-row')[0]
    const target = document.getElementsByClassName('neuroglancer-annotation-tool-status')[0]

    topBar.insertBefore(resButton, target)

    resButton.addEventListener('click', e => {
      currentValue = currentValue === LOW_RES ? HIGH_RES : LOW_RES
      setValue(currentValue)
    })
  }

})()
