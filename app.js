// app.js - shared client for display and control pages
const ws = new WebSocket((location.protocol === "https:" ? "wss" : "ws") + "://" + location.host);
let state = { darah: 0, dokter: 0, lastDarah: null, lastDokter: null };

function pad3(n){ return String(n ?? "").padStart(3, "0"); }

function speak(text, gender="female"){
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "id-ID";
  u.rate = 0.95;
  u.pitch = (gender === "male") ? 0.8 : 1.2;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function renderDisplay(){
  const elD = document.getElementById("numberDarah");
  const elK = document.getElementById("numberDokter");
  if (elD) elD.textContent = state.darah > 0 ? pad3(state.darah) : "-";
  if (elK) elK.textContent = state.dokter > 0 ? pad3(state.dokter) : "-";
}

function setConnStatus(text){
  const s = document.getElementById("status");
  if (s) s.textContent = text;
}

ws.addEventListener("open", ()=> setConnStatus("🟢 Connected"));
ws.addEventListener("close", ()=> setConnStatus("🔴 Offline"));
ws.addEventListener("error", ()=> setConnStatus("🔴 Offline"));

ws.addEventListener("message", (evt)=>{
  try{
    const msg = JSON.parse(evt.data);
    if (msg.type === "state" && msg.state){
      state = msg.state;
      renderDisplay();
      if (msg.speak === "callDarah") speak(`Nomor ${pad3(state.darah)}. Silakan ke meja cek darah.`, "female");
      if (msg.speak === "recallDarah") speak(`Panggilan ulang. Nomor ${pad3(state.darah)}. Silakan ke meja cek darah.`, "female");
      if (msg.speak === "callDokter") speak(`Nomor ${pad3(state.dokter)}. Silakan ke meja dokter.`, "male");
      if (msg.speak === "recallDokter") speak(`Panggilan ulang. Nomor ${pad3(state.dokter)}. Silakan ke meja dokter.`, "male");
    }
  }catch(e){}
});

function sendAction(action, payload){ ws.send(JSON.stringify({ type:"action", action, payload })); }

// Keyboard shortcuts
window.addEventListener("keydown",(e)=>{
  if(e.key === "F1"){ e.preventDefault(); sendAction("callDarah"); }
  if(e.key === "F2"){ e.preventDefault(); sendAction("callDokter"); }
  if(e.key.toLowerCase() === "q"){ sendAction("recallDarah"); }
  if(e.key.toLowerCase() === "w"){ sendAction("recallDokter"); }
});

function updateClock(){
  const now = new Date();
  const hari = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"][now.getDay()];
  const bln = now.toLocaleString("id-ID",{month:"short"});
  const dateEl = document.getElementById("date");
  const timeEl = document.getElementById("time");
  if (dateEl) dateEl.textContent = `${hari}, ${String(now.getDate()).padStart(2,"0")} ${bln} ${now.getFullYear()}`;
  if (timeEl) timeEl.textContent = now.toLocaleTimeString("id-ID",{hour12:false});
}
setInterval(updateClock, 1000); updateClock();