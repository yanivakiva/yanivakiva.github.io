import assert from "node:assert/strict";
import test from "node:test";
import { screenMatrix } from "./camera-math.js";
import { projectPoint, triangleTransform, drawScreenSurface } from "./screen-surface.js";
test("flattened terminal texture projects all corners without a CSS text transform", () => {
  const points = [[45,87],[905,102],[943,706],[22,696]];
  const matrix = screenMatrix(points,1,1);
  [[0,0],[1,0],[1,1],[0,1]].forEach((uv,i) => projectPoint(matrix,...uv).forEach((v,j) => assert.ok(Math.abs(v-points[i][j]) < 1e-7)));
});
test("each canvas triangle maps its original texture coordinates exactly", () => {
  const source = [[200,150],[400,150],[400,300]], target = [[33,25],[70,23],[68,57]];
  const [a,b,c,d,e,f] = triangleTransform(source,target);
  source.forEach(([x,y],i) => [a*x+c*y+e,b*x+d*y+f].forEach((v,j) => assert.ok(Math.abs(v-target[i][j]) < 1e-8)));
  assert.equal(triangleTransform([[0,0],[1,1],[2,2]],target),null);
});
test("canvas preview has balanced drawing state and bounded mesh complexity", () => {
  let saves=0, restores=0, draws=0;
  const context = {save(){saves++;},restore(){restores++;},drawImage(){draws++;},beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){},transform(){}};
  drawScreenSurface(context,{width:2400,height:1500},[[0,0],[1000,0],[1000,625],[0,625]]);
  assert.equal(draws,192); assert.equal(saves,restores);
});
