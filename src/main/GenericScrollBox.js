import React, {PropTypes} from 'react';
import {findDOMNode} from 'react-dom';

const {number, bool, func, oneOf} = PropTypes;

const
  SCROLL_BOX = 'scroll-box',
  TRACK_X = 'scroll-box__track scroll-box__track_x',
  TRACK_Y = 'scroll-box__track scroll-box__track_y',
  HANDLE_X = 'scroll-box__handle scroll-box__handle_x',
  HANDLE_Y = 'scroll-box__handle scroll-box__handle_y',

  HAS_AXIS_X = 'scroll-box_has-axis-x',
  HAS_AXIS_Y = 'scroll-box_has-axis-y',
  SHOW_AXIS_X = 'scroll-box_show-axis-x',
  SHOW_AXIS_Y = 'scroll-box_show-axis-y',

  WRAPPED = 'scroll-box_wrapped',
  NATIVE = 'scroll-box_native',
  OUTSET = 'scroll-box_outset',
  DISABLED = 'scroll-box_disabled',
  TRACK_DRAGGED = 'scroll-box__track_dragged';

export const ScrollAxes = Object.freeze({
  X: 'x',
  Y: 'y',
  XY: 'xy'
});

export const FastTrack = Object.freeze({
  PAGING: 'paging',
  REWIND: 'rewind',
  NONE: null
});

// Default easing function.
function easeCircOut(percentage, elapsedTime, min, max, duration) {
  return max * Math.sqrt(1 - (percentage -= 1) * percentage) + min;
}

export class GenericScrollBox extends React.Component {

  static propTypes = {
    axes: oneOf([ScrollAxes.X, ScrollAxes.Y, ScrollAxes.XY]),
    fastTrack: oneOf([FastTrack.PAGING, FastTrack.REWIND, FastTrack.NONE]),
    fastTrackDuration: number,
    disabled: bool,
    captureKeyboard: bool,
    outset: bool,
    native: bool,
    stepX: number,
    stepY: number,
    easing: func,
    onViewportScroll: func
  };

  static defaultProps = {
    axes: ScrollAxes.XY,
    fastTrack: FastTrack.REWIND,
    fastTrackDuration: 500,
    disabled: false,
    captureKeyboard: true,
    outset: false,
    native: 'orientation' in window,
    stepX: 30,
    stepY: 30,
    easing: easeCircOut,
    onViewportScroll: target => {},
    className: WRAPPED
  };

  // Handle elements.
  handleX = null;
  handleY = null;

  // Scroll position in pixels that was last requested.
  targetX = 0;
  targetY = 0;

  // Previously requested scroll position.
  previousX = 0;
  previousY = 0;

  // Actual scroll position that user observes.
  // This changes repeatedly during animation, while is static these
  // values are equal to `x` and `y`.
  scrollX = 0;
  scrollY = 0;

  // Maximum values for horizontal and vertical scroll positions.
  scrollMaxX = 0;
  scrollMaxY = 0;

  // Sizes of handles in pixels.
  handleXWidth = 0;
  handleYHeight = 0;
  
  // Maximum values for horizontal and vertical handle positions.
  trackMaxX = 0;
  trackMaxY = 0;

  // PRIVATE PROPERTIES
  
  // Handle currently dragged by user.
  _activeHandle = null;

  // Timestamp when scroll position was last updated.
  _timestamp = 0;

  // Duration of currently running animation. In case no animation is in progress `_duration` equals to 0.
  _duration = 0;

  // Prevent triggering `onViewportScroll` if any scrolling occurs.
  _quiet = false;

  // Is fast tracking in progress.
  _fastTracking = false;

  hasAxis(axis) {
    return this.props.axes.indexOf(axis) >= 0;
  }

  getActiveHandle() {
    return this._activeHandle;
  }

  // Is handle being dragged.
  isDraggingHandle() {
    return this._activeHandle != null;
  }

  isFastTracking() {
    return this._fastTracking;
  }

  // Get element provided as viewport.
  getViewport() {
    return findDOMNode(this).lastChild;
  }

  // Get horizontal track.
  getTrackX() {
    return this.handleX && this.handleX.parentNode;
  }

  // Get vertical track.
  getTrackY() {
    return this.handleY && this.handleY.parentNode;
  }

