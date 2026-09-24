/* CS332 Course Portal configuration. Configure only if GitHub API fallback is needed. */
const GITHUB_REPO = 'USERNAME/REPOSITORY';
const GITHUB_BRANCH = 'main';
const MATERIALS_DIR = 'materials';
const COURSE_DATA_PATH = 'data/course.json';

const WEEK_PATTERN = /week[\s_-]*0*(\d{1,2})(?!\d)/i;
const state = { courseData:null, materials:[], materialsByWeek:new Map(), marqueeResizeObserver:null, marqueeRefreshTimer:null };

document.addEventListener('DOMContentLoaded', init);

async function init(){
  bindSearch();
  try{
    const [courseData, materials] = await Promise.all([loadCourseData(), discoverMaterials()]);
    state.courseData=courseData;
    state.materials=materials;
    state.materialsByWeek=groupMaterialsByWeek(materials,courseData.course.weeks);
    const note=document.getElementById('weekly-clo-note');
    if(note && courseData.weekly_clo_note) note.textContent=courseData.weekly_clo_note;
    renderWeeks(courseData.weeks);
    applySearch();
  }catch(error){
    console.error('Course portal initialization failed:',error);
    showInitializationError();
  }
}

async function loadCourseData(){
  const url=new URL(COURSE_DATA_PATH,document.baseURI);
  const response=await fetch(url,{cache:'no-cache'});
  if(!response.ok) throw new Error(`Unable to load ${COURSE_DATA_PATH} (${response.status})`);
  return response.json();
}

async function discoverMaterials(){
  const marker=readJsonScript('jekyll-build-marker');
  if(marker && marker.processed===true){
    const items=readJsonScript('jekyll-materials');
    return normalizeMaterials(Array.isArray(items)?items:[]);
  }
  return discoverMaterialsViaGitHubApi();
}

function readJsonScript(id){
  const node=document.getElementById(id);
  if(!node) return null;
  try{return JSON.parse(node.textContent.trim())}catch{return null}
}

