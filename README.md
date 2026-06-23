# AI 辅助日程行程安排管理系统

一个基于 Flask + 原生前端的个人智能日程管理系统，集成 DeepSeek AI 大模型和 OCR 文字识别功能，帮助用户高效管理任务和旅行行程。

## 功能特性

### 核心功能
- **用户系统**：注册、登录、用户信息管理
- **任务管理**：任务的增删改查、优先级设置、分类管理、批量操作
- **行程管理**：旅行行程规划、每日行程安排、预算管理
- **AI 智能规划**：基于 DeepSeek 大模型的智能日程建议、冲突检测、个性化推荐
- **OCR 文字识别**：支持图片文字识别，快速导入日程信息
- **文件导入**：支持多种格式文件解析（TXT、CSV、Word、Excel、PDF 等）
- **日程分析**：时间冲突检测、忙碌程度分析、关怀建议

### 技术亮点
- 🤖 集成 DeepSeek AI 大模型，提供智能规划建议
- 📷 Tesseract OCR 图片文字识别
- 💾 MySQL 数据库持久化存储
- 🎨 响应式前端界面
- 🔄 日程冲突自动检测与提醒

## 技术栈

### 后端
- **框架**: Flask 2.3.3
- **ORM**: Flask-SQLAlchemy 3.0.5
- **数据库**: MySQL + PyMySQL
- **跨域**: Flask-CORS
- **AI API**: DeepSeek API
- **OCR**: Tesseract + pytesseract + Pillow
- **文件处理**: python-docx, openpyxl, pdfplumber

### 前端
- **技术**: 原生 HTML5 + CSS3 + JavaScript
- **UI**: 自定义响应式设计

## 项目结构

```
.
├── backend/                 # 后端代码目录
│   ├── app.py              # Flask 应用主入口
│   ├── config.py           # 配置文件
│   ├── models.py           # 数据库模型
│   ├── requirements.txt    # Python 依赖
│   └── ...                 # 其他测试和调试文件
├── frontend/               # 前端代码目录
│   ├── index.html          # 主页面
│   ├── css/
│   │   └── style.css       # 样式文件
│   └── js/
│       └── app.js          # 前端逻辑
└── README.md
```

## 快速开始

### 环境要求

- Python 3.8+
- MySQL 5.7+ 或 8.0+
- Tesseract OCR（可选，用于图片文字识别）

### 1. 克隆项目

```bash
git clone <repository-url>
cd 5-1系统源代码
```

### 2. 配置数据库

创建 MySQL 数据库：

```sql
CREATE DATABASE ai_task_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 配置环境变量

复制并修改配置文件 `backend/config.py`：

```python
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here'
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://username:password@localhost:3306/ai_task_db?charset=utf8mb4'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_AS_ASCII = False
    DEEPSEEK_API_KEY = 'your-deepseek-api-key'
    DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
```

> **建议**: 使用环境变量存储敏感信息，不要将真实的 API Key 和数据库密码提交到代码仓库。

### 4. 安装后端依赖

```bash
cd backend
pip install -r requirements.txt
```

### 5. 初始化数据库

```bash
python init_db.py
```

### 6. 启动后端服务

```bash
python app.py
```

服务将在 `http://localhost:5000` 启动。

### 7. 启动前端

直接在浏览器中打开 `frontend/index.html`，或者使用任意静态文件服务器：

```bash
cd frontend
python -m http.server 8000
```

然后访问 `http://localhost:8000`。

## API 接口

### 用户相关
- `POST /api/users` - 用户注册
- `POST /api/users/login` - 用户登录

### 任务相关
- `GET /api/tasks?user_id=` - 获取任务列表
- `POST /api/tasks` - 创建任务
- `PUT /api/tasks/<id>` - 更新任务
- `DELETE /api/tasks/<id>` - 删除任务
- `DELETE /api/tasks/batch` - 批量删除任务

### 行程相关
- `GET /api/trips?user_id=` - 获取行程列表
- `POST /api/trips` - 创建行程
- `PUT /api/trips/<id>` - 更新行程
- `DELETE /api/trips/<id>` - 删除行程
- `GET /api/trips/<id>/itinerary` - 获取行程详情
- `POST /api/trips/<id>/itinerary` - 添加行程项目

### AI 相关
- `POST /api/ai/plan` - AI 智能规划

### 其他
- `GET /api/health` - 健康检查

## 数据库模型

### User (用户表)
- id, username, email, password_hash, created_at, updated_at

### Task (任务表)
- id, user_id, title, description, start_time, end_time, location, priority, status, category, created_at, updated_at

### Trip (行程表)
- id, user_id, title, description, destination, start_date, end_date, budget, status, created_at, updated_at

### ItineraryItem (行程项目表)
- id, trip_id, day_number, title, description, location, time_slot, created_at

## 配置说明

### Tesseract OCR 配置（可选）

如果需要使用图片文字识别功能，请安装 Tesseract OCR：

**Windows**:
1. 下载安装包：https://github.com/UB-Mannheim/tesseract/wiki
2. 安装时勾选中文语言包（chi_sim）
3. 确保安装路径在 `app.py` 的 `TESSERACT_PATHS` 列表中

**Linux**:
```bash
sudo apt-get install tesseract-ocr tesseract-ocr-chi-sim
```

**macOS**:
```bash
brew install tesseract tesseract-lang
```

### DeepSeek API 配置

1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com/) 注册账号
2. 获取 API Key
3. 在 `config.py` 中配置 `DEEPSEEK_API_KEY`

## 注意事项

- 本项目的密码存储为明文，仅用于学习演示，生产环境请使用加密存储
- 请妥善保管您的 API Key 和数据库密码，切勿泄露
- 建议使用 `.env` 文件管理敏感配置，并添加到 `.gitignore` 中

## 开发说明

项目包含一些测试和调试文件（`test_*.py`、`debug_*.py` 等），这些是开发过程中用于调试的临时文件，可以根据需要清理。

## 许可证

MIT License
<img width="2201" height="1355" alt="image" src="https://github.com/user-attachments/assets/94d4c25e-50c9-4b84-8edb-f4e1d9e628d9" />
<img width="2251" height="1367" alt="image" src="https://github.com/user-attachments/assets/eca0ecb6-213b-4b86-9079-d9d2e36065e0" />
<img width="2359" height="1352" alt="image" src="https://github.com/user-attachments/assets/0d1da4ee-0eae-47b3-b2d7-f9d211cb8deb" />
<img width="2209" height="1330" alt="image" src="https://github.com/user-attachments/assets/790f92df-0d0c-4cc7-bb4b-b4c51938a8b2" />
<img width="2327" height="1374" alt="image" src="https://github.com/user-attachments/assets/4a83ce2a-9bb0-45a5-b5f0-033ea18bf87c" />
<img width="2223" height="1355" alt="image" src="https://github.com/user-attachments/assets/f6dc955a-404c-43ef-9166-05a177303013" />
<img width="628" height="370" alt="image" src="https://github.com/user-attachments/assets/4ab60fcf-c3a8-43df-8218-5eb1af813a7b" />
<img width="2268" height="1370" alt="image" src="https://github.com/user-attachments/assets/1151c7a9-f9e3-4a3d-b4da-b676aeb87e59" />











