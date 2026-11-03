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