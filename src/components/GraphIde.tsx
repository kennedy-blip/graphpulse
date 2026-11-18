import { useEffect, useState } from 'react';
import { Braces, ChevronDown, Copy, Play, RotateCcw, SquareTerminal, Zap } from 'lucide-react';
import type { GraphResponse } from '../types';
const sampleQuery = `query GetProjects { projects { id name status owner { name } deployments { id status } } }`;
const initialQuery = `query WorkspaceOverview {
  projects {
    id
    name
    status
    stars
    owner { name email }
    deployments { id environment status duration }
  }
  deployments { id status environment createdAt }
}`;
type Props={onResult:(r:GraphResponse)=>void;onLatency:(n:number)=>void;onExecute:(q:string,v:string)=>Promise<GraphResponse>;sampleVersion?:number};
export default function GraphIde({onResult,onLatency,onExecute,sampleVersion=0}:Props){
 const [query,setQuery]=useState(initialQuery);const [variables,setVariables]=useState('{"includeDeployments": true}');const [response,setResponse]=useState<GraphResponse|null>(null);const [busy,setBusy]=useState(false);const [tab,setTab]=useState<'response'|'variables'>('response');
 useEffect(()=>{if(sampleVersion>0)setQuery(sampleQuery)},[sampleVersion]);
 const run=async()=>{setBusy(true);try{const r=await onExecute(query,variables);setResponse(r);onResult(r);onLatency(r.extensions?.executionTime??0)}finally{setBusy(false)}};
 return <section className="panel flex min-h-[510px] flex-col overflow-hidden"><div className="flex items-center justify-between border-b border-slate-800 px-4 py-3"><div className="flex items-center gap-2 text-sm font-semibold text-slate-200"><SquareTerminal size={16} className="text-violet-400"/> Query editor <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400">GRAPHQL</span></div><div className="flex items-center gap-2 text-slate-500"><button title="Copy query" onClick={()=>navigator.clipboard?.writeText(query)} className="rounded p-1.5 hover:bg-slate-800 hover:text-white"><Copy size={14}/></button><button title="Reset query" onClick={()=>setQuery(initialQuery)} className="rounded p-1.5 hover:bg-slate-800 hover:text-white"><RotateCcw size={14}/></button><button onClick={run} disabled={busy} className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"><Play size={13} fill="currentColor"/>{busy?'Executing…':'Execute query'} <span className="hidden rounded bg-emerald-700/30 px-1.5 py-0.5 text-[9px] sm:inline">⌘ ↵</span></button></div></div>
 <div className="grid flex-1 lg:grid-cols-2"><div className="border-b border-slate-800 lg:border-b-0 lg:border-r"><div className="flex items-center justify-between px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500"><span>Query</span><span>graphql</span></div><textarea spellCheck={false} value={query} onChange={e=>setQuery(e.target.value)} className="mono scrollbar h-[275px] w-full resize-none bg-transparent px-5 py-3 text-[12px] leading-[1.9] text-cyan-100 outline-none selection:bg-violet-500/30" /><div className="flex items-center gap-4 border-t border-slate-800 px-4 py-2"><span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Request config</span><button onClick={()=>setTab('variables')} className={`text-[11px] ${tab==='variables'?'text-cyan-300':'text-slate-500'}`}>Variables JSON</button></div>{tab==='variables'&&<textarea value={variables} onChange={e=>setVariables(e.target.value)} spellCheck={false} className="mono h-28 w-full resize-none bg-transparent px-5 py-3 text-xs leading-6 text-cyan-200 outline-none"/>}</div>
 <div className="flex min-w-0 flex-col"><div className="flex items-center justify-between border-b border-slate-800 px-4 py-3"><div className="flex items-center gap-2 text-xs font-semibold text-slate-300"><Braces size={14} className="text-cyan-400"/> Response</div><div className="flex items-center gap-2"><span className="rounded bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-400">{response?.errors?.length?'400 ERROR':'200 OK'}</span><span className="mono text-[10px] text-slate-500">{response?.extensions?.executionTime??'—'} ms</span></div></div><pre className="mono scrollbar min-h-[330px] flex-1 overflow-auto whitespace-pre-wrap break-words px-5 py-4 text-[11px] leading-[1.85] text-slate-300">{response?JSON.stringify(response,null,2):'// Execute a query to inspect the response\n// Your JSON payload will appear here.'}</pre></div></div>
 <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/40 px-4 py-2 text-[10px] text-slate-500"><span>GraphQL • UTF-8 • JSON</span><span className="flex items-center gap-1"><Zap size={11} className="text-amber-400"/> Ready to execute</span></div></section>
}