# daisyUI 5 Reference Guide

daisyUI 5 is a CSS library for Tailwind CSS 4 that provides class names for common UI components.

- [daisyUI 5 docs](http://daisyui.com)
- [daisyUI 5 release notes](https://daisyui.com/docs/v5/)

## Installation

### CDN Mode (No Build Required)

```html
<link href="https://cdn.jsdelivr.net/npm/daisyui@5" rel="stylesheet" type="text/css" />
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
```

### NPM Mode (Build Required)

```bash
npm i -D daisyui@latest
```

```css
@import "tailwindcss";
@plugin "daisyui";
```

## Usage Rules

1. Style HTML elements by adding daisyUI class names (component class, part class, modifier class)
2. Customize using Tailwind CSS utility classes when needed. Example: `btn px-10`
3. Use `!` suffix for specificity override as last resort. Example: `btn bg-red-500!`
4. Create custom components with Tailwind utilities if daisyUI doesn't have one
5. Use responsive prefixes for flex/grid layouts
6. Only use existing daisyUI or Tailwind CSS class names
7. Avoid custom CSS - prefer daisyUI + Tailwind utilities
8. Use https://picsum.photos/200/300 for placeholder images
9. Don't add custom fonts unless necessary
10. Don't add `bg-base-100 text-base-content` to body unless necessary
11. Follow Refactoring UI book best practices for design decisions

## Class Name Categories

- `component`: Required component class
- `part`: Child part of a component
- `style`: Sets specific style to component/part
- `behavior`: Changes behavior of component/part
- `color`: Sets specific color
- `size`: Sets specific size
- `placement`: Sets specific placement
- `direction`: Sets specific direction
- `modifier`: Modifies component/part
- `variant`: Prefixes for conditional styles (syntax: `variant:utility-class`)

## Config

Basic config:

```css
@plugin "daisyui";
```

With specific themes:

```css
@plugin "daisyui" {
  themes:
    light --default,
    dark --prefersdark;
}
```

Full config options:

```css
@plugin "daisyui" {
  themes:
    light --default,
    dark --prefersdark;
  root: ":root";
  include:;
  exclude:;
  prefix:;
  logs: true;
}
```

## Colors

### Color Names

| Name                | Purpose                                 |
| ------------------- | --------------------------------------- |
| `primary`           | Main brand color                        |
| `primary-content`   | Foreground on primary                   |
| `secondary`         | Secondary brand color                   |
| `secondary-content` | Foreground on secondary                 |
| `accent`            | Accent brand color                      |
| `accent-content`    | Foreground on accent                    |
| `neutral`           | Neutral dark color for non-saturated UI |
| `neutral-content`   | Foreground on neutral                   |
| `base-100`          | Base surface color (blank backgrounds)  |
| `base-200`          | Darker shade for elevations             |
| `base-300`          | Even darker shade for elevations        |
| `base-content`      | Foreground on base                      |
| `info`              | Informative messages                    |
| `info-content`      | Foreground on info                      |
| `success`           | Success/safe messages                   |
| `success-content`   | Foreground on success                   |
| `warning`           | Warning/caution messages                |
| `warning-content`   | Foreground on warning                   |
| `error`             | Error/danger messages                   |
| `error-content`     | Foreground on error                     |

### Color Rules

1. daisyUI adds semantic color names to Tailwind CSS
2. Use like Tailwind colors: `bg-primary`, `text-base-content`
3. Colors change automatically based on theme
4. No need for `dark:` prefix with daisyUI colors
5. Prefer daisyUI colors so themes work automatically
6. Tailwind colors (like `red-500`) stay same across themes
7. Avoid Tailwind text colors on daisyUI backgrounds (contrast issues in dark mode)
8. `*-content` colors have good contrast with associated colors
9. Use `base-*` for majority of page, `primary` for important elements

## Custom Theme

```css
@plugin "daisyui/theme" {
  name: "mytheme";
  default: true;
  prefersdark: false;
  color-scheme: light;

  --color-base-100: oklch(98% 0.02 240);
  --color-base-200: oklch(95% 0.03 240);
  --color-base-300: oklch(92% 0.04 240);
  --color-base-content: oklch(20% 0.05 240);
  --color-primary: oklch(55% 0.3 240);
  --color-primary-content: oklch(98% 0.01 240);
  --color-secondary: oklch(70% 0.25 200);
  --color-secondary-content: oklch(98% 0.01 200);
  --color-accent: oklch(65% 0.25 160);
  --color-accent-content: oklch(98% 0.01 160);
  --color-neutral: oklch(50% 0.05 240);
  --color-neutral-content: oklch(98% 0.01 240);
  --color-info: oklch(70% 0.2 220);
  --color-info-content: oklch(98% 0.01 220);
  --color-success: oklch(65% 0.25 140);
  --color-success-content: oklch(98% 0.01 140);
  --color-warning: oklch(80% 0.25 80);
  --color-warning-content: oklch(20% 0.05 80);
  --color-error: oklch(65% 0.3 30);
  --color-error-content: oklch(98% 0.01 30);

  --radius-selector: 1rem;
  --radius-field: 0.25rem;
  --radius-box: 0.5rem;
  --size-selector: 0.25rem;
  --size-field: 0.25rem;
  --border: 1px;
  --depth: 1;
  --noise: 0;
}
```

---

# Component Reference

## accordion

Accordion shows/hides content - only one item open at a time.

**Classes:** `collapse` | `collapse-title`, `collapse-content` | `collapse-arrow`, `collapse-plus`, `collapse-open`, `collapse-close`

```html
<div class="collapse collapse-arrow">
  <input type="radio" name="accordion" checked="checked" />
  <div class="collapse-title">Title</div>
  <div class="collapse-content">Content</div>
</div>
```

**Rules:** Use same `name` for radio inputs in a group. Different name for different accordion sets.

---

## alert

Alert informs users about important events.

**Classes:** `alert` | `alert-outline`, `alert-dash`, `alert-soft` | `alert-info`, `alert-success`, `alert-warning`, `alert-error` | `alert-vertical`, `alert-horizontal`

```html
<div role="alert" class="alert alert-success">Message</div>
```

---

## avatar

Avatars show thumbnails.

**Classes:** `avatar`, `avatar-group` | `avatar-online`, `avatar-offline`, `avatar-placeholder`

```html
<div class="avatar">
  <div class="w-12 rounded-full">
    <img src="image.jpg" />
  </div>
</div>
```

**Rules:** Use `w-*` and `h-*` for size. Use mask classes like `mask-squircle`.

---

## badge

Badges show status of data.

**Classes:** `badge` | `badge-outline`, `badge-dash`, `badge-soft`, `badge-ghost` | `badge-neutral`, `badge-primary`, `badge-secondary`, `badge-accent`, `badge-info`, `badge-success`, `badge-warning`, `badge-error` | `badge-xs`, `badge-sm`, `badge-md`, `badge-lg`, `badge-xl`

```html
<span class="badge badge-primary">Badge</span>
```

---

## breadcrumbs

Breadcrumbs help users navigate.

**Classes:** `breadcrumbs`

```html
<div class="breadcrumbs">
  <ul>
    <li><a>Home</a></li>
    <li><a>Products</a></li>
    <li>Current</li>
  </ul>
</div>
```

---

## button

Buttons for user actions.

**Classes:** `btn` | `btn-neutral`, `btn-primary`, `btn-secondary`, `btn-accent`, `btn-info`, `btn-success`, `btn-warning`, `btn-error` | `btn-outline`, `btn-dash`, `btn-soft`, `btn-ghost`, `btn-link` | `btn-active`, `btn-disabled` | `btn-xs`, `btn-sm`, `btn-md`, `btn-lg`, `btn-xl` | `btn-wide`, `btn-block`, `btn-square`, `btn-circle`

```html
<button class="btn btn-primary">Button</button>
```

**Rules:** Can use on `<button>`, `<a>`, `<input>`. Can have icons before/after text.

---

## card

Cards group and display content.

**Classes:** `card` | `card-title`, `card-body`, `card-actions` | `card-border`, `card-dash` | `card-side`, `image-full` | `card-xs`, `card-sm`, `card-md`, `card-lg`, `card-xl`

```html
<div class="card bg-base-100 shadow">
  <figure><img src="image.jpg" alt="Alt" /></figure>
  <div class="card-body">
    <h2 class="card-title">Title</h2>
    <p>Content</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary">Action</button>
    </div>
  </div>
</div>
```

---

## carousel

Carousel shows content in scrollable area.

**Classes:** `carousel` | `carousel-item` | `carousel-start`, `carousel-center`, `carousel-end` | `carousel-horizontal`, `carousel-vertical`

```html
<div class="carousel">
  <div class="carousel-item"><img src="1.jpg" /></div>
  <div class="carousel-item"><img src="2.jpg" /></div>
</div>
```

---

## chat

Chat bubbles for conversations.

**Classes:** `chat` | `chat-image`, `chat-header`, `chat-footer`, `chat-bubble` | `chat-start`, `chat-end` | `chat-bubble-neutral`, `chat-bubble-primary`, `chat-bubble-secondary`, `chat-bubble-accent`, `chat-bubble-info`, `chat-bubble-success`, `chat-bubble-warning`, `chat-bubble-error`

```html
<div class="chat chat-start">
  <div class="chat-bubble">Hello!</div>
</div>
<div class="chat chat-end">
  <div class="chat-bubble chat-bubble-primary">Hi there!</div>
</div>
```

---

## checkbox

Checkboxes for selecting values.

**Classes:** `checkbox` | `checkbox-primary`, `checkbox-secondary`, `checkbox-accent`, `checkbox-neutral`, `checkbox-success`, `checkbox-warning`, `checkbox-info`, `checkbox-error` | `checkbox-xs`, `checkbox-sm`, `checkbox-md`, `checkbox-lg`, `checkbox-xl`

```html
<input type="checkbox" class="checkbox checkbox-primary" />
```

---

## collapse

Collapse shows/hides content.

**Classes:** `collapse` | `collapse-title`, `collapse-content` | `collapse-arrow`, `collapse-plus`, `collapse-open`, `collapse-close`

```html
<div tabindex="0" class="collapse collapse-arrow bg-base-100">
  <div class="collapse-title">Click to open</div>
  <div class="collapse-content">Hidden content</div>
</div>
```

---

## countdown

Countdown with transition effect (0-999).

**Classes:** `countdown`

```html
<span class="countdown">
  <span style="--value:42;"></span>
</span>
```

**Rules:** Change `--value` CSS variable with JS. Add `aria-live="polite"` for accessibility.

---

## divider

Divider separates content.

**Classes:** `divider` | `divider-neutral`, `divider-primary`, `divider-secondary`, `divider-accent`, `divider-success`, `divider-warning`, `divider-info`, `divider-error` | `divider-vertical`, `divider-horizontal` | `divider-start`, `divider-end`

```html
<div class="divider">OR</div>
```

---

## dock

Bottom navigation bar.

**Classes:** `dock` | `dock-label` | `dock-active` | `dock-xs`, `dock-sm`, `dock-md`, `dock-lg`, `dock-xl`

```html
<div class="dock">
  <button class="dock-active">
    <svg>...</svg>
    <span class="dock-label">Home</span>
  </button>
  <button>
    <svg>...</svg>
    <span class="dock-label">Search</span>
  </button>
</div>
```

---

## drawer

Grid layout with sidebar.

**Classes:** `drawer` | `drawer-toggle`, `drawer-content`, `drawer-side`, `drawer-overlay` | `drawer-end` | `drawer-open`

```html
<div class="drawer lg:drawer-open">
  <input id="my-drawer" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content">
    <label for="my-drawer" class="btn drawer-button lg:hidden">Open</label>
    <!-- Page content -->
  </div>
  <div class="drawer-side">
    <label for="my-drawer" class="drawer-overlay"></label>
    <ul class="menu bg-base-200 min-h-full w-80 p-4">
      <li><a>Item 1</a></li>
    </ul>
  </div>
</div>
```

**Rules:** Use unique ID for drawer-toggle. Everything must be inside drawer container.

---

## dropdown

Menu that opens on click.

**Classes:** `dropdown` | `dropdown-content` | `dropdown-start`, `dropdown-center`, `dropdown-end`, `dropdown-top`, `dropdown-bottom`, `dropdown-left`, `dropdown-right` | `dropdown-hover`, `dropdown-open`

Using details/summary:

```html
<details class="dropdown">
  <summary class="btn">Click</summary>
  <ul class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow">
    <li><a>Item 1</a></li>
  </ul>
</details>
```

---

## fieldset

Container for grouping form elements.

**Classes:** `fieldset` | `fieldset-legend`

```html
<fieldset class="fieldset">
  <legend class="fieldset-legend">Title</legend>
  <input type="text" class="input" />
  <p class="label">Description</p>
</fieldset>
```

---

## file-input

File upload input.

**Classes:** `file-input` | `file-input-ghost` | `file-input-neutral`, `file-input-primary`, `file-input-secondary`, `file-input-accent`, `file-input-info`, `file-input-success`, `file-input-warning`, `file-input-error` | `file-input-xs`, `file-input-sm`, `file-input-md`, `file-input-lg`, `file-input-xl`

```html
<input type="file" class="file-input file-input-primary" />
```

---

## filter

Radio button group with reset.

**Classes:** `filter` | `filter-reset`

```html
<form class="filter">
  <input class="btn btn-square" type="reset" value="×" />
  <input class="btn" type="radio" name="filter" aria-label="All" />
  <input class="btn" type="radio" name="filter" aria-label="Active" />
</form>
```

---

## footer

Page footer with links.

**Classes:** `footer` | `footer-title` | `footer-center` | `footer-horizontal`, `footer-vertical`

```html
<footer class="footer bg-base-200 p-10">
  <nav>
    <h6 class="footer-title">Services</h6>
    <a class="link link-hover">Branding</a>
    <a class="link link-hover">Design</a>
  </nav>
</footer>
```

---

## hero

Large box with title/description.

**Classes:** `hero` | `hero-content`, `hero-overlay`

```html
<div class="hero min-h-screen" style="background-image: url(bg.jpg);">
  <div class="hero-overlay bg-opacity-60"></div>
  <div class="hero-content text-center">
    <div class="max-w-md">
      <h1 class="text-5xl font-bold">Hello</h1>
      <p class="py-6">Welcome text</p>
      <button class="btn btn-primary">Get Started</button>
    </div>
  </div>
</div>
```

---

## indicator

Places element on corner of another.

**Classes:** `indicator` | `indicator-item` | `indicator-start`, `indicator-center`, `indicator-end`, `indicator-top`, `indicator-middle`, `indicator-bottom`

```html
<div class="indicator">
  <span class="indicator-item badge badge-primary">99+</span>
  <button class="btn">Inbox</button>
</div>
```

---

## input

Text input field.

**Classes:** `input` | `input-ghost` | `input-neutral`, `input-primary`, `input-secondary`, `input-accent`, `input-info`, `input-success`, `input-warning`, `input-error` | `input-xs`, `input-sm`, `input-md`, `input-lg`, `input-xl`

```html
<input type="text" placeholder="Type here" class="input input-primary" />
```

---

## join

Groups items together.

**Classes:** `join`, `join-item` | `join-vertical`, `join-horizontal`

```html
<div class="join">
  <button class="btn join-item">1</button>
  <button class="btn join-item">2</button>
  <button class="btn join-item">3</button>
</div>
```

---

## kbd

Keyboard shortcut display.

**Classes:** `kbd` | `kbd-xs`, `kbd-sm`, `kbd-md`, `kbd-lg`, `kbd-xl`

```html
<kbd class="kbd">Ctrl</kbd>+<kbd class="kbd">C</kbd>
```

---

## label

Label for input fields.

**Classes:** `label`, `floating-label`

Regular:

```html
<label class="input">
  <span class="label">Email</span>
  <input type="email" />
</label>
```

Floating:

```html
<label class="floating-label">
  <input type="text" class="input" placeholder=" " />
  <span>Email</span>
</label>
```

---

## link

Link with underline style.

**Classes:** `link` | `link-hover` | `link-neutral`, `link-primary`, `link-secondary`, `link-accent`, `link-success`, `link-info`, `link-warning`, `link-error`

```html
<a class="link link-primary">Click me</a>
```

---

## list

Vertical list layout.

**Classes:** `list`, `list-row` | `list-col-wrap`, `list-col-grow`

```html
<ul class="list bg-base-100 rounded-box shadow">
  <li class="list-row">
    <div>Icon</div>
    <div>Title</div>
    <div>Action</div>
  </li>
</ul>
```

---

## loading

Loading animation.

**Classes:** `loading` | `loading-spinner`, `loading-dots`, `loading-ring`, `loading-ball`, `loading-bars`, `loading-infinity` | `loading-xs`, `loading-sm`, `loading-md`, `loading-lg`, `loading-xl`

```html
<span class="loading loading-spinner loading-lg"></span>
```

---

## mask

Crops content to shapes.

**Classes:** `mask` | `mask-squircle`, `mask-heart`, `mask-hexagon`, `mask-hexagon-2`, `mask-decagon`, `mask-pentagon`, `mask-diamond`, `mask-square`, `mask-circle`, `mask-star`, `mask-star-2`, `mask-triangle`, `mask-triangle-2`, `mask-triangle-3`, `mask-triangle-4` | `mask-half-1`, `mask-half-2`

```html
<img class="mask mask-squircle" src="avatar.jpg" />
```

---

## menu

List of links.

**Classes:** `menu` | `menu-title`, `menu-dropdown`, `menu-dropdown-toggle` | `menu-disabled`, `menu-active`, `menu-focus`, `menu-dropdown-show` | `menu-xs`, `menu-sm`, `menu-md`, `menu-lg`, `menu-xl` | `menu-vertical`, `menu-horizontal`

```html
<ul class="menu bg-base-200 rounded-box w-56">
  <li><a>Item 1</a></li>
  <li><a class="menu-active">Item 2</a></li>
  <li><a>Item 3</a></li>
</ul>
```

---

## modal

Dialog box.

**Classes:** `modal` | `modal-box`, `modal-action`, `modal-backdrop`, `modal-toggle` | `modal-open` | `modal-top`, `modal-middle`, `modal-bottom`, `modal-start`, `modal-end`

```html
<button onclick="my_modal.showModal()">Open</button>
<dialog id="my_modal" class="modal">
  <div class="modal-box">
    <h3 class="text-lg font-bold">Hello!</h3>
    <p class="py-4">Modal content</p>
    <div class="modal-action">
      <form method="dialog">
        <button class="btn">Close</button>
      </form>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
```

---

## navbar

Top navigation bar.

**Classes:** `navbar` | `navbar-start`, `navbar-center`, `navbar-end`

```html
<div class="navbar bg-base-100">
  <div class="navbar-start">
    <a class="btn btn-ghost text-xl">Logo</a>
  </div>
  <div class="navbar-center">
    <ul class="menu menu-horizontal">
      <li><a>Home</a></li>
    </ul>
  </div>
  <div class="navbar-end">
    <button class="btn">Login</button>
  </div>
</div>
```

---

## progress

Progress bar.

**Classes:** `progress` | `progress-neutral`, `progress-primary`, `progress-secondary`, `progress-accent`, `progress-info`, `progress-success`, `progress-warning`, `progress-error`

```html
<progress class="progress progress-primary w-56" value="70" max="100"></progress>
```

---

## radial-progress

Circular progress.

**Classes:** `radial-progress`

```html
<div class="radial-progress" style="--value:70;" role="progressbar">70%</div>
```

**Rules:** Use `--value` (0-100). Use `--size` and `--thickness` for customization.

---

## radio

Radio buttons.

**Classes:** `radio` | `radio-neutral`, `radio-primary`, `radio-secondary`, `radio-accent`, `radio-success`, `radio-warning`, `radio-info`, `radio-error` | `radio-xs`, `radio-sm`, `radio-md`, `radio-lg`, `radio-xl`

```html
<input type="radio" name="radio-1" class="radio radio-primary" checked />
<input type="radio" name="radio-1" class="radio radio-primary" />
```

---

## range

Range slider.

**Classes:** `range` | `range-neutral`, `range-primary`, `range-secondary`, `range-accent`, `range-success`, `range-warning`, `range-info`, `range-error` | `range-xs`, `range-sm`, `range-md`, `range-lg`, `range-xl`

```html
<input type="range" min="0" max="100" value="40" class="range range-primary" />
```

---

## rating

Star rating.

**Classes:** `rating` | `rating-half`, `rating-hidden` | `rating-xs`, `rating-sm`, `rating-md`, `rating-lg`, `rating-xl`

```html
<div class="rating">
  <input type="radio" name="rating-1" class="mask mask-star bg-orange-400" />
  <input type="radio" name="rating-1" class="mask mask-star bg-orange-400" checked />
  <input type="radio" name="rating-1" class="mask mask-star bg-orange-400" />
</div>
```

---

## select

Dropdown select.

**Classes:** `select` | `select-ghost` | `select-neutral`, `select-primary`, `select-secondary`, `select-accent`, `select-info`, `select-success`, `select-warning`, `select-error` | `select-xs`, `select-sm`, `select-md`, `select-lg`, `select-xl`

```html
<select class="select select-primary">
  <option disabled selected>Pick one</option>
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

---

## skeleton

Loading placeholder.

**Classes:** `skeleton` | `skeleton-text`

```html
<div class="skeleton h-32 w-32"></div>
<div class="skeleton skeleton-text">Loading...</div>
```

---

## stack

Elements on top of each other.

**Classes:** `stack` | `stack-top`, `stack-bottom`, `stack-start`, `stack-end`

```html
<div class="stack">
  <div class="card bg-primary">A</div>
  <div class="card bg-secondary">B</div>
  <div class="card bg-accent">C</div>
</div>
```

---

## stat

Display numbers/data.

**Classes:** `stats` | `stat`, `stat-title`, `stat-value`, `stat-desc`, `stat-figure`, `stat-actions` | `stats-horizontal`, `stats-vertical`

```html
<div class="stats shadow">
  <div class="stat">
    <div class="stat-title">Total Users</div>
    <div class="stat-value">89,400</div>
    <div class="stat-desc">21% more than last month</div>
  </div>
</div>
```

---

## status

Small status icon.

**Classes:** `status` | `status-neutral`, `status-primary`, `status-secondary`, `status-accent`, `status-info`, `status-success`, `status-warning`, `status-error` | `status-xs`, `status-sm`, `status-md`, `status-lg`, `status-xl`

```html
<span class="status status-success"></span>
```

---

## steps

Process steps.

**Classes:** `steps` | `step`, `step-icon` | `step-neutral`, `step-primary`, `step-secondary`, `step-accent`, `step-info`, `step-success`, `step-warning`, `step-error` | `steps-vertical`, `steps-horizontal`

```html
<ul class="steps">
  <li class="step step-primary">Register</li>
  <li class="step step-primary">Choose plan</li>
  <li class="step">Purchase</li>
  <li class="step">Receive</li>
</ul>
```

---

## swap

Toggle between two elements.

**Classes:** `swap` | `swap-on`, `swap-off`, `swap-indeterminate` | `swap-active` | `swap-rotate`, `swap-flip`

```html
<label class="swap swap-rotate">
  <input type="checkbox" />
  <div class="swap-on">ON</div>
  <div class="swap-off">OFF</div>
</label>
```

---

## tab

Tabbed navigation.

**Classes:** `tabs` | `tab`, `tab-content` | `tabs-box`, `tabs-border`, `tabs-lift` | `tab-active`, `tab-disabled` | `tabs-top`, `tabs-bottom`

```html
<div role="tablist" class="tabs tabs-box">
  <a role="tab" class="tab">Tab 1</a>
  <a role="tab" class="tab tab-active">Tab 2</a>
  <a role="tab" class="tab">Tab 3</a>
</div>
```

---

## table

Data table.

**Classes:** `table` | `table-zebra`, `table-pin-rows`, `table-pin-cols` | `table-xs`, `table-sm`, `table-md`, `table-lg`, `table-xl`

```html
<div class="overflow-x-auto">
  <table class="table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Job</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>John</td>
        <td>Developer</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## textarea

Multi-line text input.

**Classes:** `textarea` | `textarea-ghost` | `textarea-neutral`, `textarea-primary`, `textarea-secondary`, `textarea-accent`, `textarea-info`, `textarea-success`, `textarea-warning`, `textarea-error` | `textarea-xs`, `textarea-sm`, `textarea-md`, `textarea-lg`, `textarea-xl`

```html
<textarea class="textarea textarea-primary" placeholder="Bio"></textarea>
```

---

## theme-controller

Theme switcher.

**Classes:** `theme-controller`

```html
<input type="checkbox" value="dark" class="toggle theme-controller" />
```

---

## timeline

Chronological events.

**Classes:** `timeline` | `timeline-start`, `timeline-middle`, `timeline-end` | `timeline-snap-icon`, `timeline-box`, `timeline-compact` | `timeline-vertical`, `timeline-horizontal`

```html
<ul class="timeline">
  <li>
    <div class="timeline-start">1984</div>
    <div class="timeline-middle">●</div>
    <div class="timeline-end timeline-box">Event</div>
    <hr />
  </li>
</ul>
```

---

## toast

Corner notification stack.

**Classes:** `toast` | `toast-start`, `toast-center`, `toast-end`, `toast-top`, `toast-middle`, `toast-bottom`

```html
<div class="toast toast-end">
  <div class="alert alert-success">
    <span>Message sent.</span>
  </div>
</div>
```

---

## toggle

Switch button.

**Classes:** `toggle` | `toggle-primary`, `toggle-secondary`, `toggle-accent`, `toggle-neutral`, `toggle-success`, `toggle-warning`, `toggle-info`, `toggle-error` | `toggle-xs`, `toggle-sm`, `toggle-md`, `toggle-lg`, `toggle-xl`

```html
<input type="checkbox" class="toggle toggle-primary" />
```

---

## tooltip

Hover message.

**Classes:** `tooltip` | `tooltip-content` | `tooltip-open` | `tooltip-top`, `tooltip-bottom`, `tooltip-left`, `tooltip-right` | `tooltip-primary`, `tooltip-secondary`, `tooltip-accent`, `tooltip-info`, `tooltip-success`, `tooltip-warning`, `tooltip-error`

```html
<div class="tooltip" data-tip="Hello">
  <button class="btn">Hover me</button>
</div>
```

---

## validator

Form validation styling.

**Classes:** `validator` | `validator-hint`

```html
<input type="email" class="input validator" required />
<p class="validator-hint">Please enter valid email</p>
```
