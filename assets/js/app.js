
const state = { tracks: [], currentIndex: 0, playing: false };

const el = {
  audio: document.getElementById("audioPlayer"),
  schedule: document.getElementById("scheduleList"),
  cover: document.getElementById("programCover"),
  title: document.getElementById("songTitle"),
  artist: document.getElementById("artistName"),
  footer: document.getElementById("footerTrack"),
  progress: document.getElementById("progressBar"),
  elapsed: document.getElementById("elapsedTime"),
  total: document.getElementById("totalTime"),
  play: document.getElementById("playButton"),
  prev: document.getElementById("prevButton"),
  next: document.getElementById("nextButton"),
  volume: document.getElementById("volumeControl"),
  mute: document.getElementById("muteButton"),
  chatForm: document.getElementById("chatForm"),
  chatInput: document.getElementById("chatInput"),
  messages: document.getElementById("messages"),
  listeners: document.getElementById("listenerCount")
};

async function loadData(){
  try{
    const res = await fetch("songs.json",{cache:"no-store"});
    if(!res.ok) throw new Error("songs.json yüklenemedi");
    state.tracks = await res.json();
    renderSchedule();
    selectTrack(0,false);
  }catch(err){
    console.error(err);
    el.title.textContent = "YAYIN YÜKLENEMEDİ";
    el.artist.textContent = "Siteyi GitHub Pages üzerinden açın.";
  }
}

function renderSchedule(){
  el.schedule.innerHTML = state.tracks.map((t,i)=>`
    <button type="button" class="schedule-item ${i===state.currentIndex?"active":""}" data-index="${i}">
      <span class="schedule-time">${safe(t.time)}</span>
      <span class="schedule-name">${safe(t.program)}</span>
      ${t.live?'<span class="live-pill">CANLI</span>':""}
    </button>
  `).join("");

  el.schedule.querySelectorAll(".schedule-item").forEach(btn=>{
    btn.addEventListener("click",()=>selectTrack(Number(btn.dataset.index),true));
  });
}

function selectTrack(index,autoplay){
  const t = state.tracks[index];
  if(!t) return;
  state.currentIndex=index;
  el.title.textContent=(t.title||"Bilinmeyen Şarkı").toUpperCase();
  el.artist.textContent=t.artist||"Bilinmeyen Sanatçı";
  el.footer.textContent=`${t.title||"Bilinmeyen Şarkı"} - ${t.artist||"Bilinmeyen Sanatçı"}`;
  el.cover.src=t.cover||"assets/images/covers/default.svg";
  el.audio.src=t.url||"";
  el.audio.load();
  renderSchedule();
  if(autoplay && t.url) playAudio(); else pauseAudio();
}

async function playAudio(){
  try{
    await el.audio.play();
    state.playing=true;
    el.play.textContent="❚❚";
  }catch(err){
    console.error(err);
    state.playing=false;
    el.play.textContent="▶";
  }
}

function pauseAudio(){
  el.audio.pause();
  state.playing=false;
  el.play.textContent="▶";
}

function move(step){
  if(!state.tracks.length) return;
  const next=(state.currentIndex+step+state.tracks.length)%state.tracks.length;
  selectTrack(next,true);
}

function format(sec){
  if(!Number.isFinite(sec)) return "00:00";
  const m=Math.floor(sec/60);
  const s=Math.floor(sec%60);
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function updateProgress(){
  const duration=el.audio.duration||0;
  const current=el.audio.currentTime||0;
  el.progress.style.width=duration?`${(current/duration)*100}%`:"0%";
  el.elapsed.textContent=format(current);
  el.total.textContent=format(duration);
}

function safe(value){
  return String(value??"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

el.play.addEventListener("click",()=>state.playing?pauseAudio():playAudio());
el.prev.addEventListener("click",()=>move(-1));
el.next.addEventListener("click",()=>move(1));
el.volume.addEventListener("input",e=>el.audio.volume=Number(e.target.value));
el.mute.addEventListener("click",()=>{
  el.audio.muted=!el.audio.muted;
  el.mute.textContent=el.audio.muted?"🔇":"🔊";
});

el.audio.addEventListener("timeupdate",updateProgress);
el.audio.addEventListener("loadedmetadata",updateProgress);
el.audio.addEventListener("ended",()=>move(1));
el.audio.addEventListener("play",()=>{state.playing=true;el.play.textContent="❚❚"});
el.audio.addEventListener("pause",()=>{state.playing=false;el.play.textContent="▶"});

el.chatForm.addEventListener("submit",e=>{
  e.preventDefault();
  const text=el.chatInput.value.trim();
  if(!text) return;
  const now=new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"});
  const article=document.createElement("article");
  article.className="message";
  article.innerHTML=`
    <span class="avatar red">S</span>
    <div>
      <div class="message-head"><strong>Sen</strong><time>${now}</time></div>
      <p></p>
    </div>`;
  article.querySelector("p").textContent=text;
  el.messages.appendChild(article);
  el.chatInput.value="";
  el.messages.scrollTop=el.messages.scrollHeight;
});

setInterval(()=>{
  const n=Number(el.listeners.textContent.replaceAll(".",""))||1248;
  const next=n+(Math.random()>.5?1:-1);
  el.listeners.textContent=Math.max(next,1).toLocaleString("tr-TR");
},6000);

el.audio.volume=.8;
loadData();
