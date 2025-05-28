// Supabase 클라이언트 생성 (디버깅 추가)
console.log('Supabase 라이브러리 확인:', window.supabase);

const supabase = window.supabase
  ? window.supabase.createClient(
      'https://vyafmobfqmudllqqtwsg.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YWZtb2JmcW11ZGxscXF0d3NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzOTc5MzQsImV4cCI6MjA2Mzk3MzkzNH0.MouQPiOy4cgWq81BBIMplBx2R5v9VGroZaZhvxQ0Uck'
    )
  : null;

console.log('Supabase 클라이언트 생성:', supabase);

// 이메일 도메인 검증
function isHanilEmail(email) {
  return email.endsWith('@hanilgo.cnehs.kr');
}

// 프로필 이미지 미리보기 기능
function setupProfileImagePreview() {
  const avatarInput = document.getElementById('avatar');
  const fileLabel = document.querySelector('.file-upload-label');
  const previewContainer = document.querySelector('.profile-preview');
  
  if (avatarInput) {
    avatarInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      
      if (file) {
        // 파일 크기 체크 (5MB 제한)
        if (file.size > 5 * 1024 * 1024) {
          alert('파일 크기가 너무 큽니다. 5MB 이하의 파일을 선택해주세요.');
          e.target.value = '';
          return;
        }
        
        // 파일 타입 체크
        if (!file.type.startsWith('image/')) {
          alert('이미지 파일만 업로드 가능합니다.');
          e.target.value = '';
          return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
          // 기존 미리보기 제거
          const existingPreview = previewContainer.querySelector('img');
          if (existingPreview) {
            existingPreview.remove();
          }
          
          // 새 미리보기 이미지 생성
          const img = document.createElement('img');
          img.src = e.target.result;
          img.alt = '프로필 미리보기';
          previewContainer.appendChild(img);
          
          // 파일 라벨 업데이트
          if (fileLabel) {
            fileLabel.textContent = `선택된 파일: ${file.name}`;
            fileLabel.classList.add('has-file');
          }
        };
        reader.readAsDataURL(file);
      } else {
        // 파일이 선택되지 않은 경우
        const existingPreview = previewContainer.querySelector('img');
        if (existingPreview) {
          existingPreview.remove();
        }
        
        if (fileLabel) {
          fileLabel.textContent = '프로필 사진 선택 (선택사항)';
          fileLabel.classList.remove('has-file');
        }
      }
    });
  }
}

// 파일을 Base64로 변환하는 함수
function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 프로필 모달을 표시하고 초기화하는 함수
function showProfileModal() {
  const authModal = document.getElementById('authModal');
  const profileModal = document.getElementById('profileModal');
  
  // 인증 모달 닫기
  if (authModal) {
    authModal.style.display = 'none';
  }
  
  // 프로필 모달 표시
  if (profileModal) {
    profileModal.style.display = 'flex';
    
    // 입력 필드 초기화
    const nicknameInput = document.getElementById('nickname');
    const avatarInput = document.getElementById('avatar');
    const fileLabel = document.querySelector('.file-upload-label');
    const previewContainer = document.querySelector('.profile-preview');
    
    if (nicknameInput) nicknameInput.value = '';
    if (avatarInput) avatarInput.value = '';
    
    if (fileLabel) {
      fileLabel.textContent = '프로필 사진 선택 (선택사항)';
      fileLabel.classList.remove('has-file');
    }
    
    // 기존 미리보기 제거
    if (previewContainer) {
      const existingPreview = previewContainer.querySelector('img');
      if (existingPreview) {
        existingPreview.remove();
      }
    }
  }
}

// 프로필 저장 처리 (업데이트된 버전)
async function saveProfile() {
  const nickname = document.getElementById('nickname').value.trim();
  const avatarFile = document.getElementById('avatar').files[0];
  
  if (!nickname) {
    alert('닉네임을 입력해주세요.');
    return;
  }
  
  // 닉네임 길이 체크
  if (nickname.length < 2 || nickname.length > 20) {
    alert('닉네임은 2자 이상 20자 이하로 입력해주세요.');
    return;
  }
  
  let avatarUrl = 'https://via.placeholder.com/80/444/fff?text=USER';
  
  // 파일이 있으면 Base64로 변환하여 저장
  if (avatarFile) {
    try {
      avatarUrl = await convertFileToBase64(avatarFile);
    } catch (error) {
      console.error('이미지 변환 오류:', error);
      alert('이미지 처리 중 오류가 발생했습니다.');
      return;
    }
  }

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  // 프로필 모달 닫기
  document.getElementById('profileModal').style.display = 'none';
  
  // 회원가입 진행
  await signUp(email, password, nickname, avatarUrl);
}

