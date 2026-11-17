import pyrebase
import json
import hmac
import re
from pathlib import Path

class DBhandler:
    def __init__(self):
        config_path = Path(__file__).resolve().parent / 'authentication' / 'firebase_auth.json'
        with config_path.open(encoding='utf-8') as f:
            config = json.load(f)
        self.firebase = pyrebase.initialize_app(config)

    @property
    def db(self):
        return self.firebase.database()
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

    def get_items(self):
        """item 노드 전체 {상품이름: 상품정보}. 없으면 빈 딕셔너리"""
        return self.db.child("item").get().val() or {}

    def get_item(self, name):
        """상품 이름을 키로 조회. 없으면 None."""
        return self.db.child("item").child(name).get().val()

    def insert_review(self, review_info):
        """review 노드 아래에 push()로 저장하고 자동 생성된 키를 돌려줌"""
        return self.db.child("review").push(review_info)["name"]

    def get_reviews(self):
        """Return reviews keyed by their Firebase push IDs."""
        return self.db.child("review").get().val() or {}

    def get_review_by_id(self, review_id):
        """Read one review without changing the stored schema."""
        return self.db.child("review").child(review_id).get().val()

    def get_user(self, user_id):
        """user/아이디 정보. 없으면 None"""
        return self.db.child("user").child(user_id).get().val()

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

    def authenticate_user(self, user_id, pw_hash):
        """Firebase user/<아이디>의 기존 해시를 확인하고 최소 회원 정보만 반환."""
        if (not isinstance(user_id, str) or not user_id
                or any(char in user_id for char in '.#$[]/')
                or any(ord(char) < 32 or ord(char) == 127 for char in user_id)
                or len(user_id.encode('utf-8')) > 768):
            return None
        if not isinstance(pw_hash, str) or not re.fullmatch(r'[0-9a-f]{64}', pw_hash):
            return None

        user = self.db.child('user').child(user_id).get().val()
        if not isinstance(user, dict):
            return None
        stored_hash = user.get('pw')
        if not isinstance(stored_hash, str) or not re.fullmatch(r'[0-9a-f]{64}', stored_hash):
            return None
        if not hmac.compare_digest(stored_hash, pw_hash):
            return None
        if user.get('user_type') not in ('student', 'owner'):
            return None
        return {'id': user_id, 'user_type': user['user_type']}
    
    # Firebase 경로 유효성 검사
    @staticmethod
    def valid_key(key):
        return (
            isinstance(key, str)
            and bool(key)
            and not any(c in key for c in ".#$[]/")
            and not any(ord(c) < 32 or ord(c) == 127 for c in key)
            and len(key.encode("utf-8")) <= 768
        )

    # 상품 좋아요 상태 조회 (누르지 않았으면 False)
    def get_heart(self, user_id, name):
        if not self.valid_key(user_id) or not self.valid_key(name):
            raise ValueError("잘못된 좋아요 경로입니다.")
        return self.db.child("like").child(user_id).child(name).get().val() is True

    # 상품 좋아요 상태 저장 (True: 좋아요, False: 취소)
    def set_heart(self, user_id, name, liked):
        if not self.valid_key(user_id) or not self.valid_key(name):
            raise ValueError("잘못된 좋아요 경로입니다.")
        self.db.child("like").child(user_id).child(name).set(bool(liked))
        return bool(liked)