  /**
   * Scroll area by the given amount of pixels.
   *
   * Positive coordinates will scroll to the right and down the content.
   * Negative values will scroll to the left and up the content.
   *
   * If non-numeric value is provided then corresponding position of
   * scroll bar coordinate is not changed.
   *
   * @param {Number} [dx = 0] Horizontal offset.
   * @param {Number} [dy = 0] Vertical offset.
   * @param {Number} [duration = 0] How long the scrolling should run.
   * @param {Boolean} [quiet = false] Prevent invocation of `onViewportScroll` until requested
   *        scrolling is finished. Can be used for synchronization of multiple scroll areas.
   */
  scrollBy(dx, dy, duration = 0, quiet = false) {
    this.scrollTo(this.scrollX + dx, this.scrollY + dy, duration, quiet);
  }

  /**
   * Scroll content to a particular place in pixels.
   *
   * If non-numeric value is provided then corresponding position of
   * scroll bar coordinate is not changed.
   *
   * @param {Number} [x] Horizontal offset.
   * @param {Number} [y] Vertical offset.
   * @param {Number} [duration = 0] How long the scrolling should run.
   * @param {Boolean} [quiet = false] Prevent invocation of `onViewportScroll` until requested
   *        scrolling is finished. Can be used for synchronization of multiple scroll areas.
   */
  scrollTo(x, y, duration = 0, quiet = false) {
    // Consider actual scroll position to be a starting point.
    this._duration = duration;
    this._timestamp = Date.now();
    this.previousX = this.scrollX;
    this.previousY = this.scrollY;
    if (!isNaN(x)) {
      this.targetX = x;
    }
    if (!isNaN(y)) {
      this.targetY = y;
    }
    this._quiet = Boolean(quiet);
    this.forceSync();
  }

  // Synchronize scrollbar positions immediately without waiting for animation frame.
  forceSync() {
    const {handleX, handleY} = this;
    if (handleX == null) {
      return; // Component was unmounted.
    }

    const {native, outset, easing, onViewportScroll} = this.props;
    let el = findDOMNode(this),
        viewport = this.getViewport(),
        width = '100%',
        height = '100%';

    // On desktops scrollbars may have non-zero thickness so in case of outset
    // scrollbar positioning cropped pixes must be compensated.
    if (native && outset) {
      let trackYSize = viewport.offsetWidth - viewport.clientWidth,
          trackXSize = viewport.offsetHeight - viewport.clientHeight;
      if (trackYSize) {
        width = `calc(${width} + ${trackYSize}px)`;
      }
      if (trackXSize) {
        height = `calc(${height} + ${trackXSize}px)`;
      }
    }
    viewport.style.width = width;
    viewport.style.height = height;

    const {clientWidth, clientHeight, scrollWidth, scrollHeight} = viewport,
          SCROLL_MAX_X = this.hasAxis(ScrollAxes.X) * Math.max(0, scrollWidth - clientWidth),
          SCROLL_MAX_Y = this.hasAxis(ScrollAxes.Y) * Math.max(0, scrollHeight - clientHeight);

    this.targetX = Math.max(0, Math.min(Math.round(this.targetX), SCROLL_MAX_X));
    this.targetY = Math.max(0, Math.min(Math.round(this.targetY), SCROLL_MAX_Y));

    el.classList.toggle(SHOW_AXIS_X, SCROLL_MAX_X > 0);
    el.classList.toggle(SHOW_AXIS_Y, SCROLL_MAX_Y > 0);

    const {targetX, targetY, scrollY, scrollX, previousX, previousY, _duration} = this;
    let x = targetX,
        y = targetY;

    if (scrollY == viewport.scrollTop && scrollX == viewport.scrollLeft) {
      let elapsedTime = Date.now() - this._timestamp;
      if (elapsedTime < _duration) {
        let ratio = easing(elapsedTime / _duration, elapsedTime, 0, 1, _duration);

        // Compute eased scroll positions.
        x = Math.round(previousX + ratio * (targetX - previousX));
        y = Math.round(previousY + ratio * (targetY - previousY));
      } else {
        // Scroll animation completed.
        this._duration = 0;
      }
      viewport.scrollLeft = x;
      viewport.scrollTop = y;
    } else {
      // Viewport scroll position is not synced with component state.
      // This is usually caused by system scrolling, resize of element etc.
      // So stop running animation and update component state with current
      // viewport scroll offsets.
      this._duration = 0;
      x = this.targetX = viewport.scrollLeft;
      y = this.targetY = viewport.scrollTop;
    }

    if (scrollX == x && scrollY == y && this.scrollMaxX == SCROLL_MAX_X && this.scrollMaxY == SCROLL_MAX_Y) {
      if (this._duration == 0) {
        // Animation has completed and geometry did not change, so reset flags possibly introduced
        // during scroll request (by `scrollTo` or fast tracking).
        this._quiet = false;
        this._fastTracking = false;
      }

      // Viewport did not change its scroll parameters, so invocation of `onViewportScroll` and
      // further altering geometry of handles and tracks is not required.
      return;
    }

    this.handleXWidth = 0;
    this.handleYHeight = 0;
    this.trackMaxX = 0;
    this.trackMaxY = 0;

    // Update non-native handle positions and sizes.
    if (!native) {
      // Scrollbar size represents ratio of content and viewport sizes.
      handleX.style.width = clientWidth / scrollWidth * 100 + '%';
      handleY.style.height = clientHeight / scrollHeight * 100 + '%';

      this.handleXWidth = handleX.offsetWidth;
      this.handleYHeight = handleY.offsetHeight;
      this.trackMaxX = this.getTrackX().clientWidth - this.handleXWidth;
      this.trackMaxY = this.getTrackY().clientHeight - this.handleYHeight;

      handleX.style.left = this.trackMaxX * x / SCROLL_MAX_X + 'px';
      handleY.style.top = this.trackMaxY * y / SCROLL_MAX_Y + 'px';
    }
    this.scrollX = x;
    this.scrollY = y;
    this.scrollMaxX = SCROLL_MAX_X;
    this.scrollMaxY = SCROLL_MAX_Y;

    if (!this._quiet) {
      onViewportScroll.call(this, this);
    }
  }

