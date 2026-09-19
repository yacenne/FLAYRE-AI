"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BrandMark, Button } from "@/components/ui";

function Form(){
 const router=useRouter(), params=useSearchParams();
 const {login,signup,loginWithGoogle,isAuthenticated,isLoading:authLoading}=useAuth();
 const [mode,setMode]=useState<"login"|"signup">("login");
 const [loading,setLoading]=useState(false),[error,setError]=useState(""),[show,setShow]=useState(false);
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState("");
 useEffect(()=>{if(!authLoading&&isAuthenticated)router.replace(params.get("redirect")||"/dashboard")},[authLoading,isAuthenticated,params,router]);
 if(authLoading)return <div className="flex min-h-screen items-center justify-center bg-[#fafafa] text-sm text-[#777]">Loading flayre…</div>;
 const submit=async(e:React.FormEvent)=>{e.preventDefault();setError("");if(!email||!password||(mode==="signup"&&!name)){setError("Please complete the required fields.");return}setLoading(true);try{if(mode==="login")await login(email,password);else await signup(email,password,name);router.push(params.get("redirect")||"/dashboard")}catch(err:any){let m=err?.message||"Something went wrong";if(m.includes("Invalid login credentials"))m="Invalid email or password";if(m.includes("User already registered"))m="An account with this email already exists";if(m.includes("Email not confirmed"))m="Please check your email to confirm your account";setError(m)}finally{setLoading(false)}};
 return <main className="min-h-screen bg-[#fafafa]"><div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[.9fr_1.1fr]">
   <div className="hidden flex-col justify-between border-r border-[#e8e8e8] p-10 lg:flex"><Link href="/"><BrandMark/></Link><div className="max-w-sm"><p className="text-sm font-medium text-[#888]">flayre</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Less thinking.<br/>Better replies.</h1><p className="mt-4 text-sm leading-6 text-[#777]">Analyze a conversation screenshot and get a few responses that fit the moment.</p></div><p className="text-xs text-[#aaa]">Private by design · Built for quick conversations</p>
   </div>
   <div className="flex items-center justify-center p-6 sm:p-10"><div className="w-full max-w-md">
    <div className="mb-8 flex items-center justify-between lg:hidden"><Link href="/"><BrandMark/></Link></div>
    <div className="mb-8"><h2 className="text-2xl font-semibold tracking-[-0.03em]">{mode==="login"?"Welcome back":"Create your account"}</h2><p className="mt-2 text-sm text-[#777]">{mode==="login"?"Sign in to continue to flayre.":"Start with 10 free analyses each month."}</p></div>
    <div className="mb-6 grid grid-cols-2 rounded-xl bg-[#f1f1f1] p-1"><button onClick={()=>{setMode("login");setError("")}} className={`rounded-lg px-3 py-2 text-sm font-medium ${mode==="login"?"bg-white text-[#111] shadow-sm":"text-[#777]"}`}>Sign in</button><button onClick={()=>{setMode("signup");setError("")}} className={`rounded-lg px-3 py-2 text-sm font-medium ${mode==="signup"?"bg-white text-[#111] shadow-sm":"text-[#777]"}`}>Sign up</button></div>
    <form onSubmit={submit} className="space-y-4">
      {mode==="signup"&&<label className="block"><span className="mb-1.5 block text-sm font-medium">Name</span><input value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-xl border border-[#ddd] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#999]" placeholder="Your name"/></label>}
      <label className="block"><span className="mb-1.5 block text-sm font-medium">Email</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-xl border border-[#ddd] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#999]" placeholder="you@example.com"/></label>
      <label className="block"><span className="mb-1.5 block text-sm font-medium">Password</span><div className="relative"><input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-xl border border-[#ddd] bg-white px-3.5 py-3 pr-11 text-sm outline-none focus:border-[#999]" placeholder="At least 8 characters"/><button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888]">{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
      {error&&<div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</div>}
      <Button className="w-full py-3" disabled={loading}>{loading?"Please wait…":mode==="login"?"Sign in":"Create account"}<ArrowRight size={16}/></Button>
    </form>
    <div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-[#e8e8e8]"/><span className="text-xs text-[#aaa]">or</span><div className="h-px flex-1 bg-[#e8e8e8]"/></div>
    <Button variant="secondary" className="w-full py-3" onClick={async()=>{setError("");try{await loginWithGoogle()}catch(err:any){setError(err?.message||"Google sign-in failed")}}}>Continue with Google</Button>
    <p className="mt-6 text-center text-xs leading-5 text-[#999]">By continuing, you agree to use flayre responsibly and keep conversations you upload private.</p>
   </div></div>
 </div></main>;
}
export default function LoginPage(){return <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#fafafa] text-sm text-[#777]">Loading flayre…</div>}><Form/></Suspense>}
