# 서버 (코드닉네임: 익명A/B/… + 대댓글 + 수정 + 관리자 삭제/식별)
- `nickmap` 테이블로 `author_id` → `익명A/B/C…` 매핑 (추가 순서대로 A→Z→AA…)
- 일반 사용자에게는 **코드닉만 노출**, 관리자는 요청에 `X-Admin-Key`가 유효하면 `author` 정보 추가 노출
- 글/댓글은 **작성자만 수정 가능**, **삭제는 관리자만**

## 실행
```bash
npm install
export PORT=8080
export ADMIN_KEY='관리자삭제키'   # 관리자 기능 필수
# 선택
export ACCESS_CODE=''
export ALLOW_DISCORD_IDS=''
npm start
```
