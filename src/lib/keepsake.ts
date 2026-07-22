import type { Note } from '../storage/types';
import { MONTH_NAMES, daysInMonth } from './date';
import { moodRibbonColor } from './mood';

// A per-month keepsake image (spec §5) drawn on a canvas — self-contained, no
// screenshot library. Private days are shown as locked, never decrypted here.

const PAPER = '#f7f4ec';
const INK = '#29251f';
const SOFT = '#6a6358';
const FAINT = '#9e9689';
const RULE = '#e0dacd';
const ACCENT = '#b76e4a';

export function downloadMonthKeepsake(year: number, month: number, notes: Note[]): void {
  const W = 720;
  const pad = 40;
  const headerH = 150;
  const rowH = 46;
  const footerH = 64;
  const H = headerH + notes.length * rowH + footerH;

  const canvas = document.createElement('canvas');
  const scale = 2;
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.fillStyle = INK;
  ctx.font = '600 34px Georgia, serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${MONTH_NAMES[month]} ${year}`, pad, 62);

  ctx.fillStyle = FAINT;
  ctx.font = '13px ui-monospace, monospace';
  const total = notes.reduce((s, n) => s + n.entries.length, 0);
  ctx.fillText(`${notes.length} days · ${total} entries`, pad, 84);

  // Mood ribbon
  const ribbonY = 104;
  const ribbonW = W - pad * 2;
  const dim = daysInMonth(year, month);
  const byDay = new Map<number, Note>();
  for (const n of notes) byDay.set(Number(n.date.slice(-2)), n);
  const seg = ribbonW / dim;
  for (let i = 0; i < dim; i++) {
    const note = byDay.get(i + 1);
    ctx.fillStyle = note ? moodRibbonColor(note.mood) : RULE;
    ctx.fillRect(pad + i * seg, ribbonY, Math.ceil(seg), 12);
  }

  // Day rows
  let y = headerH;
  ctx.textBaseline = 'middle';
  for (const n of notes) {
    const cy = y + rowH / 2;
    // mood dot
    ctx.beginPath();
    ctx.fillStyle = moodRibbonColor(n.mood);
    ctx.arc(pad + 8, cy, 6, 0, Math.PI * 2);
    ctx.fill();
    // day number
    ctx.fillStyle = INK;
    ctx.font = '600 18px Georgia, serif';
    ctx.fillText(String(Number(n.date.slice(-2))), pad + 26, cy);
    // snippet
    ctx.fillStyle = SOFT;
    ctx.font = '15px Georgia, serif';
    const snippet = n.private
      ? '🔒 private'
      : (n.entries[0]?.text ?? '').replace(/\s+/g, ' ').slice(0, 60) || 'Empty day';
    ctx.fillText(snippet + (n.entries.length > 1 ? ` · +${n.entries.length - 1}` : ''), pad + 58, cy);
    if (n.starred) {
      ctx.fillStyle = ACCENT;
      ctx.font = '14px serif';
      ctx.fillText('★', W - pad - 12, cy);
    }
    // hairline
    ctx.strokeStyle = RULE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, y + rowH);
    ctx.lineTo(W - pad, y + rowH);
    ctx.stroke();
    y += rowH;
  }

  // Footer
  ctx.fillStyle = FAINT;
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('Listify · a notestack', pad, H - 28);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `listify-${year}-${String(month + 1).padStart(2, '0')}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
