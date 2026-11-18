// Flags frame jumps: a frame-to-frame change far bigger than the motion around it.
// usage: node studio/check-jumps.mjs a.mp4 b.mp4 ...   (run on every rendered video before sending it for review)
// "intro restarts" = last frame differs from the first because the intro plays again; normal, not a jump.
import { spawnSync } from 'node:child_process';
const W = 108, H = 192;
for (const f of process.argv.slice(2)) {
  const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-i', f, '-vf', `scale=${W}:${H},format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30 });
  const buf = r.stdout, n = W * H, frames = Math.floor(buf.length / n);
  const fps = +(spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', f]).stdout.toString().trim().split('/').reduce((a, b) => a / b));
  const d = [];
  for (let i = 1; i < frames; i++) { let s = 0; for (let k = 0; k < n; k++) s += Math.abs(buf[i * n + k] - buf[(i - 1) * n + k]); d.push(s / n); }
  // loop seam: last frame -> first frame
  let seam = 0; for (let k = 0; k < n; k++) seam += Math.abs(buf[k] - buf[(frames - 1) * n + k]); seam /= n;
  const flags = [];
  for (let i = 0; i < d.length; i++) {
    const win = d.slice(Math.max(0, i - 6), i).concat(d.slice(i + 1, i + 7)).sort((a, b) => a - b);
    const med = win[Math.floor(win.length / 2)] || 0;
    if (d[i] > 2 && d[i] > 4 * med + 0.5) flags.push(`${((i + 1) / fps).toFixed(2)}s (${d[i].toFixed(1)} vs ~${med.toFixed(1)})`);
  }
  const typical = [...d].sort((a, b) => a - b)[Math.floor(d.length / 2)];
  const seamBad = seam > 2 && seam > 4 * typical + 0.5;
  console.log(`${f.split(/[\\/]/).pop()}: ${frames} frames @${fps}fps, max step ${Math.max(...d).toFixed(1)}, seam ${seam.toFixed(1)}${seamBad ? ' (intro restarts)' : ''} -> ${flags.length ? 'JUMPS at ' + flags.join(', ') : 'OK'}`);
}
