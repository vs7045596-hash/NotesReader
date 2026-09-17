let notes=[],book=null,page=0,sound=true,busy=false;
const $=s=>document.querySelector(s);
function query(k){return new URLSearchParams(location.search).get(k)}
async function init(){const r=await fetch("data/notes.json?v="+Date.now());notes=await r.json();book=notes.find(x=>x.id===query("id"));if(!book){location.href="./";return}$("#bookTitle").textContent=book.title;$("#bookMeta").textContent=`${book.subject.toUpperCase()} · ${book.className||""}`;page=0;render()}
function render(){const total=book.pages.length;$("#pageImg").src=book.pages[page];$("#pageNo").textContent=`${page+1} / ${total}`;$("#progress").style.width=((page+1)/total*100)+"%";document.title=book.title+" — NotesBook"}
function flip(dir){if(busy)return;const next=page+dir;if(next<0||next>=book.pages.length)return;busy=true;const b=$("#book");b.classList.remove("turn-next","turn-prev");void b.offsetWidth;b.classList.add(dir>0?"turn-next":"turn-prev");page=next;playSound();setTimeout(()=>{render();b.classList.remove("turn-next","turn-prev");busy=false},dir>0?650:520)}
function playSound(){if(!sound)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C(),o=c.createOscillator(),g=c.createGain();o.type="triangle";o.frequency.setValueAtTime(1700,c.currentTime);o.frequency.exponentialRampToValueAtTime(500,c.currentTime+.09);g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.035,c.currentTime+.012);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.14);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.15)}catch(e){}}
$("#prev").onclick=$("#prev2").onclick=()=>flip(-1);$("#next").onclick=$("#next2").onclick=()=>flip(1);
$("#soundBtn").onclick=$("#soundText").onclick=()=>{sound=!sound;$("#soundBtn").textContent=sound?"🔊":"🔇";$("#soundText").textContent=sound?"Sound on":"Sound off"};
$("#fullBtn").onclick=()=>document.documentElement.requestFullscreen?.();
document.addEventListener("keydown",e=>{if(e.key==="ArrowRight")flip(1);if(e.key==="ArrowLeft")flip(-1)});
let sx=0;$("#book").addEventListener("touchstart",e=>sx=e.changedTouches[0].clientX,{passive:true});$("#book").addEventListener("touchend",e=>{let dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>45)flip(dx<0?1:-1)},{passive:true});
init();