import hashlib

from flask import Flask, render_template, redirect, url_for, request, flash, jsonify

from database import DBhandler
from werkzeug.utils import secure_filename
from pathlib import Path
from uuid import uuid4

# html·css·js를 페이지 폴더(pages/)에 같이 두고, css·js·이미지는 /pages/... 주소로 보내요
app = Flask(__name__, template_folder="pages", static_folder="pages", static_url_path="/pages")
app.config["SECRET_KEY"] = "team246-osp"   # flash 메시지용

DB = DBhandler()


# role: 헤더/메뉴 종류를 정함 (None = 로그인 전, "student" = 학생, "owner" = 사장님)

# ---------- 공통 ----------
@app.route("/")
def index():
    return redirect(url_for("login"))


@app.route("/login")
def login():
    return render_template("common/login/login.html", role=None)


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
ITEMS_PER_PAGE = 4   # 상품 목록 한 페이지에 보여줄 개수 (2열 × 2줄)


@app.route("/products")
def product_list():
    # 필터와 페이지는 주소 뒤 ?discount=closing&category=cafe&page=2 로 받기
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

    store_names = {}   # 같은 가게를 여러 번 읽지 않게
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
            "price": price * (100 - rate) // 100,   # 할인 적용한 가격
            "store_name": store_names[seller_id],
        })

    return render_template("student/product_list/product_list.html", role="student",
                           products=products, page=page, total_pages=total_pages,
                           discount=discount, category=category)


# 상세 페이지 · 상품 목록에서는 DB 키(상품 이름)로 들어와요: /products/아메리카노
@app.route("/products/<int:product_id>")
@app.route("/products/<name>")
def product_detail(product_id=None, name=None):
    product = None
    # 숫자 ID 링크는 유지하되, Firebase 상품은 이름을 키로 조회한다.
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
    return render_template("student/product_detail/product_detail.html",
                           role="student", product=product)


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
