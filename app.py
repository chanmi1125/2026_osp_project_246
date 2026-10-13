from flask import Flask, render_template

app = Flask(__name__, template_folder="presentation")


@app.route("/")
def hello():
    return render_template("main.html")

@app.route("/reg_items")
def reg_items():
    return render_template("reg_items.html") //상품등록

if __name__ == "__main__":
    app.run(debug=True)
