import {fonts} from './fonts.js?v=native-v10';
import {code39} from './barcode.js?v=native-v10';
import {makeQr} from './qr.js?v=native-v10';
export function initGallery(useFont,addElement){
 const grid=document.getElementById('font-gallery');
 for(const font of fonts){
  const card=document.createElement('article');card.className='font-card';
  const title=document.createElement('h3');title.textContent=font.name;
  const sample=document.createElement('p');sample.className='font-sample';sample.style.fontFamily=font.family;sample.textContent='Mi etiqueta · Café 123';
  const styles=document.createElement('p');styles.className='font-styles';styles.style.fontFamily=font.family;
  const bold=document.createElement('strong');bold.textContent='Negrita';const command=document.createElement('code');command.textContent=font.requiresFile?'^A@':'^A'+font.zpl;styles.append(bold,command);
  const description=document.createElement('p');description.className='hint';description.textContent=font.description;
  const button=document.createElement('button');button.textContent='Usar esta fuente';button.addEventListener('click',()=>useFont(font.id));
  card.append(title,sample,styles,description,button);grid.append(card);
 }
 document.getElementById('sample-text').addEventListener('input',event=>{for(const node of grid.querySelectorAll('.font-sample'))node.textContent=event.target.value||'Mi etiqueta · Café 123';});
 for(const [type,name,detail] of [['text','Texto','Nombres, descripciones y datos.'],['box','Recuadro','Bordes para organizar tu etiqueta.'],['barcode','Código de barras','Code 39: letras mayúsculas y números.'],['qr','Código QR','Texto o información escaneable.'],['url','QR con enlace','Abre una página web al escanearlo.'],['image','Imagen','Logos, fotografías y tramado de grises.']]){
  const card=document.createElement('article');card.className='font-card';
  const title=document.createElement('h3');title.textContent=name;
  const sample=document.createElement('div');sample.className='element-sample';
  if(type==='qr'||type==='url'){
   const qr=makeQr(type==='url'?'https://example.com':'Muestra');const canvas=document.createElement('canvas');canvas.width=canvas.height=(qr.size+8)*3;const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='black';for(let r=0;r<qr.size;r++)for(let c=0;c<qr.size;c++)if(qr.dark(r,c))ctx.fillRect((c+4)*3,(r+4)*3,3,3);canvas.setAttribute('aria-label','Ejemplo de QR');sample.append(canvas);
  }else if(type==='barcode'){
   const bars=code39('ABC123');const canvas=document.createElement('canvas');canvas.width=bars.modules*2;canvas.height=70;const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,70);ctx.fillStyle='black';for(const bar of bars.bars)ctx.fillRect(bar.x*2,5,bar.width*2,60);canvas.setAttribute('aria-label','Ejemplo de código de barras');sample.append(canvas);
  }else sample.textContent={text:'Aa · 123',box:'▭',image:'▧'}[type];
  const description=document.createElement('p');description.className='hint';description.textContent=detail;
  const button=document.createElement('button');button.textContent='Añadir a mi etiqueta';button.addEventListener('click',()=>addElement(type));
  card.append(title,sample,description,button);document.getElementById('element-gallery').append(card);
 }
}
