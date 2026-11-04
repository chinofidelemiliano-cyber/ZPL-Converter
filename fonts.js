export const fonts=[
 {id:'arial',zpl:'0',name:'Zebra 0 · escalable',family:'Arial, Helvetica, sans-serif',description:'Clara y versátil para nombres y datos.'},
 {id:'verdana',zpl:'D',name:'Zebra D · estándar',family:'Verdana, Geneva, sans-serif',description:'Letras abiertas para facilitar la lectura.'},
 {id:'trebuchet',zpl:'A',name:'Zebra A · compacta',family:'"Trebuchet MS", Arial, sans-serif',description:'Fuente pequeña incorporada para datos compactos.'},
 {id:'georgia',zpl:'E',name:'Zebra E · OCR-B',family:'Georgia, "Times New Roman", serif',description:'Fuente OCR-B incorporada en impresoras compatibles.'},
 {id:'times',zpl:'F',name:'Zebra F · alta',family:'"Times New Roman", Times, serif',description:'Fuente de mapa de bits incorporada, con escalado por múltiplos.'},
 {id:'mono',zpl:'H',name:'Zebra H · OCR-A',family:'"Courier New", Courier, monospace',description:'Caracteres de ancho fijo para referencias y lotes.'}
];
export const fontById=id=>fonts.find(font=>font.id===id)||fonts[0];
