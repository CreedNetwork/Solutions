/**
 * Joker Community - Core Logic (2025)
 */

// --- Scroll Reveal System ---
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    
    reveals.forEach(el => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initTheme();
    initNavigation();
    initScrollReveal(); // 추가
    
    const path = window.location.pathname;
    if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
        initIndexHeroParallax();
    }
    if (path.includes('dashboard.html')) {
        initDashboard();
    } else if (path.includes('board.html')) {
        renderPosts();
    } else if (path.includes('post.html')) {
        renderPostDetail();
    }
});

// --- Index Hero FX ---
function initIndexHeroParallax() {
    const hero = document.querySelector('.hero');
    const orb1 = document.querySelector('.hero-orb.purple');
    const orb2 = document.querySelector('.hero-orb.pink');
    if (!hero || !orb1 || !orb2) return;

    let rafId = null;
    let mx = 0, my = 0;

    function apply() {
        rafId = null;
        const rect = hero.getBoundingClientRect();
        const x = (mx - (rect.left + rect.width / 2)) / rect.width;  // -0.5~0.5
        const y = (my - (rect.top + rect.height / 2)) / rect.height; // -0.5~0.5
        orb1.style.transform = `translate3d(${x * 18}px, ${y * 14}px, 0)`;
        orb2.style.transform = `translate3d(${x * -16}px, ${y * -12}px, 0)`;
    }

    hero.addEventListener('mousemove', (e) => {
        mx = e.clientX;
        my = e.clientY;
        if (!rafId) rafId = requestAnimationFrame(apply);
    });
}

// --- Auth System ---
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('joker_user'));
    const path = window.location.pathname;
    
    // 공개 페이지 목록 (랜딩 페이지, 로그인 페이지, 준비중 페이지)
    const isPublicPage = path.includes('index.html') || path.includes('login.html') || path.includes('coming-soon.html') || path === '/' || path.endsWith('/');
    
    if (!user && !isPublicPage) {
        // 테스트 모드: 자동으로 게스트 로그인
        autoLogin();
    }
}

// 테스트용 자동 로그인 (GitHub Pages 테스트용)
function autoLogin() {
    const existingUser = JSON.parse(localStorage.getItem('joker_user'));
    if (existingUser) return; // 이미 로그인된 경우 스킵
    
    const testUser = {
        id: Date.now(),
        nickname: 'Joker_Tester',
        email: 'test@joker.com',
        password: 'test1234',
        role: 'admin', // 관리자 권한으로 모든 기능 테스트 가능
        joinDate: new Date().toLocaleDateString()
    };
    
    // 유저 목록에 추가
    const users = JSON.parse(localStorage.getItem('joker_users') || '[]');
    if (!users.find(u => u.email === testUser.email)) {
        users.push(testUser);
        localStorage.setItem('joker_users', JSON.stringify(users));
    }
    
    // 로그인 처리
    localStorage.setItem('joker_user', JSON.stringify(testUser));
}

