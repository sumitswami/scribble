const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const sizeSlider = document.getElementById('sizeSlider');
const sizeLabel = document.getElementById('sizeLabel');

// Stroke history for undo
let strokes = [];
let currentStroke = null;
let isDrawing = false;

// --- Smooth stroke helper ---
// Uses midpoint Bezier curves for natural handwriting feel
function getMidPoint(p1, p2) {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue;

    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length - 1; i++) {
      const mid = getMidPoint(stroke.points[i], stroke.points[i + 1]);
      // Quadratic curve through midpoints = smooth natural stroke
      ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, mid.x, mid.y);
    }

    const last = stroke.points[stroke.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

// --- Pointer events (works for trackpad, mouse, stylus) ---

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  isDrawing = true;
  const pos = getPos(e);

  currentStroke = {
    color: colorPicker.value,
    size: parseInt(sizeSlider.value),
    points: [pos]
  };
});

canvas.addEventListener('pointermove', (e) => {
  if (!isDrawing || !currentStroke) return;
  e.preventDefault();

  currentStroke.points.push(getPos(e));

  // Draw incrementally for live feedback
  const pts = currentStroke.points;
  if (pts.length >= 2) {
    ctx.beginPath();
    ctx.strokeStyle = currentStroke.color;
    ctx.lineWidth = currentStroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const prev = pts[pts.length - 2];
    const curr = pts[pts.length - 1];
    const mid = getMidPoint(prev, curr);

    ctx.moveTo(prev.x, prev.y);
    ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y);
    ctx.stroke();
  }
});

canvas.addEventListener('pointerup', (e) => {
  if (!isDrawing) return;
  isDrawing = false;

  if (currentStroke && currentStroke.points.length > 0) {
    strokes.push(currentStroke);
    currentStroke = null;
  }
});

canvas.addEventListener('pointerleave', (e) => {
  if (isDrawing && currentStroke) {
    strokes.push(currentStroke);
    currentStroke = null;
    isDrawing = false;
  }
});

// --- Controls ---

sizeSlider.addEventListener('input', () => {
  sizeLabel.textContent = sizeSlider.value + 'px';
});

document.getElementById('undoBtn').addEventListener('click', () => {
  strokes.pop();
  redraw();
});

document.getElementById('clearBtn').addEventListener('click', () => {
  strokes = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

document.getElementById('copyBtn').addEventListener('click', () => {
  canvas.toBlob(blob => {
    const item = new ClipboardItem({ 'image/png': blob });
    navigator.clipboard.write([item])
      .then(() => alert('Copied to clipboard!'))
      .catch(err => console.error('Clipboard error:', err));
  });
});