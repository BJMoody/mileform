const FIT_EPOCH_MS = Date.UTC(1989, 11, 31, 0, 0, 0);
const SEMICIRCLES_TO_DEG = 180 / 2147483648;

const BASE = {
  0x00:{size:1, read:(v,o)=>v.getUint8(o), invalid:0xff},
  0x01:{size:1, read:(v,o)=>v.getInt8(o), invalid:0x7f},
  0x02:{size:1, read:(v,o)=>v.getUint8(o), invalid:0xff},
  0x83:{size:2, read:(v,o,l)=>v.getInt16(o,l), invalid:0x7fff},
  0x84:{size:2, read:(v,o,l)=>v.getUint16(o,l), invalid:0xffff},
  0x85:{size:4, read:(v,o,l)=>v.getInt32(o,l), invalid:0x7fffffff},
  0x86:{size:4, read:(v,o,l)=>v.getUint32(o,l), invalid:0xffffffff},
  0x07:{size:1, read:null, invalid:null},
  0x88:{size:4, read:(v,o,l)=>v.getFloat32(o,l), invalid:null},
  0x89:{size:8, read:(v,o,l)=>v.getFloat64(o,l), invalid:null},
  0x0a:{size:1, read:(v,o)=>v.getUint8(o), invalid:0x00},
  0x8b:{size:2, read:(v,o,l)=>v.getUint16(o,l), invalid:0x0000},
  0x8c:{size:4, read:(v,o,l)=>v.getUint32(o,l), invalid:0x00000000},
  0x0d:{size:1, read:(v,o)=>v.getUint8(o), invalid:0xff}
};

function baseInfo(type) { return BASE[type] || BASE[type & 0x1f] || null; }

function readField(view, offset, size, baseType, little) {
  const base = baseInfo(baseType);
  if (!base) return null;
  if ((baseType & 0x1f) === 0x07) {
    let s = '';
    for (let i=0;i<size;i++) { const c=view.getUint8(offset+i); if (!c) break; s+=String.fromCharCode(c); }
    return s;
  }
  if (!base.read) return null;
  if (size === base.size) {
    const v = base.read(view, offset, little);
    return v === base.invalid ? null : v;
  }
  // FIT fields can be arrays. Return first valid numeric value for the minimal decoder.
  if (size >= base.size) {
    const v = base.read(view, offset, little);
    return v === base.invalid ? null : v;
  }
  return null;
}

function semicircles(v) { return Number.isFinite(v) ? v * SEMICIRCLES_TO_DEG : null; }
function fitTime(v) { return Number.isFinite(v) ? new Date(FIT_EPOCH_MS + v*1000) : null; }

function scaleRecordField(num, value) {
  if (value == null) return null;
  switch (num) {
    case 0: return semicircles(value);
    case 1: return semicircles(value);
    case 2: return value/5 - 500;
    case 5: return value/100;
    case 6: return value/1000;
    case 32: return value/1000;
    case 39: return value/10;
    case 41: return value/100;
    case 42: return value/10;
    case 73: return value/1000;
    case 78: return value/5 - 500;
    case 253: return fitTime(value);
    default: return value;
  }
}

function recordObject(fields) {
  const out = {};
  for (const [num,val] of fields) {
    const v = scaleRecordField(num,val);
    if (v == null) continue;
    if (num===0) out.lat=v;
    else if (num===1) out.lon=v;
    else if (num===2 || num===78) out.altitudeM=v;
    else if (num===3) out.hr=v;
    else if (num===4) out.cadence=v;
    else if (num===5) out.distanceM=v;
    else if (num===6 || num===73) out.speedMps=v;
    else if (num===7) out.power=v;
    else if (num===13) out.temperatureC=v;
    else if (num===39) out.verticalOscillationMm=v;
    else if (num===41) out.stanceTimePct=v;
    else if (num===42) out.stanceTimeMs=v;
    else if (num===253) out.time=v;
  }
  return out;
}

