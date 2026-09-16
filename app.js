import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs";

const KEY="notesbook_books_v2";
let books=JSON.parse(localStorage.getItem(KEY)||"[]");
let current=null,currentPage=0,soundOn=true,turning=false,touchX=0;
const $=id=>document.getElementById(id);

function save(){localStorage.setItem(KEY,JSON.stringify(books))}
function showHome(){hideAll();$("home").classList.remove("hidden");renderLibrary();window.scrollTo(0,0)}
function showAdmin(){hideAll();$("admin").classList.remove("hidden");renderAdmin()}
function hideAll(){["home","admin","reader"].forEach(id=>$(id).classList.add("hidden"))}
window.showHome=showHome;window.showAdmin=showAdmin;

function renderLibrary(){
 $("noteCount").textContent=`${books.length} book${books.length===1?"":"s"}`;
 $("notesGrid").innerHTML=books.length?books.map((b,i)=>`<article class="noteCard" onclick="openReader(${i})"><h3>${esc(b.title)}</h3><p>${esc(b.subject)}${b.desc?" · "+esc(b.desc):""}</p><span>Open book →</span></article>`).join(""):`<div class="empty">No notes uploaded yet. Open Admin and upload your first PDF.</div>`;
}
function renderAdmin(){
 $("adminBooks").innerHTML=books.length?books.map((b,i)=>`<div class="adminRow"><div><strong>${esc(b.title)}</strong><span>${esc(b.subject)} · ${b.pages.length} pages</span></div><button class="delete" onclick="removeBook(${i})">Delete</button></div>`).join(""):`<div class="empty">No books yet.</div>`;
}
window.removeBook=i=>{if(confirm("Delete this book?")){books.splice(i,1);save();renderAdmin();renderLibrary()}};

$("fileInput").addEventListener("change",e=>{
 const fs=[...e.target.files];$("fileInfo").textContent=fs.length?fs.map(f=>f.name).join(" · "):"No file selected";
});

async function createBook(){
 const fs=[...$("fileInput").files],title=$("bookTitle").value.trim(),subject=$("bookSubject").value.trim(),desc=$("bookDesc").value.trim();
 if(!title||!subject||!fs.length){$("status").textContent="Please add a title, subject and file.";return}
 $("uploadBtn").disabled=true;$("status").textContent="Preparing your book…";
 try{
   let pages=[];
   for(const f of fs){
     if(f.type==="application/pdf") pages.push(...await pdfToPages(f));
     else if(f.type.startsWith("image/")) pages.push(await imageToData(f));
   }
   if(!pages.length) throw new Error("No readable pages found.");
   books.unshift({id:crypto.randomUUID(),title,subject,desc,pages});
   save();$("status").textContent=`Done — ${pages.length} pages created.`;
   $("bookTitle").value="";$("bookSubject").value="";$("bookDesc").value="";$("fileInput").value="";$("fileInfo").textContent="No file selected";
   renderAdmin();renderLibrary();
 }catch(e){$("status").textContent="Could not create book: "+e.message}
 $("uploadBtn").disabled=false;
}
window.createBook=createBook;

async function pdfToPages(file){
 const buf=await file.arrayBuffer(),pdf=await pdfjsLib.getDocument({data:buf}).promise,out=[];
 for(let n=1;n<=pdf.numPages;n++){
   $("status").textContent=`Making page ${n} of ${pdf.numPages}…`;
   const p=await pdf.getPage(n),base=p.getViewport({scale:1}),max=1500,scale=Math.min(2.2,max/base.width);
   const v=p.getViewport({scale}),c=document.createElement("canvas");c.width=v.width;c.height=v.height;
   await p.render({canvasContext:c.getContext("2d"),viewport:v}).promise;
   out.push(c.toDataURL("image/jpeg",.88));
 }
 return out;
}
function imageToData(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}

function openReader(i){
 current=books[i];currentPage=0;hideAll();$("reader").classList.remove("hidden");
 $("readerTitle").textContent=current.title;$("readerSubject").textContent=current.subject;drawPage();window.scrollTo(0,0);
}
window.openReader=openReader;
function closeReader(){showHome()}window.closeReader=closeReader;

function drawPage(){
 const url=current.pages[currentPage],img=new Image();
 img.onload=()=>{$("currentPage").innerHTML="";img.className="pageImg";$("currentPage").appendChild(img);img.style.cssText="width:100%;height:100%;object-fit:contain;display:block";
  $("pageText").textContent=`${currentPage+1} / ${current.pages.length}`;$("progress").style.width=((currentPage+1)/current.pages.length*100)+"%";
  $("prevBtn").disabled=currentPage===0;$("nextBtn").disabled=currentPage===current.pages.length-1;
 };
 img.src=url;
}
function turn(dir){
 if(turning||!current)return;
 const target=currentPage+dir;if(target<0||target>=current.pages.length)return;
 turning=true;
 const page=$("currentPage");page.classList.remove("flipNext","flipPrev");void page.offsetWidth;page.classList.add(dir>0?"flipNext":"flipPrev");
 playTurn();
 setTimeout(()=>{currentPage=target;page.classList.remove("flipNext","flipPrev");drawPage();turning=false},520);
}
window.turn=turn;

function playTurn(){
 if(!soundOn)return;
 try{
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  const ac=new AC(),dur=.22,rate=ac.sampleRate,buf=ac.createBuffer(1,rate*dur,rate),d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++){let t=i/d.length;d[i]=(Math.random()*2-1)*(1-t)*.10}
  const src=ac.createBufferSource(),filter=ac.createBiquadFilter(),gain=ac.createGain();
  src.buffer=buf;filter.type="bandpass";filter.frequency.value=1700;filter.Q.value=.7;
  gain.gain.setValueAtTime(.001,ac.currentTime);gain.gain.exponentialRampToValueAtTime(.06,ac.currentTime+.03);gain.gain.exponentialRampToValueAtTime(.001,ac.currentTime+dur);
  src.connect(filter).connect(gain).connect(ac.destination);src.start();src.stop(ac.currentTime+dur+.01);
 }catch{}
}
function toggleSound(){soundOn=!soundOn;$("soundBtn").textContent=soundOn?"🔊":"🔇"}window.toggleSound=toggleSound;

$("nextPage").onclick=()=>turn(1);$("currentPage").onclick=()=>turn(1);
$("book").addEventListener("touchstart",e=>touchX=e.changedTouches[0].clientX,{passive:true});
$("book").addEventListener("touchend",e=>{let dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>45)turn(dx<0?1:-1)},{passive:true});
document.addEventListener("keydown",e=>{if(!$("reader").classList.contains("hidden")){if(e.key==="ArrowRight")turn(1);if(e.key==="ArrowLeft")turn(-1)}});
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
renderLibrary();
