# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + TypeScript + Vite + Tailwind CSS + TDesign React. Local-first interactive prototype; no backend.

## Users

The primary user is a CliniVol three-dimensional reconstruction designer working in a Windows desktop browser. Their job is to receive assigned cases, inspect clinical context and source imaging, complete reconstruction work, save progress, and submit a controlled result for physician review.

## Product Purpose

CliniVol is a unified web platform for medical three-dimensional design work. This prototype validates the UX architecture connecting business work management with a focused professional reconstruction workspace.

Success means the complete flow can be exercised in-browser: Home -> My Tasks -> Task Detail -> Start Reconstruction -> Save -> Submit for Review -> Return Home -> Observe Updated Status, while also comparing a multi-task internal tab model.

## Positioning

The platform separates business coordination from specialist production without breaking task identity, patient context, status continuity, or navigation. Professional tools receive most of the screen while the platform remains consistently recoverable.

## Operating Context

- Used primarily on 1920px-wide Windows desktop browsers.
- Designers move between a light operational dashboard and a light professional shell whose individual medical-image viewports remain dark.
- Medical source data, masks, models, review records, and task status are distinct working objects.
- Multiple existing reconstruction tasks may be open as internal tabs under one platform header.

## Capabilities and Constraints

- Prototype scope: reconstruction-designer dashboard, task list, task details, reconstruction workspace, saving, submission, returned-review recovery, unsaved-change guard, and multi-task tabs.
- Three simulated tasks are required: 001 facial skeleton reconstruction (in progress), 002 mandible reconstruction (returned), and 003 skull reconstruction (pending review).
- Saving remains in the current workspace and reports success.
- Submission requires confirmation, changes status to pending review, and prevents direct overwriting of the submitted version.
- A returned task exposes revision feedback and can re-enter editing.
- Closing a tab closes only the workspace view; it never deletes the task.
- No real DICOM parsing, segmentation, reconstruction, AI auto-segmentation, CAD expansion, finite element analysis, 3D printing workflow, hospital, sales, or admin pages.
- Prototype data is synthetic and has no clinical meaning.

## Brand Commitments

- Product name: CliniVol. Do not display CliniVol 3D, CliniVol3D, V2, or v2.0 as the product name.
- Use the supplied color graphic + English PNG logo without redrawing, recoloring, stretching, or cropping it.
- Brand primary is #0D7A5D and secondary is #2F9D78; TDesign semantic colors remain intact.
- All persistent application surfaces use Light Mode. Dark color is limited to image viewports.
- Tone: modern, professional medical software; clear, restrained, rigorous, and efficiency-led.
- Avoid excessive rounded cards, gradients, shadows, decoration, and Figma imitation.
- Platform-level controls use TDesign; professional reconstruction layout and panels remain purpose-built.

## Evidence on Hand

- The user-supplied requirements in this task are the source of truth.
- The supplied logo, dashboard reference, professional architecture reference, and current requirements are the visual evidence. Professional features remain limited to the explicitly confirmed View, Segment, Model, Measure shells and named tools.

## Product Principles

1. Preserve task and clinical context across every surface.
2. Keep operational navigation available without permanently consuming the professional canvas.
3. Make save, submission, review, and editability states explicit and reversible where allowed.
4. Treat multi-task tabs as a testable candidate architecture, not a final product commitment.
5. Prefer scanability and keyboard-friendly desktop efficiency over decorative presentation.

## Accessibility & Inclusion

The prototype should support keyboard navigation, visible focus, semantic buttons and dialogs, readable contrast in both light and dark surfaces, and status labels that do not rely on color alone.
