import qrcode from './vendor/qrcode.mjs?v=native-v6';
// Use the platform UTF-8 encoder, including accented text and emoji.
qrcode.stringToBytes=text=>Array.from(new TextEncoder().encode(text));
export function qrContent(text,isUrl=false){
 let content=text.trim();
 if(!content)throw new Error('Escribe el contenido del código QR.');
 if(isUrl){
  if(!/^[a-z][a-z0-9+.-]*:/i.test(content)){
   if(!/^(?:[a-z0-9-]+\.)+[a-z0-9-]+(?::\d+)?(?:[/?#]|$)/i.test(content))throw new Error('Escribe un enlace válido, por ejemplo tusitio.com o https://tusitio.com.');
   content='https://'+content;
  }
  let url;try{url=new URL(content);}catch{throw new Error('Revisa el enlace de tu página web.');}
  if(!['https:','http:'].includes(url.protocol)||!url.hostname||/\s/.test(content))throw new Error('El enlace debe ser una dirección web http:// o https:// sin espacios.');
 }
 if(new TextEncoder().encode(content).length>1000)throw new Error('El QR admite hasta 1000 bytes. Acorta el texto o el enlace.');
 return content;
}
const cache=new Map();
export function makeQr(text,isUrl=false){
 const content=qrContent(text,isUrl);if(cache.has(content))return cache.get(content);
 const qr=qrcode(0,'M');qr.addData(content,'Byte');qr.make();
 const result={size:qr.getModuleCount(),dark:(row,col)=>qr.isDark(row,col)};cache.set(content,result);if(cache.size>8)cache.delete(cache.keys().next().value);return result;
}
