//////////////////////////////////////////////////////////////////////////////
/**
 * @namespace geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class renderer
 *
 * @class
 * @returns {geo.renderer}
 */
//////////////////////////////////////////////////////////////////////////////
geo.renderer = function (arg) {
  "use strict";

  if (!(this instanceof geo.renderer)) {
    return new geo.renderer(arg);
  }
  geo.object.call(this);

  arg = arg || {};
  var m_this = this,
      m_layer = arg.layer === undefined ? null : arg.layer,
      m_canvas = arg.canvas === undefined ? null : arg.canvas,
      m_initialized = false;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get layer of the renderer
   *
   * @returns {*}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.layer = function () {
    return m_layer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get canvas for the renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.canvas = function (val) {
    if (val === undefined) {
      return m_canvas;
    } else {
      m_canvas = val;
      m_this.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get map that this renderer belongs to
   */
  ////////////////////////////////////////////////////////////////////////////
  this.map = function () {
    if (m_layer) {
      return m_layer.map();
    } else {
      return null;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get base layer that belongs to this renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.baseLayer = function () {
    if (m_this.map()) {
      return m_this.map().baseLayer();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set if renderer has been initialized
   */
  ////////////////////////////////////////////////////////////////////////////
  this.initialized = function (val) {
    if (val === undefined) {
      return m_initialized;
    } else {
      m_initialized = val;
      return m_this;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get render API used by the renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.api = function () {
    throw "Should be implemented by derivied classes";
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Reset to default
   */
  ////////////////////////////////////////////////////////////////////////////
  this.reset = function () {
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert array of points from world to GCS coordinate space
   */
  ////////////////////////////////////////////////////////////////////////////
  this.worldToGcs = function () {
    throw "Should be implemented by derivied classes";
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert array of points from display to GCS space
   */
  ////////////////////////////////////////////////////////////////////////////
  this.displayToGcs = function () {
    throw "Should be implemented by derivied classes";
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert array of points from display to GCS space
   */
  ////////////////////////////////////////////////////////////////////////////
  this.gcsToDisplay = function () {
    throw "Should be implemented by derivied classes";
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert array of points from world to display space
   */
  ////////////////////////////////////////////////////////////////////////////
  this.worldToDisplay = function () {
    throw "Should be implemented by derivied classes";
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert array of points from display to world space
   */
  ////////////////////////////////////////////////////////////////////////////
  this.displayToWorld = function () {
    throw "Should be implemented by derivied classes";
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get mouse coodinates related to canvas
   *
   * @param {object} event
   * @returns {object}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.relMouseCoords = function (event) {
    var totalOffsetX = 0,
        totalOffsetY = 0,
        canvasX = 0,
        canvasY = 0,
        currentElement = m_this.canvas();

    do {
      totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
      totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
      currentElement = currentElement.offsetParent;
    } while (currentElement);

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return {
      x: canvasX,
      y: canvasY
    };
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function () {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle resize event
   */
  ////////////////////////////////////////////////////////////////////////////
  this._resize = function () {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Render
   */
  ////////////////////////////////////////////////////////////////////////////
  this._render = function () {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Exit
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function () {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Connect mouse events to the map layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this._connectMouseEvents = function () {

  };

  return this;
};

inherit(geo.renderer, geo.object);
