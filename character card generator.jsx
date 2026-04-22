import { useState, useRef } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=Noto+Sans+SC:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0d0d0f; color: #e8e0d5; font-family: 'Noto Sans SC', sans-serif; }
  .app {
    min-height: 100vh;
    background: #0d0d0f;
    background-image: radial-gradient(ellipse at 15% 15%, rgba(180,140,100,0.07) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(120,100,160,0.05) 0%, transparent 55%);
    padding: 36px 20px 60px;
  }
  .header { text-align: center; margin-bottom: 36px; }
  .header-title { font-family: 'Noto Serif SC', serif; font-size: 26px; font-weight: 700; color: #c9a96e; letter-spacing: 4px; margin-bottom: 6px; }
  .header-sub { font-size: 11px; color: #5a5450; letter-spacing: 2px; text-transform: uppercase; }
  .mode-bar { display: flex; max-width: 860px; margin: 0 auto 20px; border: 1px solid rgba(201,169,110,0.2); border-radius: 2px; overflow: hidden; }
  .mode-btn { flex: 1; padding: 10px; background: transparent; border: none; color: #5a5450; font-size: 12px; letter-spacing: 1.5px; cursor: pointer; transition: all 0.2s; font-family: 'Noto Sans SC', sans-serif; }
  .mode-btn.active { background: rgba(201,169,110,0.12); color: #c9a96e; }
  .mode-btn + .mode-btn { border-left: 1px solid rgba(201,169,110,0.2); }
  .container { max-width: 860px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 680px) { .container { grid-template-columns: 1fr; } }
  .panel { background: rgba(255,255,255,0.025); border: 1px solid rgba(201,169,110,0.13); border-radius: 2px; padding: 24px; }
  .panel-title { font-family: 'Noto Serif SC', serif; font-size: 12px; color: #c9a96e; letter-spacing: 3px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid rgba(201,169,110,0.13); }
  .field { margin-bottom: 16px; }
  .field label { display: block; font-size: 10px; color: #7a6e66; letter-spacing: 1.5px; margin-bottom: 6px; text-transform: uppercase; }
  .field input, .field textarea, .field select { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(201,169,110,0.18); border-radius: 2px; padding: 9px 11px; color: #e8e0d5; font-family: 'Noto Sans SC', sans-serif; font-size: 13px; outline: none; transition: border-color 0.2s; resize: vertical; }
  .field input:focus, .field textarea:focus, .field select:focus { border-color: rgba(201,169,110,0.45); }
  .field select option { background: #1a1815; }
  .field textarea { min-height: 68px; line-height: 1.6; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 7px; }
  .chip { padding: 3px 10px; border: 1px solid rgba(201,169,110,0.2); border-radius: 20px; font-size: 11px; color: #7a6e66; cursor: pointer; transition: all 0.15s; background: transparent; font-family: 'Noto Sans SC', sans-serif; }
  .chip:hover { border-color: rgba(201,169,110,0.5); color: #c9a96e; }
  .format-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
  .tab { flex: 1; padding: 8px; background: transparent; border: 1px solid rgba(201,169,110,0.18); border-radius: 2px; color: #5a5450; font-size: 11px; letter-spacing: 1px; cursor: pointer; transition: all 0.2s; font-family: 'Noto Sans SC', sans-serif; }
  .tab.active { background: rgba(201,169,110,0.1); border-color: rgba(201,169,110,0.45); color: #c9a96e; }
  .generate-btn { width: 100%; padding: 13px; background: linear-gradient(135deg, rgba(201,169,110,0.14), rgba(201,169,110,0.07)); border: 1px solid rgba(201,169,110,0.38); border-radius: 2px; color: #c9a96e; font-family: 'Noto Serif SC', serif; font-size: 13px; letter-spacing: 3px; cursor: pointer; transition: all 0.2s; }
  .generate-btn:hover:not(:disabled) { background: linear-gradient(135deg, rgba(201,169,110,0.22), rgba(201,169,110,0.13)); }
  .generate-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .output-panel { grid-column: 1 / -1; }
  .output-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid rgba(201,169,110,0.13); }
  .copy-btn { padding: 5px 14px; background: transparent; border: 1px solid rgba(201,169,110,0.28); border-radius: 2px; color: #c9a96e; font-size: 11px; letter-spacing: 1px; cursor: pointer; transition: all 0.2s; font-family: 'Noto Sans SC', sans-serif; }
  .copy-btn:hover { border-color: rgba(201,169,110,0.55); }
  .copy-btn.ok { color: #7abf7a; border-color: rgba(122,191,122,0.4); }
  .output-text { width: 100%; min-height: 300px; background: rgba(0,0,0,0.28); border: 1px solid rgba(201,169,110,0.1); border-radius: 2px; padding: 18px; color: #c0b8ad; font-family: 'Noto Sans SC', sans-serif; font-size: 13px; line-height: 1.85; white-space: pre-wrap; resize: vertical; outline: none; }
  .output-text:focus { border-color: rgba(201,169,110,0.28); }
  .placeholder-text { color: #2e2a26; font-style: italic; font-size: 12px; line-height: 2.2; }
  .loading { display: flex; align-items: center; gap: 10px; color: #6a6056; font-size: 12px; letter-spacing: 1px; padding: 20px 0; }
  .dot { width: 4px; height: 4px; border-radius: 50%; background: #c9a96e; animation: pulse 1.2s ease-in-out infinite; }
  .dot:nth-child(2) { animation-delay: 0.2s; } .dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes pulse { 0%,80%,100%{opacity:.2;transform:scale(.8)} 40%{opacity:1;transform:scale(1)} }
  .diag-full { grid-column: 1/-1; }
  .tips { grid-column: 1/-1; font-size: 11px; color: #3a3530; letter-spacing: 1px; line-height: 2; text-align: center; margin-top: 4px; }
`;

const PERSONALITY_CHIPS = ["温柔体贴","外热内冷","冷淡疏离","腹黑温柔","霸道占有欲强","活泼开朗","忧郁敏感","骄傲高冷","痴情专一","亦正亦邪","病娇","傲娇"];
const RELATIONSHIP_CHIPS = ["新婚伴侣","恋人","青梅竹马","师徒","主仆","对手/宿敌","前任","复杂的前任关系","命中注定的陌生人"];

async function callClaude(prompt, tokens = 2000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: tokens, messages: [{ role: "user", content: prompt }] })
  });
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "生成失败，请重试";
}

export default function App() {
  const [mode, setMode] = useState("generate");
  const [format, setFormat] = useState("prose");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [copyState, setCopyState] = useState("idle");
  const [diagInput, setDiagInput] = useState(() => {
    try { return localStorage.getItem("cc_diagInput") || ""; } catch(e) { return ""; }
  });
  const updateDiagInput = (v) => {
    setDiagInput(v);
    try { localStorage.setItem("cc_diagInput", v); } catch(e) {}
  };
  const clearDiag = () => {
    setDiagInput("");
    try { localStorage.removeItem("cc_diagInput"); } catch(e) {}
  };
  const [diagTarget, setDiagTarget] = useState("酒馆/SillyTavern");
  const [maxTokens, setMaxTokens] = useState(2000);
  const textareaRef = useRef(null);

  const [form, setForm] = useState({
    name: "", gender: "男", age: "", appearance: "",
    personality: "", background: "", relationship: "",
    speakStyle: "", quirks: "", userName: "",
    userExpanded: false, userName2: "", userAge: "", userBg: "", userPersonality: "",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const appendChip = (k, v) => setForm(p => ({ ...p, [k]: p[k] ? p[k] + "、" + v : v }));

  const buildGenPrompt = () => {
    const user = form.userName || "你";
    const lines = [
      `角色名：${form.name}`,
      form.gender && `性别：${form.gender}`,
      form.age && `年龄：${form.age}`,
      form.appearance && `外貌：${form.appearance}`,
      form.personality && `性格：${form.personality}`,
      form.background && `背景：${form.background}`,
      form.relationship && `与用户关系：${form.relationship}`,
      `角色称用户为：${user}`,
      (form.userName2 || form.userAge || form.userBg || form.userPersonality) && `\n用户信息：${[form.userName2 && "名字："+form.userName2, form.userAge && "年龄："+form.userAge, form.userPersonality && "性格："+form.userPersonality, form.userBg && "背景："+form.userBg].filter(Boolean).join("，")}`,
      form.speakStyle && `说话风格：${form.speakStyle}`,
      form.quirks && `习惯/癖好：${form.quirks}`,
    ].filter(Boolean).join("\n");

    if (format === "prose") {
      return `你是SillyTavern角色卡作者。根据以下信息写prose格式Character Description。

${lines}

规范：
1. 全程第三人称，写"${form.name}会..."的行为描述，禁止文学总结句如"他会哄，不会停"
2. 不扩写用户未提供的内容，忠实还原输入
3. 结构：外貌→性格行为模式→背景关键节点→对${user}的具体态度和行为→说话习惯
4. 总字数500-700字
5. 有粤语设定时给出具体粤语词汇/例句
6. 最后另起：【示例台词】5句，每句前标(场景)，严格符合说话风格

只输出正文，无前言后记。`;
    } else {
      return `你是猫箱/C.AI角色卡作者。根据以下信息写W++格式角色卡。

${lines}

严格按结构，每字段用顿号分隔短语：

[名字(${form.name})]
[性别(${form.gender})]
[年龄(${form.age || "未设定"})]
[外貌(关键词)]
[性格(含矛盾面，不超过8个词)]
[喜好(具体事物)]
[厌恶(具体事物)]
[背景(时间线，50字内)]
[与{{user}}的关系(${form.relationship || "未设定"}，写具体行为表现)]
[说话风格(特征+1-2例句)]
[行为习惯(具体小动作)]
[称呼{{user}}为(${form.userName || "你"})]

最后另起：
【开场白】第一句话，100字内，带具体场景。

只输出正文，无前言后记。`;
    }
  };

  const buildDiagPrompt = () =>
    `你是${diagTarget}角色卡审查专家。分析以下角色卡会导致OOC或表现不稳定的问题。

${diagInput}

从以下维度诊断，有问题才写，给具体修改建议：
1. 信息密度（关键信息缺失/冗余）
2. 行为指令清晰度（模型能否知道该怎么做）
3. 性格逻辑（是否有冲突让模型无所适从）
4. 说话风格具体度
5. 关系边界清晰度
6. 格式规范性

最后：总评分（1-10）+ 一句核心建议。直接输出，不废话。`;

  const run = async () => {
    if (mode === "generate" && !form.name.trim()) { alert("请填写角色名"); return; }
    if (mode === "diagnose" && !diagInput.trim()) { alert("请粘贴角色卡内容"); return; }
    setLoading(true); setOutput("");
    try { setOutput(await callClaude(mode === "generate" ? buildGenPrompt() : buildDiagPrompt(), maxTokens)); }
    catch(e) { setOutput("网络错误，请重试"); }
    setLoading(false);
  };

  const copy = () => {
    if (!output) return;
    navigator.clipboard?.writeText(output).then(() => {
      setCopyState("ok"); setTimeout(() => setCopyState("idle"), 2000);
    }).catch(() => {
      if (textareaRef.current) {
        textareaRef.current.select();
        document.execCommand("copy");
        setCopyState("ok"); setTimeout(() => setCopyState("idle"), 2000);
      }
    });
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">
        <div className="header">
          <div className="header-title">角色卡工坊</div>
          <div className="header-sub">角色卡工作台 · Character Card Workshop</div>
        </div>

        <div className="mode-bar">
          <button className={`mode-btn ${mode==="generate"?"active":""}`} onClick={()=>{setMode("generate");setOutput("");}}>生成角色卡</button>
          <button className={`mode-btn ${mode==="diagnose"?"active":""}`} onClick={()=>{setMode("diagnose");setOutput("");}}>诊断 / 优化建议</button>
        </div>

        <div className="container">
          {mode === "generate" ? (<>
            <div className="panel">
              <div className="panel-title">基础设定</div>
              <div className="field"><label>角色名 *</label><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="输入角色全名"/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div className="field"><label>性别</label><select value={form.gender} onChange={e=>set("gender",e.target.value)}><option>男</option><option>女</option><option>无性别</option><option>其他</option></select></div>
                <div className="field"><label>年龄</label><input value={form.age} onChange={e=>set("age",e.target.value)} placeholder="如：36岁"/></div>
              </div>
              <div className="field"><label>外貌描述</label><textarea value={form.appearance} onChange={e=>set("appearance",e.target.value)} placeholder="建议顺序：发色瞳色→五官特征→身形体格（可含身高）→标志性细节（纹身/疤痕/气质）→常见穿着"/></div>
              <div className="field">
                <label>性格（直接填写，点标签追加）</label>
                <textarea value={form.personality} onChange={e=>set("personality",e.target.value)} placeholder="例：外热内冷，对外人温柔疏离，只对认定的人暴露真实自我；容易内耗自卑，用微笑掩饰失落..."/>
                <div className="chips">{PERSONALITY_CHIPS.map(c=><button key={c} className="chip" onClick={()=>appendChip("personality",c)}>{c}</button>)}</div>
              </div>
              <div className="field"><label>ta如何称呼你</label><input value={form.userName} onChange={e=>set("userName",e.target.value)} placeholder="例：漫漫、阿星（多个用/分隔）"/></div>
              <div style={{borderTop:"1px solid rgba(201,169,110,0.1)",paddingTop:12,marginTop:4}}>
                <button onClick={()=>set("userExpanded",!form.userExpanded)} style={{width:"100%",background:"transparent",border:"1px dashed rgba(201,169,110,0.2)",borderRadius:2,padding:"7px 12px",color:"#6a6056",fontSize:11,letterSpacing:"1.5px",cursor:"pointer",fontFamily:"'Noto Sans SC',sans-serif",textAlign:"left",display:"flex",justifyContent:"space-between"}}>
                  <span>你的人设（可选）</span>
                  <span>{form.userExpanded ? "▲ 收起" : "▼ 展开"}</span>
                </button>
                {form.userExpanded && (
                  <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:10}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div className="field" style={{margin:0}}><label>你的名字</label><input value={form.userName2} onChange={e=>set("userName2",e.target.value)} placeholder="林漫漫"/></div>
                      <div className="field" style={{margin:0}}><label>你的年龄</label><input value={form.userAge} onChange={e=>set("userAge",e.target.value)} placeholder="25岁"/></div>
                    </div>
                    <div className="field" style={{margin:0}}><label>你的性格</label><input value={form.userPersonality} onChange={e=>set("userPersonality",e.target.value)} placeholder="例：表面女强人，在他面前会撒娇"/></div>
                    <div className="field" style={{margin:0}}><label>你的背景</label><textarea value={form.userBg} onChange={e=>set("userBg",e.target.value)} style={{minHeight:52}} placeholder="例：内地人，在香港中环上市公司做marketing，会一点粤语"/></div>
                  </div>
                )}
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">深度设定</div>
              <div className="field"><label>背景故事</label><textarea value={form.background} onChange={e=>set("background",e.target.value)} placeholder="成长经历、重要事件、当前处境..." rows={3}/></div>
              <div className="field">
                <label>与你的关系（直接填写，点标签追加）</label>
                <textarea value={form.relationship} onChange={e=>set("relationship",e.target.value)} placeholder="例：新婚丈夫，暗恋多年才表白；或：前任金主，分手后悔挽回，现同居..."/>
                <div className="chips">{RELATIONSHIP_CHIPS.map(c=><button key={c} className="chip" onClick={()=>appendChip("relationship",c)}>{c}</button>)}</div>
              </div>
              <div className="field"><label>说话风格</label><textarea value={form.speakStyle} onChange={e=>set("speakStyle",e.target.value)} placeholder="语气、口癖、是否夹粤语/英语..."/></div>
              <div className="field"><label>独特习惯 / 小动作</label><textarea value={form.quirks} onChange={e=>set("quirks",e.target.value)} placeholder="例：独处时借酒消愁；确保对方口袋有荔枝味糖..."/></div>
              <div style={{marginTop:8}}>
                <div style={{fontSize:10,color:"#7a6e66",letterSpacing:"1.5px",marginBottom:8,textTransform:"uppercase"}}>输出格式</div>
                <div className="format-tabs">
                  <button className={`tab ${format==="prose"?"active":""}`} onClick={()=>setFormat("prose")}>Prose · 酒馆</button>
                  <button className={`tab ${format==="wpp"?"active":""}`} onClick={()=>setFormat("wpp")}>W++ · 猫箱</button>
                </div>
              </div>
              <button className="generate-btn" onClick={run} disabled={loading}>{loading?"生成中...":"生 成 角 色 卡"}</button>
            </div>
          </>) : (
            <div className="panel diag-full">
              <div className="panel-title">角色卡诊断 · 找出OOC根源</div>
              <div className="field"><label>目标平台</label><select value={diagTarget} onChange={e=>setDiagTarget(e.target.value)}><option>酒馆/SillyTavern</option><option>猫箱</option><option>Character.AI</option><option>通用</option></select></div>
              <div className="field"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><label style={{margin:0}}>粘贴角色卡内容</label><button onClick={clearDiag} style={{fontSize:10,color:"#5a5450",background:"transparent",border:"1px solid rgba(201,169,110,0.15)",borderRadius:2,padding:"2px 8px",cursor:"pointer",fontFamily:"'Noto Sans SC',sans-serif",letterSpacing:"1px"}}>清空</button></div><textarea value={diagInput} onChange={e=>updateDiagInput(e.target.value)} style={{minHeight:200}} placeholder="把现有的prose或W++角色卡粘贴进来，分析OOC原因..."/></div>
              <button className="generate-btn" onClick={run} disabled={loading}>{loading?"分析中...":"诊 断 角 色 卡"}</button>
            </div>
          )}

          <div className="panel output-panel">
            <div className="output-header">
              <div className="panel-title" style={{margin:0,border:"none",padding:0}}>
                {mode==="generate" ? `生成结果 · ${format==="prose"?"Prose / 酒馆":"W++ / 猫箱"}` : "诊断报告"}
              </div>
              {output && <button className={`copy-btn ${copyState==="ok"?"ok":""}`} onClick={copy}>{copyState==="ok"?"已复制 ✓":"复制全文"}</button>}
            </div>
            <div style={{marginBottom:16,padding:"10px 0",borderBottom:"1px solid rgba(201,169,110,0.1)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:10,color:"#7a6e66",letterSpacing:"1.5px",textTransform:"uppercase"}}>输出长度上限</span>
                <span style={{fontSize:12,color:"#c9a96e",fontFamily:"monospace"}}>
                  {maxTokens} tokens ≈ {Math.round(maxTokens*0.6)}汉字
                </span>
              </div>
              <input type="range" min={500} max={4000} step={500} value={maxTokens}
                onChange={e=>setMaxTokens(Number(e.target.value))}
                style={{width:"100%",accentColor:"#c9a96e",cursor:"pointer"}}
              />
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#4a4540",marginTop:5}}>
                <span>500 猫箱推荐</span>
                <span>1500 酒馆生成</span>
                <span>2500 详细诊断</span>
                <span>4000 深度分析</span>
              </div>
            </div>
            {loading ? (
              <div className="loading"><div className="dot"/><div className="dot"/><div className="dot"/><span>{mode==="generate"?"正在为角色注入灵魂...":"正在诊断角色卡..."}</span></div>
            ) : output ? (
              <textarea ref={textareaRef} className="output-text" value={output} onChange={e=>setOutput(e.target.value)}/>
            ) : (
              <div className="output-text">
                <span className="placeholder-text">{mode==="generate"?"填写上方设定后点击生成。\n\nProse适合酒馆，W++适合猫箱。\n生成后可直接在此编辑。":"粘贴角色卡后点击诊断，\n分析OOC根源和优化方向。"}</span>
              </div>
            )}
          </div>
          <div className="tips">性格/关系直接填写，点标签快速追加 · 诊断模式可分析已有角色卡的OOC问题</div>
        </div>
      </div>
    </>
  );
}
