export const fonts=[
 {id:'arial',zpl:'0',name:'Zebra 0 · escalable',family:'Arial, Helvetica, sans-serif',description:'Clara y versátil para nombres y datos.'},
 {id:'verdana',zpl:'D',name:'Zebra D · estándar',family:'Verdana, Geneva, sans-serif',description:'Letras abiertas para facilitar la lectura.'},
 {id:'trebuchet',zpl:'A',name:'Zebra A · compacta',family:'"Trebuchet MS", Arial, sans-serif',description:'Fuente pequeña incorporada para datos compactos.'},
 {id:'georgia',zpl:'E',name:'Zebra E · OCR-B',family:'Georgia, "Times New Roman", serif',description:'Fuente OCR-B incorporada en impresoras compatibles.'},
 {id:'times',zpl:'F',name:'Zebra F · alta',family:'"Times New Roman", Times, serif',description:'Fuente de mapa de bits incorporada, con escalado por múltiplos.'},
 {id:'mono',zpl:'H',name:'Zebra H · OCR-A',family:'"Courier New", Courier, monospace',description:'Caracteres de ancho fijo para referencias y lotes.'}
];
export const fontById=id=>fonts.find(font=>font.id===id)||fonts[0];

// Resident ZPL font identifiers. Actual availability depends on printer firmware.
fonts.push(
 {id:'zebra-b',zpl:'B',name:'Zebra B · 11 × 7',family:'Arial, sans-serif',description:'Fuente residente B. Tamaño base: 11 × 7 dots.'},
 {id:'zebra-c',zpl:'C',name:'Zebra C · 18 × 10',family:'Arial, sans-serif',description:'Fuente residente C. Tamaño base: 18 × 10 dots.'},
 {id:'zebra-g',zpl:'G',name:'Zebra G · 60 × 40',family:'Arial, sans-serif',description:'Fuente residente G para tamaños grandes. Base: 60 × 40 dots.'},
 {id:'zebra-gs',requiresFile:true,name:'GS · símbolos por archivo',family:'monospace',description:'Fuente de símbolos GS: indica el archivo real instalado en tu impresora. No se incluye ni se descarga automáticamente.'},
 {id:'installed',requiresFile:true,name:'Otra fuente instalada · ^A@',family:'Arial, sans-serif',description:'Usa una fuente FNT, TTF o TTE ya instalada. Especifica su ruta en memoria; no se instala desde esta página.'}
);
export function fontCommand(id,size,fontFile=''){
 const font=fontById(id);
 if(font.requiresFile){
  if(!/^[REBA]:[A-Za-z0-9_-]{1,32}\.(?:FNT|TTF|TTE)$/i.test(fontFile))throw new Error('Indica la ruta real de la fuente instalada, por ejemplo E:MI_FUENTE.TTF.');
  return `^A@N,${size},${Math.max(1,Math.round(size*.6))},${fontFile}`;
 }
 return `^A${font.zpl}N,${size},${Math.max(1,Math.round(size*.6))}`;
}
