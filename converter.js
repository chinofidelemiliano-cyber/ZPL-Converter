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

export function applyPrintSettings(zpl,copies=1,speed='',thermal={}){
 if(!Number.isInteger(copies)||copies<1||copies>9999)throw new Error('La cantidad debe ser un entero entre 1 y 9999 etiquetas.');
 const validLetter=typeof speed==='string'&&/^[A-E]$/.test(speed);
 if(typeof speed==='string'&&/^(?:[1-9]|1[0-4])$/.test(speed))speed=Number(speed);
 if(speed!==''&&!validLetter&&(!Number.isInteger(speed)||speed<1||speed>14))throw new Error('Elige una velocidad numérica entre 1 y 14, o una letra heredada de A a E.');
 const {method='printer',darkness='',ribbon='unknown',handling='printer'}=thermal;
 if(!['printer','direct','transfer'].includes(method))throw new Error('Método de impresión inválido.');
 if(darkness!==''&&(!Number.isInteger(darkness)||darkness<0||darkness>30))throw new Error('La oscuridad debe ser un entero entre 0 y 30.');
 if(!['unknown','wax','wax-resin','resin'].includes(ribbon))throw new Error('Tipo de ribbon inválido.');
 if(method==='direct'&&ribbon!=='unknown')throw new Error('La térmica directa no utiliza ribbon.');
 const modes={printer:'',tear:'T',peel:'P',rewind:'R',cutter:'C'};if(!(handling in modes))throw new Error('Modo de salida inválido.');
 const commands=(speed===''?'':`^PR${speed}\n`)+(method==='printer'?'':`^MT${method==='direct'?'D':'T'}\n`)+(darkness===''?'':`^MD0\n`)+(modes[handling]?`^MM${modes[handling]}\n`:'');
 return zpl.replace('^XA\n',(darkness===''?'':`~SD${darkness}\n`)+'^XA\n'+commands).replace('\n^XZ',`\n^PQ${copies}\n^XZ`);
}
