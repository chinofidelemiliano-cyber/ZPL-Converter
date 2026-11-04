// Code 39: nine alternating bars/spaces, narrow=1 and wide=3 modules.
const alphabet='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%*';
const patterns=['nnnwwnwnn','wnnwnnnnw','nnwwnnnnw','wnwwnnnnn','nnnwwnnnw','wnnwwnnnn','nnwwwnnnn','nnnwnnwnw','wnnwnnwnn','nnwwnnwnn','wnnnnwnnw','nnwnnwnnw','wnwnnwnnn','nnnnwwnnw','wnnnwwnnn','nnwnwwnnn','nnnnnwwnw','wnnnnwwnn','nnwnnwwnn','nnnnwwwnn','wnnnnnnww','nnwnnnnww','wnwnnnnwn','nnnnwnnww','wnnnwnnwn','nnwnwnnwn','nnnnnnwww','wnnnnnwwn','nnwnnnwwn','nnnnwnwwn','wwnnnnnnw','nwwnnnnnw','wwwnnnnnn','nwnnwnnnw','wwnnwnnnn','nwwnwnnnn','nwnnnnwnw','wwnnnnwnn','nwwnnnwnn','nwnwnwnnn','nwnwnnnwn','nwnnnwnwn','nnnwnwnwn','nwnnwnwnn'];
export function code39(text){
 if(!text||text.length>40||!/^[0-9A-Z. $/+%\-]+$/.test(text))throw new Error('Code 39: usa de 1 a 40 caracteres: A–Z, 0–9, espacio o - . $ / + %.');
 const bars=[];let position=10;
 for(const char of '*'+text+'*'){
  const pattern=patterns[alphabet.indexOf(char)];
  for(let i=0;i<9;i++){const width=pattern[i]==='w'?3:1;if(i%2===0)bars.push({x:position,width});position+=width;}
  position++;
 }
 return {bars,modules:position-1+10};
}
