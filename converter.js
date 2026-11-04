export function rasterToZpl(rgba,width,height,threshold=128,invert=false,mode="threshold"){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>16000000||rgba.length!==width*height*4)throw new Error('Dimensiones de imagen inválidas');
 if(!Number.isFinite(threshold)||threshold<0||threshold>255)throw new Error('Umbral inválido');
 if(!["threshold","dither"].includes(mode))throw new Error("Modo inválido");
 const errors=mode==="dither"?new Float32Array(width*height):null;
 const stride=Math.ceil(width/8), bytes=new Uint8Array(stride*height),preview=new Uint8ClampedArray(rgba.length);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4,a=rgba[i+3]/255;
  const brightness=(.299*rgba[i]+.587*rgba[i+1]+.114*rgba[i+2])*a+255*(1-a);
  let black;
  if(errors){
   const pos=y*width+x;
   const adjusted=Math.max(0,Math.min(255,(invert?255-brightness:brightness)+(threshold-128)*-1+errors[pos]));
   black=adjusted<128;
   const error=adjusted-(black?0:255);
   if(x+1<width)errors[pos+1]+=error*7/16;
   if(y+1<height){
    if(x>0)errors[pos+width-1]+=error*3/16;
    errors[pos+width]+=error*5/16;
    if(x+1<width)errors[pos+width+1]+=error/16;
   }
  }else black=(brightness<threshold)!==invert;
  if(black)bytes[y*stride+(x>>3)]|=128>>(x%8);
  preview[i]=preview[i+1]=preview[i+2]=black?0:255;preview[i+3]=255;
 }
 const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0').toUpperCase()).join('');
 return {zpl:`^XA\n^PW${width}\n^LL${height}\n^FO0,0\n^GFA,${bytes.length},${bytes.length},${stride},${hex}\n^FS\n^XZ`,preview,bytes};
}
