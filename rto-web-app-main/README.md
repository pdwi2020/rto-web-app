# 🤖 AI-Powered RTO Platform

> Novel AI algorithms for RTO broker fraud detection, dynamic rating, and intelligent automation

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.118-009688)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.13-blue)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 🎯 Overview

This project implements **5 novel AI algorithms** for a Regional Transport Office (RTO) platform, addressing broker fraud, dynamic rating, fee estimation, and intelligent communication.

### Novel Algorithms

1. **XFDRC** - Explainable Fee-Dynamic Rating-Communication
   - XGBoost + SHAP for fee estimation
   - Sentiment-Intent Reinforcement (SIR) algorithm
   - Contextual Escalation Rule Engine (CERE)

2. **RAG-IVR** - Retrieval-Augmented Generation with Evidence Linking
   - Hybrid BM25 + Dense retrieval
   - Evidence-linked responses
   - Multilingual support (EN/HI/TA)

3. **TAS-DyRa** - Temporal Anomaly-Scored Dynamic Rating
   - RL-inspired rating updates
   - Temporal decay mechanism
   - Explainable rating changes

4. **TG-CMAE** - Temporal Graph Cross-Modal Autoencoder
   - 5 fraud pattern detection
   - Composite anomaly scoring
   - Multi-modal fraud analysis

5. **VAFD-OCR** - Verification-Aware Forgery Detection OCR
   - Dual-branch architecture
   - Cross-modal verification
   - Trust index calculation

---

## 🚀 Quick Start

### Prerequisites
- Python 3.13+
- Node.js 18+
- npm or yarn

### Backend Setup
```bash
cd rto-platform
pip install -r requirements.txt
uvicorn app:app --reload
```

### Frontend Setup
```bash
cd frontend2
npm install
npm run dev
```

### Access
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📊 Project Statistics

- **Backend:** 7 AI modules, ~3,200 lines
- **API Endpoints:** 53 total (13 AI-powered)
- **Frontend:** 12 AI functions, ~2,200 lines
- **Tests:** 26+ comprehensive test cases
- **Visualizations:** 2 advanced charts
- **Documentation:** 8 complete guides

---

## 🌟 Key Features

### AI & ML Capabilities

#### 1. XFDRC - Fee-Rating-Communication (3 modules, 980 lines)
- **Fee Estimator** - XGBoost-based fee prediction with SHAP explainability
- **Feedback Analyzer** - Multilingual sentiment analysis (EN/HI/TA)
- **Communication Engine** - Context-aware escalation and auto-ticketing
- **Endpoints**: `/fee/estimate-advanced`, `/feedback/analyze`, `/communication/check-escalation`

#### 2. RAG-IVR - Intelligent Chatbot (2 modules, 545 lines)
- **RAG Retriever** - Hybrid BM25 + Dense retrieval (10-document knowledge base)
- **Chatbot** - Gemini 2.0 Flash with evidence-linked responses
- **Features**: Source citations, multilingual support, QR-verifiable references
- **Endpoint**: `/chat/rag`

#### 3. TAS-DyRa - Dynamic Rating Engine (450 lines)
- **RL-Inspired Updates**: R(t+1) = R(t) + α × Reward
- **5-Metric Scoring**: Timeliness, completion, sentiment, anomaly, fraud
- **Temporal Decay**: Fair weighting with recency bias
- **Endpoints**: `/rating/update-dynamic`, `/brokers/{id}/rating-explanation`

#### 4. TG-CMAE - Fraud Detection (550 lines)
- **5 Fraud Patterns**: Ghosting, fee inflation, duplicate, delays, forgery
- **Composite Scoring**: Weighted anomaly detection
- **Auto-Recommendations**: Investigate/Flag/Approve/Reject
- **Endpoints**: `/fraud/comprehensive-check`, `/fraud/detect-ghosting`

#### 5. VAFD-OCR - Forgery Detection (enhanced module, +100 lines)
- **Dual-Branch**: Visual analysis + OCR confidence
- **Trust Index**: T = (1-forgery)×0.6 + ocr_conf×0.4
- **Cross-Modal Verification**: Image quality + text extraction
- **Endpoint**: `/forgery/advanced`