  onWheel = e => {
    // Do not disable wheel when native scrolling is enabled.
    // This helps to avoid native smooth scroll collisions.
    if (this.props.disabled || e.isDefaultPrevented()) {
      return;
    }
    let dx = e.deltaX * this.hasAxis(ScrollAxes.X),
        dy = e.deltaY * this.hasAxis(ScrollAxes.Y);

    if (dx + dy == 0) {
      return; // Nothing to scroll.
    }
    // By default, Google Chrome changes scrolling orientation if shift key is pressed,
    // so propagate this behavior to other browsers as well.
    if (e.shiftKey && !window.chrome) {
      [dx, dy] = [dy, dx];
    }
    e.preventDefault();
    this.scrollBy(dx, dy);
  };

  onKeyDown = e => {
    if (this.props.disabled || !this.props.captureKeyboard || e.isDefaultPrevented()) {
      return;
    }
    if (/3[6534879]|40/.test(e.keyCode)) {
      // Prevent page scrolling.
      e.preventDefault();
    }
    let {stepX, stepY} = this.props;
    switch (e.keyCode) {
      case 36: // Home
        this.scrollTo(0, 0);
        break;
      case 35: // End
        this.scrollTo(this.scrollMaxX, this.scrollMaxY);
        break;
      case 33: // PgUp
      case 34: // PgDn
        let viewport = this.getViewport(),
            dy = viewport.clientHeight,
            dx = viewport.clientWidth;
        if (e.keyCode === 33) {
          // For PageUp invert direction.
          dy *= -1;
          dx *= -1;
        }
        if (e.shiftKey) {
          this.scrollBy(dx, 0);
        } else {
          this.scrollBy(0, dy);
        }
        break;
      case 38: // Up
        this.scrollBy(0, -stepY);
        break;
      case 40: // Down
        this.scrollBy(0, stepY);
        break;
      case 37: // Left
        this.scrollBy(-stepX, 0);
        break;
      case 39: // Right
        this.scrollBy(stepX, 0);
        break;
    }
  };

