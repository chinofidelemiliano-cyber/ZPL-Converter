export function installFieldHelp(){
 const help={
  width:'Ancho imprimible de cada etiqueta. Puedes escribir la medida y elegir mm o pulgadas.',
  height:'Largo de la etiqueta, sin incluir la separación entre etiquetas (gap).',
  dpi:'Elige la resolución real de tu impresora. Determina cuántos puntos se usan por pulgada.',
  copies:'Cuántas copias del mismo diseño quieres. En una serie, son las copias de cada número.',
  units:'Unidad predeterminada para las medidas. Cada campo también puede usar su propio selector.',
  pw:'Ancho en puntos de impresión (dots). Cambiarlo también actualiza la medida física de la etiqueta.',
  ll:'Largo en puntos de impresión (dots), sin el gap. Se sincroniza con el largo en mm o pulgadas.',
  'element-x':'Distancia horizontal desde el borde izquierdo de la etiqueta.',
  'element-y':'Distancia vertical desde el borde superior de la etiqueta.',
  'fo-x':'La misma posición horizontal expresada en dots, como se escribe en ^FO.',
  'fo-y':'La misma posición vertical expresada en dots, como se escribe en ^FO.',
  'element-w':'Ancho del elemento. En un QR es el tamaño máximo del cuadrado, incluidos sus márgenes blancos.',
  'element-h':'Alto del elemento dentro de la etiqueta.',
  'font-family':'Fuente que usará la impresora. Las fuentes adicionales deben estar instaladas en su memoria.',
  'font-size':'Altura del texto. El aspecto final depende de la fuente Zebra y la resolución elegidas.',
  'companion-size':'Altura del texto adicional que acompaña al código o a la imagen.',
  'line-width':'Grosor del borde del recuadro.',
  'barcode-number-mode':'Fijo repite el mismo dato. Consecutivo cambia el número en cada etiqueta según el inicio y el incremento.',
  'puzzle-rows':'Cantidad de piezas de arriba a abajo en la imagen armada.',
  'puzzle-cols':'Cantidad de piezas de izquierda a derecha en la imagen armada.',
  'puzzle-fit':'Imagen completa conserva todo y puede dejar márgenes. Llenar recorta el sobrante para cubrir las piezas.',
  mode:'Blanco y negro usa un umbral. Grises con puntos conserva tonos mediante tramado monocromático.'
 };
 for(const [id,text] of Object.entries(help)){
  const field=document.getElementById(id),card=field?.closest('.field,.setting-card');if(!field||!card||card.querySelector('small'))continue;
  const node=document.createElement('small');node.id=id+'-description';node.className='field-help';node.textContent=text;card.append(node);
  field.setAttribute('aria-describedby',((field.getAttribute('aria-describedby')||'')+' '+node.id).trim());
 }
}
