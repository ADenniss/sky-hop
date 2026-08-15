# Sky Hop

Sky Hop is a colorful side-scrolling platformer about crossing Mosslight Valley: run and jump between floating platforms, bounce on patrolling critters, dodge spikes, gather valley glow, and reach the lantern gate before your three sparks run out.

The game runs a fixed 60 Hz simulation and only renders after a simulation step, so movement stays consistent across display refresh rates. Jumps use a short coyote time and jump buffer so ledge and early-press jumps still register.

To test locally, run:

```sh
python3 -m http.server --bind 0.0.0.0 8012
```

Then open http://localhost:8012.

## Controls

- `A`/`D` or arrow keys — move
- `W`, `↑`, or `Space` — jump
- `P` or `Esc` — pause or resume
- `Enter` — start, restart, or resume
- Touch — on-screen left, right, and jump buttons

The game pauses automatically when the window loses focus.

Lantern checkpoints light as you pass them and become your respawn point. Landing on a critter from above defeats it and bounces you upward; touching one from the side, hitting spikes, or falling costs a spark. Losing all three sparks ends the run.
