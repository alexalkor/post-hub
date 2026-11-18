---
name: motion-design
description: Rules for good short social videos and animated posts (reels, stories, animated feed posts, GIFs, 5-15 s loops): timing, easing, text pacing, loops without jumps, 9:16 safe zones, and frame-jump checks with ffmpeg. Use when making or reviewing an animation, motion, reel, story video or GIF, when a video looks jumpy, too fast or too busy, or when designing a new motion or text animation.
---

# Motion design for social video

General craft. Brand looks and approved templates come from the project.

## Timing (7 s post as the reference; scale for other lengths)
| Time | What happens |
|---|---|
| 0.0-0.6 s | Product or main shape already visible. Never start on an empty frame (thumbnail and autoplay). |
| 0.3-1.5 s | Title in, then 1 support line. One thing moves at a time. |
| 1.5-5.5 s | Calm loop: slow orbit, float or breathe. Pills or facts in, about 0.25 s apart. |
| 5.5-7.0 s | Hold. Logo or CTA readable for at least 1.5 s. |

- Readable text: about 3 words per second at most. A line stays on screen at least 1.5 s.
- 30 fps. Ease-out for things coming in, ease-in-out for loops, no linear motion except slow rotation.
- Entry moves 150-450 ms. Loops 3-6 s per cycle. Small amplitude: 2-6% scale, 8-20 px drift.
- One hero motion plus at most one or two extras (shine, sparkles). More looks cheap.

## Loops without jumps
- A looping motion must **start at its resting pose** (phase 0 = the pose the intro ends on). Otherwise the product jumps when the loop starts.
- Use a negative `animation-delay` or start keyframes at the rest pose. Never hand off between two animations on the same property mid-move.
- If the whole video should loop seamlessly, the last frame must match the first. Otherwise the intro restarting is fine; say which one it is.
- Render by stepping a fixed clock frame by frame (no real-time capture). Real-time capture drops frames.

## Checking for jumps (do this on every video)
In this repo: `node studio/check-jumps.mjs <video.mp4> ...` does all of the below.
Measure the mean absolute difference between consecutive frames at low resolution:
`ffmpeg -i in.mp4 -vf scale=108:192,format=gray -f rawvideo -`. Then, per frame, compare the step to the median of the 6 frames before and after.
Flag a step that is more than 4 times the local median and above 2 (on a 0-255 scale). Report the time in seconds. Look at the flagged frames before calling it a bug: a planned cut or flash is not a jump.

## 9:16 safe zones (1080x1920)
- Keep text out of the top 250 px and the bottom 340 px (app UI). For reels, also keep the right 120 px clear (buttons).
- Feed 4:5 (1080x1350): keep text 60 px in from every edge.

## Review checklist
- Thumbnail frame (0 s and 1 s) looks good on its own.
- No jumps (checker output), no text cut by safe zones, logo correct for the brand.
- Motion supports the message; nothing moves for no reason.
- File: H.264, yuv420p, 30 fps, under about 15 MB for 7 s.