function login(email, password) {
    const users = JSON.parse(localStorage.getItem('joker_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        localStorage.setItem('joker_user', JSON.stringify(user));
        window.location.href = 'dashboard.html'; // 대시보드로 이동
    } else {
        alert('이메일 또는 비밀번호가 일치하지 않습니다.');
    }
}

function register(nickname, email, password) {
    const users = JSON.parse(localStorage.getItem('joker_users') || '[]');
    if (users.find(u => u.email === email)) {
        alert('이미 가입된 이메일입니다.');
        return;
    }
    
    const newUser = {
        id: Date.now(),
        nickname,
        email,
        password,
        role: email.includes('admin') ? 'admin' : 'user', // admin 포함 이메일은 관리자
        joinDate: new Date().toLocaleDateString()
    };
    
    users.push(newUser);
    localStorage.setItem('joker_users', JSON.stringify(users));
    alert('회원가입이 완료되었습니다. 로그인해주세요.');
    return true;
}

function logout() {
    localStorage.removeItem('joker_user');
    window.location.href = 'login.html';
}

// --- Board System ---
function savePost(title, content, category) {
    const user = JSON.parse(localStorage.getItem('joker_user'));
    const posts = JSON.parse(localStorage.getItem('joker_posts') || '[]');
    
    const newPost = {
        id: Date.now(),
        title,
        content,
        category,
        author: user.nickname,
        authorRole: user.role,
        date: new Date().toLocaleString(),
        views: 0,
        likes: 0,
        comments: []
    };
    
    posts.unshift(newPost);
    localStorage.setItem('joker_posts', JSON.stringify(posts));
    window.location.href = 'board.html';
}

function renderPosts() {
    const postList = document.querySelector('.post-list');
    if (!postList) return;
    
    const posts = JSON.parse(localStorage.getItem('joker_posts') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('joker_user'));
    
    if (posts.length === 0) {
        postList.innerHTML = '<div class="card text-center">게시글이 없습니다.</div>';
        return;
    }
    
    postList.innerHTML = posts.map(post => `
        <div class="post-item card" style="display:flex; justify-content:space-between; align-items:center;">
            <div onclick="location.href='post.html?id=${post.id}'" style="cursor:pointer; flex:1;">
                <span class="category-badge">${post.category}</span>
                <h3 class="post-title">${post.title} ${post.authorRole === 'admin' ? '<span class="admin-badge">Admin</span>' : ''}</h3>
                <div class="post-meta">
                    <span>${post.author}</span> • <span>${post.date}</span> • <span>조회 ${post.views}</span>
                </div>
            </div>
            ${currentUser.role === 'admin' ? `<button onclick="deletePost(${post.id})" class="btn-delete">삭제</button>` : ''}
        </div>
    `).join('');
}

function deletePost(id) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    let posts = JSON.parse(localStorage.getItem('joker_posts') || '[]');
    posts = posts.filter(p => p.id !== id);
    localStorage.setItem('joker_posts', JSON.stringify(posts));
    renderPosts();
}

function renderPostDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    const posts = JSON.parse(localStorage.getItem('joker_posts') || '[]');
    const post = posts.find(p => p.id == postId);
    
    if (!post) return;
    
    // 조회수 증가
    post.views++;
    localStorage.setItem('joker_posts', JSON.stringify(posts));
    
    const container = document.querySelector('.post-detail-container');
    if (container) {
        container.innerHTML = `
            <article class="post-detail-card card">
                <div class="post-detail-header">
                    <span class="category-badge">${post.category}</span>
                    <h1 class="post-detail-title">${post.title}</h1>
                    <div class="post-author-info">
                        <div class="author-name">${post.author} ${post.authorRole === 'admin' ? '<span class="admin-badge">Admin</span>' : ''}</div>
                        <div class="post-date">${post.date}</div>
                    </div>
                </div>
                <div class="post-detail-content">
                    ${post.content.replace(/\n/g, '<br>')}
                </div>
            </article>
            <div class="text-center">
                <a href="board.html" class="btn btn-dim">목록으로</a>
            </div>
        `;
    }
}

// --- Dashboard Logic ---
function initDashboard() {
    const user = JSON.parse(localStorage.getItem('joker_user'));
    if (user) {
        const profileName = document.querySelector('.user-profile-card h4');
        if (profileName) profileName.textContent = user.nickname;
        
        const avatar = document.querySelector('.profile-avatar');
        if (avatar) avatar.textContent = user.nickname.charAt(0).toUpperCase();
        
        const badge = document.querySelector('.badge');
        if (badge && user.role === 'admin') {
            badge.textContent = 'Admin';
            badge.style.background = 'var(--accent-red)';
        }
    }

    initDashboardCounters();
    initDashboardCharts();
    initDashboardGauge();
    renderDashboardRecentPosts();
}