async function discoverMaterialsViaGitHubApi(){
  if(!isConfiguredRepo(GITHUB_REPO)){
    console.info('GitHub API fallback is disabled until GITHUB_REPO is configured in assets/js/app.js.');
    return [];
  }
  const dir=MATERIALS_DIR.split('/').map(encodeURIComponent).join('/');
  const endpoint=`https://api.github.com/repos/${GITHUB_REPO}/contents/${dir}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
  try{
    const response=await fetch(endpoint,{headers:{Accept:'application/vnd.github+json'},cache:'no-cache'});
    if(!response.ok) throw new Error(`GitHub API returned ${response.status}`);
    const entries=await response.json();
    if(!Array.isArray(entries)) return [];
    return normalizeMaterials(entries.filter(item=>item&&item.type==='file'&&/\.html?$/i.test(item.name||'')).map(item=>({name:item.name,path:item.path,url:toSiteUrl(item.path)})));
  }catch(error){console.warn('GitHub API material discovery failed:',error);return []}
}

function isConfiguredRepo(repo){
  return typeof repo==='string' && /^[^/\s]+\/[^/\s]+$/.test(repo) && !repo.includes('USERNAME') && !repo.includes('REPOSITORY');
}

function normalizeMaterials(materials){
  const seen=new Set();
  return materials
    .filter(item=>item&&/\.html?$/i.test(item.name||''))
    .map(item=>{
      const path=String(item.path||`${MATERIALS_DIR}/${item.name}`).replace(/^\/+/, '');
      return {name:String(item.name),path,url:item.url?absolutizeUrl(item.url):toSiteUrl(path)};
    })
    .filter(item=>{const key=item.path.toLowerCase();if(seen.has(key))return false;seen.add(key);return true})
    .sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:'base'}));
}

function absolutizeUrl(url){try{return new URL(url,document.baseURI).href}catch{return url}}
function toSiteUrl(path){return new URL(String(path).replace(/^\/+/,''),document.baseURI).href}

function detectWeekNumber(filename){
  const match=String(filename).match(WEEK_PATTERN);
  if(!match) return null;
  const week=Number.parseInt(match[1],10);
  return Number.isFinite(week)?week:null;
}

function groupMaterialsByWeek(materials,maxWeek){
  const grouped=new Map();
  for(let week=1;week<=maxWeek;week+=1) grouped.set(week,[]);
  for(const material of materials){
    const week=detectWeekNumber(material.name);
    if(week&&week>=1&&week<=maxWeek) grouped.get(week).push({...material,displayName:formatMaterialName(material.name)});
  }
  for(const files of grouped.values()) files.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:'base'}));
  return grouped;
}

function formatMaterialName(filename){
  const base=String(filename).replace(/\.html?$/i,'');
  const match=base.match(WEEK_PATTERN);
  let display=match?base.slice(match.index):base;
  return display.replace(/[_-]+/g,' ').replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/\s+/g,' ').trim()||base;
}

function renderWeeks(weeks){
  const grid=document.getElementById('weekly-grid');
  if(!grid) return;
  grid.replaceChildren();
  for(const week of weeks){
    const files=state.materialsByWeek.get(week.week)||[];
    grid.appendChild(buildWeekCard(week,files));
  }
  setupFilenameMarquees();
}

function buildWeekCard(week,files){
  const card=createElement('article','week-card');
  card.dataset.week=String(week.week);
  const header=createElement('header','week-card-header');
  header.append(createElement('div','week-number',`Week ${String(week.week).padStart(2,'0')}`),createElement('h3','',week.title));
  const body=createElement('div','week-body');
  const meta=createElement('div','week-meta');
  const clos=Array.isArray(week.clo)?week.clo:[];
  if(clos.length) clos.forEach(clo=>meta.appendChild(createElement('span','clo-chip',clo)));
  else meta.appendChild(createElement('span','clo-chip neutral','CLO not specified by week'));
  const sessionList=createElement('div','session-list');
  for(const session of week.sessions||[]) sessionList.appendChild(buildSessionItem(session));
  body.append(meta,sessionList);
  card.append(header,body,buildMaterialBlock(week.week,files));
  card.dataset.search=buildSearchIndex(week,files);
  return card;
}

function buildSessionItem(session){
  const item=createElement('div','session-item');
  const number=createElement('span','session-no',String(session.session));
  const copy=createElement('div','session-copy');
  copy.append(createElement('strong','session-topic',session.topic),createElement('div','session-coverage',session.coverage),createElement('div','session-activity',`Activity: ${session.activity}`));
  if(session.assessment&&session.assessment!=='—'){
    const wrap=createElement('div','session-assessment');
    const cls=session.assessment==='No assessment'?'assessment-badge no-assessment':'assessment-badge';
    wrap.appendChild(createElement('span',cls,session.assessment));
    copy.appendChild(wrap);
  }
  item.append(number,copy);
  return item;
}

function buildMaterialBlock(weekNumber,files){
  const block=createElement('div','material-block');
  const header=createElement('div','material-block-header');
  header.appendChild(createElement('strong','','Learning Material'));
  if(!files.length){
    header.appendChild(createElement('span','material-empty','Not uploaded yet'));
    block.appendChild(header);
    return block;
  }
  header.appendChild(createElement('span','material-count',`${files.length} ${files.length===1?'file':'files'}`));
  block.appendChild(header);
  const list=createElement('div','material-list');
  files.forEach((material,index)=>list.appendChild(buildMaterialRow(material,weekNumber,index+1)));
  block.appendChild(list);
  return block;
}

function buildMaterialRow(material,weekNumber,index){
  const row=createElement('div','material-row');
  row.appendChild(createElement('span','material-index',String(index)));
  const viewport=createElement('div','material-name-viewport');
  viewport.title=material.name;
  viewport.appendChild(createElement('span','material-name-text',material.displayName));
  const viewButton=createElement('button','material-action material-view','View');
  viewButton.type='button';
  viewButton.addEventListener('click',()=>viewMaterial(material,weekNumber));
  const openLink=createElement('a','material-action material-open','Open');
  openLink.href=material.url;openLink.target='_blank';openLink.rel='noopener';
  openLink.setAttribute('aria-label',`Open ${material.displayName} in a new tab`);
  row.append(viewport,viewButton,openLink);
  return row;
}

function buildSearchIndex(week,files){
  const terms=[`week ${week.week}`,`week${week.week}`,`week ${String(week.week).padStart(2,'0')}`,week.title,...(week.clo||[])];
  for(const s of week.sessions||[]) terms.push(s.topic,s.coverage,s.activity,s.assessment);
  for(const m of files) terms.push(m.name,m.displayName,m.path);
  return terms.filter(Boolean).join(' ').toLowerCase();
}

function viewMaterial(material,weekNumber){
  const empty=document.getElementById('viewer-empty'),panel=document.getElementById('viewer-panel'),frame=document.getElementById('material-frame'),week=document.getElementById('viewer-week'),name=document.getElementById('viewer-name'),path=document.getElementById('viewer-path'),open=document.getElementById('viewer-open');
  if(!panel||!frame||!week||!name||!path||!open) return;
  if(empty) empty.hidden=true;
  panel.hidden=false;
  week.textContent=`Week ${String(weekNumber).padStart(2,'0')}`;
  name.textContent=material.displayName;
  path.textContent=material.path;
  open.href=material.url;
  frame.src=material.url;
  frame.title=`${material.displayName} — Week ${weekNumber}`;
  document.getElementById('material-viewer')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function bindSearch(){
  const input=document.getElementById('week-search'),clear=document.getElementById('clear-search');
  if(!input||!clear) return;
  input.addEventListener('input',()=>{clear.hidden=input.value.length===0;applySearch()});
  clear.addEventListener('click',()=>{input.value='';clear.hidden=true;input.focus();applySearch()});
}

function applySearch(){
  const input=document.getElementById('week-search'),cards=[...document.querySelectorAll('.week-card')],empty=document.getElementById('no-search-results');
  if(!input||!cards.length) return;
  const query=input.value.trim().toLowerCase();let visible=0;
  for(const card of cards){const matches=!query||card.dataset.search.includes(query);card.hidden=!matches;if(matches)visible+=1}
  if(empty) empty.hidden=visible!==0;
  scheduleMarqueeRefresh();
}

function setupFilenameMarquees(){
  if('ResizeObserver' in window){
    state.marqueeResizeObserver?.disconnect();
    state.marqueeResizeObserver=new ResizeObserver(scheduleMarqueeRefresh);
    document.querySelectorAll('.material-name-viewport').forEach(v=>state.marqueeResizeObserver.observe(v));
  }else window.addEventListener('resize',scheduleMarqueeRefresh,{passive:true});
  scheduleMarqueeRefresh();
}

function scheduleMarqueeRefresh(){window.clearTimeout(state.marqueeRefreshTimer);state.marqueeRefreshTimer=window.setTimeout(refreshFilenameMarquees,70)}
function refreshFilenameMarquees(){
  document.querySelectorAll('.material-name-viewport').forEach(viewport=>{
    const text=viewport.querySelector('.material-name-text');if(!text)return;
    viewport.classList.remove('is-overflowing');text.style.removeProperty('--scroll-distance');text.style.removeProperty('--marquee-duration');
    if(viewport.clientWidth<=0)return;
    const distance=Math.ceil(text.scrollWidth-viewport.clientWidth);
    if(distance>4){const duration=Math.min(18,Math.max(7,6+distance/28));text.style.setProperty('--scroll-distance',String(distance));text.style.setProperty('--marquee-duration',`${duration.toFixed(1)}s`);viewport.classList.add('is-overflowing')}
  });
}

function createElement(tag,className='',text=''){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined&&text!==null&&text!=='')el.textContent=text;return el}
function showInitializationError(){const grid=document.getElementById('weekly-grid');if(!grid)return;grid.replaceChildren();const m=createElement('div','empty-search','The weekly plan could not be loaded. Check that data/course.json is present and valid.');m.hidden=false;grid.appendChild(m)}
