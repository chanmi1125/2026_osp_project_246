import firebase_admin
from firebase_admin import credentials, db


class DBhandler:
    def __init__(self):
        cred = credentials.Certificate("authentication/serviceAccountKey.json")
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred, {
                "databaseURL": "https://team246-osp-default-rtdb.asia-southeast1.firebasedatabase.app/"
            })
        self.db = db.reference()

    # ---------- 회원가입 ----------
    def user_duplicate_check(self, user_id):
        """이미 있는 아이디면 False, 쓸 수 있으면 True"""
        return self.db.child("user").child(user_id).get() is None

    def insert_user(self, data, pw_hash):
        """user 노드 아래에 아이디를 키로 저장. 중복이면 False"""
        user_id = data["user_id"]
        if not self.user_duplicate_check(user_id):
            return False

        user_info = {
            "id": user_id,
            "pw": pw_hash,
            "nickname": data["nickname"],
            "user_type": data["user_type"],
        }
        if data["user_type"] == "student":
            user_info["email"] = data["email_id"] + "@ewha.ac.kr"
            user_info["phone"] = data.get("phone", "")
        else:
            user_info["email"] = data["email"]
            user_info["store_name"] = data["store_name"]
            user_info["store_phone"] = data["store_phone"]
            user_info["store_address"] = data["store_address"]

        self.db.child("user").child(user_id).set(user_info)
        return True
