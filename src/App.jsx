
import {useState} from "react";
const rules=[
[/https?:\/\/\S+/g,"{URL}"],
[/process\.env\.[A-Z0-9_]+/g,"process.env.{ENV_VAR}"],
[/\b(?:SELECT|INSERT|UPDATE|DELETE)[\s\S]*?;/gi,"{SQL_QUERY}"],
[/eyJ[A-Za-z0-9_\-\.]+/g,"{JWT}"],
[/AKIA[0-9A-Z]{16}/g,"{AWS_KEY}"],
[/sk-[A-Za-z0-9]+/g,"{API_KEY}"],
[/password\s*[:=]\s*["'][^"']+["']/gi,'password="{PASSWORD}"']
];
export default function App(){
 const [o,s]=useState("");
 const f=e=>{
  const file=e.target.files[0];
  file.text().then(t=>{
   let x=t;
   rules.forEach(r=>x=x.replace(r[0],r[1]));
   s(x);
  });
 };
 return <div style={{padding:20}}>
 <h2>Sanitizador</h2>
 <input type="file" onChange={f}/>
 <textarea style={{width:"100%",height:"70vh"}} value={o} readOnly/>
 </div>
}