export function parseFit(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  if (view.byteLength < 14) throw new Error('FIT file is too small.');
  const headerSize = view.getUint8(0);
  const dataSize = view.getUint32(4, true);
  const signature = String.fromCharCode(view.getUint8(8),view.getUint8(9),view.getUint8(10),view.getUint8(11));
  if (signature !== '.FIT') throw new Error('Not a valid FIT file.');
  const dataEnd = Math.min(view.byteLength, headerSize + dataSize);
  let offset = headerSize;
  const definitions = new Map();
  const records = [];
  const laps = [];
  const sessions = [];
  let lastTimestamp = null;

  while (offset < dataEnd) {
    const header = view.getUint8(offset++);
    if (header & 0x80) {
      const local = (header >> 5) & 0x03;
      const timeOffset = header & 0x1f;
      const def = definitions.get(local);
      if (!def) break;
      const decoded = decodeDataMessage(view, offset, def);
      offset = decoded.offset;
      let timestamp = lastTimestamp;
      if (timestamp != null) {
        let base = timestamp & ~0x1f;
        let candidate = base + timeOffset;
        if (candidate < timestamp) candidate += 0x20;
        timestamp = candidate;
        lastTimestamp = candidate;
        decoded.fields.set(253, timestamp);
      }
      storeMessage(def.global, decoded.fields, records, laps, sessions);
      continue;
    }
    const isDefinition = !!(header & 0x40);
    const hasDev = !!(header & 0x20);
    const local = header & 0x0f;
    if (isDefinition) {
      if (offset+5 > dataEnd) break;
      offset++; // reserved
      const architecture = view.getUint8(offset++);
      const little = architecture === 0;
      const global = view.getUint16(offset, little); offset += 2;
      const nFields = view.getUint8(offset++);
      const fields = [];
      for (let i=0;i<nFields;i++) {
        if (offset+3 > dataEnd) break;
        fields.push({ num:view.getUint8(offset++), size:view.getUint8(offset++), baseType:view.getUint8(offset++) });
      }
      const devFields = [];
      if (hasDev && offset < dataEnd) {
        const nDev=view.getUint8(offset++);
        for(let i=0;i<nDev;i++) {
          if (offset+3 > dataEnd) break;
          devFields.push({num:view.getUint8(offset++), size:view.getUint8(offset++), devIndex:view.getUint8(offset++)});
        }
      }
      definitions.set(local,{global,little,fields,devFields});
    } else {
      const def=definitions.get(local);
      if(!def) break;
      const decoded=decodeDataMessage(view,offset,def);
      offset=decoded.offset;
      if(decoded.fields.has(253) && Number.isFinite(decoded.fields.get(253))) lastTimestamp=decoded.fields.get(253);
      storeMessage(def.global,decoded.fields,records,laps,sessions);
    }
  }
  if (!records.length && !sessions.length) throw new Error('FIT decoded, but no activity records were found.');
  return { records, laps, sessions, format:'FIT' };
}

function decodeDataMessage(view, offset, def) {
  const fields=new Map();
  for(const f of def.fields) {
    if(offset+f.size>view.byteLength) return {fields,offset:view.byteLength};
    fields.set(f.num,readField(view,offset,f.size,f.baseType,def.little));
    offset+=f.size;
  }
  for(const f of def.devFields||[]) offset+=f.size;
  return {fields,offset};
}

function storeMessage(global,fields,records,laps,sessions) {
  if(global===20) records.push(recordObject(fields));
  else if(global===19) laps.push(genericMessage(fields));
  else if(global===18) sessions.push(genericMessage(fields));
}

function genericMessage(fields) {
  const out={};
  for(const [k,v] of fields) out[k]=k===253?fitTime(v):v;
  return out;
}

function haversine(a,b) {
  const R=6371000, p1=a.lat*Math.PI/180,p2=b.lat*Math.PI/180;
  const dp=(b.lat-a.lat)*Math.PI/180,dl=(b.lon-a.lon)*Math.PI/180;
  const h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}

function median(arr) {
  if(!arr.length) return 0;
  const a=[...arr].sort((x,y)=>x-y), m=Math.floor(a.length/2);
  return a.length%2?a[m]:(a[m-1]+a[m])/2;
}