function initDashboardCounters() {
    const counters = document.querySelectorAll('[data-count]');
    counters.forEach(el => {
        const raw = el.getAttribute('data-count');
        const suffix = el.getAttribute('data-suffix') || '';
        const target = Number(raw);
        if (!Number.isFinite(target)) return;

        const duration = 1100;
        const start = performance.now();
        const from = 0;

        function tick(now) {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            const val = Math.round(from + (target - from) * eased);
            el.textContent = val.toLocaleString() + suffix;
            if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    });
}

function initDashboardCharts() {
    // 1) Line chart: occupancy trend (12 points)
    const occ = [22, 28, 35, 41, 48, 55, 62, 68, 74, 81, 88, 72]; // sample
    const line = document.getElementById('occLine');
    const area = document.getElementById('occArea');
    if (line && area) {
        const w = 300, h = 90, top = 10;
        const min = 0, max = 100;
        const step = w / (occ.length - 1);
        const pts = occ.map((v, i) => {
            const x = i * step;
            const y = top + (h * (1 - (v - min) / (max - min)));
            return [x, y];
        });

        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
        line.setAttribute('d', d);

        const areaD = `M 0 ${top + h} ` + pts.map((p) => `L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ` L ${w} ${top + h} Z`;
        area.setAttribute('d', areaD);
    }

    // 2) Bar chart: hourly traffic
    const bars = document.getElementById('trafficBars');
    if (bars) {
        const data = [8, 6, 5, 4, 6, 8, 14, 18, 26, 34, 38, 44, 52, 60, 64, 70, 76, 82, 90, 88, 78, 62, 40, 22];
        bars.innerHTML = '';
        // show 12 bars (every 2 hours) to keep it clean
        const compact = data.filter((_, idx) => idx % 2 === 0);
        compact.forEach((v, i) => {
            const cell = document.createElement('div');
            cell.className = 'bar';
            const fill = document.createElement('span');
            fill.style.height = '0%';
            cell.title = `${String(i * 2).padStart(2, '0')}시 • ${v}%`;
            cell.appendChild(fill);
            bars.appendChild(cell);
            // animate
            requestAnimationFrame(() => {
                fill.style.height = `${Math.max(6, v)}%`;
            });
        });
    }
}

function initDashboardGauge() {
    const pct = 72; // 샘플 (나중에 occupancy.html과 연동 가능)
    const fill = document.getElementById('occGaugeFill');
    const glow = document.getElementById('occGaugeGlow');
    const kpi = document.getElementById('occKpi');
    const state = document.getElementById('occState');
    if (!fill || !glow || !kpi || !state) return;

    // 상태 라벨
    let label = '여유';
    let cls = 'pill good';
    let icon = 'fas fa-leaf';
    if (pct >= 80) { label = '혼잡'; cls = 'pill bad'; icon = 'fas fa-fire'; }
    else if (pct >= 50) { label = '보통'; cls = 'pill warn'; icon = 'fas fa-wave-square'; }

    state.className = cls;
    state.innerHTML = `<i class="${icon}"></i> ${label}`;

    // 애니메이션 (살짝 지연 후 채우기)
    kpi.textContent = `${pct}%`;
    requestAnimationFrame(() => {
        fill.style.width = `${pct}%`;
        glow.style.left = `${pct}%`;
    });
}

function renderDashboardRecentPosts() {
    const wrap = document.getElementById('recentPosts');
    if (!wrap) return;

    const posts = JSON.parse(localStorage.getItem('joker_posts') || '[]');
    const items = posts.slice(0, 4);

    if (items.length === 0) {
        wrap.innerHTML = `
            <div class="row-item">
                <div class="left">
                    <div class="a">아직 게시글이 없어요 ✍️</div>
                    <div class="b">커뮤니티에서 첫 글을 작성해보세요</div>
                </div>
                <span class="pill good"><i class="fas fa-pen"></i> 시작</span>
            </div>
        `;
        return;
    }

    wrap.innerHTML = items.map(p => {
        const when = (p.date || '').toString();
        const cat = (p.category || '일반').toString();
        const views = Number(p.views || 0);
        return `
            <div class="row-item card-shimmer" onclick="location.href='post.html?id=${p.id}'" style="cursor:pointer;">
                <div class="left">
                    <div class="a">[${cat}] ${escapeHtml(p.title || '')}</div>
                    <div class="b">${escapeHtml(p.author || 'unknown')} • 조회 ${views.toLocaleString()} • ${escapeHtml(when)}</div>
                </div>
                <span class="pill warn"><i class="fas fa-comment"></i> 보기</span>
            </div>
        `;
    }).join('');
}

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// --- Utils ---
function initTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
}

function initNavigation() {
    // 모바일 햄버거 메뉴 토글
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            navLinks.classList.toggle('open');
        });

        // 메뉴 링크 클릭 시 닫기
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.classList.remove('active');
                navLinks.classList.remove('open');
    });
});
    }
}
