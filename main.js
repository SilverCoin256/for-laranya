document.addEventListener('DOMContentLoaded', () => {
  // Screens navigation wrapper
  const screens = {
    introGarden: document.getElementById('screen-intro-garden'),
    loveQuiz: document.getElementById('screen-love-quiz'),
    home: document.getElementById('screen-home'),
    mainCard: document.getElementById('screen-main-card'),
    album: document.getElementById('screen-album'),
    bouquet: document.getElementById('screen-bouquet'),
    letter: document.getElementById('screen-letter')
  };

  // Audio setup
  const bgMusic = document.getElementById('bg-music');
  const musicBtn = document.getElementById('music-btn');
  const playSvg = document.getElementById('play-svg');
  const pauseSvg = document.getElementById('pause-svg');
  const musicProgressBar = document.getElementById('music-progress-bar');
  let isPlaying = false;

  function togglePlay() {
    if (isPlaying) {
      bgMusic.pause();
      playSvg.style.display = 'block';
      pauseSvg.style.display = 'none';
      isPlaying = false;
    } else {
      // Browsers block autoplay, must play on interaction
      bgMusic.play().then(() => {
        playSvg.style.display = 'none';
        pauseSvg.style.display = 'block';
        isPlaying = true;
      }).catch(err => console.log("Audio play blocked: ", err));
    }
  }

  musicBtn.addEventListener('click', togglePlay);

  // Update audio progress timeline bar
  bgMusic.addEventListener('timeupdate', () => {
    if (bgMusic.duration) {
      const progress = (bgMusic.currentTime / bgMusic.duration) * 100;
      musicProgressBar.style.width = `${progress}%`;
    }
  });

  // Smooth Screen Transition function using GSAP
  let currentScreen = 'introGarden';
  let gardenIntroActive = true;

  function transitionTo(nextScreenId) {
    const fromEl = screens[currentScreen];
    const toEl = screens[nextScreenId];
    
    if (!toEl || nextScreenId === currentScreen) return;

    if (currentScreen === 'introGarden') {
      gardenIntroActive = false; // Stop canvas loop when leaving intro garden
    }

    // Scroll the upcoming screen to top
    toEl.scrollTop = 0;

    const tl = gsap.timeline({
      onStart: () => {
        toEl.style.display = 'flex';
      },
      onComplete: () => {
        fromEl.classList.remove('active');
        fromEl.style.display = 'none';
        toEl.classList.add('active');
        currentScreen = nextScreenId;
      }
    });

    // Fade out active screen
    tl.to(fromEl, {
      opacity: 0,
      y: -20,
      duration: 0.4,
      ease: 'power2.in'
    });

    // Fade in new screen
    tl.fromTo(toEl, 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
      "-=0.1"
    );
  }

  // Envelope Open Interaction
  const envelopeWrapper = document.getElementById('envelope-trigger');
  envelopeWrapper.addEventListener('click', () => {
    if (envelopeWrapper.classList.contains('open')) return;
    
    // Add open class to trigger CSS lid swing and letter slide
    envelopeWrapper.classList.add('open');

    // Auto-play music on envelope click
    setTimeout(() => {
      bgMusic.play().then(() => {
        playSvg.style.display = 'none';
        pauseSvg.style.display = 'block';
        isPlaying = true;
      }).catch(err => console.log("Autoplay blocked: ", err));
    }, 300);

    // Transition to main card screen after slide up completes
    setTimeout(() => {
      transitionTo('mainCard');
    }, 1200);
  });

  // Footer Navigation Buttons
  document.getElementById('go-to-album').addEventListener('click', () => {
    transitionTo('album');
  });

  document.getElementById('go-to-bouquet').addEventListener('click', () => {
    transitionTo('bouquet');
  });

  document.getElementById('go-to-letter').addEventListener('click', () => {
    transitionTo('letter');
  });


  // --- STACK CAROUSEL LOGIC ---
  const cardStack = document.getElementById('card-stack');
  let cards = Array.from(cardStack.querySelectorAll('.carousel-card'));
  const indicators = Array.from(document.querySelectorAll('.indicator-dot'));
  let activeIndex = 0;

  // Render/arrange card stack initial positioning
  function arrangeStack() {
    cards.forEach((card, index) => {
      // Arrangement styling based on position in cards array
      gsap.killTweensOf(card);
      
      let transformValue = '';
      let zIndex = cards.length - index;
      let opacity = 1;
      let scale = 1 - (index * 0.05);
      let translateY = index * 12;
      let rotation = index === 0 ? 0 : index === 1 ? 3 : -3;

      if (index === 0) {
        card.style.pointerEvents = 'auto'; // only allow interaction on top card
      } else {
        card.style.pointerEvents = 'none';
      }

      gsap.to(card, {
        scale: scale,
        y: translateY,
        rotation: rotation,
        opacity: opacity,
        zIndex: zIndex,
        duration: 0.4,
        ease: 'power2.out'
      });
    });

    // Update active indicators
    indicators.forEach((ind, idx) => {
      if (idx === activeIndex) {
        ind.classList.add('active');
      } else {
        ind.classList.remove('active');
      }
    });
  }

  arrangeStack();

  // Slide top card away (Next Card)
  function slideNext() {
    const topCard = cards[0];
    if (!topCard) return;

    // Animate top card throwing away to the right
    gsap.to(topCard, {
      x: 320,
      rotation: 20,
      opacity: 0,
      scale: 0.9,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        // Move top card to the bottom of the cards array
        cards.push(cards.shift());
        
        // Reset topCard position off-screen on the bottom
        gsap.set(topCard, { x: 0, y: 30, rotation: 0, opacity: 0, zIndex: 1 });
        
        // Update active index
        activeIndex = (activeIndex + 1) % cards.length;
        
        // Re-arrange stack
        arrangeStack();
      }
    });
  }

  // Bring card back from bottom (Prev Card)
  function slidePrev() {
    // Take bottom card and make it top card
    const bottomCard = cards[cards.length - 1];
    if (!bottomCard) return;

    // Shift bottom card to front of array
    cards.unshift(cards.pop());
    
    // Position it off-screen to the left to prepare slide in
    gsap.set(bottomCard, {
      x: -320,
      rotation: -20,
      opacity: 0,
      zIndex: cards.length
    });

    // Update active index
    activeIndex = (activeIndex - 1 + cards.length) % cards.length;

    // Rearrange stack first (will animate other cards down)
    arrangeStack();

    // Slide in the new top card
    gsap.to(bottomCard, {
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      scale: 1,
      duration: 0.45,
      ease: 'power2.out'
    });
  }

  document.getElementById('next-btn').addEventListener('click', slideNext);
  document.getElementById('prev-btn').addEventListener('click', slidePrev);

  // Click on dots directly to navigate
  indicators.forEach(indicator => {
    indicator.addEventListener('click', () => {
      const targetSlide = parseInt(indicator.dataset.slide);
      let limit = 0;
      while (activeIndex !== targetSlide && limit < 5) {
        slideNext();
        limit++;
      }
    });
  });

  // Swipe support for Carousel (Mobile & Desktop drag)
  let startX = 0;
  let isDragging = false;

  cardStack.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  });

  cardStack.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX;
    
    // Drag visual effect on top card
    if (cards[0]) {
      gsap.set(cards[0], { x: diff, rotation: diff * 0.05 });
    }
  });

  cardStack.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    const diff = e.changedTouches[0].clientX - startX;

    if (diff > 80) {
      slidePrev();
    } else if (diff < -80) {
      slideNext();
    } else {
      // Snap back to top position
      if (cards[0]) {
        gsap.to(cards[0], { x: 0, rotation: 0, duration: 0.3, ease: 'power2.out' });
      }
    }
  });

  // Desktop Drag Swipe support
  cardStack.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    isDragging = true;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const diff = e.clientX - startX;
    if (cards[0]) {
      gsap.set(cards[0], { x: diff, rotation: diff * 0.05 });
    }
  });

  document.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    const diff = e.clientX - startX;

    if (diff > 80) {
      slidePrev();
    } else if (diff < -80) {
      slideNext();
    } else {
      if (cards[0]) {
        gsap.to(cards[0], { x: 0, rotation: 0, duration: 0.3, ease: 'power2.out' });
      }
    }
  });


  // --- HEART BURST ANIMATION ---
  const finalHeart = document.getElementById('final-heart');
  
  function createHeartParticle() {
    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
    heart.style.position = 'absolute';
    heart.style.pointerEvents = 'none';
    heart.style.fontSize = `${Math.random() * 1.2 + 0.8}rem`;
    
    // Position at heart's location
    const rect = finalHeart.getBoundingClientRect();
    const containerRect = document.querySelector('.app-container').getBoundingClientRect();
    
    // Relative coordinates
    const startX = rect.left - containerRect.left + rect.width / 2;
    const startY = rect.top - containerRect.top + rect.height / 2;
    
    heart.style.left = `${startX}px`;
    heart.style.top = `${startY}px`;
    
    document.querySelector('.app-container').appendChild(heart);

    // Random spray direction
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 180 + 80;
    const targetX = startX + Math.cos(angle) * distance;
    const targetY = startY - Math.random() * 150 - 50; // Tend upward

    gsap.to(heart, {
      x: targetX - startX,
      y: targetY - startY,
      opacity: 0,
      scale: 0.5,
      rotation: Math.random() * 360 - 180,
      duration: Math.random() * 1.5 + 0.8,
      ease: 'power2.out',
      onComplete: () => {
        heart.remove();
      }
    });
  }

  finalHeart.addEventListener('click', () => {
    // Spray 30 hearts on click!
    for (let i = 0; i < 30; i++) {
      setTimeout(createHeartParticle, i * 40);
    }
  });

  /* ============================================================
     GARDEN EXPERIENCE (Intro Canvas Garden)
  ============================================================ */
  const canvas = document.getElementById('garden-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, CX, BASE, SC;

  const flowers = [];
  const introHearts = [];
  const fireflies = [];
  const trail = [];
  let introFlowerCount = 0;
  let START_TIME = Date.now();

  const loveMessages = [
    "I love you 🌹", "You're my sunshine ☀️", "Forever yours 💕",
    "You make me smile 😊", "My heart beats for you 💓",
    "You're beautiful 🌺", "Thinking of you 💭", "My everything 🌷",
    "You're amazing ✨", "Perfect in every way 🌟", "My dream come true 💫",
    "Love you more than words 💖", "You're my world 🌍",
    "Simply the best 🏆", "My queen 👑", "You're magical 🦋"
  ];

  const loveInLanguages = [
    "I Love You", "Je t'aime", "Te amo", "Ich liebe dich",
    "愛してる", "Saranghae", "Ti amo", "Eu te amo",
    "Σ' αγαπώ", "Я тебя люблю", "احبك", "मैं तुमसे प्यार करता हूँ",
    "Aku cinta kamu", "Saya cinta padamu", "Wo ai ni", "Ya tebya lyublyu"
  ];

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = canvas.width = rect.width || window.innerWidth;
    H = canvas.height = rect.height || window.innerHeight;
    CX = W / 2;
    BASE = H * 0.95;
    SC = Math.min(W, H) / 700;
    if (W < 600) SC = W / 350;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const clampVal = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeOutVal = x => 1 - Math.pow(1 - x, 3);
  const segVal = (p, s, e) => easeOutVal(clampVal((p - s) / (e - s), 0, 1));

  function bezPt(x0, y0, cx1, cy1, cx2, cy2, x1, y1, t) {
    const m = 1 - t;
    return [
      m*m*m*x0 + 3*m*m*t*cx1 + 3*m*t*t*cx2 + t*t*t*x1,
      m*m*m*y0 + 3*m*m*t*cy1 + 3*m*t*t*cy2 + t*t*t*y1
    ];
  }

  function bezAngle(x0, y0, cx1, cy1, cx2, cy2, x1, y1, t) {
    const m = 1 - t;
    const dx = 3*m*m*(cx1-x0) + 6*m*t*(cx2-cx1) + 3*t*t*(x1-cx2);
    const dy = 3*m*m*(cy1-y0) + 6*m*t*(cy2-cy1) + 3*t*t*(y1-cy2);
    return Math.atan2(dy, dx);
  }

  function getThemeColors() {
    const palettes = [
      { c1: '#e06d75', c2: '#f0d5db', c3: '#eac3cd' },
      { c1: '#7c6a9f', c2: '#f0ecf6', c3: '#e9e5ee' },
      { c1: '#fbd87f', c2: '#faf8f0', c3: '#faf0d5' }
    ];
    return palettes[Math.floor(Math.random() * palettes.length)];
  }

  function showFloatingText(x, y, text, isLove = true) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.textContent = text;
    
    const size = isLove ? 20 + Math.random() * 12 : 14 + Math.random() * 8;
    const xOffset = (Math.random() - 0.5) * 60;
    
    el.style.cssText = `
      left: ${clampVal(x + xOffset, 10, W - 150)}px;
      top: ${y}px;
      color: ${isLove ? '#ff8fa3' : '#bb8fce'};
      font-size: ${size}px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.5);
      transform: translateY(0) scale(0.8);
      opacity: 0;
    `;
    
    canvas.parentElement.appendChild(el);
    
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = `translateY(-${60 + Math.random() * 40}px) scale(1.1)`;
    });
    
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = `translateY(-${140 + Math.random() * 60}px) scale(0.9)`;
    }, 2000);
    
    setTimeout(() => el.remove(), 3000);
  }

  function createIntroHearts(x, y) {
    for (let i = 0; i < 15; i++) {
      introHearts.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: -1 - Math.random() * 5,
        size: 8 + Math.random() * 14,
        life: 1,
        color: i % 3 === 0 ? '#ff6b8a' : (i % 3 === 1 ? '#ff8fa3' : '#e06d75'),
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.1
      });
    }
  }

  // Init fireflies
  for (let i = 0; i < 20; i++) {
    fireflies.push({
      x: Math.random() * W,
      y: Math.random() * H,
      angle: Math.random() * Math.PI * 2,
      radius: 40 + Math.random() * 100,
      speed: 0.005 + Math.random() * 0.015,
      size: 1.5 + Math.random() * 2.5,
      phase: Math.random() * Math.PI * 2,
      targetX: Math.random() * W,
      targetY: Math.random() * H,
      lerpSpeed: 0.001 + Math.random() * 0.003
    });
  }

  const STARS = Array.from({length: 120}, () => ({
    x: Math.random(), y: Math.random() * 0.85, r: Math.random() * 0.9 + 0.15,
    phase: Math.random() * Math.PI * 2, speed: 0.02 + Math.random() * 0.03
  }));

  const SPARKS = Array.from({length: 25}, () => { const s={}; resetSp(s); s.life=Math.random()*s.max; return s; });
  function resetSp(s) {
    s.x = Math.random() * W;
    s.y = BASE - Math.random() * (H * 0.8);
    s.vy = -0.15 - Math.random()*0.4;
    s.life = 0; s.max = 0.5 + Math.random()*0.4; s.sz = 1.0 + Math.random()*1.5;
    s.hue = Math.random()*360;
  }

  function drawEnvironment() {
    const bg = ctx.createRadialGradient(CX, H*0.5, 10, CX, H*0.35, H*0.85);
    bg.addColorStop(0, '#190a20');
    bg.addColorStop(0.5, '#09040c');
    bg.addColorStop(1, '#000000');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    STARS.forEach(s => {
      s.phase += s.speed;
      const a = 0.2 + 0.5 * Math.abs(Math.sin(s.phase));
      ctx.beginPath();
      ctx.arc(s.x*W, s.y*H, s.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,235,245,${a})`;
      ctx.fill();
    });

    SPARKS.forEach(s => {
      s.life += 0.005;
      if (s.life > s.max) resetSp(s);
      const a = Math.sin((s.life/s.max)*Math.PI) * 0.6;
      ctx.beginPath();
      ctx.arc(s.x + Math.sin(s.life*4)*3, s.y + s.vy*s.life*40, s.sz, 0, Math.PI*2);
      ctx.fillStyle = `hsla(${s.hue}, 90%, 85%, ${a})`;
      ctx.fill();
    });
    
    fireflies.forEach(f => {
      f.x += (f.targetX - f.x) * f.lerpSpeed;
      f.y += (f.targetY - f.y) * f.lerpSpeed;
      if (Math.random() < 0.002) {
        f.targetX = Math.random() * W;
        f.targetY = Math.random() * H;
      }
      f.phase += 0.025;
      const glow = 0.3 + 0.7 * Math.abs(Math.sin(f.phase));
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 230, 180, ${glow * 0.4})`;
      ctx.fill();
    });
  }

  function drawStem(x0, y0, cx1, cy1, cx2, cy2, x1, y1, prog, thick, col) {
    if (prog <= 0) return;
    ctx.beginPath();
    const steps = 30;
    for (let i = 0; i <= steps*prog; i++) {
      const [px,py] = bezPt(x0,y0,cx1,cy1,cx2,cy2,x1,y1, i/steps);
      i === 0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
    }
    ctx.strokeStyle = col; ctx.lineWidth = thick; ctx.lineCap = 'round';
    ctx.stroke();
  }

  function drawLilyLeaf(x, y, rot, size, prog) {
    if (prog <= 0) return;
    const s = size * prog;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(s * 0.15, s * 0.15, s, 0);
    ctx.quadraticCurveTo(s * 0.15, -s * 0.15, 0, 0);
    ctx.fillStyle = '#4c8651'; ctx.fill();
    ctx.restore();
  }

  function drawLilyFlower(x, y, size, prog, wob, stemAngle) {
    const s = size * prog * 1.5;
    const rot = (stemAngle + Math.PI/2) * 0.3 + wob;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.7);
    pg.addColorStop(0, '#f9ecf0'); pg.addColorStop(0.5, '#f5d6dd'); pg.addColorStop(1, '#e06d75');

    const drawPetal = (rad, w) => {
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-rad*0.3*w, -rad*0.3, -rad*0.2*w, -rad*0.8, 0, -rad);
      ctx.bezierCurveTo(rad*0.2*w, -rad*0.8, rad*0.3*w, -rad*0.3, 0, 0);
      ctx.fillStyle = pg; ctx.fill();
    }
    for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate((i * Math.PI*2/3)); drawPetal(s * 0.9, 0.85); ctx.restore(); }
    for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate((i * Math.PI*2/3) + Math.PI/3); drawPetal(s, 1.0); ctx.restore(); }
    ctx.restore();
  }

  function drawRoseFlower(x, y, size, prog, wob, stemAngle) {
    const s = size * prog * 1.3;
    const rot = (stemAngle + Math.PI/2) + wob;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = '#ff6b8a'; ctx.beginPath(); ctx.arc(0, -s*0.3, s*0.4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#e06d75'; ctx.beginPath(); ctx.arc(-s*0.15, -s*0.2, s*0.3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ff8fa3'; ctx.beginPath(); ctx.arc(s*0.15, -s*0.2, s*0.3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#f5d6dd'; ctx.beginPath(); ctx.arc(0, 0, s*0.2, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function drawSunflowerLeaf(x, y, rot, size, prog) {
    if (prog <= 0) return; const s = size * prog;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s*0.4, s*0.3, s, 0); ctx.quadraticCurveTo(s*0.4, -s*0.3, 0, 0);
    ctx.fillStyle = '#3f7c46'; ctx.fill();
    ctx.restore();
  }

  function drawSunflowerFlower(x, y, size, prog, wob, stemAngle) {
    const s = size * prog * 1.4;
    const rot = (stemAngle + Math.PI/2) * 0.4 + wob;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    for (let i = 0; i < 16; i++) {
      ctx.save(); ctx.rotate((i/16)*Math.PI*2);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s*0.15, -s*0.4, 0, -s*0.8);
      ctx.quadraticCurveTo(-s*0.15, -s*0.4, 0, 0); ctx.fillStyle = '#fbd87f'; ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle='#5a3e20'; ctx.beginPath(); ctx.arc(0,0,s*0.35,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function drawTulipLeaf(x, y, rot, size, prog) {
    if (prog <= 0) return; const s = size * prog;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(s*0.3, s*0.25, s*0.8, s*0.1, s, 0);
    ctx.bezierCurveTo(s*0.8, -s*0.15, s*0.3, -s*0.25, 0, 0);
    ctx.fillStyle = '#417255'; ctx.fill();
    ctx.restore();
  }

  function drawTulipFlower(x, y, size, prog, wob, stemAngle) {
    const s = size * prog * 1.4;
    const rot = (stemAngle + Math.PI/2) * 0.2 + wob;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = '#a66dbf';
    ctx.beginPath(); ctx.moveTo(-s*0.1, 0); ctx.bezierCurveTo(-s*0.35, -s*0.4, -s*0.25, -s*0.9, 0, -s); ctx.bezierCurveTo(s*0.25, -s*0.9, s*0.35, -s*0.4, s*0.1, 0); ctx.fill();
    ctx.fillStyle = '#bb8fce';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-s*0.4, -s*0.1, -s*0.5, -s*0.7, -s*0.25, -s*0.9); ctx.bezierCurveTo(-s*0.1, -s*0.8, 0, -s*0.4, 0, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(s*0.4, -s*0.1, s*0.5, -s*0.7, s*0.25, -s*0.9); ctx.bezierCurveTo(s*0.1, -s*0.8, 0, -s*0.4, 0, 0); ctx.fill();
    ctx.restore();
  }

  function drawGenericFlower(x, y, size, prog, wob) {
    const s = size * prog;
    ctx.save(); ctx.translate(x, y); ctx.rotate(wob);
    for (let i = 0; i < 5; i++) {
      ctx.save(); ctx.rotate((i/5)*Math.PI*2);
      ctx.beginPath(); ctx.ellipse(0, -s*0.5, s*0.25, s*0.4, 0, 0, Math.PI*2);
      ctx.fillStyle = '#eac3cd'; ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = '#fbd87f'; ctx.beginPath(); ctx.arc(0, 0, s*0.25, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  const FLOWER_DEFS = {
    lily: { sd: '#234d20', sl: '#4c8651', leaves: [0.2, 0.6] },
    rose: { sd: '#193f1d', sl: '#3f7c46', leaves: [0.3] },
    sunflower: { sd: '#193f1d', sl: '#3f7c46', leaves: [0.2, 0.5] },
    tulip: { sd: '#204f32', sl: '#417255', leaves: [0.3, 0.7] },
    generic: { sd: '#193f1d', sl: '#3f7c46', leaves: [] }
  };

  canvas.addEventListener('click', (e) => {
    if (currentScreen !== 'introGarden') return;

    if (!isPlaying) {
      bgMusic.play().then(() => {
        playSvg.style.display = 'none';
        pauseSvg.style.display = 'block';
        isPlaying = true;
      }).catch(err => console.log("Audio play blocked: ", err));
    }

    const types = Object.keys(FLOWER_DEFS);
    const type = types[Math.floor(Math.random() * types.length)];
    const def = FLOWER_DEFS[type];

    const rect = canvas.getBoundingClientRect();
    let tx = e.clientX - rect.left;
    let ty = e.clientY - rect.top;
    
    if (ty > BASE - 60) ty = BASE - 60;
    const size = (25 + Math.random() * 20) * SC;

    let txAdjust = tx;
    let tyAdjust = ty;
    let overlapping = true;
    let attempts = 0;
    while (overlapping && attempts < 10) {
      overlapping = false;
      for (let f of flowers) {
        let dx = txAdjust - f.tx;
        let dy = tyAdjust - f.ty;
        let minDist = (size + f.size) * 0.7;
        if (dx*dx + dy*dy < minDist*minDist) {
          txAdjust += (Math.random() > 0.5 ? 1 : -1) * minDist * 0.5;
          tyAdjust += (Math.random() - 0.5) * minDist * 0.5;
          overlapping = true;
          break;
        }
      }
      attempts++;
    }
    tx = clampVal(txAdjust, 30, W - 30);
    ty = clampVal(tyAdjust, 30, BASE - 60);

    const xSpread = ((tx / W) - 0.5) * 120;
    const bx = CX + xSpread;
    const by = BASE + Math.random() * 15;

    const cp1x = bx;
    const cp1y = by - Math.abs(by - ty) * 0.4;
    const cp2x = tx - (tx - bx) * 0.2;
    const cp2y = ty + Math.abs(by - ty) * 0.4;

    flowers.push({
      type,
      bx, by, tx, ty,
      cp1x, cp1y, cp2x, cp2y,
      size,
      thick: (2.5 + Math.random() * 1) * SC,
      startTime: Date.now(),
      duration: 2000 + Math.random() * 1000,
      wobble: Math.random() * Math.PI * 2,
      sd: def.sd, sl: def.sl, leaves: def.leaves,
      dir: Math.random() < 0.5 ? 1 : -1
    });

    if (flowers.length > 30) {
      flowers.shift();
    }

    introFlowerCount++;
    document.getElementById('intro-flower-count').textContent = introFlowerCount;
    createIntroHearts(tx, ty);

    const isLove = Math.random() < 0.6;
    const msg = isLove ?
      loveMessages[Math.floor(Math.random() * loveMessages.length)] :
      loveInLanguages[Math.floor(Math.random() * loveInLanguages.length)];
    showFloatingText(tx, ty, msg, isLove);

    if (introFlowerCount >= 3) {
      const contBtn = document.getElementById('intro-garden-continue');
      if (contBtn && contBtn.style.display === 'none') {
        contBtn.style.display = 'block';
        gsap.fromTo(contBtn, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5 });
      }
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (currentScreen !== 'introGarden') return;
    const rect = canvas.getBoundingClientRect();
    trail.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, life: 1 });
    if (trail.length > 40) trail.shift();
  });

  function drawGarden() {
    if (!gardenIntroActive) return;
    ctx.clearRect(0, 0, W, H);
    drawEnvironment();

    trail.forEach((t, i) => {
      t.life -= 0.02;
      if (t.life > 0) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, 2 * t.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 230, 240, ${t.life * 0.25})`;
        ctx.fill();
      }
    });
    for (let i = trail.length - 1; i >= 0; i--) {
      if (trail[i].life <= 0) trail.splice(i, 1);
    }

    introHearts.forEach((h, i) => {
      h.x += h.vx;
      h.y += h.vy;
      h.vy += 0.04;
      h.rotation += h.rotSpeed;
      h.life -= 0.01;
      
      if (h.life <= 0) introHearts.splice(i, 1);
      else {
        ctx.save();
        ctx.globalAlpha = h.life;
        ctx.translate(h.x, h.y);
        ctx.rotate(h.rotation);
        ctx.font = `${h.size}px "Arial"`;
        ctx.fillStyle = h.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♥', 0, 0);
        ctx.restore();
      }
    });

    const now = Date.now();
    const elapsed = now - START_TIME;

    flowers.forEach((f) => {
      const rawP = Math.min((now - f.startTime) / f.duration, 1);
      const sp = easeOutVal(rawP);
      const fp = easeOutVal(clampVal((rawP - 0.5) / 0.5, 0, 1));

      drawStem(f.bx, f.by, f.cp1x, f.cp1y, f.cp2x, f.cp2y, f.tx, f.ty, sp, f.thick, f.sd);
      drawStem(f.bx, f.by, f.cp1x, f.cp1y, f.cp2x, f.cp2y, f.tx, f.ty, sp, f.thick * 0.5, f.sl);

      f.leaves.forEach((lt, i) => {
        if (sp > lt) {
          const [lx, ly] = bezPt(f.bx, f.by, f.cp1x, f.cp1y, f.cp2x, f.cp2y, f.tx, f.ty, lt);
          const lAngle = bezAngle(f.bx, f.by, f.cp1x, f.cp1y, f.cp2x, f.cp2y, f.tx, f.ty, lt);
          const lDir = i % 2 === 0 ? f.dir : -f.dir;
          const lProg = clampVal((sp - lt) * 4, 0, 1);

          if (f.type === 'lily') drawLilyLeaf(lx, ly, lAngle + (Math.PI / 2.8) * lDir, f.size * 1.5, lProg);
          else if (f.type === 'sunflower') drawSunflowerLeaf(lx, ly, lAngle + (Math.PI / 2.5) * lDir, f.size * 1.6, lProg);
          else if (f.type === 'tulip') drawTulipLeaf(lx, ly, lAngle + (Math.PI / 8) * lDir, f.size * 2.2, lProg);
        }
      });

      const [fx, fy] = bezPt(f.bx, f.by, f.cp1x, f.cp1y, f.cp2x, f.cp2y, f.tx, f.ty, Math.min(sp, 1));
      const angle = bezAngle(f.bx, f.by, f.cp1x, f.cp1y, f.cp2x, f.cp2y, f.tx, f.ty, Math.min(sp, 1));
      const wob = Math.sin(elapsed * 0.0013 + f.wobble) * 0.04;

      if (f.type === 'lily') drawLilyFlower(fx, fy, f.size, fp, wob, angle);
      else if (f.type === 'rose') drawRoseFlower(fx, fy, f.size, fp, wob, angle);
      else if (f.type === 'sunflower') drawSunflowerFlower(fx, fy, f.size, fp, wob, angle);
      else if (f.type === 'tulip') drawTulipFlower(fx, fy, f.size, fp, wob, angle);
      else if (f.type === 'generic') drawGenericFlower(fx, fy, f.size, fp, wob);
    });

    requestAnimationFrame(drawGarden);
  }
  drawGarden();

  document.getElementById('intro-garden-continue').addEventListener('click', () => {
    transitionTo('loveQuiz');
  });

  // --- LOVE QUIZ RUNAWAY NO BUTTON LOGIC ---
  const noBtn = document.getElementById('no-btn');
  const yesBtn = document.getElementById('yes-btn');
  const appContainer = document.querySelector('.app-container');

  function moveNoButton() {
    const containerWidth = appContainer.clientWidth;
    const containerHeight = appContainer.clientHeight;
    const btnWidth = noBtn.offsetWidth || 110;
    const btnHeight = noBtn.offsetHeight || 52;
    
    const padding = 24;
    const maxX = containerWidth - btnWidth - padding;
    const maxY = containerHeight - btnHeight - padding;
    
    const randomX = Math.random() * (maxX - padding) + padding;
    const randomY = Math.random() * (maxY - padding) + padding;
    
    noBtn.style.position = 'absolute';
    noBtn.style.left = `${randomX}px`;
    noBtn.style.top = `${randomY}px`;
    noBtn.style.zIndex = '999';
  }

  noBtn.addEventListener('mouseenter', moveNoButton);
  noBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    moveNoButton();
  });

  yesBtn.addEventListener('click', () => {
    transitionTo('home');
  });

});
