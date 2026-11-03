from flask import Flask, render_template, redirect, url_for, request
from database.database import DBhandler
from werkzeug.utils import secure_filename
from pathlib import Path
from uuid import uuid4

# html·css·js를 페이지 폴더(pages/)에 같이 두고, css·js·이미지는 /pages/... 주소로 보내요
app = Flask(__name__, template_folder="pages", static_folder="pages", static_url_path="/pages")
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
                filename = secure_filename(image.filename)
                if not filename:
                    continue

                filename = f"{uuid4().hex}_{filename}"
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
