// 팀 정보 미리 세팅 (예시)
const teams = [
  { teamName: "울산", group: "A", played: 3, points: 7 },
  { teamName: "포항", group: "A", played: 3, points: 6 },
  { teamName: "전북", group: "A", played: 3, points: 4 },
  { teamName: "인천", group: "B", played: 3, points: 9 },
  { teamName: "서울", group: "B", played: 3, points: 3 },
  { teamName: "수원", group: "B", played: 3, points: 1 },
  // 필요시 추가
  { teamName: "광주", group: "C", played: 2, points: 6 },
  { teamName: "대전", group: "C", played: 2, points: 4 },
  { teamName: "청주", group: "C", played: 2, points: 2 },
  { teamName: "경남", group: "D", played: 2, points: 6 },
  { teamName: "부산", group: "D", played: 2, points: 3 },
  { teamName: "창원", group: "D", played: 2, points: 0 }
];

// 그룹별로 표에 렌더링
function renderGroupTable(group) {
  const groupTeams = teams.filter(team => team.group === group);
  // 승점, 경기수 기준 정렬
  groupTeams.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.played - a.played;
  });

  const tbody = document.querySelector(`#groupTable${group} tbody`);
  tbody.innerHTML = '';
  groupTeams.forEach((team, idx) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${idx + 1}</td>
      <td>${team.teamName}</td>
      <td>${team.played}</td>
      <td>${team.points}</td>
    `;
    tbody.appendChild(row);
  });
}

// 각 그룹 표 렌더링
['A', 'B', 'C', 'D'].forEach(renderGroupTable);