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
                "on_sale": "판매중", "reserved": "예약중", "sold_out": "판매완료",
            }.get(info.get("status"), info.get("status", "")),
            "pickup_time": f"{info.get('pickup_start', '')}–{info.get('pickup_end', '')}",
            "rating": 0,
            "review_count": 0,
        }
    return render_template("student/product_detail/product_detail.html", product=product)


@app.route("/reserve/done")


def reserve_done():
    return render_template("student/reserve_done/reserve_done.html")


@app.route("/reviews")


def review_list():
    return render_template("student/review_list/review_list.html")


@app.route("/reviews/<int:review_id>")


def review_detail(review_id):
    return render_template("student/review_detail/review_detail.html", review_id=review_id)


@app.route("/reviews/write")


def review_write():
    return render_template("student/review_write/review_write.html")


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
