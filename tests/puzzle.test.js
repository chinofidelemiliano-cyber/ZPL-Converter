import test from 'node:test';
import assert from 'node:assert/strict';
import {puzzleLayout,fitImage} from '../puzzle.js';
import {mediaSettings,applyMedia} from '../media.js';
test('puzzle tiles cover the whole image without missing or overlapping pixels',()=>{
 const layout=puzzleLayout(3,2,2,3);assert.deepEqual([layout.width,layout.height],[9,4]);
 const hits=new Uint8Array(layout.width*layout.height);
 for(const tile of layout.tiles)for(let y=tile.y;y<tile.y+tile.height;y++)for(let x=tile.x;x<tile.x+tile.width;x++)hits[y*layout.width+x]++;
 assert.ok(hits.every(n=>n===1));
 assert.deepEqual(layout.tiles.map(t=>[t.row,t.col]),[[1,1],[1,2],[1,3],[2,1],[2,2],[2,3]]);
});
test('puzzle rejects invalid grids and excessive raster memory',()=>{
 for(const args of [[1,1,0,2],[1,1,2,11],[1,1,1.5,2],[2000,2000,10,10]])assert.throws(()=>puzzleLayout(...args));
});
test('contain preserves whole image; cover crops symmetrically',()=>{
 assert.deepEqual(fitImage(100,50,100,100,'contain'),{x:0,y:25,width:100,height:50});
 assert.deepEqual(fitImage(100,50,100,100,'cover'),{x:-50,y:0,width:200,height:100});
});
test('gap is measured stock spacing, not printable image length',()=>{
 const media=mediaSettings('gap',3,50,203);assert.equal(media.pitchMm,53);assert.equal(media.gapDots,24);
 const zpl=applyMedia('^XA\n^LL400\n^XZ','gap');assert.match(zpl,/\^MNY/);assert.match(zpl,/\^LL400/);assert.ok(!zpl.includes('^LL424'));
 assert.match(applyMedia('^XA\n^XZ','continuous'),/\^MNN/);assert.equal(applyMedia('^XA\n^XZ','printer'),'^XA\n^XZ');
});
test('gap validation only applies to gap media',()=>{
 for(const gap of [0,-1,26,NaN])assert.throws(()=>mediaSettings('gap',gap,50,203));
 assert.equal(mediaSettings('continuous',NaN,50,203).pitchMm,50);
});
