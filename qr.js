import qrcode from './vendor/qrcode.mjs?v=native-v4';
// Use the platform UTF-8 encoder, including accented text and emoji.
qrcode.stringToBytes=text=>Array.from(new TextEncoder().encode(text));
export function makeQr(text,isUrl=false){
 const content=text.trim();
 if(!content)throw new Error('Escribe el contenido del código QR.');
 if(new TextEncoder().encode(content).length>1000)throw new Error('El QR admite hasta 1000 bytes. Acorta el texto o el enlace.');
 if(isUrl){
  let url;try{url=new URL(content);}catch{throw new Error('Escribe un enlace completo, por ejemplo https://tusitio.com.');}
  if(!['https:','http:'].includes(url.protocol)||!url.hostname)throw new Error('El enlace debe empezar con https:// o http://.');
 }
 const qr=qrcode(0,'M');qr.addData(content,'Byte');qr.make();
 return {size:qr.getModuleCount(),dark:(row,col)=>qr.isDark(row,col)};
}
