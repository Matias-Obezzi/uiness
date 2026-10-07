---
'@uiness/three': patch
---

Fix a frame loop that doubled every frame while the camera moved: an auto-rotating viewer froze the whole computer within a second, and any viewer stuttered for a moment after a drag. Moving the camera in a frame fired the controls' change, which scheduled the next frame, and the loop scheduled another on top.
