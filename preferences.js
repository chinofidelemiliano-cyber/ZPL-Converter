const defaults={theme:'system',accent:'#207f5f',textSize:'normal',density:'comfortable',previewGrid:true};
const presets={green:'#207f5f',blue:'#2563eb',purple:'#7c3aed',orange:'#c2410c'};
export function normalizePreferences(value={}){
 return {theme:['system','light','dark'].includes(value.theme)?value.theme:defaults.theme,accent:/^#[0-9a-f]{6}$/i.test(value.accent||'')?value.accent:defaults.accent,textSize:['normal','large'].includes(value.textSize)?value.textSize:'normal',density:['comfortable','compact'].includes(value.density)?value.density:'comfortable',previewGrid:typeof value.previewGrid==='boolean'?value.previewGrid:true};
}
function contrastText(hex){const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4),l=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];return (1.05/(l+.05))>=((l+.05)/.05)?'#ffffff':'#000000';}
function readableAccent(hex,dark){
 const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)),background=dark?[27,40,34]:[255,255,255];
 const luminance=values=>values.map(v=>v/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
 const bg=luminance(background);let color=rgb;
 for(let n=0;n<=10;n++){color=rgb.map(c=>Math.round(c*(1-n/10)+(dark?255:0)*n/10));const l=luminance(color);if((Math.max(l,bg)+.05)/(Math.min(l,bg)+.05)>=4.5)break;}
 return '#'+color.map(c=>c.toString(16).padStart(2,'0')).join('');
}
export function initPreferences(){
 const $=id=>document.getElementById(id),query=matchMedia('(prefers-color-scheme: dark)');let prefs={...defaults};
 try{prefs=normalizePreferences(JSON.parse(localStorage.getItem('label-studio-page-preferences')||'{}'));}catch{}
 function apply(){const root=document.documentElement;root.dataset.theme=prefs.theme==='system'?(query.matches?'dark':'light'):prefs.theme;root.dataset.uiSize=prefs.textSize;root.dataset.density=prefs.density;root.dataset.previewGrid=String(prefs.previewGrid);root.style.setProperty('--accent',prefs.accent);root.style.setProperty('--accent-ink',contrastText(prefs.accent));root.style.setProperty('--accent-text',readableAccent(prefs.accent,root.dataset.theme==='dark'));$('appearance-sample').style.borderColor=prefs.accent;}
 function fields(){ $('page-theme').value=prefs.theme;$('page-accent').value=prefs.accent;$('page-text-size').value=prefs.textSize;$('page-density').value=prefs.density;$('page-preview-grid').checked=prefs.previewGrid;for(const button of document.querySelectorAll('[data-accent]'))button.setAttribute('aria-pressed',String(presets[button.dataset.accent]===prefs.accent));}
 function save(){apply();fields();try{localStorage.setItem('label-studio-page-preferences',JSON.stringify(prefs));$('preferences-status').textContent='Preferencias guardadas en este navegador.';}catch{$('preferences-status').textContent='Preferencias aplicadas a esta sesión. El navegador no permitió guardarlas.';}}
 for(const [id,key] of [['page-theme','theme'],['page-accent','accent'],['page-text-size','textSize'],['page-density','density'],['page-preview-grid','previewGrid']])$(id).addEventListener('input',()=>{prefs=normalizePreferences({...prefs,[key]:id==='page-preview-grid'?$(id).checked:$(id).value});save();});
 for(const button of document.querySelectorAll('[data-accent]'))button.addEventListener('click',()=>{prefs.accent=presets[button.dataset.accent];save();});
 $('page-preferences-reset').addEventListener('click',()=>{prefs={...defaults};save();$('preferences-status').textContent='Apariencia restablecida. Tus perfiles de impresora no se han borrado.';});
 query.addEventListener('change',()=>{if(prefs.theme==='system')apply();});apply();fields();
}
