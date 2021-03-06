/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const utils = module.exports = {
  /**
   * @param {!Page} page
   * @param {string} frameId
   * @param {string} url
   */
  attachFrame: async function(page, frameId, url) {
    await page.evaluate(attachFrame, frameId, url);

    function attachFrame(frameId, url) {
      const frame = document.createElement('iframe');
      frame.src = url;
      frame.id = frameId;
      document.body.appendChild(frame);
      return new Promise(x => frame.onload = x);
    }
  },

  /**
   * @param {!Page} page
   * @param {string} frameId
   */
  detachFrame: async function(page, frameId) {
    await page.evaluate(detachFrame, frameId);

    function detachFrame(frameId) {
      const frame = document.getElementById(frameId);
      frame.remove();
    }
  },

  /**
   * @param {!Page} page
   * @param {string} frameId
   * @param {string} url
   */
  navigateFrame: async function(page, frameId, url) {
    await page.evaluate(navigateFrame, frameId, url);

    function navigateFrame(frameId, url) {
      const frame = document.getElementById(frameId);
      frame.src = url;
      return new Promise(x => frame.onload = x);
    }
  },

  /**
   * @param {!Frame} frame
   * @param {string=} indentation
   * @return {string}
   */
  dumpFrames: function(frame, indentation) {
    indentation = indentation || '';
    let result = indentation + frame.url().replace(/:\d{4}\//, ':<PORT>/');
    for (const child of frame.childFrames())
      result += '\n' + utils.dumpFrames(child, '    ' + indentation);
    return result;
  },

  /**
   * @param {!EventEmitter} emitter
   * @param {string} eventName
   * @param {number=} eventCount
   * @return {!Promise<!Object>}
   */
  waitForEvents: function(emitter, eventName, eventCount = 1) {
    let fulfill;
    const promise = new Promise(x => fulfill = x);
    emitter.on(eventName, onEvent);
    return promise;

    function onEvent(event) {
      --eventCount;
      if (eventCount)
        return;
      emitter.removeListener(eventName, onEvent);
      fulfill(event);
    }
  },

  /**
  * @param {!Buffer} pdfBuffer
  * @return {!Promise<!Array<!Object>>}
  */
  getPDFPages: async function(pdfBuffer) {
    const PDFJS = require('pdfjs-dist');
    PDFJS.disableWorker = true;
    const data = new Uint8Array(pdfBuffer);
    const doc = await PDFJS.getDocument(data);
    const pages = [];
    for (let i = 0; i < doc.numPages; ++i) {
      const page = await doc.getPage(i + 1);
      const viewport = page.getViewport(1);
      // Viewport width and height is in PDF points, which is
      // 1/72 of an inch.
      pages.push({
        width: viewport.width / 72,
        height: viewport.height / 72,
      });
      page.cleanup();
    }
    doc.cleanup();
    return pages;
  },

  /**
   * @param {number} px
   * @return {number}
   */
  cssPixelsToInches: function(px) {
    return px / 96;
  },
};
