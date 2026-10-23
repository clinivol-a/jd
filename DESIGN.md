---
name: "CliniVol"
description: "A light, precise medical production platform joining task coordination to a purpose-built reconstruction workspace."
colors:
  brand-primary: "#0D7A5D"
  brand-secondary: "#2F9D78"
  brand-soft: "#E8F5F1"
  ink: "#1D252D"
  muted: "#65727D"
  line: "#DFE4E7"
  canvas: "#F3F5F6"
  panel: "#FFFFFF"
  viewport: "#050708"
  warning: "#D79B2B"
  returned: "#D6534C"
  complete: "#4D976D"
typography:
  heading:
    fontFamily: '"Segoe UI Variable", "Segoe UI", "Microsoft YaHei UI", system-ui, sans-serif'
    fontSize: "26px"
    fontWeight: 690
    lineHeight: 1.2
  title:
    fontFamily: '"Segoe UI Variable", "Segoe UI", "Microsoft YaHei UI", system-ui, sans-serif'
    fontSize: "16px"
    fontWeight: 660
    lineHeight: 1.3
  body:
    fontFamily: '"Segoe UI Variable", "Segoe UI", "Microsoft YaHei UI", system-ui, sans-serif'
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  control: "6px"
  card: "8px"
  round: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "20px"
  page: "32px"
---

# Design System: CliniVol

## North Star

CliniVol is a light medical production console. The platform layer follows TDesign's desktop interaction grammar, while the reconstruction layer behaves like compact Windows professional software rather than a SaaS dashboard. Brand green connects selection and primary action across both layers. Dark color is confined to the four image viewports where CT/MR contrast requires it.

## Brand and Logo

- Product name is always **CliniVol**. Do not append 3D, V2, or version text to the visible brand name.
- Use `/public/assets/clinivol-logo.png` as supplied. Preserve its full graphic-plus-English lockup, alpha channel, aspect ratio, and color.
- The 56px GlobalHeader reserves a fixed 196px logo region. The image uses `object-fit: contain`; transparent padding is handled by the container and image dimensions, never by stretching or cropping.

## Color and Theme

- Primary brand: `#0D7A5D`; hover/secondary emphasis: `#2F9D78`; active: `#086348`; soft field: `#E8F5F1`.
- TDesign brand variables are overridden centrally in `:root`, including the 1–10 ramp and hover, active, disabled, light, and focus tokens.
- Warning, error, success, and information keep distinct semantic colors. Green is not used as a universal status color.
- Persistent surfaces are white or cool gray. Only `.medical-view` uses a dark background.

## Layout

- GlobalHeader remains mounted at 56px across Home, details, and professional tasks.
- Internal task tabs have fixed 184×55px geometry, so hover and active states cannot change their size.
- Platform content and professional content have independent scrolling/overflow regions; the document itself remains fixed.
- Business pages use a 224px TDesign Menu rail that collapses to 64px without affecting the header.
- Dashboard uses five 8px statistics cards, a primary task table, recent work, and one important-notice card.
- Professional workspace rows: menu bar, case/action strip, four workspace modes, contextual toolbar, optional state banner, flexible three-column work area, and status bar.
- Professional columns: 222px Series tree, flexible 2×2 image grid, 280px object/property panel. Side panels may collapse independently.

## Component Ownership

### TDesign

Cards, Tables, Menu, Buttons, Tags, Inputs, Drawer, Dropdown, Popup, Dialog, Tooltip, and Message feedback are platform-level primitives. Their spacing and neutral/semantic colors remain recognizable as TDesign while the centralized brand token replaces default blue.

### Purpose-built professional UI

Global task-tab composition, Windows-style software menu, View/Segment/Model/Measure switcher, contextual toolbar, Patient/Study/Series tree, medical four-view layout, cross-reference lines, object lists, and compact properties are custom components. TDesign basics may appear inside them, but the layout is not a generic admin template.

## Professional Viewports

- Axial border red; Coronal border green; Sagittal border yellow; 3D View border blue.
- Each 2D viewport includes view name, orientation marks, slice/window/thickness metadata, simulated-image disclosure, and two cross-reference lines.
- The 3D viewport contains only surface-preview and orientation information; it does not receive artificial slice metadata.
- All geometry is explicitly marked as simulated and has no diagnostic or clinical meaning.

## Interaction Rules

- Home and task tabs change content below GlobalHeader only.
- Closing a tab closes the workspace view, never the task record.
- Dirty state is preserved per open task and triggers save/discard/cancel before leaving.
- Save remains in the workspace and reports success.
- Submit creates a pending-review state, locks the submitted version, disables editing, and synchronizes Home counts and table status.
- Returned tasks display doctor feedback and re-enable editing.
- Lock screen covers the entire application but preserves the exact underlying task/screen state.
- Keyboard focus remains visible. Reduced-motion preference collapses transitions to near-instant behavior.

## Avoid

- Do not redraw the logo or type the wordmark as a substitute.
- Do not reintroduce a dark professional shell outside the image viewports.
- Do not use default TDesign blue for brand actions.
- Do not invent AI segmentation, real DICOM interpretation, unconfirmed CAD tools, or clinical measurement claims.
- Do not use gradients, heavy shadows, oversized radii, or decorative dashboard metrics.
