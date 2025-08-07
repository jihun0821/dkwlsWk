class AdminController {
    constructor() {
        this.isAdmin = false;
        this.init();
    }

    init() {
        this.checkAdminStatus();
        this.setupEventListeners();
    }

    checkAdminStatus() {
        const auth = firebase.getAuth();
        firebase.onAuthStateChanged(auth, async (user) => {
            if (user) {
                const db = firebase.getFirestore();
                const adminDocRef = firebase.doc(db, "admins", user.email);
                try {
                    const adminDoc = await firebase.getDoc(adminDocRef);
                    this.isAdmin = adminDoc.exists();
                    if (this.isAdmin) {
                        document.getElementById('adminAddMatchBtn').style.display = 'block';
                    } else {
                        document.getElementById('adminAddMatchBtn').style.display = 'none';
                    }
                } catch (error) {
                    console.error("관리자 권한 확인 실패:", error);
                }
            } else {
                // 로그아웃 시 버튼 숨김
                document.getElementById('adminAddMatchBtn').style.display = 'none';
                this.isAdmin = false;
            }
        });
    }

    setupEventListeners() {
        document.getElementById('adminAddMatchBtn').addEventListener('click', () => {
            if (this.isAdmin) {
                this.handleAddMatch();
            }
        });
    }

    handleAddMatch() {
        // 경기 추가 기능 구현
        alert('경기 추가 기능을 구현해주세요!');
        console.log('관리자가 경기 추가 버튼을 클릭했습니다.');
        
        // 여기에 경기 추가 모달을 여는 코드나
        // 경기 추가 페이지로 이동하는 코드를 추가하세요
    }
}

// DOM이 로드되면 AdminController 초기화
document.addEventListener('DOMContentLoaded', () => {
    new AdminController();
});