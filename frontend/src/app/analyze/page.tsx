"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Check, Clipboard, FileImage, LoaderCircle, Sparkles, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { AIResponse, AnalyzeResponse, UsageInfo } from "@/types";
import { BrandMark, Button, Card, Label } from "@/components/ui";

const platforms = ["whatsapp","instagram","discord","telegram","imessage","other"];

function LoadingScreen(){return <div className="flex min-h-screen items-center justify-center bg-[#fafafa]"><div className="text-sm text-[#777]">Loading flayre…</div></div>}

export default function AnalyzePage(){
 const router=useRouter();
 const {isAuthenticated,isLoading:authLoading}=useAuth();
 const [image,setImage]=useState<string|null>(null);
 const [file,setFile]=useState<File|null>(null);
 const [platform,setPlatform]=useState("whatsapp");
 const [analyzing,setAnalyzing]=useState(false);
 const [analysis,setAnalysis]=useState<AnalyzeResponse|null>(null);
 const [usage,setUsage]=useState<UsageInfo|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [copied,setCopied]=useState<string|null>(null);
 const inputRef=useRef<HTMLInputElement>(null);

 const loadUsage=useCallback(async()=>{try{setUsage(await api.analyze.getUsage())}catch{}},[]);
 useEffect(()=>{if(!authLoading&&!isAuthenticated)router.push("/login?redirect=/analyze")},[authLoading,isAuthenticated,router]);
 useEffect(()=>{if(isAuthenticated)loadUsage()},[isAuthenticated,loadUsage]);

 const setSelectedFile=(next:File|null)=>{
   if(!next)return;
   if(!next.type.startsWith("image/")){setError("Please choose an image.");return;}
   setFile(next); setError(null); setAnalysis(null);
   const reader=new FileReader(); reader.onload=()=>setImage(String(reader.result)); reader.readAsDataURL(next);
 };
 useEffect(()=>{
   const onPaste=(e:ClipboardEvent)=>{const item=[...(e.clipboardData?.items??[])].find(x=>x.type.startsWith("image/")); if(item){e.preventDefault();setSelectedFile(item.getAsFile())}};
   document.addEventListener("paste",onPaste); return()=>document.removeEventListener("paste",onPaste);
 },[]);

 const analyze=async()=>{
   if(!image||!file)return setError("Add a screenshot first.");
   if(usage&&usage.analyses_remaining<=0)return setError("You have used your monthly analyses. Upgrade to Pro for unlimited use.");
   setAnalyzing(true);setError(null);
   try{
    const base64=image.includes(",")?image.split(",")[1]:image;
    setAnalysis(await api.analyze.analyzeScreenshot({screenshot:base64,platform}));
    await loadUsage();
   }catch(e){setError(e instanceof Error?e.message:"Analysis failed. Please try again.")}finally{setAnalyzing(false)}
 };
 const copy=async(r:AIResponse)=>{await navigator.clipboard.writeText(r.content);setCopied(r.id);setTimeout(()=>setCopied(null),1800)};
 if(authLoading)return <LoadingScreen/>; if(!isAuthenticated)return null;

 return <div className="min-h-screen bg-[#fafafa]">
  <header className="border-b border-[#e7e7e7] bg-white">
   <div className="page-width flex h-16 items-center justify-between">
    <Link href="/dashboard"><BrandMark/></Link>
    <div className="flex items-center gap-2 text-sm text-[#777]">{usage&&<span>{usage.analyses_remaining}/{usage.analyses_limit===999999?"∞":usage.analyses_limit} left</span>}<Link href="/dashboard" className="rounded-lg px-3 py-2 hover:bg-[#f4f4f4]">Dashboard</Link></div>
   </div>
  </header>

  <main className="page-width py-8">
   <div className="mb-7 flex items-center gap-3"><Link href="/dashboard" className="text-[#888] hover:text-[#111]"><ArrowLeft size={18}/></Link><div><h1 className="text-2xl font-semibold tracking-[-0.02em]">Analyze conversation</h1><p className="mt-1 text-sm text-[#777]">Drop in a screenshot. Flayre handles the rest.</p></div></div>

   <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
    <Card className="p-6">
      <Label>Screenshot</Label>
      {!image ? (
        <button onClick={()=>inputRef.current?.click()} className="flex min-h-[430px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#d7d7d7] bg-[#fcfcfc] text-center transition hover:border-[#a8a8a8] hover:bg-[#f8f8f8]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#e2e2e2] bg-white"><Upload size={20} className="text-[#555]"/></div>
          <div className="text-sm font-medium">Drop screenshot here or browse</div>
          <div className="mt-2 text-xs text-[#999]">You can also paste with Ctrl/Cmd + V</div>
          <div className="mt-5 flex items-center gap-2 text-[11px] text-[#999]"><FileImage size={14}/> PNG, JPG, WEBP</div>
        </button>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-[#e6e6e6] bg-[#f6f6f6] p-3">
          <img src={image} alt="Selected chat screenshot" className="mx-auto max-h-[560px] w-auto max-w-full rounded-xl object-contain"/>
          <button onClick={()=>{setImage(null);setFile(null);setAnalysis(null);setError(null)}} aria-label="Remove screenshot" className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md"><X size={16}/></button>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e=>setSelectedFile(e.target.files?.[0]??null)}/>

      <div className="mt-5 grid gap-3 sm:grid-cols-[180px_1fr]">
       <select value={platform} onChange={e=>setPlatform(e.target.value)} className="rounded-xl border border-[#dedede] bg-white px-3 py-3 text-sm outline-none focus:border-[#999]">
         {platforms.map(p=><option key={p} value={p}>{p[0].toUpperCase()+p.slice(1)}</option>)}
       </select>
       <Button onClick={analyze} disabled={!image||analyzing||Boolean(usage&&usage.analyses_remaining<=0)} className="w-full py-3">
         {analyzing?<><LoaderCircle size={16} className="animate-spin"/>Analyzing…</>:<><Sparkles size={16}/>Analyze screenshot</>}
       </Button>
      </div>
      {error&&<div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle size={17} className="mt-0.5 shrink-0"/><span>{error}</span></div>}
    </Card>

    <div className="space-y-4">
      {!analysis&&!analyzing&&<Card className="p-6"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3f3f3]"><Sparkles size={18}/></div><h2 className="mt-5 text-lg font-semibold">Your replies will appear here</h2><p className="mt-2 text-sm leading-6 text-[#777]">Flayre will summarize the conversation, identify the tone, and suggest a few replies you can actually send.</p></Card>}
      {analyzing&&<Card className="p-6"><div className="flex items-center gap-3 text-sm font-medium"><LoaderCircle size={18} className="animate-spin"/>Reading the conversation…</div><div className="mt-5 h-3 rounded-full bg-[#f0f0f0]"/><div className="mt-3 h-3 w-4/5 rounded-full bg-[#f0f0f0]"/></Card>}
      {analysis&&<><Card className="p-5"><Label>Context</Label><p className="text-sm leading-6 text-[#333]">{analysis.context.summary}</p><div className="mt-4 flex flex-wrap gap-2">{[analysis.context.tone,analysis.context.emotional_state,analysis.context.relationship_type].filter(Boolean).map(x=><span key={x} className="rounded-full bg-[#f3f3f3] px-2.5 py-1 text-xs text-[#666] capitalize">{x}</span>)}</div></Card>
      <div><div className="mb-3 flex items-center justify-between"><Label>Suggested replies</Label><span className="text-xs text-[#999]">Pick one and copy</span></div>
      <div className="space-y-3">{analysis.responses.map(r=><Card key={r.id} className="p-4 transition hover:border-[#cfcfcf]"><div className="flex items-center justify-between"><span className="text-xs font-medium text-[#777] capitalize">{r.tone}</span><span className="text-[11px] text-[#aaa]">{r.character_count} chars</span></div><p className="mt-3 text-sm leading-6 text-[#222]">{r.content}</p><button onClick={()=>copy(r)} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#dedede] px-3 py-2 text-xs font-medium text-[#444] hover:bg-[#f6f6f6]">{copied===r.id?<><Check size={14}/>Copied</>:<><Clipboard size={14}/>Copy</>}</button></Card>)}</div></div></>}
    </div>
   </div>
  </main>
 </div>
}
