const $=s=>document.querySelector(s);
const STORE="notesbook_admin_v1";
let saved={};try{saved=JSON.parse(localStorage.getItem(STORE)||"{}")}catch(e){}
$("#owner").value=saved.owner||"";$("#repo").value=saved.repo||"";$("#remember").checked=!!saved.token;if(saved.token)$("#token").value=saved.token;
$("#remember").onchange=()=>saveMaybe();["owner","repo","token"].forEach(id=>$("#"+id).addEventListener("change",saveMaybe));
function saveMaybe(){const d={owner:$("#owner").value.trim(),repo:$("#repo").value.trim()};if($("#remember").checked)d.token=$("#token").value.trim();localStorage.setItem(STORE,JSON.stringify(d))}
function msg(t,ok=false){$("#status").textContent=t;$("#status").style.color=ok?"#7de2b0":"#aeb7ca"}
function b64(a){let s="";const u=new Uint8Array(a);for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode(...u.subarray(i,i+0x8000));return btoa(s)}
async function gh(path,options={}){const token=$("#token").value.trim();if(!token)throw Error("Enter your GitHub token.");const r=await fetch(`https://api.github.com/repos/${encodeURIComponent($("#owner").value.trim())}/${encodeURIComponent($("#repo").value.trim())}/contents/${path}`,{...options,headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",...(options.headers||{})}});if(!r.ok){const x=await r.json().catch(()=>({}));throw Error(x.message||`GitHub error ${r.status}`)}return r.json()}
async function getFile(path){try{return await gh(path)}catch(e){if(/Not Found/i.test(e.message)||e.message.includes("404"))return null;throw e}}
$("#uploadForm").onsubmit=async e=>{e.preventDefault();const f=$("#file").files[0];if(!f)return;const owner=$("#owner").value.trim(),repo=$("#repo").value.trim();if(!owner||!repo){msg("Enter your GitHub owner and repository.");return}
try{saveMaybe();msg("Reading PDF…");const bytes=await f.arrayBuffer();if(bytes.byteLength>100*1024*1024)throw Error("GitHub Contents API is not suitable for a PDF this large. Keep uploads below 100 MB.");
const slug=$("#title").value.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"note";const id=Date.now().toString(36)+"-"+slug;const pdfPath=`uploads/${$("#subject").value}/${id}.pdf`;
msg("Uploading PDF to GitHub…");await gh(pdfPath,{method:"PUT",body:JSON.stringify({message:`Add note: ${$("#title").value.trim()}`,content:b64(bytes)})});
msg("Updating note catalogue…");const existing=await getFile("data/notes.json");let arr=[];let sha;if(existing){arr=JSON.parse(atob(existing.content.replace(/\n/g,"")));sha=existing.sha}
arr.unshift({id,title:$("#title").value.trim(),description:$("#description").value.trim(),subject:$("#subject").value,className:$("#className").value.trim()||"Class 11",pages:[],source:pdfPath,status:"processing",createdAt:new Date().toISOString()});
const content=btoa(unescape(encodeURIComponent(JSON.stringify(arr,null,2))));const body={message:`Register note: ${$("#title").value.trim()}`,content};if(sha)body.sha=sha;await gh("data/notes.json",{method:"PUT",body:JSON.stringify(body)});
msg("Published. GitHub Actions is now converting the PDF into readable book pages. Refresh the student site after the workflow finishes.",true);$("#file").value="";$("#title").value="";$("#description").value="";
}catch(err){console.error(err);msg("Publish failed: "+err.message)}};