// 회원가입 처리
async function signUp(email, password, nickname, avatarUrl) {
  console.log('회원가입 시도:', { email, nickname });
  
  if (!supabase) {
    alert('Supabase 초기화 오류');
    return;
  }

  if (!isHanilEmail(email)) {
    alert('한일고 이메일(@hanilgo.cnehs.kr)만 가입할 수 있습니다.');
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      console.error('회원가입 오류:', error);
      alert('회원가입 실패: ' + error.message);
      return;
    }

    console.log('회원가입 성공:', data);
    const user = data.user;
    
    // 프로필 생성
    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      email: email,
      nickname: nickname,
      avatar_url: avatarUrl
    });

    if (profileError) {
      console.error('프로필 생성 오류:', profileError);
    }

    alert('회원가입 성공! 이메일 인증 후 로그인하세요.');
  } catch (err) {
    console.error('회원가입 처리 중 오류:', err);
    alert('회원가입 처리 중 오류가 발생했습니다.');
  }
}

// 로그인 처리
async function login(email, password) {
  console.log('로그인 시도:', email);
  
  if (!supabase) {
    alert('Supabase 초기화 오류');
    return;
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('로그인 오류:', error);
      alert('로그인 실패: ' + error.message);
      return;
    }

    console.log('로그인 성공:', data);
    alert('로그인 성공');
    showUserProfile();
  } catch (err) {
    console.error('로그인 처리 중 오류:', err);
    alert('로그인 처리 중 오류가 발생했습니다.');
  }
}

// 프로필 표시
async function showUserProfile() {
  console.log('프로필 표시 시도');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('사용자 정보 없음');
      return;
    }

    console.log('현재 사용자:', user);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('프로필 불러오기 실패:', error);
      return;
    }

    console.log('프로필 데이터:', data);

    document.getElementById('authModal').style.display = 'none';

    document.getElementById('profile-box').innerHTML = `
      <img src="${data?.avatar_url || 'https://via.placeholder.com/40'}" alt="avatar" width="40" height="40" style="border-radius:50%">
      <span>${data?.nickname || '사용자'}</span>
      <button onclick="logout()">로그아웃</button>
    `;

    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'inline-block';
  } catch (err) {
    console.error('프로필 표시 중 오류:', err);
  }
}

// 로그아웃
async function logout() {
  console.log('로그아웃 시도');
  try {
    await supabase.auth.signOut();
    location.reload();
  } catch (err) {
    console.error('로그아웃 오류:', err);
  }
}

// 초기화: 로그인 유지 & 이벤트 바인딩
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM 로드 완료, 이벤트 바인딩 시작');
  
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const authModal = document.getElementById('authModal');
  const closeAuthModal = document.getElementById('closeAuthModal');
  const profileModal = document.getElementById('profileModal');
  const closeProfileModal = document.getElementById('closeProfileModal');
  const saveProfileBtn = document.getElementById('saveProfileBtn');

  const doLoginBtn = document.getElementById('doLogin');
  const doSignUpBtn = document.getElementById('doSignUp');

  console.log('요소 확인:', { loginBtn, doLoginBtn, doSignUpBtn });

  // 프로필 이미지 미리보기 설정
  setupProfileImagePreview();

  // 로그인 버튼 클릭 시 모달 표시
  if (loginBtn) {
    loginBtn.onclick = () => {
      console.log('로그인 버튼 클릭');
      authModal.style.display = 'flex';
    };
  }

  // 로그아웃
  if (logoutBtn) {
    logoutBtn.onclick = logout;
  }

  // 모달 닫기
  if (closeAuthModal) {
    closeAuthModal.onclick = () => {
      authModal.style.display = 'none';
    };
  }

  if (closeProfileModal) {
    closeProfileModal.onclick = () => {
      profileModal.style.display = 'none';
    };
  }

  // 프로필 저장
  if (saveProfileBtn) {
    saveProfileBtn.onclick = saveProfile;
  }

  // 로그인 실행
  if (doLoginBtn) {
    doLoginBtn.onclick = () => {
      console.log('로그인 버튼 클릭됨');
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      console.log('입력값 확인:', { email: email, passwordLength: password.length });
      
      if (!email || !password) {
        alert('이메일과 비밀번호를 입력해주세요.');
        return;
      }
      
      login(email, password);
    };
  } else {
    console.error('doLogin 버튼을 찾을 수 없습니다');
  }

  // 회원가입 실행 - 프로필 모달 표시
  if (doSignUpBtn) {
    doSignUpBtn.onclick = () => {
      console.log('회원가입 버튼 클릭됨');
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      if (!email || !password) {
        alert('이메일과 비밀번호를 입력해주세요.');
        return;
      }
      
      // 프로필 설정 모달 표시
      showProfileModal();
    };
  } else {
    console.error('doSignUp 버튼을 찾을 수 없습니다');
  }

  // 바깥 클릭 시 모달 닫기
  window.onclick = (e) => {
    if (e.target === authModal) {
      authModal.style.display = 'none';
    }
    if (e.target === profileModal) {
      profileModal.style.display = 'none';
    }
  };

  // 자동 로그인 유지
  if (supabase) {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('세션 확인:', session);
      if (session) {
        showUserProfile();
      }
    });
  }
});
