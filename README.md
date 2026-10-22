# 2026_osp_project_246

2026 오픈소스SW플랫폼 팀 프로젝트 (팀 246)

## 실행 방법
```
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install flask
python app.py
```
브라우저에서 http://127.0.0.1:5000 접속

## 폴더 구조
```
app.py                      # 페이지 주소(라우트)
pages/
  core/                     # 공통 (담당: 박찬미)
    base.html               # 모든 페이지 공통 뼈대
    header.html             # 이화픽 헤더
    menu_student.html       # 학생 메뉴
    menu_owner.html         # 사장님 메뉴
    common.css              # 색상 변수, 버튼, 카드 등 공통 스타일
    menu.js                 # 메뉴 열기/닫기
  images/                   # 상품·가게 이미지
  common/                   # 로그인 전: login, signup
  student/                  # product_list, product_detail, reserve_done, review_list, review_detail, review_write, mypage
  owner/                    # product_register, reservations, reviews, mypage
```
- 페이지마다 폴더 하나에 `이름.html / 이름.css / 이름.js`가 같이 있어요.
- 각 페이지는 `{% extends "core/base.html" %}` 후 `{% block content %}` 안만 채우면 돼요.
- css·js·이미지 경로는 `{{ url_for('static', filename='student/product_list/product_list.css') }}`처럼 `pages/` 기준으로 써요.
