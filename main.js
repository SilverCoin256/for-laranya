document.addEventListener('DOMContentLoaded', () => {
  // Screens navigation wrapper
  const screens = {
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
  let currentScreen = 'home';
  function transitionTo(nextScreenId) {
    const fromEl = screens[currentScreen];
    const toEl = screens[nextScreenId];
    
    if (!toEl || nextScreenId === currentScreen) return;

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

});
