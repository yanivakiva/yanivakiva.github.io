import { screenMatrix } from "./camera-math.js";

export function projectPoint(matrix, u, v) {
  const w = matrix[3] * u + matrix[7] * v + 1;
  return [(matrix[0] * u + matrix[4] * v + matrix[12]) / w,
    (matrix[1] * u + matrix[5] * v + matrix[13]) / w];
}

export function triangleTransform(source, target) {
  const [[x0,y0],[x1,y1],[x2,y2]] = source;
  const [[u0,v0],[u1,v1],[u2,v2]] = target;
  const determinant = x0*(y1-y2) + x1*(y2-y0) + x2*(y0-y1);
  if (Math.abs(determinant) < 1e-10) return null;
  const coefficients = (a,b,c) => [
    (a*(y1-y2)+b*(y2-y0)+c*(y0-y1))/determinant,
    (a*(x2-x1)+b*(x0-x2)+c*(x1-x0))/determinant,
    (a*(x1*y2-x2*y1)+b*(x2*y0-x0*y2)+c*(x0*y1-x1*y0))/determinant,
  ];
  const [a,c,e] = coefficients(u0,u1,u2), [b,d,f] = coefficients(v0,v1,v2);
  return [a,b,c,d,e,f];
}

/** One flattened texture avoids Firefox clipping individual glyphs in CSS 3D layers. */
export function drawScreenSurface(context, texture, points) {
  const matrix = screenMatrix(points, 1, 1);
  if (!matrix) return;
  const columns = 12, rows = 8, width = texture.naturalWidth || texture.width, height = texture.naturalHeight || texture.height;
  const triangle = coordinates => {
    const source = coordinates.map(([u,v]) => [u*width,v*height]);
    const target = coordinates.map(([u,v]) => projectPoint(matrix,u,v));
    const transform = triangleTransform(source,target);
    if (!transform) return;
    const center = [0,1].map(axis => target.reduce((sum,p) => sum+p[axis]/3,0));
    // Sub-pixel overlap prevents cracks between independently antialiased clips.
    const expanded = target.map(p => {
      const length = Math.hypot(p[0]-center[0],p[1]-center[1]);
      return p.map((value,axis) => value + (value-center[axis]) / Math.max(1,length) * .45);
    });
    context.save(); context.beginPath(); context.moveTo(...expanded[0]);
    context.lineTo(...expanded[1]); context.lineTo(...expanded[2]); context.closePath(); context.clip();
    context.transform(...transform); context.drawImage(texture,0,0); context.restore();
  };
  for (let y=0;y<rows;y++) for (let x=0;x<columns;x++) {
    const a=[x/columns,y/rows], b=[(x+1)/columns,y/rows], c=[(x+1)/columns,(y+1)/rows], d=[x/columns,(y+1)/rows];
    triangle([a,b,c]); triangle([a,c,d]);
  }
}
