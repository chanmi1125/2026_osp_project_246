from flask import Flask, render_template, request, url_for, send_from_directory
from werkzeug.utils import secure_filename
import os
import uuid

# 246팀 기존 폴더 구조 유지
app = Flask(__name__, template_folder="presentation")

# 이미지 저장 경로
UPLOAD_FOLDER = os.path.join(app.static_folder, "images")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# 메인 페이지
@app.route("/")
def hello():
    return render_template("index.html")


# 상품 목록
@app.route("/list")
def view_list():
    return render_template("list.html")


# 리뷰 목록
@app.route("/review")
def view_review():
    return render_template("review.html")

# 리뷰 등록
@app.route("/reg_reviews")
def reg_review():
    return render_template("reg_reviews.html")


# 상품 등록 결과
@app.route("/submit_item_post", methods=["POST"])
def reg_item_submit_post():

    # POST 방식으로 입력 데이터 받기
    data = request.form

    # 이미지 파일 받기
    image_file = request.files.get("file_input")

    if not image_file or not image_file.filename:
        return "이미지를 선택해주세요.", 400

    filename = secure_filename(image_file.filename)
    extension = os.path.splitext(filename)[1].lower()

    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

    if extension not in allowed_extensions:
        return "지원하지 않는 이미지 형식입니다.", 400

    # 중복되지 않는 파일명 생성
    saved_filename = str(uuid.uuid4()) + extension

    # static/images 폴더에 이미지 저장
    image_file.save(
        os.path.join(UPLOAD_FOLDER, saved_filename)
    )

    # 결과 페이지에 전달할 이미지 주소
    img_path = url_for(
        "static",
        filename="images/" + saved_filename
    )

    return render_template(
        "result.html",
        data=data,
        img_path=img_path
    )

# 상품 등록
@app.route("/reg_items")
def reg_items():
    return render_template("reg_items.html")

# 네비게이션 바
@app.route("/index.css")
def index_css():
    return send_from_directory("presentation", "index.css")

if __name__ == "__main__":
    app.run(debug=True)


