class NoticeManager {
    constructor() {
        this.currentPage = 1;
        this.noticesPerPage = 5;
        this.totalNotices = 0;
        this.notices = [];
        this.isAdmin = false;
        this.init();
    }

    init() {
        this.checkAdminStatus(); // 로그인 감지 후 관리자 확인
        this.loadNotices();
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
                        document.getElementById('adminWriteBtn').style.display = 'block';
                    }
                } catch (error) {
                    console.error("관리자 권한 확인 실패:", error);
                }
            }
        });
    }


    setupEventListeners() {
        document.getElementById('adminWriteBtn').addEventListener('click', () => {
            document.getElementById('writeNoticeModal').style.display = 'block';
        });

        document.getElementById('closeWriteModal').addEventListener('click', () => {
            document.getElementById('writeNoticeModal').style.display = 'none';
        });

        document.getElementById('cancelWrite').addEventListener('click', () => {
            document.getElementById('writeNoticeModal').style.display = 'none';
        });

        document.getElementById('noticeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitNotice();
        });

        document.getElementById('moreLink').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('moreModal').style.display = 'block';
        });

        document.getElementById('closeMoreModal').addEventListener('click', () => {
            document.getElementById('moreModal').style.display = 'none';
        });
    }

    async loadNotices() {
        const db = firebase.getFirestore();
        const noticesRef = firebase.collection(db, "notices");
        const q = firebase.query(noticesRef, firebase.orderBy("timestamp", "desc"));

        try {
            const querySnapshot = await firebase.getDocs(q);
            this.notices = [];
            querySnapshot.forEach(doc => {
                this.notices.push({ id: doc.id, ...doc.data() });
            });

            this.totalNotices = this.notices.length;
            this.renderNotices();
            this.renderPagination();
        } catch (error) {
            console.error("공지사항 불러오기 오류:", error);
            document.getElementById('noticeList').innerHTML = `<p style="color: red;">공지사항을 불러오는 중 오류가 발생했습니다.</p>`;
        }
    }

    renderNotices() {
        const noticeList = document.getElementById('noticeList');
        const startIndex = (this.currentPage - 1) * this.noticesPerPage;
        const endIndex = startIndex + this.noticesPerPage;
        const currentNotices = this.notices.slice(startIndex, endIndex);

        if (currentNotices.length === 0) {
            noticeList.innerHTML = `
                <div class="empty-notice">
                    <div class="empty-notice-icon">📋</div>
                    <div class="empty-notice-text">등록된 공지사항이 없습니다</div>
                    <div class="empty-notice-subtext">새로운 공지사항을 기다려주세요</div>
                </div>
            `;
            return;
        }

        noticeList.innerHTML = currentNotices.map(notice => `
            <div class="notice-item" onclick="openNoticeDetail('${notice.id}')">
                <div class="notice-item-header">
                    <h3 class="notice-item-title">${notice.title}</h3>
                    ${notice.isImportant ? '<span class="notice-badge">중요</span>' : ''}
                </div>
                <div class="notice-content-preview">
                    ${notice.content.length > 100 ? notice.content.substring(0, 100) + '...' : notice.content}
                </div>
                <div class="notice-meta">
                    <span class="notice-author">${notice.author || '관리자'}</span>
                    <span class="notice-date">${notice.date || ''}</span>
                </div>
            </div>
        `).join('');
    }

    renderPagination() {
        const totalPages = Math.ceil(this.totalNotices / this.noticesPerPage);
        const paginationContainer = document.getElementById('noticePagination');

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let html = `
            <button class="notice-pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="noticeManager.goToPage(${this.currentPage - 1})">
                이전
            </button>
        `;

        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="notice-page-number ${i === this.currentPage ? 'active' : ''}" onclick="noticeManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        html += `
            <button class="notice-pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="noticeManager.goToPage(${this.currentPage + 1})">
                다음
            </button>
            <span class="notice-pagination-info">
                ${this.currentPage} / ${totalPages} 페이지 (총 ${this.totalNotices}개)
            </span>
        `;

        paginationContainer.innerHTML = html;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.totalNotices / this.noticesPerPage);
        if (page < 1 || page > totalPages) return;
        this.currentPage = page;
        this.renderNotices();
        this.renderPagination();
        document.querySelector('.notice-container').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    async submitNotice() {
        const title = document.getElementById('noticeTitle').value.trim();
        const content = document.getElementById('noticeContent').value.trim();
        const isImportant = document.getElementById('isImportant').checked;

        if (!title || !content) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        try {
            const db = firebase.getFirestore();
            const auth = firebase.getAuth();
            const user = auth.currentUser;
            const author = user?.email || "관리자";

            await firebase.addDoc(firebase.collection(db, "notices"), {
                title,
                content,
                isImportant,
                author,
                date: new Date().toISOString().split('T')[0],
                timestamp: firebase.serverTimestamp()
            });

            document.getElementById('noticeForm').reset();
            document.getElementById('writeNoticeModal').style.display = 'none';

            await this.loadNotices();
        } catch (error) {
            console.error('공지사항 저장 오류:', error);
            alert('공지사항 등록 중 오류가 발생했습니다.');
        }
    }
}

// 공지사항 상세보기 (나중에 실제 구현 가능)
function openNoticeDetail(noticeId) {
    alert('상세보기 기능은 준비 중입니다.');
}

// 초기화
let noticeManager;
document.addEventListener('DOMContentLoaded', () => {
    noticeManager = new NoticeManager();
});
