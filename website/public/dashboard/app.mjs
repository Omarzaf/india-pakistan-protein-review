import { mount } from './pakistan-india.mjs';

const container=document.querySelector('#main');
const toastElement=document.querySelector('#toast');
let toastTimer;
function toast(message){clearTimeout(toastTimer);toastElement.textContent=message;toastElement.hidden=false;toastTimer=setTimeout(()=>{toastElement.hidden=true;},5000);}
function download(name,text,type='text/plain'){const url=URL.createObjectURL(new Blob([text],{type:type+';charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function fetchJson(url){const response=await fetch(url,{credentials:'omit'});if(!response.ok)throw new Error('Published evidence is unavailable ('+response.status+').');return response.json();}
try {
  const manifest=await fetchJson('/dashboard/pakistan-india-manifest.json');
  const tables=new Map(Object.values(manifest.datasets).map(binding=>['/tables/'+binding.id+'.json','/dashboard/tables/'+binding.id+'.json']));
  const documents=new Map(manifest.documents.map(document=>[document.id,document]));
  async function json(request){
    if(tables.has(request))return fetchJson(tables.get(request));
    const parsed=new URL(request,location.origin);
    if(parsed.origin===location.origin&&parsed.pathname==='/api/focus-document'){
      const document=documents.get(parsed.searchParams.get('id'));
      if(document?.readerPath&&document.readerPath.startsWith('/dashboard/documents/')&&!document.readerPath.includes('..'))return fetchJson(document.readerPath);
    }
    throw new Error('This resource is outside the published dashboard.');
  }
  mount(container,manifest,{json,download,toast,sourceDetail:()=>toast('Select a published source or report in the evidence panel.')});
} catch(error) {
  container.replaceChildren();
  const heading=document.createElement('h1');heading.textContent='The dashboard could not load.';
  const message=document.createElement('p');message.textContent=error.message;
  const retry=document.createElement('button');retry.textContent='Retry dashboard';retry.addEventListener('click',()=>location.reload());
  const report=document.createElement('a');report.href='/';report.textContent='Read the retained report';
  container.append(heading,message,retry,document.createTextNode(' '),report);
}
