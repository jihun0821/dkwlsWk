// ✅ Supabase 클라이언트 초기화
const supabase = window.supabase
  ? window.supabase.createClient(
      'https://ckwfolmletqxtuzinixg.supabase.co', // ← 수정 필요
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrd2ZvbG1sZXRxeHR1emluaXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTE4NjksImV4cCI6MjA2NTAyNzg2OX0.e9QxIpu_HHMwcixZa1wexB8_Ec04qI6Ez8yv4i97A_Q' // ← 수정 필요
    )
  : null;

// ✅ 로그인
async function login(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    document.getElementById('authModal').style.display = 'none';
    showUserProfile();
  } catch (err) {
    console.error('로그인 오류:', err);
    alert('로그인 실패: ' + err.message);
  }
}

// ✅ 회원가입: 인증 없이 즉시 가입 + nickname 자동 설정
async function signup(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    const user = data.user ?? data.session?.user;
    if (!user) throw new Error("사용자 정보가 없습니다.");

    const nickname = email.split('@')[0];
    const avatar_url = null;

    await supabase.from('profiles').insert({
      id: user.id,
      email,
      nickname,
      avatar_url
    });

    document.getElementById('authModal').style.display = 'none';
    showUserProfile();
  } catch (err) {
    console.error('회원가입 실패:', err);
    alert(err.message || '회원가입 오류 발생');
  }
}

// ✅ 프로필 표시 (사진 누르면 설정 모달 띄우기)
async function showUserProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return updateUIForAuthState(false);

    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (error) throw error;

    updateUIForAuthState(true, data);
  } catch (err) {
    console.error('프로필 불러오기 실패:', err);
    updateUIForAuthState(false);
  }
}

// ✅ 프로필 업데이트 (설정용)
async function updateProfile() {
  const nickname = document.getElementById('nickname').value.trim();
  const avatarFile = document.getElementById('avatar').files[0];

  if (!nickname) return alert('닉네임을 입력해주세요.');

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('사용자 정보를 불러올 수 없습니다.');

    let avatar_url = null;

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      avatar_url = publicUrlData.publicUrl;

      // auth 메타데이터에도 업데이트
      await supabase.auth.updateUser({ data: { avatar_url } });
    }

    const { error } = await supabase.from('profiles').update({ nickname, avatar_url }).eq('id', user.id);
    if (error) throw error;

    document.getElementById('profileModal').style.display = 'none';
    showUserProfile();
    alert('프로필이 업데이트되었습니다.');
  } catch (err) {
    console.error('프로필 업데이트 실패:', err);
    alert('프로필 수정 중 오류 발생: ' + err.message);
  }
}

// ✅ UI 상태 업데이트 (프로필 클릭 시 설정 모달)
function updateUIForAuthState(isLoggedIn, profileData = null) {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const profileBox = document.getElementById('profile-box');

  if (isLoggedIn && profileData) {
    const avatarUrl = profileData.avatar_url || 'https://via.placeholder.com/40/444/fff?text=USER';
    const nickname = profileData.nickname || '사용자';

    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';

    profileBox.innerHTML = `
      <div onclick="showProfileModal()" style="cursor: pointer; display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 20px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);">
        <img src="${avatarUrl}" alt="프로필" style="width: 35px; height: 35px; border-radius: 50%; border: 2px solid #fff; object-fit: cover;">
        <span style="color: white; font-weight: bold; font-size: 14px;">${nickname}</span>
      </div>
    `;
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (profileBox) profileBox.innerHTML = '';
  }
}

// ✅ 로그아웃
async function logout() {
  await supabase.auth.signOut();
  updateUIForAuthState(false);
  alert('로그아웃되었습니다.');
}

// ✅ DOM 초기 바인딩
window.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const doLoginBtn = document.getElementById('doLogin');
  const doSignUpBtn = document.getElementById('doSignUp');
  const saveProfileBtn = document.getElementById('saveProfileBtn');

  loginBtn.onclick = () => document.getElementById('authModal').style.display = 'flex';
  logoutBtn.onclick = logout;
  if (saveProfileBtn) saveProfileBtn.onclick = updateProfile;

  doLoginBtn.onclick = () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if (!email || !password) return alert('이메일과 비밀번호를 입력하세요.');
    login(email, password);
  };

  doSignUpBtn.onclick = () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if (!email || !password) return alert('이메일과 비밀번호를 입력하세요.');
    signup(email, password);
  };

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) showUserProfile();
    else updateUIForAuthState(false);
  });
});
