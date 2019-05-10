# React Scroll Box

[![npm version](https://badge.fury.io/js/react-scroll-box.svg)](https://www.npmjs.com/package/react-scroll-box)

_Note_ I'm currently working on `resct-scroll-box@0.3`. It would contain [50+ configurable parameters](https://github.com/smikhalevski/react-scroll-box/blob/master/src/main/GenericScrollBox.js#L32) and would provide fine grained tracking of scrolling events and [their causes](https://github.com/smikhalevski/react-scroll-box/blob/master/src/main/GenericScrollBox.js#L15).

Charged cross-browser and cross-platform scrollable container implementation with no external dependencies but React 0.13+.

Requires [`classList` polyfill](https://www.npmjs.com/package/classlist-polyfill) to work properly in IE9+.

Tested in FF, Chrome, Safari, iOS Safari, Opera and IE9+.

Any help with improvement of this component would be greatly appreciated.

[**API Playground and Live Demo**](http://smikhalevski.github.io/react-scroll-box/)

## Contents

1. [Motivation](#motivation)
2. [`ScrollBox`](#scrollbox)
  1. [Attributes](#attributes)
3. [`GenericScrollBox`](#genericscrollbox)
  1. [Layout](#layout)
  2. [Properties](#properties)
  3. [Methods](#methods)
4. [License](#license)

## Motivation

- Use custom or native scroll bars.
- Highly customizable tracks and handles for both mobile and desktop.
- Inset and outset scroll bars with ease.
- Optional fallback to native inertial scrolling on mobile devices.
- Animated and smooth scrolling with customizable easing functions.
- Scrollbars detect mouse in close proximity and change their style accordingly for better UX.
- Scrollbars are automatically added, removed and resized when scroll box dimensions are changed.
- Scrolling speed is equalized among browsers.
- Customizable keyboard scrolling support.
- Scroll boxes can be nested.
- Custom viewports can be used. Have a look at [`react-text-input`](https://github.com/smikhalevski/react-text-input) for `textarea` with customizable scrollbars.
- Conditionally unwrap scroll box to scroll its content along with page. This can even be done using a media query.
- Scrollbar size represents ratio of content and viewport sizes and can be constrained from CSS.
- LESS styles with a mixin to simplify coloring.
- Lots of other properties to customize scrolling behavior.

## `ScrollBox`

In most cases you should use `ScrollBox` to create a scrollable area, but in case you need more control over viewport use [`GenericScrollBox`](#genericscrollbox).

By default, `ScrollBox` has no decoration and behaves as a regular `div` container. Specify height for scroll box in your styles, otherwise container would contract to zero height.

```jsx
var ScrollBox = require('react-scroll-box').ScrollBox; // ES5

import {ScrollBox, ScrollAxes, FastTrack} from 'react-scroll-box'; // ES6

<ScrollBox style={{height: '200px'}} axes={ScrollAxes.Y} fastTrack={FastTrack.PAGING}>
  Place any content here.
</ScrollBox>
```

### Attributes

#### <code><i>boolean</i> <a name="genericscrollbox-nativescroll"></a> nativeScroll</code>
Use native scrollbars. By default, this flag is set to `true` on mobile platforms and `false` on desktops. Paltforms are distinguished by presence of `window.orientation`.

#### <code><i>[ScrollAxes](#scroll-axes)</i> <a name="genericscrollbox-axes"></a> axes = [ScrollAxes.XY](#scroll-axes-xy)</code>
Scroll axes which are managed by the scroll box. If scroll axis is not listed then corresponding scroll offset would be constantly equal to 0 and any scrolling requests via API or from UI for that axes would be ignored.

#### <code><i>integer</i> hoverProximity = 50</code>
Maximum distance in pixels between cursor and scroll track edge when track is considered to be hovered. Useful when you want to have thin scrollbars and increase theit thickness when cursor aproaches them so user don't have to aim precisely. Set to 0 to disable hover proximity detection.

#### <code><i>boolean</i> disabled = false</code>
Disable scroll box.

#### <code><i>boolean</i> outset = false</code>
Display scrollbars outside of scrollable area. Outset scrllbars don't require additional space and don't affect surrounding layout. On mobile devices when native scrollbars are used this property has no effect because scrollbars have zero width and thus don't crop any space from viewport.

#### <code><i>integer</i> scrollMinX = 2</code> <code>scrollMinY = 2</code>
Minimum difference in pixels in content and viewport sizes to enable scrolling.

#### <code><i>boolean</i> captureKeyboard = true</code>
Use keyboard for scrolling when scroll box viewport or its nested content is focused. Keyboard is not captured for `<input type="text"/>` and `<textarea/>` elements placed inside scroll box. <kbd>PgUp</kbd> <kbd>PgDown</kbd> <kbd>Home</kbd> <kbd>End</kbd> and arrow keys are captured. You can page-scroll alternate axis with <kbd>Shift</kbd>&nbsp;+&nbsp;<kbd>PgUp</kbd> and <kbd>Shift</kbd>&nbsp;+&nbsp;<kbd>PgDown</kbd> shortcuts.

#### <code><i>integer</i> keyboardStepX = 30</code> <code>keyboardStepY = 30</code>
Distance in pixels to scroll by when arrow keys are pressed.

#### <code><i>integer</i> keyboardScrollDuration = 200</code>
Keyboard smooth scrolling animation duration in milliseconds. Set to 0 to disable smooth keyboard scrolling.

#### <code><i>[FastTrack](#fast-track)</i> fastTrack = [FastTrack.GOTO](#fast-track-goto)</code>
Defines expected behavior when user clicks on scroll track. 

#### <code><i>integer</i> fastTrackDuration = 500</code>
Animation duration of fast track smooth scroll.

#### <code><i>boolean</i> captureHandleDrag = true</code>
Allow user to drag scroll handles. If handle drag is disabled along with enabled fast track then clicking on a handle would cause fast tracking.

#### <code><i>boolean</i> captureWheel = true</code>
Use mouse wheel for scrolling. You can scroll alternate axis with <kbd>Shift</kbd> key is pressed.

#### <code><i>integer</i> wheelStepX = 30</code> <code>wheelStepY = 30</code>
Wheel scrolling distance in pixels. Scroll box heavily relies on native wheel implementation, so this speed can vary a bit depending on browser, platform and scrolling device (trackpad or mouse wheel).

#### <code><i>boolean</i> propagateWheelScroll = false</code>
Propagate wheel scroll event to parent if scrolling reached maximum or minimum value.

#### <code><i>boolean</i> swapWheelAxes = false</code>
Swap wheel scrolling axes.

#### <code><i>integer</i> wheelScrollDuration = 100</code>
Wheel smooth scrolling animation duration. Set to 0 to disable smooth wheel scrolling.

#### <code><i>string</i> className = "scroll-box--wrapped"</code>
Style class name to use.

#### <code><i>object</i> style</code>
Style to apply to root element of scroll box.

#### <a name="defaulteasing"></a><code><i>function</i> defaultEasing (percent, elapsed, min, max, duration)</code>
Easing to use when none is provided.

- **<code><i>float</i> percent</code>** Scroll percentage in range [0, 1].
- **<code><i>integer</i> elapsed</code>** Number of milliseconds passed since animation began.
- **<code><i>integer</i> min</code> <code>max</code>** Output value range.
- **<code><i>integer</i> duration</code>** Animation duration in milliseconds.

#### <code><i>function</i> onViewportScroll (genericScrollBox)</code>
Scroll event callback.

- **<code><i>[GenericScrollBox](#genericscrollbox)</i> genericScrollBox</code>** Reference to [`GenericScrollBox`](#genericscrollbox) that is being scrolled.

## `GenericScrollBox`

Expects viewport element at its only child. Has all the same attributes as `ScrollBox`.

```jsx
var GenericScrollBox = require('react-scroll-box').GenericScrollBox; // ES5

import {GenericScrollBox, ScrollAxes, FastTrack} from 'react-scroll-box'; // ES6

<GenericScrollBox style={{height: '200px'}} axes={ScrollAxes.Y} fastTrack={FastTrack.PAGING}>
  <div className="scroll-box__viewport">
    Place any content here.
  </div>
</GenericScrollBox>
```

### Layout

```jsx
<div class="scroll-box scroll-box--wrapped">
  <div class="scroll-box__track scroll-box__track--x">
    <div class="scroll-box__handle scroll-box__handle--x"></div>
  </div>
  <div class="scroll-box__track scroll-box__track--y">
    <div class="scroll-box__handle scroll-box__handle--y"></div>
  </div>
  <div class="scroll-box__viewport">
    Place any content here.
  </div>
</div>
```

Class Name | Description
--- | ---
`scroll-box--wrapped` | Causes scroll box to look like an actual scroll box. If omitted, then scrollbox behaves like a simple `div` element.
`scroll-box--disabled` | Scroll box is disabled. By default, hides scrollbars and prevents scrolling.
`scroll-box--native` | Display native scroll bars.
`scroll-box--outset` | Show scroll bars ouside of scrollable area.
`scroll-box--has-axis-x` | Scroll box can be scrolled horizintally if content is wider than viewport.
`scroll-box--has-axis-y` | Scroll box can be scrolled vertically if content is taller than viewport.
`scroll-box--show-axis-x` | Content is wider than viewport.
`scroll-box--show-axis-y` | Content is taller than viewport.
`scroll-box__track--hover` | Tack is hovered.
<code>scroll&#8209;box__track&#8209;&#8209;dragged</code> | Track handle is dragged.

Modifier `.scroll-box--wrapped-on-large-screens` would conditionally wrap scroll box on screens larger than 360 px. Content would be scrolled along with page itself on smaller screens.

```less
@media (min-width: 360px) {
  .scroll-box--wrapped-on-large-screens {
    .scroll-box-wrap();
  }
}
```

### Properties

#### <code><i>HTMLDivElement</i> handleX</code> <code>handleY</code>
Handle elements. Both are always available, even if [`axes`](#genericscrollbox-axes) exclude one or both of them.

#### <code><i>HTMLDivElement</i> trackX</code> <code>trackY</code>
Track elements. Both are always available.

#### <code><i>HTMLElement</i> viewport</code>
Viewport element provided to `GenericScrollBox`.

#### <code><i>integer</i> targetX</code> <code>targetY</code>
Scroll position in pixels that was last requested.

#### <code><i>integer</i> previousX</code> <code>previousY</code>
Previously requested scroll position.

#### <code><i>integer</i> scrollX</code> <code>scrollX</code>
Actual scroll position that user observes. This changes repeatedly during scroll animation, when no animation is in proggress equals to `targetX` and `targetY` respectively.

#### <code><i>integer</i> scrollMaxX</code> <code>scrollMaxY</code> 
Maximum values for horizontal and vertical content scroll positions. See [MDN `window.scrollMaxX`](https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollMaxX) for more info.

#### <code><i>integer</i> trackMaxX</code> <code>trackMaxY</code>
Maximum values for horizontal and vertical track scroll positions. When [`nativeScroll`](#genericscrollbox-nativescroll) is set to `true` these are constanly equal to 0.

#### <code><i>boolean</i> exposesX</code> <code>exposesY</code>
Does scroll box require actual presence of horizontal or vertical scroll bars. If set to `true`, then axis is permitted via `props.axes` and corresponding `scrollMax` is greater or equal to `scrollMin`.

### Methods

#### <code><i>void</i> scrollBy(dx, dy, duration, easing, silent)</code>

Scroll by the given amount of pixels.

- **<code><i>integer</i> dx = 0</code> <code>dy = 0</code>** Amount of pixels to scroll by. Positive coordinates will scroll to the right and down the content. Negative values will scroll to the left and up the content. If non-numeric value are provided then corresponding position of scroll bar coordinate is not changed.
- **<code><i>integer</i> duration = 0</code>** Duration of scrolling animation.
- **<code><i>function</i> easing = <a href="#defaulteasing">defaultEasing</a></code>** Scroll easing function.
- **<code><i>boolean</i> silent = false</code>** Set to `true` to prevent invocation of `onViewportScroll` until requested scrolling is finished. Can be used for synchronization of multiple scroll areas.

#### <code><i>void</i> scrollTo(x, y, duration, easing, silent)</code>

Scroll to arbitrary content position.

- **<code><i>integer</i> x = undefined</code> <code>y = undefined</code>** Position to scroll to. If non-numeric value are provided then corresponding position of scroll bar coordinate is not changed.
- **<code><i>integer</i> duration = 0</code>** Duration of scrolling animation.
- **<code><i>function</i> easing = <a href="#defaulteasing">defaultEasing</a></code>** Scroll easing function.
- **<code><i>boolean</i> silent = false</code>** Set to `true` to prevent invocation of `onViewportScroll` until requested scrolling is finished. Can be used for synchronization of multiple scroll areas.

## License

The code is available under [MIT licence](LICENSE.txt).
