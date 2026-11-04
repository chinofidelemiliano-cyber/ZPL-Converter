# Label Studio · Imagen a ZPL

Aplicación web en español para convertir PNG, JPEG y WEBP a ZPL II (`^GFA`). Procesa las imágenes localmente en el navegador, sin subirlas al servidor.

## Iniciar

Requiere Node.js 20 o posterior. No tiene dependencias externas.

```sh
npm start
```

Abre el puerto 3000 con tu navegador. Puedes cambiarlo mediante `PORT`. Para comprobar el conversor: `npm test`.

## Uso

Carga una imagen, indica el tamaño de la etiqueta en milímetros y la resolución real de tu impresora (203, 300 o 600 dpi). Ajusta el umbral o invierte los colores y descarga el archivo `.zpl`. La imagen conserva sus proporciones y se centra sobre la etiqueta con márgenes blancos. Límite: 20 MB por archivo, 40 megapíxeles de entrada y 16 millones de puntos de salida.

La vista previa muestra el mapa de bits, no simula el firmware de Zebra. Verifica tamaño, resolución y consumibles en una impresión de prueba. Esta versión genera archivos y no envía trabajos directamente a una impresora. No requiere servicios de terceros, claves ni conexión de red después de cargar la página.