export function summarizeActivity(parsed) {
  const records=(parsed.records||[]).filter(r=>r.time || Number.isFinite(r.distanceM) || (Number.isFinite(r.lat)&&Number.isFinite(r.lon)));
  if(!records.length) throw new Error('No usable GPS/activity records found.');
  const times=records.map(r=>r.time?.getTime()).filter(Number.isFinite);
  const start=times.length?Math.min(...times):null,end=times.length?Math.max(...times):null;
  const durationS=start!=null&&end!=null?(end-start)/1000:0;
  let distanceM=0;
  const distVals=records.map(r=>r.distanceM).filter(Number.isFinite);
  if(distVals.length) distanceM=Math.max(...distVals)-Math.min(...distVals);
  if(!distanceM) {
    for(let i=1;i<records.length;i++) {
      const a=records[i-1],b=records[i];
      if(Number.isFinite(a.lat)&&Number.isFinite(a.lon)&&Number.isFinite(b.lat)&&Number.isFinite(b.lon)) {
        const d=haversine(a,b); if(d<250) distanceM+=d;
      }
    }
  }
  const samples=[];
  let movingDurationS=0, stopped=0;
  for(let i=1;i<records.length;i++) {
    const a=records[i-1],b=records[i];
    const dt=a.time&&b.time?(b.time-a.time)/1000:1;
    if(dt<=0||dt>120) continue;
    let speed=Number.isFinite(b.speedMps)?b.speedMps:null;
    if(speed==null&&Number.isFinite(a.lat)&&Number.isFinite(a.lon)&&Number.isFinite(b.lat)&&Number.isFinite(b.lon)) speed=haversine(a,b)/dt;
    if(Number.isFinite(speed)&&speed>0.55&&speed<12) { movingDurationS+=dt; samples.push({t:(b.time?.getTime()||0)/1000,speed,dt}); }
    else stopped+=dt;
  }
  if(!movingDurationS) movingDurationS=durationS;
  const speeds=samples.map(s=>s.speed).filter(v=>v>1);
  const avgSpeed=distanceM&&movingDurationS?distanceM/movingDurationS:median(speeds);
  const paces=speeds.map(v=>1609.344/v).filter(v=>v>150&&v<1200);
  const meanPace=paces.length?paces.reduce((a,b)=>a+b,0)/paces.length:NaN;
  const sd=paces.length?Math.sqrt(paces.reduce((s,x)=>s+(x-meanPace)**2,0)/paces.length):NaN;
  const paceCV=Number.isFinite(sd)&&meanPace?sd/meanPace:NaN;
  const hr=records.map(r=>r.hr).filter(Number.isFinite);
  const cadence=records.map(r=>r.cadence).filter(Number.isFinite);
  const intervals=detectIntervals(samples);
  return {
    format:parsed.format,
    records:records.length,
    start:start?new Date(start):null,
    end:end?new Date(end):null,
    durationS,
    movingDurationS,
    distanceM,
    avgSpeedMps:avgSpeed,
    avgPacePerMile:avgSpeed?1609.344/avgSpeed:NaN,
    paceCV,
    avgHr:hr.length?Math.round(hr.reduce((a,b)=>a+b,0)/hr.length):null,
    maxHr:hr.length?Math.max(...hr):null,
    avgCadence:cadence.length?Math.round(cadence.reduce((a,b)=>a+b,0)/cadence.length):null,
    pauseRatio:durationS?clamp01((durationS-movingDurationS)/durationS):0,
    intervals
  };
}

function clamp01(x){return Math.max(0,Math.min(1,x));}

function detectIntervals(samples) {
  if(samples.length<20) return [];
  const speeds=samples.map(s=>s.speed).filter(v=>v>1);
  const med=median(speeds);
  if(!med) return [];
  const threshold=med*1.12;
  const bouts=[];
  let current=null, gap=0;
  for(const s of samples) {
    if(s.speed>=threshold) {
      if(!current) current={durationS:0,distanceM:0,speeds:[]};
      current.durationS+=s.dt; current.distanceM+=s.speed*s.dt; current.speeds.push(s.speed); gap=0;
    } else if(current) {
      gap+=s.dt;
      if(gap<=20) { current.durationS+=s.dt; current.distanceM+=s.speed*s.dt; }
      else {
        if(current.durationS>=35&&current.distanceM>=120) bouts.push(finalizeBout(current));
        current=null; gap=0;
      }
    }
  }
  if(current&&current.durationS>=35&&current.distanceM>=120) bouts.push(finalizeBout(current));
  return bouts.slice(0,30);
}

function finalizeBout(b) {
  const avg=b.speeds.length?b.speeds.reduce((a,c)=>a+c,0)/b.speeds.length:0;
  return {durationS:Math.round(b.durationS),distanceM:Math.round(b.distanceM),avgSpeedMps:avg,pacePerMile:avg?1609.344/avg:NaN};
}

export function parseGpx(text) {
  const xml=new DOMParser().parseFromString(text,'application/xml');
  if(xml.querySelector('parsererror')) throw new Error('GPX file could not be parsed.');
  const pts=[...xml.querySelectorAll('trkpt')];
  if(!pts.length) throw new Error('No track points found in GPX file.');
  const records=pts.map(p=>{
    const lat=Number(p.getAttribute('lat')),lon=Number(p.getAttribute('lon'));
    const ele=Number(p.querySelector('ele')?.textContent);
    const timeText=p.querySelector('time')?.textContent;
    const time=timeText?new Date(timeText):null;
    const hrNode=[...p.getElementsByTagName('*')].find(n=>/(:|^)hr$/i.test(n.tagName));
    const cadNode=[...p.getElementsByTagName('*')].find(n=>/(:|^)cad$/i.test(n.tagName));
    return {lat,lon,altitudeM:Number.isFinite(ele)?ele:null,time:time&&!Number.isNaN(time.getTime())?time:null,hr:hrNode?Number(hrNode.textContent):null,cadence:cadNode?Number(cadNode.textContent):null};
  });
  return {records,laps:[],sessions:[],format:'GPX'};
}

export async function parseActivityFile(file) {
  const name=file.name.toLowerCase();
  if(name.endsWith('.gpx')) return summarizeActivity(parseGpx(await file.text()));
  if(name.endsWith('.fit')) return summarizeActivity(parseFit(await file.arrayBuffer()));
  throw new Error('Use a .GPX or .FIT activity file.');
}
