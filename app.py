import hashlib
import hmac
import os
import secrets
from datetime import timedelta

from flask import Flask, render_template, redirect, url_for, request, flash, jsonify, session

from database import DBhandler
from werkzeug.utils import secure_filename
from pathlib import Path
from uuid import uuid4

app = Flask(__name__, template_folder="pages", static_folder="pages", static_url_path="/pages")
app.config.update(
    SECRET_KEY=os.environ.get("SECRET_KEY") or secrets.token_hex(32),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    PERMANENT_SESSION_LIFETIME=timedelta(days=7),
)

DB = DBhandler()


def csrf_token():
    """로그인/로그아웃 폼이 이 브라우저에서 생성됐는지 확인할 토큰."""
    if "_csrf_token" not in session:
        session["_csrf_token"] = secrets.token_hex(32)
    return session["_csrf_token"]


def valid_csrf_token():
    saved = session.get("_csrf_token")
    submitted = request.form.get("_csrf_token", "")
    return isinstance(saved, str) and hmac.compare_digest(
        saved.encode("utf-8"), submitted.encode("utf-8")
    )


def home_endpoint():
    if session.get("id") and session.get("user_type") == "owner":
        return "owner_reservations"
    return "product_list"


@app.context_processor
def auth_context():
    # 페이지의 role 값과 무관하게 로그인한 회원 유형에 맞는 메뉴를 표시.
    auth_role = session.get("user_type") if session.get("id") else None
    return {"auth_role": auth_role, "csrf_token": csrf_token}


@app.after_request
def prevent_auth_page_cache(response):
    if session.get("id") or request.endpoint in {"login", "login_confirm", "logout"}:
        response.headers["Cache-Control"] = "no-store"
    return response


# role: 헤더/메뉴 종류를 정함 (None = 로그인 전, "student" = 학생, "owner" = 사장님)

# ---------- 공통 ----------
@app.route("/")
def index():
    return redirect(url_for(home_endpoint()))


@app.route("/login")
def login():
    if session.get("id"):
        return redirect(url_for(home_endpoint()))
    return render_template("common/login/login.html", role=None)


@app.route("/login_confirm", methods=["POST"])
def login_confirm():
    if not valid_csrf_token():
        flash("로그인 화면이 만료됐습니다. 다시 시도해 주세요.", "error")
        return redirect(url_for("login"))

    if session.get("id"):
        return redirect(url_for(home_endpoint()))

    user_id = request.form.get("user_id", "").strip()
    password = request.form.get("password", "")
    if not user_id or not password:
        flash("아이디와 비밀번호를 모두 입력해 주세요.", "error")
        return redirect(url_for("login"))

    # 기존 회원가입과 동일한 SHA-256 방식으로 비교.
    pw_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()
    try:
        user = DB.authenticate_user(user_id, pw_hash)
    except Exception as error:
        # 라이브러리 예외 내용에는 연결 정보가 포함될 수 있어 종류만 기록.
        app.logger.error("Firebase 로그인 조회 실패 (%s)", type(error).__name__)
        flash("서버에 연결할 수 없습니다. 잠시 후 다시 로그인해 주세요.", "error")
        return redirect(url_for("login"))

    if user is None:
        flash("아이디 또는 비밀번호가 올바르지 않습니다.", "error")
        return redirect(url_for("login"))

    session.clear()
    session["id"] = user["id"]
    session["user_type"] = user["user_type"]
    session.permanent = request.form.get("remember") == "on"
    return redirect(url_for(home_endpoint()))


@app.route("/logout", methods=["POST"])
def logout():
    if not valid_csrf_token():
        return "잘못된 로그아웃 요청입니다. 페이지를 새로고침해 주세요.", 400
    session.clear()
    return redirect(url_for("index"))


@app.route("/signup")
def signup():
    return render_template("common/signup/signup.html", role=None)


@app.route("/signup_post", methods=["POST"])
def signup_post():
    data = request.form
    pw_hash = hashlib.sha256(data["password"].encode("utf-8")).hexdigest()   # 비밀번호는 해시로 저장
    if DB.insert_user(data, pw_hash):
        return redirect(url_for("login"))
    flash("이미 있는 아이디예요")
    return redirect(url_for("signup"))


@app.route("/check-id")
def check_id():
    """회원가입 화면의 '중복 확인' 버튼이 부르는 주소"""
    user_id = request.args.get("user_id", "").strip()
    return jsonify(available=DB.user_duplicate_check(user_id))


# ---------- 학생 ----------
@app.route("/products")
def product_list():
    return render_template("student/product_list/product_list.html", role="student")


@app.route("/products/<int:product_id>")
def product_detail(product_id):
    return render_template("student/product_detail/product_detail.html", role="student", product_id=product_id)


@app.route("/reserve/done")
def reserve_done():
    return render_template("student/reserve_done/reserve_done.html", role="student")


@app.route("/reviews")
def review_list():
    return render_template("student/review_list/review_list.html", role="student")


@app.route("/reviews/<int:review_id>")
def review_detail(review_id):
    return render_template("student/review_detail/review_detail.html", role="student", review_id=review_id)


@app.route("/reviews/write")
def review_write():
    return render_template("student/review_write/review_write.html", role="student")


@app.route("/mypage")
def student_mypage():
    return render_template("student/mypage/mypage.html", role="student")


# ---------- 사장님 ----------

@app.route("/owner/products/new", methods=["GET", "POST"])
def product_register():
    if request.method == "POST":
        data = request.form
        name = data["name"].strip()

        if not name:
            return "상품 이름을 입력해주세요.", 400

        # 상품 이미지 저장
        upload_dir = Path(app.static_folder) / "uploads"
        upload_dir.mkdir(parents=True, exist_ok=True)

        img_paths = []

        for image in request.files.getlist("images"):
            if image and image.filename:
                # 이름은 겹치지 않게 랜덤으로, 확장자만 원래 파일에서 가져오기
                # (secure_filename은 한글을 지워서 "사진.jpeg" → "jpeg"처럼 확장자가 사라짐)
                ext = secure_filename(Path(image.filename).suffix.lower())
                filename = f"{uuid4().hex}.{ext}" if ext else uuid4().hex
                image.save(upload_dir / filename)

                img_paths.append(f"uploads/{filename}")

        # Firebase Realtime Database에 저장
        DB.insert_item(name, data, img_paths)

        # 등록 완료 후 사장님 예약 페이지 이동
        return redirect(url_for("owner_reservations"))

    return render_template(
        "owner/product_register/product_register.html",
        role="owner"
    )



@app.route("/owner/reservations")
def owner_reservations():
    return render_template("owner/reservations/reservations.html", role="owner")


@app.route("/owner/reviews")
def owner_reviews():
    return render_template("owner/reviews/reviews.html", role="owner")


@app.route("/owner/mypage")
def owner_mypage():
    return render_template("owner/mypage/mypage.html", role="owner")


if __name__ == "__main__":
    app.run(debug=True)