  onDragStart(e, axis) {
    if (this.props.disabled) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    let draggedTrack;
    if (axis == ScrollAxes.X) {
      this._activeHandle = this.handleX;
      draggedTrack = this.getTrackX();
    } else {
      this._activeHandle = this.handleY;
      draggedTrack = this.getTrackY();
    }

    const OFFSET_X = e.pageX - this.handleX.offsetLeft,
          OFFSET_Y = e.pageY - this.handleY.offsetTop;

    let onDrag = e => {
      if (this.handleX == null) {
        onDragEnd(); // Component was unmounted.
      }
      if (axis == ScrollAxes.X) {
        var x = this.scrollMaxX * (e.pageX - OFFSET_X) / this.trackMaxX;
      } else {
        var y = this.scrollMaxY * (e.pageY - OFFSET_Y) / this.trackMaxY;
      }
      this.scrollTo(x, y, 0);
    };

    let onDragEnd = () => {
      this._activeHandle = null;
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', onDragEnd);
      window.removeEventListener('blur', onDragEnd);
      if (this.handleX) {
        // Check component is mounted.
        draggedTrack.classList.remove(TRACK_DRAGGED);
      }
    };

    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('blur', onDragEnd);
    draggedTrack.classList.add(TRACK_DRAGGED);
  };

  onDragStartX = e => this.onDragStart(e, ScrollAxes.X);

  onDragStartY = e => this.onDragStart(e, ScrollAxes.Y);

  onFastTrack(e, axis) {
    if (this.props.disabled) {
      return;
    }
    let x, y;
    const {clientWidth, clientHeight, scrollWidth, scrollHeight} = this.getViewport(),
          POINTER_X = e.pageX - window.scrollX - this.getTrackX().getBoundingClientRect().left,
          POINTER_Y = e.pageY - window.scrollY - this.getTrackY().getBoundingClientRect().top;

    switch (this.props.fastTrack) {

      case FastTrack.PAGING:
        if (axis == ScrollAxes.X) {
          x = this.targetX + (1 - 2 * (POINTER_X < this.handleX.offsetLeft)) * clientWidth;
        } else {
          y = this.targetY + (1 - 2 * (POINTER_Y < this.handleY.offsetTop)) * clientHeight;
        }
        break;

      case FastTrack.REWIND:
        if (axis == ScrollAxes.X) {
          x = POINTER_X / this.getTrackX().clientWidth * scrollWidth - clientWidth / 2;
        } else {
          y = POINTER_Y / this.getTrackY().clientHeight * scrollHeight - clientHeight / 2;
        }
        break;

      default: return;
    }
    this._fastTracking = true;
    this.scrollTo(x, y, this.props.fastTrackDuration);
  };

  onFastTrackX = e => this.onFastTrack(e, ScrollAxes.X);

  onFastTrackY = e => this.onFastTrack(e, ScrollAxes.Y);

  onRenderHandleX = ref => this.handleX = ref;

  onRenderHandleY = ref => this.handleY = ref;

  componentDidMount() {
    let requestForceSync = () => {
      if (this.handleX == null) {
        return; // Component was unmounted.
      }
      if (window.requestAnimationFrame) {
        requestAnimationFrame(requestForceSync);
      } else {
        setTimeout(requestForceSync, 1000 / 30); // 30fps
      }
      this.forceSync();
    };
    requestForceSync();
  }

  componentDidUpdate() {
    this.forceSync();
  }

  render() {
    const {disabled, native, outset, className, children, style} = this.props;
    let classNames = [className, SCROLL_BOX];
    if (disabled) {
      classNames.push(DISABLED);
    }
    if (native) {
      classNames.push(NATIVE);
    }
    if (outset) {
      classNames.push(OUTSET);
    }
    if (this.hasAxis(ScrollAxes.X)) {
      classNames.push(HAS_AXIS_X);
    }
    if (this.hasAxis(ScrollAxes.Y)) {
      classNames.push(HAS_AXIS_Y);
    }
    return (
      <div style={style}
           className={classNames.join(' ')}
           onWheel={this.onWheel}
           onKeyDown={this.onKeyDown}
           tabIndex="-1">
        <div className={TRACK_X}
             onMouseDown={this.onFastTrackX}>
          <div ref={this.onRenderHandleX}
               onMouseDown={this.onDragStartX}
               className={HANDLE_X}/>
        </div>
        <div className={TRACK_Y}
             onMouseDown={this.onFastTrackY}>
          <div ref={this.onRenderHandleY}
               onMouseDown={this.onDragStartY}
               className={HANDLE_Y}/>
        </div>
        {React.Children.only(children)}
      </div>
    );
  }
}
