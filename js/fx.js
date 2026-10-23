// Stackbound visual FX: swirling shader background that shifts colour per area,
// a full-screen particle layer (confetti, sparks) and card tilt.
'use strict';
(function (SB) {
  const FX = (SB.FX = { gl: null, area: 'menu', pulseV: 0, danger: 0, parts: [], t0: performance.now(), scene: 0 });

  const AREAS = {
    menu: { c1: [0.03, 0.02, 0.10], c2: [0.16, 0.05, 0.26], c3: [0.20, 0.85, 1.00], spin: 1.0, bright: 0.62 },
    map: { c1: [0.02, 0.03, 0.10], c2: [0.06, 0.10, 0.28], c3: [0.35, 0.55, 1.00], spin: 0.8, bright: 0.6 },
    play: { c1: [0.01, 0.02, 0.06], c2: [0.04, 0.06, 0.18], c3: [0.30, 0.40, 1.00], spin: 0.5, bright: 0.42 },
    boss: { c1: [0.06, 0.00, 0.03], c2: [0.25, 0.02, 0.07], c3: [1.00, 0.22, 0.25], spin: 0.9, bright: 0.5 },
    shop: { c1: [0.05, 0.02, 0.06], c2: [0.24, 0.10, 0.06], c3: [1.00, 0.62, 0.18], spin: 0.4, bright: 0.58 },
    gameover: { c1: [0.02, 0.02, 0.04], c2: [0.08, 0.06, 0.12], c3: [0.55, 0.20, 0.35], spin: 0.15, bright: 0.5 },
    victory: { c1: [0.08, 0.04, 0.02], c2: [0.40, 0.20, 0.05], c3: [1.00, 0.85, 0.35], spin: 1.4, bright: 0.65 },
  };

  const cur = JSON.parse(JSON.stringify(AREAS.menu));

  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  // Neon tower city: block skyline on the horizon, a scrolling grid floor, rising motes
  const FS = `precision mediump float;
uniform float t;uniform vec2 res;uniform vec3 c1;uniform vec3 c2;uniform vec3 c3;uniform float spin;uniform float bright;uniform float pulse;uniform float danger;
float h1(float n){return fract(sin(n*127.1)*43758.5453);}
float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 skyline(vec2 p,float hz,float bw,float scale,float drift,vec3 body,vec3 lit,float litP){
  float x=p.x/bw+drift;float col=floor(x);
  float hgt=(0.04+pow(h1(col*1.7+scale),2.0)*0.30)*scale;
  hgt=floor(hgt/bw)*bw+bw;
  float y=p.y-hz;
  if(y<0.0||y>hgt)return vec3(-1.0);
  vec2 cell=vec2(fract(x),fract(y/bw));
  float row=floor(y/bw);
  float edge=step(0.08,cell.x)*step(cell.x,0.92)*step(0.1,cell.y)*step(cell.y,0.9);
  float on=step(1.0-litP,h2(vec2(col,row)+floor(t*0.15+h1(col)*7.0)*0.0));
  float fl=0.75+0.25*sin(t*1.3+col*3.1+row*1.7);
  vec3 c=body*(0.75+0.25*edge);
  c=mix(c,lit*fl,on*edge*0.85);
  if(row==floor(hgt/bw)-1.0)c+=lit*0.25*edge;
  return c;
}
// backdrops (Prize Counter): ridgelines, stars, a striped sun, a ringed planet
float ridge(float x,float s,float a){return a*(0.55+0.25*sin(x*2.3+s)+0.12*sin(x*5.7+s*2.1)+0.08*sin(x*11.3+s*3.7)+0.05*abs(sin(x*23.1+s)));}
float tri(float x){return 1.0-abs(fract(x)*2.0-1.0);}
float crag(float x,float s,float a){return a*(0.12+0.6*tri(x*0.8+s)+0.2*tri(x*2.1+s*1.7)+0.08*tri(x*5.3+s*0.3));}
float star(vec2 uv,float dens,float sc){vec2 g=uv*vec2(sc*1.8,sc);vec2 i=floor(g);vec2 f=fract(g)-0.5;float h=h2(i);if(h<1.0-dens)return 0.0;float tw=0.55+0.45*sin(t*1.7+h*61.0);return smoothstep(0.22,0.0,length(f))*tw*(0.5+0.5*fract(h*13.0));}
vec3 sunset(vec2 p,vec2 uv,float hz,vec3 col){
  col=mix(vec3(0.42,0.08,0.30)*0.9+c2*0.5,c1*0.8,smoothstep(hz,0.95,uv.y));
  col+=vec3(star(uv,0.03,90.0))*smoothstep(hz+0.3,0.9,uv.y)*0.8;
  vec2 sc=vec2(p.x-min(0.55,res.x/res.y*0.3),uv.y-(hz+0.15));float sr=0.21;float d=length(sc);
  float yy=(sc.y+sr)/(2.0*sr);
  vec3 sun=mix(vec3(1.0,0.22,0.55),vec3(1.0,0.86,0.32),clamp(yy,0.0,1.0));
  float gap=yy<0.58?step(fract(yy*11.0+t*0.12),(0.58-yy)*0.95):0.0;
  col+=sun*exp(-max(d-sr,0.0)*9.0)*0.35;
  if(d<sr&&gap<0.5)col=sun;
  float m=hz+ridge(p.x*1.5+t*0.004*spin,3.0,0.10);
  if(uv.y<m){col=mix(vec3(0.10,0.02,0.16),c1*0.7,0.4);col+=vec3(1.0,0.35,0.6)*smoothstep(0.006,0.0,m-uv.y)*0.7;}
  return col;
}
vec3 peaks(vec2 p,vec2 uv,float hz,vec3 col){
  col=mix(c2*0.8+vec3(0.02,0.04,0.10),c1*0.55,smoothstep(hz,1.0,uv.y));
  col+=vec3(star(uv,0.04,110.0)+star(uv+0.37,0.02,60.0))*smoothstep(hz+0.12,0.75,uv.y);
  vec2 mc=vec2(p.x+min(0.62,res.x/res.y*0.34),uv.y-0.78);float md=length(mc);
  col+=vec3(0.9,0.92,1.0)*exp(-md*14.0)*0.25;
  if(md<0.045)col=mix(vec3(0.98,0.96,0.88),vec3(0.8,0.8,0.75),smoothstep(0.0,0.045,length(mc-vec2(0.012,0.01))));
  for(int i=0;i<3;i++){
    float fi=float(i);
    float amp=0.32-fi*0.085;
    float x=p.x*(1.0+fi*0.6)+fi*5.0+t*0.003*spin*(fi+1.0);
    float m=hz+crag(x,fi*2.3+1.0,amp);
    if(uv.y<m){
      vec3 lc=mix(c2*0.7+vec3(0.10,0.12,0.22),c1*0.35,fi/2.0);
      float side=step(0.5,fract(x*0.8+fi*2.3+1.0));
      lc*=0.8+0.3*side;
      float hgt=(uv.y-hz)/amp+0.04*sin(p.x*70.0+fi*3.0)+0.03*sin(p.x*23.0);
      float snow=smoothstep(0.58,0.63,hgt);
      col=mix(lc,vec3(0.86,0.9,1.0)*(0.82-fi*0.16)*(0.85+0.2*side),snow*(0.95-fi*0.25));
    }
  }
  return col;
}
vec3 space(vec2 p,vec2 uv,vec3 col){
  col=c1*0.45;
  float n=0.5+0.5*sin(p.x*2.6+uv.y*3.7+t*0.04)*sin(p.x*4.3-uv.y*2.2+1.3+t*0.03);
  float n2=0.5+0.5*sin(p.x*6.1-uv.y*5.3+2.1)*sin(p.x*1.7+uv.y*7.9-t*0.02);
  col+=mix(c2*1.6,c3,n2)*pow(n,3.0)*0.55;
  col+=vec3(star(uv,0.05,120.0)+star(uv+0.21,0.03,70.0)*1.3+star(uv+0.63,0.012,40.0)*1.6);
  vec2 pc=vec2(p.x+0.5,uv.y-0.3);float pr=0.2;float d=length(pc);
  vec2 rp=vec2(pc.x*0.98+pc.y*0.2,(pc.y-pc.x*0.2)*3.6);float rd=length(rp);
  bool ringBack=rd>pr*1.35&&rd<pr*1.9&&rp.y>0.0;
  if(ringBack)col=mix(col,c3*0.8+vec3(0.15),0.55*smoothstep(pr*1.9,pr*1.6,rd));
  if(d<pr){float l=clamp(dot(normalize(vec3(pc,sqrt(max(0.0,pr*pr-d*d)))),normalize(vec3(-0.5,0.6,0.6))),0.0,1.0);
    vec3 pcol=mix(c2*1.2+vec3(0.1,0.05,0.2),c3*0.9,0.5+0.5*sin(pc.y*40.0+pc.x*6.0));col=pcol*(0.12+0.95*l);}
  else col+=c3*exp(-(d-pr)*30.0)*0.25;
  if(rd>pr*1.35&&rd<pr*1.9&&rp.y<=0.0)col=mix(col,c3*0.9+vec3(0.2),0.65*smoothstep(pr*1.9,pr*1.6,rd));
  return col;
}
// Hellscape: a soot-red sky with rolling smoke, two ranges of black crags rimmed with lava light
vec3 hell(vec2 p,vec2 uv,float hz,vec3 col){
  col=mix(vec3(0.34,0.06,0.03),vec3(0.05,0.01,0.02),smoothstep(hz,0.95,uv.y));
  float sm=0.5+0.5*sin(p.x*3.1+uv.y*5.0+t*0.07)*sin(p.x*1.3-uv.y*7.3-t*0.05);
  float sm2=0.5+0.5*sin(p.x*7.7-uv.y*3.1+t*0.11);
  col=mix(col,vec3(0.10,0.03,0.03),smoothstep(0.35,0.9,sm*sm2)*0.65*smoothstep(hz,hz+0.4,uv.y));
  col+=vec3(1.0,0.32,0.06)*exp(-(uv.y-hz)*7.0)*0.5;
  for(int i=0;i<2;i++){
    float fi=float(i);
    float amp=0.27-fi*0.1;
    float x=p.x*(1.2+fi*0.7)+fi*3.0+t*0.003*spin*(fi+1.0);
    float m=hz+crag(x,fi*1.7+4.0,amp);
    if(uv.y<m){
      col=mix(vec3(0.08,0.02,0.02),vec3(0.025,0.0,0.01),fi);
      col+=vec3(1.0,0.38,0.08)*smoothstep(0.012,0.0,m-uv.y)*(0.85-fi*0.45);
      float f=abs(fract(x*3.0+sin(uv.y*40.0+fi)*0.08)-0.5);
      col+=vec3(1.0,0.26,0.03)*smoothstep(0.025,0.0,f)*smoothstep(m,hz,uv.y)*0.4*(1.0-fi);
    }
  }
  return col;
}
void main(){
  vec2 uv=gl_FragCoord.xy/res;
  float asp=res.x/res.y;
  vec2 p=vec2((uv.x-0.5)*asp,uv.y);
  float hz=0.34;
  vec3 col=mix(c2*1.25,c1,smoothstep(hz,1.0,uv.y));
  float glow=exp(-pow(length(vec2(p.x*0.7,(uv.y-hz)*2.2)),2.0)*3.0);
  col+=c3*glow*(0.55+pulse*0.8);
#if SCENE==3
  col=space(p,uv,col);
  if(true){
#else
  if(uv.y>hz){
#if SCENE==1
    col=sunset(p,uv,hz,col);
#elif SCENE==2
    col=peaks(p,uv,hz,col);
#elif SCENE==4
    col=hell(p,uv,hz,col);
#else
    vec3 far=skyline(p,hz,0.022,0.7,t*0.004*spin,c1*0.9+c2*0.35,c3*0.7,0.18);
    if(far.x>=0.0)col=mix(col,far,0.55);
    vec3 nearc=skyline(p+vec2(13.0,0.0),hz,0.034,1.0,t*0.009*spin,c1*0.55,c3,0.12);
    if(nearc.x>=0.0)col=nearc;
#endif
    col+=c3*glow*0.25;
#endif
  }else{
#if SCENE==4
    // a sea of lava: dark crust plates drifting on a glowing flow
    float d=hz-uv.y;
    float z=0.09/(d+0.004);
    vec2 q=vec2(p.x*z,z+t*0.25*spin);
    float n=sin(q.x*1.7+sin(q.y*1.3+t*0.4))*sin(q.y*1.9+sin(q.x*1.1-t*0.3));
    float crust=smoothstep(-0.05,0.25,n);
    vec3 lava=mix(vec3(1.0,0.78,0.25),vec3(1.0,0.24,0.02),smoothstep(-0.6,0.0,n));
    float fade=exp(-z*0.05);
    col=mix(lava*(0.55+0.45*fade),vec3(0.08,0.02,0.02),crust);
    col+=vec3(1.0,0.3,0.05)*glow*0.35*(1.0+pulse);
#else
    float d=hz-uv.y;
    float z=0.09/(d+0.004);
    float gx=p.x*z;
    float gz=z+t*0.9*spin;
    float lx=abs(fract(gx)-0.5);float lz=abs(fract(gz)-0.5);
    float w=0.03*z*0.35+0.01;
    float line=max(smoothstep(0.5-w,0.5,lx),smoothstep(0.5-w*1.4,0.5,lz));
    float fade=exp(-z*0.05);
    col=mix(c1*0.35,c2*0.5,fade*0.5);
    col+=c3*line*fade*(1.1+pulse*1.5);
    col+=c3*glow*0.4;
#endif
  }
  vec2 mc=vec2(uv.x*26.0,uv.y*14.0-t*0.35*spin);
  vec2 mi=floor(mc);vec2 mf=fract(mc)-0.5;
  float mh=h2(mi);
#if SCENE==4
  vec3 mote=vec3(1.0,0.55,0.15);
#else
  vec3 mote=mix(c3,vec3(1.0),0.3);
#endif
  if(mh>0.93){float sz=0.06+0.08*fract(mh*37.0);float sq=step(abs(mf.x),sz)*step(abs(mf.y),sz);col+=mote*sq*0.7*smoothstep(0.0,0.4,uv.y);}
  col=mix(col,vec3(0.65,0.04,0.10),danger*0.45*(0.6+0.4*sin(t*4.0)));
  col*=bright*1.45*(1.0+pulse*0.35);
  float v=length((uv-0.5)*vec2(1.1,1.0));
  col*=1.0-0.55*smoothstep(0.45,1.05,v);
  gl_FragColor=vec4(col,1.0);
}`;

  FX.init = function () {
    const cv = document.getElementById('bg');
    try {
      const gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: false });
      if (!gl) throw new Error('no webgl');
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const vs = sh(gl.VERTEX_SHADER, VS);
      // one program per backdrop, built the first time it's shown, so each frame only runs its own scene
      FX.progs = [];
      FX.prog = (n) => {
        if (FX.progs[n]) return FX.progs[n];
        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, '#define SCENE ' + n + '\n' + FS));
        gl.bindAttribLocation(prog, 0, 'p');
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
        const u = {};
        for (const k of ['t', 'res', 'c1', 'c2', 'c3', 'spin', 'bright', 'pulse', 'danger']) u[k] = gl.getUniformLocation(prog, k);
        return (FX.progs[n] = { prog, u });
      };
      FX.prog(0);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      FX.gl = gl;
    } catch (e) {
      FX.gl = null;
      cv.style.display = 'none';
    }
    FX.overlay = document.getElementById('fxlayer');
    FX.resize();
    window.addEventListener('resize', FX.resize);
    requestAnimationFrame(FX.frame);
  };
  FX.resize = function () {
    const cv = document.getElementById('bg');
    const scale = 0.75;
    cv.width = Math.floor(window.innerWidth * scale);
    cv.height = Math.floor(window.innerHeight * scale);
    if (FX.overlay) { FX.overlay.width = window.innerWidth; FX.overlay.height = window.innerHeight; }
  };
  FX.setArea = function (a) { if (AREAS[a]) FX.area = a; };
  FX.setScene = function (n) { FX.scene = n || 0; };
  FX.pulse = function (v) { FX.pulseV = Math.min(1.2, FX.pulseV + v); };
  FX.setDanger = function (d) { FX.danger = d; };

  // ---------- particles (screen space) ----------
  const COLORS = ['#35e6ff', '#ffd83b', '#b25cff', '#4dff7c', '#ff4d6a', '#ff9a3b', '#4f7bff', '#ffffff'];
  FX.confetti = function (x, y, n, opts) {
    opts = opts || {};
    for (let i = 0; i < n; i++) {
      const a = (opts.dir === undefined ? -Math.PI / 2 : opts.dir) + (Math.random() - 0.5) * (opts.spread || Math.PI * 1.2);
      const sp = (opts.speed || 520) * (0.4 + Math.random() * 0.8);
      FX.parts.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14,
        w: 5 + Math.random() * 6, h: 3 + Math.random() * 4, life: 1.2 + Math.random() * 1.2, max: 2.4,
        color: opts.colors ? opts.colors[i % opts.colors.length] : COLORS[i % COLORS.length], spark: !!opts.spark,
      });
    }
  };
  FX.burstAt = function (el, n, opts) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    FX.confetti(r.left + r.width / 2, r.top + r.height / 2, n, opts);
  };

  function draw(t, scene) {
    const gl = FX.gl, cv = gl.canvas;
    let P;
    try { P = FX.prog(scene | 0); } catch (e) { P = FX.prog(0); }
    const u = P.u;
    gl.useProgram(P.prog);
    gl.viewport(0, 0, cv.width, cv.height);
    gl.uniform1f(u.t, t);
    gl.uniform2f(u.res, cv.width, cv.height);
    gl.uniform3fv(u.c1, cur.c1); gl.uniform3fv(u.c2, cur.c2); gl.uniform3fv(u.c3, cur.c3);
    gl.uniform1f(u.spin, cur.spin + FX.pulseV * 0.8);
    gl.uniform1f(u.bright, cur.bright);
    gl.uniform1f(u.pulse, FX.pulseV);
    gl.uniform1f(u.danger, FX.danger);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  // paint a backdrop scene into a small canvas (Prize Counter thumbnails), then put the live one back
  FX.snapshot = function (scene, out) {
    if (!FX.gl) return false;
    // drawn at a landscape size so phone thumbnails frame the same view as desktop ones
    const src = FX.gl.canvas, ctx = out.getContext('2d'), w0 = src.width, h0 = src.height;
    src.width = 640; src.height = Math.round(640 * Math.min(0.75, out.height / out.width));
    draw(20, scene);
    const sh = Math.min(src.height, src.width * (out.height / out.width)), sw = sh * (out.width / out.height);
    ctx.drawImage(src, (src.width - sw) / 2, Math.min(src.height - sh, Math.max(0, src.height * 0.6 - sh / 2)), sw, sh, 0, 0, out.width, out.height);
    src.width = w0; src.height = h0;
    draw((performance.now() - FX.t0) / 1000, FX.scene);
    return true;
  };

  let last = performance.now();
  FX.frame = function (now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const target = AREAS[FX.area];
    const k = 1 - Math.pow(0.02, dt); // smooth ~1s blend
    for (const c of ['c1', 'c2', 'c3']) for (let i = 0; i < 3; i++) cur[c][i] += (target[c][i] - cur[c][i]) * k;
    cur.spin += (target.spin - cur.spin) * k;
    cur.bright += (target.bright - cur.bright) * k;
    FX.pulseV *= Math.pow(0.15, dt);
    if (FX.gl) draw((now - FX.t0) / 1000, FX.scene);
    const ov = FX.overlay;
    if (ov) {
      const ctx = ov.getContext('2d');
      ctx.clearRect(0, 0, ov.width, ov.height);
      if (FX.parts.length) {
        for (const p of FX.parts) {
          p.vy += (p.spark ? 300 : 900) * dt;
          p.vx *= Math.pow(p.spark ? 0.2 : 0.5, dt);
          p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.life -= dt;
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5));
          ctx.translate(p.x, p.y);
          if (p.spark) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, p.w * 0.4, 0, 7); ctx.fill(); }
          else { ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.rot * 1.7)); ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
          ctx.restore();
        }
        FX.parts = FX.parts.filter((p) => p.life > 0 && p.y < ov.height + 40);
      }
    }
    requestAnimationFrame(FX.frame);
  };

  // ---------- card tilt ----------
  function initTilt() {
    let cur = null;
    const reset = (el) => { if (el) { el.style.transform = ''; el.style.setProperty('--mx', '50%'); el.style.setProperty('--my', '50%'); } };
    document.addEventListener('mousemove', (e) => {
      const el = e.target.closest && e.target.closest('.tilt');
      if (el !== cur) { reset(cur); cur = el; }
      if (!el || el.classList.contains('sold')) return;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(700px) rotateX(${(-dy * 14).toFixed(2)}deg) rotateY(${(dx * 16).toFixed(2)}deg) scale(1.05)`;
      el.style.setProperty('--mx', ((dx + 0.5) * 100).toFixed(1) + '%');
      el.style.setProperty('--my', ((dy + 0.5) * 100).toFixed(1) + '%');
    });
  }
})(window.SB);
