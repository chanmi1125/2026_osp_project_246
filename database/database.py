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
