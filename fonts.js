export const fonts=[
 {id:'arial',name:'Sans serif',family:'Arial, Helvetica, sans-serif',description:'Clara y versátil para nombres y datos.'},
 {id:'verdana',name:'Amplia',family:'Verdana, Geneva, sans-serif',description:'Letras abiertas para facilitar la lectura.'},
 {id:'trebuchet',name:'Humanista',family:'"Trebuchet MS", Arial, sans-serif',description:'Un estilo suave para títulos y productos.'},
 {id:'georgia',name:'Serif',family:'Georgia, "Times New Roman", serif',description:'Remates clásicos para etiquetas elegantes.'},
 {id:'times',name:'Clásica',family:'"Times New Roman", Times, serif',description:'Texto tradicional con proporciones compactas.'},
 {id:'mono',name:'Monoespaciada',family:'"Courier New", Courier, monospace',description:'Caracteres de ancho fijo para referencias y lotes.'}
];
export const fontById=id=>fonts.find(font=>font.id===id)||fonts[0];
