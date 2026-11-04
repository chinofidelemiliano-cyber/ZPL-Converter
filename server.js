import http from 'node:http';
import { readFile } from 'node:fs/promises';
const files = {'/':'index.html','/app.js':'app.js','/editor.js':'editor.js','/barcode.js':'barcode.js','/qr.js':'qr.js','/vendor/qrcode.mjs':'vendor/qrcode.mjs','/converter.js':'converter.js','/style.css':'style.css'};
const types = {html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8'};
http.createServer(async(req,res)=>{
 const file=files[new URL(req.url,'http://localhost').pathname];
 if(!file){res.writeHead(404);res.end('No encontrado');return;}
 try{const data=await readFile(new URL(file,import.meta.url));res.writeHead(200,{'Content-Type':types[file.split('.').pop()],'X-Content-Type-Options':'nosniff'});res.end(data);}catch{res.writeHead(500);res.end('Error al cargar la aplicación');}
}).listen(Number(process.env.PORT || 3000),'0.0.0.0',()=>console.log('Convertidor iniciado en puerto '+(process.env.PORT || 3000)));
