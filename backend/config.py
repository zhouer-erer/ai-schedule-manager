import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'secret_key_for_development'
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://username:password@localhost:3306/ai_task_db?charset=utf8mb4'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_AS_ASCII = False
    DEEPSEEK_API_KEY = 'sk-密钥串'
    DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
    