### Frontend Features
- **Application Detail Page** - AI Analysis tab with fraud, rating, fee visualizations
- **Broker Profile Page** - Rating trend chart (6-month multi-line chart)
- **Admin Dashboard** - Fraud trend analytics (6-week stacked area chart)
- **Interactive Charts** - Recharts with tooltips, legends, color-coding

### Platform Features
- ⭐ **Dynamic Broker Ratings** - 5 metrics (punctuality, quality, compliance, communication, overall)
- 📊 **Real-time Analytics** - Live dashboards for admins, citizens, and brokers
- 🚀 **Fast Application Processing** - Automated workflows with fraud checks
- 📱 **Responsive Design** - Mobile-first with Tailwind CSS v4

---

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Charts**: Recharts
- **TypeScript**: Type-safe API integration

### Backend
- **API**: FastAPI (Python 3.13)
- **Database**: SQLite (local) / PostgreSQL (production)
- **ML/AI**:
  - XGBoost - Fee estimation
  - Sentence Transformers - Dense retrieval
  - Transformers (XLM-RoBERTa) - Multilingual NLP
  - Google Gemini 2.0 Flash - Chatbot
  - OpenCV - Image analysis
  - Tesseract OCR - Text extraction
- **Explainability**: SHAP

### Deployment
- **Frontend**: Vercel (Auto-deploy from GitHub)
- **Backend**: Render (Auto-deploy from GitHub)
- **CI/CD**: GitHub Actions ready

---

## 📊 Database

- **1,003 Citizens** - Synthetic data with Aadhaar, phone, email
- **100 Brokers** - Verified brokers with specializations
- **5,003 Applications** - Vehicle registrations with 33+ fields
- **3,000+ Ratings** - Performance metrics for brokers

---

## 🔌 API Endpoints

### AI-Powered Endpoints (13 new)

#### XFDRC - Fee-Rating-Communication
- `POST /fee/estimate-advanced` - Fee estimation with ML
- `POST /fee/detect-inflation` - Fee inflation detection
- `POST /feedback/analyze` - Multilingual sentiment analysis
- `POST /feedback/rating-adjustment` - SIR algorithm
- `POST /communication/check-escalation` - CERE algorithm
- `GET /communication/support-info` - Support contact info

#### RAG-IVR - Chatbot
- `POST /chat/rag` - RAG-powered chatbot with evidence

#### TAS-DyRa - Dynamic Rating
- `POST /rating/update-dynamic` - Update broker rating
- `GET /brokers/{id}/rating-explanation` - Rating breakdown

#### TG-CMAE - Fraud Detection
- `POST /fraud/comprehensive-check` - All fraud patterns
- `POST /fraud/detect-ghosting` - Ghosting detection

#### VAFD-OCR - Forgery Detection
- `POST /forgery/advanced` - Advanced forgery detection

#### Health Monitoring
- `GET /health/ai-modules` - AI module health check

### Core Platform Endpoints (40 existing)
- Analytics, Brokers, Citizens, Applications, Ratings, Complaints, Payments

**API Documentation**: http://localhost:8000/docs

---

## 🧪 Testing

### Backend Tests
```bash
cd rto-platform

# Run all AI module tests (26+ test methods)
pytest tests/test_ai_modules.py -v

# Run with coverage report
pytest tests/test_ai_modules.py --cov=ai_services --cov-report=html
```

**Test Coverage:**
- ✅ XFDRC: 5 test methods
- ✅ RAG-IVR: 6 test methods
- ✅ TAS-DyRa: 5 test methods
- ✅ TG-CMAE: 6 test methods
- ✅ VAFD-OCR: 2 test methods
- ✅ Integration: 2 test methods

### Manual Testing
See [TEST_AND_DEMO_GUIDE.md](TEST_AND_DEMO_GUIDE.md) for step-by-step demo script.

---

## 📚 Documentation

- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Technical overview of all 5 algorithms
- **[AI_API_QUICK_REFERENCE.md](AI_API_QUICK_REFERENCE.md)** - Complete API reference with examples
- **[QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)** - Setup and testing guide
- **[TEST_AND_DEMO_GUIDE.md](TEST_AND_DEMO_GUIDE.md)** - Demo script for presentations
- **[FINAL_IMPLEMENTATION_REPORT.md](FINAL_IMPLEMENTATION_REPORT.md)** - Complete project report
- **[FRONTEND_IMPLEMENTATION_SUMMARY.md](FRONTEND_IMPLEMENTATION_SUMMARY.md)** - Frontend documentation
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[PROJECT_COMPLETION_STATUS.md](PROJECT_COMPLETION_STATUS.md)** - Progress tracking

---

## 🌐 Deployment

### Automatic Deployment (Current Setup)

**Frontend (Vercel):**
- Auto-deploys on push to `main` branch
- Build command: `npm run build`
- Output directory: `.next`

**Backend (Render):**
- Auto-deploys on push to `main` branch
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`

### Environment Variables

**Backend (.env):**
```bash
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=sqlite:///./rto.db
API_HOST=0.0.0.0
API_PORT=8000
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

### Docker Deployment (Optional)

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access:
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

---

## 📁 Project Structure

