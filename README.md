## MongoDB

1. mongo db 설치

   - [macos 참고](https://choboit.tistory.com/95)

2. mongo DB 실행

- 실행 `brew services start mongodb-community@5.0`
- [참고] 중지 `brew services stop mongodb-community@5.0`

3. database 생성
   `use royal-flash`

   - database 목록 확인 : `show dbs`
   - 현재 사용중인 database 확인 : `db`
   - 컬렉션 목록 확인 : `show collections`

## 서버 실행

1. `npm i`
2. `npm run dev`
