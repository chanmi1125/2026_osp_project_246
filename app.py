import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta

from flask import Flask, render_template, redirect, url_for, request, flash, jsonify, session, abort

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
    auth_role = session.get("user_type") if session.get("id") else None
    return {"auth_role": auth_role, "csrf_token": csrf_token}


@app.after_request
def prevent_auth_page_cache(response):
    if session.get("id") or request.endpoint in {"login", "login_confirm", "logout"}:
        response.headers["Cache-Control"] = "no-store"
    return response


@app.route("/")
def index():
    return redirect(url_for(home_endpoint()))


@app.route("/login")
def login():
    if session.get("id"):
        return redirect(url_for(home_endpoint()))
    return render_template("common/login/login.html")


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

    pw_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()
    try:
        user = DB.authenticate_user(user_id, pw_hash)
    except Exception as error:
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
    return render_template("common/signup/signup.html")


@app.route("/signup_post", methods=["POST"])
def signup_post():
    data = request.form
    pw_hash = hashlib.sha256(data["password"].encode("utf-8")).hexdigest()
    if DB.insert_user(data, pw_hash):
        return redirect(url_for("login"))
    flash("이미 있는 아이디예요")
    return redirect(url_for("signup"))


@app.route("/check-id")
def check_id():
    """회원가입 화면의 '중복 확인' 버튼이 부르는 주소"""
    user_id = request.args.get("user_id", "").strip()
    return jsonify(available=DB.user_duplicate_check(user_id))


ITEMS_PER_PAGE = 4


