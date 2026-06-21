/**
 * Draw a grid on a 2D Canvas context
 */
export const drawGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  step: number = 40,
  color: string = '#1e293b'
) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;

  // Draw vertical lines
  for (let x = 0; x < width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Draw horizontal lines
  for (let y = 0; y < height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.restore();
};

/**
 * Draw an arrow representing a physical vector
 */
export const drawArrow = (
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string = '#3b82f6',
  width: number = 2,
  headLength: number = 10
) => {
  // Check if length is practically zero
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;

  // Draw shaft
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Draw arrowhead
  const angle = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLength * Math.cos(angle - Math.PI / 6),
    toY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    toX - headLength * Math.cos(angle + Math.PI / 6),
    toY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();

  ctx.restore();
};

/**
 * Draw text with a background box for legibility
 */
export const drawLabel = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string = '12px var(--font-sans)',
  textColor: string = '#f8fafc',
  bgColor: string = 'rgba(10, 14, 23, 0.75)',
  borderColor: string = '#1e293b'
) => {
  ctx.save();
  ctx.font = font;
  ctx.textBaseline = 'top';
  
  const textWidth = ctx.measureText(text).width;
  const paddingX = 8;
  const paddingY = 4;
  const boxWidth = textWidth + paddingX * 2;
  const boxHeight = 16 + paddingY * 2;

  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  
  // Draw rounded rect
  ctx.beginPath();
  ctx.roundRect(x, y, boxWidth, boxHeight, 4);
  ctx.fill();
  ctx.stroke();

  // Draw text
  ctx.fillStyle = textColor;
  ctx.fillText(text, x + paddingX, y + paddingY);
  ctx.restore();
};

/**
 * Extract scaled coordinates from mouse or touch events relative to a canvas
 */
export const getEventCoords = (
  e: MouseEvent | TouchEvent,
  canvas: HTMLCanvasElement
) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  let clientX = 0;
  let clientY = 0;

  // Touch event checks
  if ('touches' in e && e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if ('changedTouches' in e && e.changedTouches && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX;
    clientY = e.changedTouches[0].clientY;
  } else if ('clientX' in e) {
    clientX = (e as MouseEvent).clientX;
    clientY = (e as MouseEvent).clientY;
  }

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
};
