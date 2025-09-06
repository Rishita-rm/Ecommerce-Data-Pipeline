# E-commerce Data Processing Web Tool  

A **scalable data processing and analytics platform** designed to transform raw e-commerce transaction data into actionable insights. Built with an enterprise mindset, the solution incorporates a **modular ETL pipeline, a secure data store, and a modern analytics dashboard** — aligning with industry standards for high-availability, performance, and maintainability.  

---

## Key Capabilities  

### Data Ingestion & Processing  
- Robust CSV ingestion with schema validation and error handling  
- Automated ETL pipeline with **deduplication, normalization, and type enforcement**  
- Real-time feedback loop with processing metrics and failure tracking  
- Extensible design to support additional data sources (APIs, streams)  

### Analytics & Reporting  
- **Business KPIs:** Revenue, customer/product segmentation, order volume  
- **Advanced Insights:** Customer lifetime value trends, top product analysis, frequency analysis  
- **Time Series Analysis:** Daily revenue tracking with visual dashboards  
- **Data Governance:** Clear audit trail with timestamps and logs  

### Monitoring & Operations  
- End-to-end logging of processing stages and outcomes  
- Performance metrics: throughput, error rates, and latency tracking  
- Safe data clearing with user confirmation prompts  
- Modular design supporting CI/CD and containerized deployments  

---

## Architecture & Technology  

### Backend — **FastAPI + MongoDB**  
- Lightweight, asynchronous API layer (FastAPI) with OpenAPI/Swagger documentation  
- **MongoDB aggregation pipelines** for scalable analytics queries  
- **Pandas-based ETL** for data transformation and enrichment  
- UUID-based record IDs with timezone-aware datetime storage  
- 6 RESTful endpoints covering ingestion, analytics, logs, and system management  

### Frontend — **React + Shadcn UI**  
- Modern component-driven architecture with **React hooks**  
- Responsive UI with a **professional design system (Shadcn UI)**  
- Real-time state management and error boundary handling  
- Data visualization with interactive charts and metric displays  

---

## Testing & Validation  

- **Unit Tests:** 9/9 backend tests passed, validating ETL, aggregation, and error handling  
- **Integration Tests:** Full workflow validated from ingestion to analytics output  
- **Frontend QA:** Navigation, file uploads, and analytics rendering confirmed  
- **End-to-End:** Demonstrated ability to process and analyze 36-record dataset in <0.01s  

---

## Sample Data  

Includes a synthetic dataset representing a small e-commerce business:  
- **Fields:** Order ID, product, customer, timestamp, quantity, price, geography  
- **Coverage:** 36 transactions across UK, France, and Ireland  
- **Use Cases:** Revenue calculations, product performance, customer insights  

---

## Deployment & Usage  

### 1. Clone the repository  
```bash
git clone https://github.com/your-username/ecommerce-data-pipeline.git
cd ecommerce-data-pipeline


### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 👤 Author  

**Rishita Makkar**  
📧 [rishitamakkar0777@gmail.com](mailto:rishitamakkar0777@gmail.com)  

🔗 [LinkedIn](https://www.linkedin.com/in/rishita-makkar-256851291/) | [Portfolio](https://portfolio-five-drab-74.vercel.app/)

