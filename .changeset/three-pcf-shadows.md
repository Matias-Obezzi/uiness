---
'@uiness/three': patch
---

Shadows use `PCFShadowMap`. Recent three.js removed `PCFSoftShadowMap` and fell back to it with a console warning on every viewer.
