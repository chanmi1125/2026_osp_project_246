# 이화픽 (EwhaPick)

2026 오픈소스SW플랫폼 팀 프로젝트 · 팀 246

이화여대 주변 가게의 **마감 할인·이화인 할인 상품**을 학생이 미리 예약하고 매장에서 픽업하는 서비스예요.
사장님은 남은 상품을 등록하고, 들어온 예약과 리뷰를 관리할 수 있어요.

## 테스트 계정

| 구분 | 아이디 | 비밀번호 | 이름 |
|---|---|---|---|
| 학생 | `ewha` | `abc123` | 김이화 |
| 사장님 | `cafe_ewha` | `abc123` | 카페 이화 |

- 학생으로 로그인하면 **상품 목록**, 사장님으로 로그인하면 **예약 관리** 화면으로 이동해요.
- 다른 계정으로 보려면 헤더의 **로그아웃**을 누른 뒤 다시 로그인하면 돼요.

## 주요 기능

### 학생
- **상품 목록**: 할인 유형(마감 할인 / 이화인 할인)과 카테고리(베이커리·도시락·카페·분식) 필터, 페이지 이동, 가게까지 거리 표시
- **상품 상세**: 가격·할인율·픽업 시간·남은 수량 확인, 수량 선택 후 예약
- **예약 완료**: 픽업 코드, 결제 금액, 픽업 장소 안내
- **리뷰**: 리뷰 목록(카테고리 필터·정렬), 리뷰 상세, 리뷰 작성(별점·사진 첨부)
- **마이페이지**: 예약 내역, 픽업 코드, 내가 쓴 후기

### 사장님
- **예약 관리**: 픽업 대기·완료·취소 필터, 픽업 코드 확인, 픽업 완료 처리
- **상품 등록**: 사진(최대 5장), 할인 유형, 카테고리, 가격·할인율, 픽업 시간, 수량 입력과 임시저장
- **받은 리뷰**: 평점 요약, 답글 작성
- **마이페이지**: 가게 정보, 판매·예약·후기 현황, 오늘 픽업 예정, 등록한 상품

### 공통
- 회원가입(학생 / 사장님), 아이디 중복 확인, 로그인·로그아웃
- 휴대폰부터 PC까지 폭에 맞춰 보이는 반응형 화면

## 화면 목록

| 화면 | 주소 | 파일 |
|---|---|---|
| 로그인 | `/login` | `pages/common/login/` |
| 회원가입 | `/signup` | `pages/common/signup/` |
| 상품 목록 | `/products` | `pages/student/product_list/` |
| 상품 상세 | `/products/<상품 이름>` | `pages/student/product_detail/` |
| 예약 완료 | `/reserve/done` | `pages/student/reserve_done/` |
| 리뷰 목록 | `/reviews` | `pages/student/review_list/` |
| 리뷰 상세 | `/reviews/<번호>` | `pages/student/review_detail/` |
| 리뷰 작성 | `/reviews/write` | `pages/student/review_write/` |
| 학생 마이페이지 | `/mypage` | `pages/student/mypage/` |
| 예약 관리 | `/owner/reservations` | `pages/owner/reservations/` |
| 상품 등록 | `/owner/products/new` | `pages/owner/product_register/` |
| 받은 리뷰 | `/owner/reviews` | `pages/owner/reviews/` |
| 사장님 마이페이지 | `/owner/mypage` | `pages/owner/mypage/` |

`/`로 들어오면 로그인 전에는 로그인 화면, 로그인 후에는 학생은 상품 목록·사장님은 예약 관리로 이동해요.

## 기술 스택
- **Frontend**: HTML, CSS, JavaScript (Jinja2 템플릿), Pretendard 폰트
- **Backend**: Python Flask
- **Database**: Firebase Realtime Database (pyrebase4)

## 실행 방법
```
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install flask pyrebase4
python app.py
```
브라우저에서 http://127.0.0.1:5000 접속

### Firebase 연결
- `authentication/firebase_auth.json` 파일이 있어야 실행돼요. 깃에는 안 올라가니 팀원한테 따로 받아서 넣어 주세요.
- 이 파일은 절대 깃에 올리면 안 돼요. (`.gitignore`에 `authentication/`이 들어 있어요)

## 폴더 구조
```
app.py                      # 페이지 주소(라우트)
database.py                 # Firebase 연결 (DBhandler)
authentication/             # firebase_auth.json (깃에 안 올림)
pages/
  core/                     # 공통
    base.html               # 모든 페이지 공통 뼈대
    header.html             # 이화픽 헤더
    drawer.html             # 메뉴 서랍
    menu_student.html       # 학생 메뉴
    menu_owner.html         # 사장님 메뉴
    common.css              # 색상 변수, 버튼, 카드 등 공통 스타일
    menu.js                 # 메뉴 열기/닫기
  images/                   # 상품·가게 이미지
  uploads/                  # 사장님이 등록한 상품 사진
  common/                   # 로그인 전: login, signup
  student/                  # product_list, product_detail, reserve_done, review_list, review_detail, review_write, mypage
  owner/                    # product_register, reservations, reviews, mypage
```
- 페이지마다 폴더 하나에 `이름.html / 이름.css / 이름.js`가 같이 있어요.
- 각 페이지는 `{% extends "core/base.html" %}` 후 `{% block content %}` 안만 채우면 돼요.
- css·js·이미지 경로는 `{{ url_for('static', filename='student/product_list/product_list.css') }}`처럼 `pages/` 기준으로 써요.
