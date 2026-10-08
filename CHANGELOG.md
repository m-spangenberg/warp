# Changelog

All notable changes to Warp are documented in this file. Each version lists its changes by type: Added, Changed, Deprecated, Removed, Fixed, Security.

## v0.1.1

- Fixed sound not starting after reload on mobile browsers that create the audio context in a suspended state (e.g. iOS Safari); the context is now resumed within the first user gesture, and tap-up events (touchend/click) now count as the unlocking gesture.
- Fixed the sound toggle saving stale settings: the switch state is now updated synchronously, so persisted settings always match what the user sees after toggling sound on or off.

## v0.1.0

- Added PWA support: web app manifest, service worker, and app icons. Warp can now be installed and runs fully offline.
- Added an install call-to-action at the bottom of the screen on first launch. Dismissible by tap or click, and shows home-screen instructions on iOS.
- Added an Aberration slider that adds chromatic aberration to the star trails (0–100%, default off).
- Added an Edge Glow slider that adds a blue glow to the edges of the screen, matching the install CTA's glow (0–100%, default off).
- Added persistence of control panel settings across visits (localStorage).
- Added a Reset control that restores all panel settings to their defaults.
- Added a version tag to the control panel.
- Added the social media preview image to the README and pointed og:image at it (previously a GitHub placeholder).
- Added starfield and soundscape groupings to the control panel.
- Added keyboard support (Enter/Space) and ARIA switch roles to the toggle controls.
- Added a headless Chrome test suite (tests/) with automated screenshots for PWA, control panel, effects, and settings behavior.
- Changed the control panel to be hidden by default, revealed from a small icon in the top-right corner (which peeks slightly brighter while you move over the scene), and shown centered on screen with the same blue glow as the install CTA; auto-hides when idle.
- Changed the control panel to a centered, scrollable sheet with starfield and soundscape sections on both desktop and mobile.
- Changed the install call-to-action and corner controls to respect the safe-area insets of notched iOS devices.
- Changed starfield rendering to scale with devicePixelRatio for sharp stars on high-DPI displays.
- Changed the viewport to use viewport-fit=cover so the installed app renders edge-to-edge on notched iOS devices.
- Changed the social preview image to the recommended 1280x640 dimensions.
- Fixed hidden controls (panel, install CTA) leaking into the keyboard tab order.
