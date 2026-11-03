import pyrebase
import json


class DBhandler:
    def __init__(self):
        with open('./authentication/firebase_auth.json') as f:
            config = json.load(f)
        firebase = pyrebase.initialize_app(config)
        self.db = firebase.database()

    def insert_item(self, name, data, img_paths):
        item_info = {
            "seller_id": data["seller_id"],
            "price": int(data["price"].replace(",", "")),
            "address": data["address"],
            "status": data["status"],
            "email": data["email"],
            "img_path": img_paths,
            "discount_type": data["discount_type"],
            "category": data["category"],
            "discount_rate": int(data["discount_rate"]),
            "pickup_start": data["pickup_start"],
            "pickup_end": data["pickup_end"],
            "quantity": int(data["quantity"]),
            "description": data.get("description", "")
        }

        self.db.child("item").child(name).set(item_info)

        return True

    # ---------- 회원가입 ----------
    def user_duplicate_check(self, user_id):
        """이미 있는 아이디면 False, 쓸 수 있으면 True"""
        return self.db.child("user").child(user_id).get().val() is None

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
