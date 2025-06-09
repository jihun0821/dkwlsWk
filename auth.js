// Supabase 클라이언트 생성 (디버깅 추가)
console.log('Supabase 라이브러리 확인:', window.supabase);
const supabase = window.supabase
  ? window.supabase.createClient(
      'https://ckwfolmletqxtuzinixg.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrd2ZvbG1sZXRxeHR1emluaXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTE4NjksImV4cCI6MjA2NTAyNzg2OX0.e9QxIpu_HHMwcixZa1wexB8_Ec04qI6Ez8yv4i97A_Q'
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

// Supabase Storage에 이미지 업로드하는 함수
async function uploadAvatarToStorage(file, userId) {
  if (!file || !userId) return null;

  try {
    // 파일 확장자 추출
    const fileExt = file.name.split('.').pop().toLowerCase();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    
    console.log('파일 업로드 시작:', fileName);

    // Supabase Storage에 파일 업로드
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage 업로드 오류:', error);
      throw error;
    }

    console.log('Storage 업로드 성공:', data);

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    console.log('생성된 공개 URL:', publicUrl);
    return publicUrl;

  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    throw error;
  }
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

// 수정된 saveProfile 함수 (일부)
async function saveProfile() {
  const nickname = document.getElementById('nickname').value.trim();
  const avatarFile = document.getElementById('avatar').files[0];
  const saveBtn = document.getElementById('saveProfileBtn');
  
  if (!nickname) {
    alert('닉네임을 입력해주세요.');
    return;
  }
  
  // 닉네임 길이 체크
  if (nickname.length < 2 || nickname.length > 20) {
    alert('닉네임은 2자 이상 20자 이하로 입력해주세요.');
    return;
  }

  // 버튼 비활성화 및 로딩 표시
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = '저장 중...';
  }

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  let avatarUrl = 'https://via.placeholder.com/80/444/fff?text=USER';
  
  try {
    console.log('회원가입 시도:', { email, nickname });

    if (!supabase) {
      throw new Error('Supabase 초기화 오류');
    }

    if (!isHanilEmail(email)) {
      throw new Error('한일고 이메일(@hanilgo.cnehs.kr)만 가입할 수 있습니다.');
    }

const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    user_metadata: {
      nickname: nickname,
      avatar_url: avatarUrl
    }
  }
});

    if (error) {
      throw new Error('회원가입 실패: ' + error.message);
    }

    console.log('회원가입 성공:', data);

    // 안전하게 user 정보 가져오기
    const user = data?.user ?? data?.session?.user;

    if (!user) {
      throw new Error('사용자 정보를 불러올 수 없습니다.');
    }

    // 파일이 있으면 Supabase Storage에 업로드
    if (avatarFile) {
      console.log('이미지 업로드 시작...');
      avatarUrl = await uploadAvatarToStorage(avatarFile, user.id);
      console.log('이미지 업로드 완료:', avatarUrl);
      
      // 🔥 업로드된 이미지 URL로 사용자 메타데이터 업데이트
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl }
      });
      
      if (updateError) {
        console.warn('메타데이터 업데이트 실패:', updateError);
      }
    }

    // profiles 테이블에도 저장 (선택사항)
    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      email: email,
      nickname: nickname,
      avatar_url: avatarUrl
    });

    if (profileError) {
      console.error('프로필 생성 오류:', profileError.message);
      // profiles 테이블 저장 실패해도 회원가입은 성공
      console.warn('회원가입은 완료되었지만 프로필 테이블 저장에 실패했습니다.');
    }

    // 프로필 모달 닫기
    document.getElementById('profileModal').style.display = 'none';
    
    alert('회원가입 성공! 이메일 인증 후 로그인하세요.');
    
    // 프로필 UI 업데이트
    showUserProfile();

  } catch (error) {
    console.error('프로필 저장 중 오류:', error);
    alert(error.message || '프로필 저장 중 오류가 발생했습니다.');
  } finally {
    // 버튼 다시 활성화
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = '저장하고 가입';
    }
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
    
    // 모달 닫기
    document.getElementById('authModal').style.display = 'none';
    
    // 프로필 표시
    showUserProfile();
    
  } catch (err) {
    console.error('로그인 처리 중 오류:', err);
    alert('로그인 처리 중 오류가 발생했습니다.');
  }
}

// UI 업데이트 함수 - 로그인/로그아웃 버튼과 프로필 박스 관리
function updateUIForAuthState(isLoggedIn, profileData = null) {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const profileBox = document.getElementById('profile-box');
  
  if (isLoggedIn && profileData) {
    // 로그인 상태: 로그인 버튼 숨기고 프로필 박스 표시
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    
    if (profileBox) {
      // 이미지 로딩 에러 처리를 위한 기본 이미지
      const defaultAvatar = 'https://via.placeholder.com/40/444/fff?text=USER';
      const avatarUrl = profileData.avatar_url || defaultAvatar;
      
      profileBox.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 20px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);">
          <img src="${avatarUrl}" 
               alt="프로필" 
               style="width: 35px; height: 35px; border-radius: 50%; border: 2px solid #fff; object-fit: cover;"
               onerror="this.src='${defaultAvatar}'">
          <span style="color: white; font-weight: bold; font-size: 14px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${profileData.nickname || '사용자'}</span>
          <button onclick="logout()" 
                  style="background: linear-gradient(135deg, #ff4757, #ff3742); color: white; border: none; padding: 6px 12px; border-radius: 12px; font-size: 12px; cursor: pointer; font-weight: bold; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(255,71,87,0.3);">
            로그아웃
          </button>
        </div>
      `;
    }
  } else {
    // 로그아웃 상태: 로그인 버튼 표시하고 프로필 박스 숨기기
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (profileBox) profileBox.innerHTML = '';
  }
}

// 프로필 표시 (수정된 버전)
async function showUserProfile() {
  console.log('프로필 표시 시도');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('사용자 정보 없음');
      updateUIForAuthState(false);
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
      // 프로필이 없는 경우 기본 프로필로 UI 업데이트
      updateUIForAuthState(true, {
        nickname: user.email.split('@')[0],
        avatar_url: 'https://via.placeholder.com/40/444/fff?text=USER'
      });
      return;
    }

    console.log('프로필 데이터:', data);

    // 모든 모달 닫기
    const authModal = document.getElementById('authModal');
    const profileModal = document.getElementById('profileModal');
    if (authModal) authModal.style.display = 'none';
    if (profileModal) profileModal.style.display = 'none';

    // UI 업데이트
    updateUIForAuthState(true, data);
    
  } catch (err) {
    console.error('프로필 표시 중 오류:', err);
    updateUIForAuthState(false);
  }
}

// 로그아웃
async function logout() {
  console.log('로그아웃 시도');
  try {
    await supabase.auth.signOut();
    
    // UI 업데이트
    updateUIForAuthState(false);
    
    alert('로그아웃되었습니다.');
  } catch (err) {
    console.error('로그아웃 오류:', err);
    alert('로그아웃 중 오류가 발생했습니다.');
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

  // 자동 로그인 유지 - 페이지 로드 시 세션 확인
  if (supabase) {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('세션 확인:', session);
      if (session) {
        showUserProfile();
      } else {
        updateUIForAuthState(false);
      }
    });
  }
});