@app.route("/products")
def product_list():
    discount = request.args.get("discount", "all")
    category = request.args.get("category", "all")
    page = request.args.get("page", 1, type=int)

    items = [
        (name, info) for name, info in DB.get_items().items()
        if (discount == "all" or info.get("discount_type") == discount)
        and (category == "all" or info.get("category") == category)
    ]

    total_pages = max(1, (len(items) + ITEMS_PER_PAGE - 1) // ITEMS_PER_PAGE)
    page = max(1, min(page, total_pages))
    start = (page - 1) * ITEMS_PER_PAGE
    page_items = items[start:start + ITEMS_PER_PAGE]

    store_names = {}
    products = []
    for name, info in page_items:
        seller_id = info.get("seller_id", "")
        if seller_id not in store_names:
            seller = DB.get_user(seller_id) or {}
            store_names[seller_id] = seller.get("store_name", seller_id)
        price = info.get("price", 0)
        rate = info.get("discount_rate", 0)
        products.append({
            "name": name,
            "image": (info.get("img_path") or [None])[0],
            "discount_type": info.get("discount_type"),
            "category": info.get("category"),
            "discount_rate": rate,
            "price": price * (100 - rate) // 100,
            "store_name": store_names[seller_id],
        })

    return render_template("student/product_list/product_list.html",
                           products=products, page=page, total_pages=total_pages,
                           discount=discount, category=category)


@app.route("/products/<int:product_id>")
@app.route("/products/<name>")
def product_detail(product_id=None, name=None):
    product = None

    item_name = name if name is not None else str(product_id)
    info = DB.get_item(item_name)

    if info is not None:
        seller_id = info.get("seller_id", "")
        seller = (DB.get_user(seller_id) or {}) if seller_id else {}
        original_price = info.get("price", 0)
        discount_rate = info.get("discount_rate", 0)

        product = {
            **info,
            "id": item_name,
            "name": item_name,
            "image": (info.get("img_path") or [None])[0],
            "discount_type": info.get("discount_type", ""),
            "discount_rate": discount_rate,
            "original_price": original_price,
            "price": original_price * (100 - discount_rate) // 100,
            "store_name": seller.get("store_name") or seller_id,
            "address": info.get("address", ""),
            "seller_id": seller_id,
            "email": info.get("email", ""),
            "quantity": info.get("quantity", 0),
            "description": info.get("description", ""),
            "status": {
                "on_sale": "판매중",
                "reserved": "예약중",
                "sold_out": "판매완료",
            }.get(info.get("status"), info.get("status", "")),
            "pickup_time": f"{info.get('pickup_start', '')}–{info.get('pickup_end', '')}",
        }
        product["rating"], product["review_count"] = review_rating(item_name)

    return render_template("student/product_detail/product_detail.html", product=product)


def review_rating(item_name):
    """이 상품에 달린 리뷰의 평균 별점(소수 첫째 자리)과 개수."""
    try:
        reviews = DB.get_reviews().values()
    except Exception:
        app.logger.exception("Firebase review lookup failed")
        return 0, 0
    ratings = []
    for info in reviews:
        if not isinstance(info, dict):
            continue
        if (info.get("product_name") or info.get("product")) != item_name:
            continue
        try:
            rating = int(info.get("rating", 0))
        except (ValueError, TypeError):
            continue
        if 1 <= rating <= 5:
            ratings.append(rating)
    if not ratings:
        return 0, 0
    return round(sum(ratings) / len(ratings), 1), len(ratings)

# 상품 좋아요: GET은 현재 상태 조회, POST는 {"liked": true/false} 저장
@app.route("/item_like/<name>", methods=["GET", "POST"])
def item_like(name):
    user_id = session.get("id")
    if user_id is None:
        return jsonify({"error": "로그인이 필요합니다."}), 401
    if not DB.valid_key(name):
        return jsonify({"error": "잘못된 상품 이름입니다."}), 400

    try:
        if DB.get_item(name) is None:
            return jsonify({"error": "존재하지 않는 상품입니다."}), 404

        if request.method == "GET":
            return jsonify({"liked": DB.get_heart(user_id, name)})

        # 다른 사이트에서 보낸 요청을 막기 위한 CSRF 토큰 확인
        saved_token = session.get("_csrf_token")
        submitted_token = request.headers.get("X-CSRF-Token", "")
        if not isinstance(saved_token, str) or not hmac.compare_digest(
            saved_token.encode("utf-8"), submitted_token.encode("utf-8")
        ):
            return jsonify({"error": "잘못된 요청입니다."}), 403

        data = request.get_json(silent=True)
        if not isinstance(data, dict) or not isinstance(data.get("liked"), bool):
            return jsonify({"error": "잘못된 요청입니다."}), 400

        saved = DB.set_heart(user_id, name, data["liked"])
        return jsonify({"liked": saved})

    except Exception as error:
        app.logger.error("좋아요 처리 실패 (%s)", type(error).__name__)
        return jsonify({"error": "좋아요 처리에 실패했습니다."}), 500


@app.route("/reserve/done")
def reserve_done():
    return render_template("student/reserve_done/reserve_done.html")


REVIEW_PHOTO_EXTS = {".jpg", ".jpeg", ".png"}


@app.route("/reviews")
def review_list():
    page = request.args.get("page", 1, type=int)
    try:
        stored_reviews = DB.get_reviews()
    except Exception:
        app.logger.exception("Firebase review list lookup failed")
        abort(503, description="리뷰를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.")
    reviews = [(key, info) for key, info in stored_reviews.items()
               if isinstance(info, dict)]
    total_pages = max(1, (len(reviews) + ITEMS_PER_PAGE - 1) // ITEMS_PER_PAGE)
    page = max(1, min(page, total_pages))
    start = (page - 1) * ITEMS_PER_PAGE
    return render_template(
        "student/review_list/review_list.html",
        reviews=[review_view(key, info) for key, info in reviews[start:start + ITEMS_PER_PAGE]],
        page=page, total_pages=total_pages, total_reviews=len(reviews),
    )


def review_view(review_id, info):
    """Adapt existing form names and common stored names for display only."""
    photo = info.get("img_path") or info.get("photo") or info.get("image")
    if isinstance(photo, list):
        photo = next((path for path in photo if isinstance(path, str) and path), None)
    image_url = None
    if isinstance(photo, str) and photo.strip():
        photo = photo.strip().replace("\\", "/")
        if photo.startswith(("https://", "http://")):
            image_url = photo
        else:
            photo = photo.lstrip("/")
            if photo.startswith("pages/"):
                photo = photo[len("pages/"):]
            if not photo.startswith(("uploads/", "images/")) and "/" not in photo:
                photo = "images/" + photo
            image_url = url_for("static", filename=photo)
    try:
        rating = int(info.get("rating", 0))
    except (ValueError, TypeError, OverflowError):
        rating = 0
    return {
        "id": review_id,
        "title": info.get("title") or "제목 없는 리뷰",
        "product": info.get("product_name") or info.get("product") or "상품 정보 없음",
        "body": info.get("body") or info.get("content") or info.get("text") or "",
        "rating": rating if 1 <= rating <= 5 else None,
        "image_url": image_url,
    }


@app.route("/reviews/<review_id>")
@app.route("/view_review_detail/<review_id>", endpoint="view_review_detail")
def review_detail(review_id):
    if (any(char in review_id for char in '.#$[]/')
            or any(ord(char) < 32 or ord(char) == 127 for char in review_id)
            or len(review_id.encode("utf-8")) > 768):
        abort(404)
    try:
        info = DB.get_review_by_id(review_id)
    except Exception:
        app.logger.exception("Firebase review detail lookup failed")
        abort(503, description="리뷰를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.")
    if not isinstance(info, dict) or not info:
        return render_template("student/review_detail/review_detail.html", review=None), 404
    return render_template("student/review_detail/review_detail.html",
                           review=review_view(review_id, info))


@app.route("/reviews/write", methods=["GET", "POST"])
def review_write():
    if request.method == "GET":
        name = request.args.get("name", "").strip()
        locked = bool(name) and DB.get_item(name) is not None
        return render_template("student/review_write/review_write.html",
                               name=name, product_locked=locked)

    if not valid_csrf_token():
        flash("리뷰 작성 화면이 만료됐습니다. 다시 시도해 주세요.", "error")
        return redirect(url_for("review_write", name=request.form.get("product_name", "")))

    data = request.form
    writer = session.get("id") or data.get("writer", "").strip()
    product_name = data.get("product_name", "").strip()
    title = data.get("title", "").strip()
    body = data.get("body", "").strip()
    rating = data.get("rating", "0")
    photo = request.files.get("photo")
    ext = Path(photo.filename).suffix.lower() if photo and photo.filename else ""

    error = None
    if not (writer and product_name and title and body):
        error = "필수 항목을 모두 입력해 주세요."
    elif rating not in {"1", "2", "3", "4", "5"}:
        error = "평점을 선택해 주세요."
    elif ext not in REVIEW_PHOTO_EXTS:
        error = "리뷰 사진(JPG, PNG)을 올려 주세요."
    elif DB.get_item(product_name) is None:
        error = "등록된 상품 이름이 아니에요. 상품 상세에서 리뷰 쓰기를 눌러 주세요."
    if error:
        flash(error, "error")
        return redirect(url_for("review_write", name=product_name))

    upload_dir = Path(app.static_folder) / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{ext}"
    photo.save(upload_dir / filename)

    DB.insert_review({
        "writer": writer,
        "product_name": product_name,
        "title": title,
        "body": body,
        "rating": int(rating),
        "img_path": f"uploads/{filename}",
        "created_at": datetime.now().isoformat(timespec="seconds"),
    })
    return redirect(url_for("review_list"))


@app.route("/mypage")
def student_mypage():
    return render_template("student/mypage/mypage.html")


@app.route("/owner/products/new", methods=["GET", "POST"])
def product_register():
    if request.method == "POST":
        data = request.form
        name = data["name"].strip()

        if not name:
            return "상품 이름을 입력해주세요.", 400

        upload_dir = Path(app.static_folder) / "uploads"
        upload_dir.mkdir(parents=True, exist_ok=True)

        img_paths = []

        for image in request.files.getlist("images"):
            if image and image.filename:
                ext = secure_filename(Path(image.filename).suffix.lower())
                filename = f"{uuid4().hex}.{ext}" if ext else uuid4().hex
                image.save(upload_dir / filename)

                img_paths.append(f"uploads/{filename}")

        DB.insert_item(name, data, img_paths)

        return redirect(url_for("owner_reservations"))

    return render_template("owner/product_register/product_register.html")


@app.route("/owner/reservations")
def owner_reservations():
    return render_template("owner/reservations/reservations.html")


@app.route("/owner/reviews")
def owner_reviews():
    return render_template("owner/reviews/reviews.html")


@app.route("/owner/mypage")
def owner_mypage():
    return render_template("owner/mypage/mypage.html")


if __name__ == "__main__":
    app.run(debug=True)