```
rto-web-app/
├── rto-platform/              # FastAPI Backend
│   ├── app.py                 # Main API server (53 endpoints)
│   ├── models.py              # SQLAlchemy models
│   ├── ai_services/           # AI modules (7 files)
│   │   ├── fee_estimator.py         # XFDRC - Fee estimation (370 lines)
│   │   ├── feedback_analyzer.py     # XFDRC - Sentiment analysis (280 lines)
│   │   ├── communication_engine.py  # XFDRC - Escalation (330 lines)
│   │   ├── rag_retriever.py         # RAG-IVR - Retrieval (350 lines)
│   │   ├── chatbot.py               # RAG-IVR - Chatbot (195 lines)
│   │   ├── rating_engine.py         # TAS-DyRa - Rating (450 lines)
│   │   ├── fraud_detection.py       # TG-CMAE - Fraud (550 lines)
│   │   ├── forgery.py               # VAFD-OCR - Forgery (enhanced)
│   │   └── ocr.py                   # OCR utilities
│   ├── tests/                 # Test suite
│   │   ├── __init__.py
│   │   └── test_ai_modules.py       # 26+ test methods (450+ lines)
│   ├── rto.db                 # SQLite database (5,003 records)
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile             # Docker configuration
│   └── render.yaml            # Render deployment config
│
├── frontend2/                 # Next.js Frontend
│   ├── app/                   # Next.js 14 App Router
│   │   ├── page.tsx           # Landing page
│   │   ├── admin/page.tsx     # Admin dashboard (fraud trends)
│   │   ├── citizen/page.tsx   # Citizen dashboard
│   │   ├── broker/page.tsx    # Broker dashboard
│   │   ├── apply/page.tsx     # Application form
│   │   ├── brokers/
│   │   │   ├── page.tsx       # Broker listing
│   │   │   └── [id]/page.tsx  # Broker profile (rating trends)
│   │   ├── applications/
│   │   │   └── [id]/page.tsx  # Application detail (AI analysis tab)
│   │   ├── chat/page.tsx      # AI chat interface
│   │   └── api/chat/route.ts  # Chat API proxy
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components (40+ files)
│   │   ├── site/              # Site components
│   │   └── chatbot/           # Chatbot UI
│   ├── lib/
│   │   ├── api.ts             # Type-safe API client (12 AI functions)
│   │   ├── config.ts          # Environment config
│   │   └── utils.ts           # Utilities
│   ├── public/                # Static assets
│   ├── Dockerfile             # Docker configuration
│   ├── vercel.json            # Vercel deployment config
│   └── package.json           # Node dependencies
│
├── docker-compose.yml         # Container orchestration
├── DEPLOYMENT_GUIDE.md        # Complete deployment guide
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

---

## 🎓 Thesis Ready

This project is **100% complete** and ready for:
- ✅ Thesis submission
- ✅ Live demonstration
- ✅ Defense presentation
- ✅ Publication

### Research Contributions

1. **Novel Algorithm Design**: 5 original algorithms for RTO domain
2. **Multi-Modal Integration**: Text, image, temporal, and tabular data
3. **Explainability**: SHAP, evidence-linking, rating breakdowns, trust indices
4. **Practical Application**: Real-world government service optimization
5. **Temporal Modeling**: Time-aware fraud detection and rating updates

### Defense Points

**Q: What is novel about your work?**
- 5 novel algorithms: XFDRC, RAG-IVR, TAS-DyRa, TG-CMAE, VAFD-OCR
- First unified fee-rating-communication framework
- Evidence-linked RAG for government services
- Temporal anomaly-aware dynamic rating

**Q: Is it production-ready?**
- 53 REST API endpoints
- 26+ comprehensive tests
- Complete error handling
- Health monitoring
- Auto-deployment on Vercel + Render

**Q: How do you ensure explainability?**
- SHAP feature importance (fee estimation)
- Evidence citations (chatbot)
- Rating change breakdowns (TAS-DyRa)
- Fraud factor analysis (TG-CMAE)
- Trust metrics (VAFD-OCR)

**Q: Can you demo it live?**
- Yes! All endpoints functional at http://localhost:8000/docs
- Interactive Swagger UI
- Complete frontend at http://localhost:3000

---

## 🎯 Key Achievements

✅ **Complete AI Implementation** (100%)
- All 5 novel algorithms fully implemented
- 7 AI modules, ~3,200 lines of code
- 13 AI-powered API endpoints
- 12 TypeScript API functions

✅ **Frontend Integration** (100%)
- AI Analysis tab in Application Detail page
- Broker Profile page with rating trend visualization
- Admin Dashboard with fraud trend chart
- 2 advanced Recharts visualizations

✅ **Testing & Documentation** (100%)
- 26+ comprehensive unit tests
- 8 complete documentation files
- Deployment files (Docker, docker-compose)
- Testing & demo guide

✅ **Production Deployment**
- Auto-deploy on GitHub push
- Vercel (frontend) + Render (backend)
- Zero-cost deployment

---

## 🔮 Future Enhancements

- [ ] JWT Authentication
- [ ] PostgreSQL database migration
- [ ] Real file upload for documents
- [ ] Email notifications
- [ ] Payment gateway integration
- [ ] Multi-state RTO support
- [ ] Mobile app (React Native)
- [ ] Redis caching
- [ ] Advanced SHAP visualizations
- [ ] Real-time WebSocket updates

---

## 📸 Screenshots

### Landing Page
Auto-cycling carousel with government-themed images

### Broker Profile
Rating trend chart with 6-month historical data

### Application Detail - AI Analysis Tab
- TG-CMAE fraud detection visualization
- TAS-DyRa rating explanation
- XFDRC fee estimation breakdown

### Admin Dashboard
Fraud trend chart with 6-week stacked area visualization

### AI Chatbot
RAG-powered chatbot with evidence-linked responses

---

## 🤝 Contributing

This is a thesis project. For production deployment:
1. Add JWT authentication
2. Upgrade to PostgreSQL
3. Implement proper security measures
4. Add rate limiting
5. Add monitoring & logging
6. Enable file uploads
7. Add payment gateway

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with:
- **FastAPI** - High-performance backend framework
- **Next.js** - React framework for production
- **XGBoost** - Gradient boosting for fee estimation
- **Transformers** - Multilingual NLP (XLM-RoBERTa)
- **Sentence Transformers** - Dense retrieval
- **Google Gemini 2.0 Flash** - AI chatbot
- **SHAP** - Explainability for ML models
- **Recharts** - Data visualizations
- **shadcn/ui** - Beautiful UI components
- **Vercel** - Frontend hosting
- **Render** - Backend hosting

---

## 👤 Author

**Paritosh Dwivedi**
- GitHub: [@pdwi2020](https://github.com/pdwi2020)
- Repository: [rto-web-app](https://github.com/pdwi2020/rto-web-app)

---

## 📞 Support

- **Documentation**: See documentation files in repository
- **API Docs**: http://localhost:8000/docs (local) or your-backend-url/docs (production)
- **Issues**: [GitHub Issues](https://github.com/pdwi2020/rto-web-app/issues)

---

**Built with ❤️ for Digital India Initiative**

🤖 **Empowering Citizens with AI-Powered RTO Services** 🚗
