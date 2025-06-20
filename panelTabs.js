// panelTabs.js - 라인업/채팅 패널 탭 및 채팅 기능 (파이어베이스 Firestore에 실제 저장/불러오기 구현)
// 기존 script.js, auth.js 등과 충돌 없이 안전하게 동작하도록 변수/전역 네임스페이스 분리
// 실제 Firebase Firestore 채팅 연동 (로컬이 아닌 실제 배포환경 기준)

(function () {
  // 내부 네임스페이스로 변수 충돌 방지
  const PanelTabs = {};

  // HTML 이스케이프
  function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/[&<>"'`]/g, s => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
      "`": "&#96;"
    }[s]));
  }

  // 라인업 렌더링
  function renderLineup(match) {
    function players(list) {
      if (!list || list.length === 0) {
        return `<div class="players-container"><span class="no-players">선수 정보 없음</span></div>`;
      }
      return `<div class="players-container">${list.map((name) =>
        `<div class="player">${escapeHtml(name)}</div>`
      ).join("")}</div>`;
    }
    function sideBlock(side, data) {
      return `
        <div class="lineup-team lineup-${side}">
          <div class="lineup-group">
            <span class="position-label">3학년</span>
            ${players(data?.third || [])}
          </div>
          <div class="lineup-group">
            <span class="position-label">2학년</span>
            ${players(data?.second || [])}
          </div>
          <div class="lineup-group">
            <span class="position-label">1학년</span>
            ${players(data?.first || [])}
          </div>
        </div>
      `;
    }
    if (!match?.lineups) {
      return `
        <div class="lineup-field">
          <div class="lineup-bg"></div>
          <div class="lineup-sides">
            <div class="lineup-team lineup-home">
              <p style="text-align: center; color: #a0aec0; padding: 20px;">홈팀 라인업 정보가 없습니다.</p>
            </div>
            <div class="vs-label">VS</div>
            <div class="lineup-team lineup-away">
              <p style="text-align: center; color: #a0aec0; padding: 20px;">원정팀 라인업 정보가 없습니다.</p>
            </div>
          </div>
        </div>
      `;
    }
    return `
      <div class="lineup-field">
        <div class="lineup-bg"></div>
        <div class="lineup-sides">
          ${sideBlock("home", match.lineups.home)}
          <div class="vs-label">VS</div>
          ${sideBlock("away", match.lineups.away)}
        </div>
      </div>
    `;
  }

  // 채팅 박스 렌더링
  function renderChatBox(matchId) {
    return `
      <div class="chat-messages" id="chatMessages">
        <p style="text-align: center; color: #aaa; font-size: 14px;">채팅을 불러오는 중...</p>
      </div>
      <form class="chat-form" id="chatForm" autocomplete="off" onsubmit="return false;">
        <input type="text" id="chatInput" autocomplete="off" maxlength="120" placeholder="메시지를 입력하세요" />
        <button type="submit" id="sendChatBtn">전송</button>
      </form>
      <div class="chat-login-notice" style="display:none;">
        <button class="login-btn" type="button">로그인 후 채팅하기</button>
      </div>
    `;
  }

  // Firestore 채팅 컬렉션 경로
  function chatCollection(matchId) {
    if (!window.firebase || !window.db) return null;
    // v9 modular API (firebase 9+)
    return window.firebase.collection(window.db, 'match_chats', matchId, 'messages');
  }

  // 패널 탭 UI
  PanelTabs.renderPanelTabs = function (matchDetails, matchId) {
    return `
      <div class="tab-container">
        <div class="tabs">
          <div class="tab active" data-tab="lineup">라인업</div>
          <div class="tab" data-tab="chat">채팅</div>
        </div>
        <div class="tab-contents">
          <div class="tab-content lineup-content active">
            ${renderLineup(matchDetails)}
          </div>
          <div class="tab-content chat-content">
            ${renderChatBox(matchId)}
          </div>
        </div>
      </div>
    `;
  };

  // 패널 탭 동작
  PanelTabs.setupPanelTabs = function (matchId) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    if (!tabs.length || !contents.length) return;

    tabs.forEach((tab, index) => {
      tab.onclick = (e) => {
        e.preventDefault();
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        if (contents[index]) {
          contents[index].classList.add('active');
        }
        // 채팅 탭이면 초기화
        if (tab.dataset.tab === "chat") {
          setTimeout(() => {
            PanelTabs.setupChat(matchId);
          }, 60);
        }
      };
    });
    // 기본 활성화
    tabs[0].classList.add('active');
    contents[0].classList.add('active');
  };

  // 채팅 기능
  PanelTabs.setupChat = function (matchId) {
    const chatBox = document.getElementById('chatMessages');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const loginNotice = document.querySelector('.chat-login-notice');
    if (!chatBox || !chatForm || !chatInput) return;

    chatBox.innerHTML = "";
    // 로그인 체크 (auth는 전역, window.auth)
    if (!window.auth?.currentUser) {
      if (loginNotice) loginNotice.style.display = "block";
      chatForm.style.display = "none";
      chatBox.innerHTML = "<p style='text-align:center;color:#aaa;padding:20px;'>로그인 후 채팅을 이용할 수 있습니다.</p>";
      // 로그인 버튼 이벤트 (중복 바인딩 방지)
      loginNotice.querySelector('.login-btn').onclick = function () {
        if (typeof showLoginModal === 'function') {
          showLoginModal();
        } else {
          const modal = document.getElementById('authModal');
          if (modal) modal.style.display = 'flex';
        }
      };
      return;
    } else {
      if (loginNotice) loginNotice.style.display = "none";
      chatForm.style.display = "flex";
    }

    if (!window.firebase || !window.db) {
      chatBox.innerHTML = "<p style='text-align:center;color:#f56565;padding:20px;'>채팅 서비스를 불러올 수 없습니다.</p>";
      return;
    }
    // 기존 리스너 해제
    if (window.panelTabsChatUnsubscribe) window.panelTabsChatUnsubscribe();

    try {
      // Firestore 쿼리: matchId 기준, 시간순 정렬
      const chatQuery = window.firebase.query(
        chatCollection(matchId),
        window.firebase.where('matchId', '==', matchId),
        window.firebase.orderBy('time', 'asc')
      );
      window.panelTabsChatUnsubscribe = window.firebase.onSnapshot(
        chatQuery,
        (snapshot) => {
          let html = '';
          if (snapshot.empty) {
            html = "<p style='text-align:center;color:#aaa;padding:20px;'>아직 채팅 메시지가 없습니다.</p>";
          } else {
            snapshot.forEach(doc => {
              const msg = doc.data();
              if (msg && msg.text && msg.nickname) {
                const isMe = msg.uid === window.auth.currentUser.uid;
                const timeStr = msg.time ?
                  (msg.time.seconds ?
                    new Date(msg.time.seconds * 1000).toLocaleTimeString('ko-KR', {
                      hour: '2-digit', minute: '2-digit'
                    }) :
                    new Date(msg.time).toLocaleTimeString('ko-KR', {
                      hour: '2-digit', minute: '2-digit'
                    })
                  ) : '';
                html += `
                  <div class="chat-msg${isMe ? " me" : ""}">
                    <span class="chat-nick">${escapeHtml(msg.nickname)}</span>
                    <span class="chat-text">${escapeHtml(msg.text)}</span>
                    <span class="chat-time">${timeStr}</span>
                  </div>
                `;
              }
            });
          }
          chatBox.innerHTML = html;
          setTimeout(() => { chatBox.scrollTop = chatBox.scrollHeight; }, 50);
        },
        (error) => {
          chatBox.innerHTML = "<p style='text-align:center;color:#f56565;padding:20px;'>채팅을 불러오는 중 오류가 발생했습니다.</p>";
        }
      );
    } catch (error) {
      chatBox.innerHTML = "<p style='text-align:center;color:#f56565;padding:20px;'>채팅 기능을 초기화할 수 없습니다.</p>";
    }

    chatForm.onsubmit = async (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      const user = window.auth.currentUser;
      if (!user) {
        alert('로그인이 필요합니다.');
        return;
      }
      const sendBtn = document.getElementById('sendChatBtn');
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = '전송중...';
      }
      try {
        // Firestore에서 닉네임 가져오기 (없으면 이메일 앞부분)
        let nickname = user.email.split('@')[0];
        try {
          const profileSnap = await window.firebase.getDoc(
            window.firebase.doc(window.db, 'profiles', user.uid)
          );
          if (profileSnap.exists()) nickname = profileSnap.data().nickname || nickname;
        } catch {}
        // 메시지 저장 (서버타임)
        const messageId = `${Date.now()}_${user.uid}_${Math.random().toString(36).substr(2, 9)}`;
        await window.firebase.setDoc(
          window.firebase.doc(chatCollection(matchId), messageId),
          {
            matchId: matchId,
            uid: user.uid,
            nickname: nickname,
            text: text,
            time: window.firebase.serverTimestamp ? window.firebase.serverTimestamp() : new Date()
          }
        );
        chatInput.value = "";
        setTimeout(() => { chatBox.scrollTop = chatBox.scrollHeight; }, 100);
      } catch (err) {
        alert('메시지 전송 중 오류가 발생했습니다. 다시 시도해주세요.');
      } finally {
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.textContent = '전송';
        }
      }
    };
    chatInput.focus();
  };

  // 사용 예시: 상세정보 패널에 삽입
  PanelTabs.displayMatchDetails = function (matchDetails, matchId) {
    const container = document.getElementById('match-details-container');
    if (container) {
      container.innerHTML = PanelTabs.renderPanelTabs(matchDetails, matchId);
      PanelTabs.setupPanelTabs(matchId);
    }
  };

  // 전역 해제 방지: beforeunload 시 리스너 해제
  window.addEventListener('beforeunload', () => {
    if (window.panelTabsChatUnsubscribe) window.panelTabsChatUnsubscribe();
  });

  // 전역 등록 (window.PanelTabs.*)
  window.PanelTabs = PanelTabs;
  // 기존 이름 호환
  window.renderPanelTabs = PanelTabs.renderPanelTabs;
  window.setupPanelTabs = PanelTabs.setupPanelTabs;
  window.setupChat = PanelTabs.setupChat;
  window.displayMatchDetails = PanelTabs.displayMatchDetails;
})();