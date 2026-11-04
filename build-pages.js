import {readFile,writeFile} from 'node:fs/promises';
const release='native-v9';
const pages={ 'impresoras.html':['models','Modelos de impresoras Zebra'], 'visor-zpl.html':['viewer','Previsualizar código ZPL'], 'index.html':['image','Imagen a ZPL'], 'editor.html':['editor','Crea tu etiqueta desde cero'], 'rompecabezas.html':['puzzle','Rompecabezas de etiquetas'], 'fuentes.html':['gallery','Fuentes y muestrario'] };
const template=await readFile(new URL('index.html',import.meta.url),'utf8');
for(const [file,[page,title]] of Object.entries(pages)){
 const html=template.replace(/data-page="[^"]+"/,`data-page="${page}"`).replace(/<title>.*?<\/title>/,`<title>${title} · Label Studio</title>`).replace(/(<h1 id="section-title">).*?(<\/h1>)/,`$1${title}$2`).replace(/href="\/style.css(?:\?[^\"]*)?"/,'href="/style.css?v='+release+'"').replace(/src="\/app.js(?:\?[^\"]*)?"/,'src="/app.js?v='+release+'"');
 await writeFile(new URL(file,import.meta.url),html);
}
console.log('6 páginas generadas · '+release);
