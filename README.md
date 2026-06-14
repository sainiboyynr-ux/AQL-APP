# AQL Finished Goods Inspection Web App

An elegant, mobile-first web application designed for **Esme Consumer Pvt. Ltd.** to digitize the Acceptance Quality Limit (AQL) inspection process. This application replaces the paper-based format `ESME-QA-SOP-22-F-02` with a modern, high-fidelity digital workflow.

---

## 🚀 Key Features

*   **Mobile-First Design**: Optimized for mobile viewports (320px–430px targets) with large tap targets (minimum 48px height) for fast operations in manufacturing spaces.
*   **ISO 2859-1 Sampling Table Integration**: Map batch/lot sizes automatically to the correct General Inspection Level II sample sizes. Allows overrides with mandatory justifications.
*   **Live Decision Engine**: Real-time evaluation of Critical, Major, and Minor defect percentages against limits, rendering immediate status updates (`ACCEPT`, `HOLD`, or `REJECT`).
*   **Dual Mode Appwrite & Local-First Fallback**: Fully integrated with the Appwrite SDK for user authentication and records database. Falls back seamlessly to mock credentials and local storage if endpoint variables are missing, ensuring high availability.
*   **Auto-Save Drafts**: Automatically saves the active inspection form state to the local cache and backend database every 60 seconds.
*   **Format SOP F-02 PDF Generation**: Instant client-side generation of high-resolution, print-ready PDFs mirroring the official paper form via `jsPDF` and `html2canvas`.

---

## 🛠️ Tech Stack

*   **Frontend Library**: React (Vite-scaffolded)
*   **Styling**: Tailwind CSS v4 (native compilation in Vite)
*   **Backend & DB**: Appwrite SDK
*   **PDF Compiler**: `jsPDF` + `html2canvas`

---

## 📈 Quality Assurance Evaluation Rules

The application enforces standard quality inspection criteria based on the AQL limit specifications:

1.  **Critical Defects (AQL = 0%)**: If **any** critical defect is identified (count > 0), the batch is immediately **REJECTED**.
2.  **Major Defects (AQL = 1%)**: If Major Defect % (Total Major Defects / Sample Size $\times 100$) exceeds **1%**, the batch is placed **ON HOLD**.
3.  **Minor Defects (AQL = 4%)**: If Minor Defect % (Total Minor Defects / Sample Size $\times 100$) exceeds **4%**, the batch is placed **ON HOLD**.
4.  **Acceptance**: If all metrics remain within limits, the batch is **ACCEPTED**.

---

## 🧱 Appwrite Collections Schema

If configuring a live Appwrite instance, establish the following schemas:

### 1. `users` collection
*   `employee_id` (string): Unique identifier.
*   `full_name` (string): The employee's full name.
*   `role` (string): Enum `[qa_executive, qa_manager]`.
*   `department` (string): Department name.

### 2. `inspections` collection
*   `inspection_id` (string): Automatic/Unique ID.
*   `created_by` (string): ID reference to user.
*   `product_name` (string)
*   `batch_no` (string)
*   `batch_size` (number)
*   `total_production` (number)
*   `sample_size` (number)
*   `sku` (string)
*   `mfd_date` (date/ISO string)
*   `exp_date` (date/ISO string)
*   `status` (string): Enum `[draft, submitted]`.
*   `overall_decision` (string): Enum `[accept, hold, reject]`.
*   `critical_defects` (JSON string/array): Array of logged defects.
*   `major_defects` (JSON string/array)
*   `minor_defects` (JSON string/array)
*   `defect_pct_critical` (number)
*   `defect_pct_major` (number)
*   `defect_pct_minor` (number)
*   `created_at` (date/ISO string)
*   `submitted_at` (date/ISO string)

---

## ⚙️ Installation & Running Locally

### 1. Clone & Install Dependencies
Navigate to the project root and run:
```bash
npm install
```

### 2. Environment Variables Configuration
To use local storage and mock authentication (fully functional demo mode), you do not need to configure anything. 

To connect to a live Appwrite service, copy the `.env.example` file:
```bash
cp .env.example .env
```
Fill in your Appwrite endpoint and project IDs. The client will detect the configuration automatically and switch to cloud sync.

### 3. Run Development Server
```bash
npm run dev
```

### 4. Demo Login Credentials (Local Mock Mode)
*   **Employee ID**: `EMP001` (Amit Sharma - QA Executive)
*   **Employee ID**: `EMP002` (Priyanka Patel - QA Manager)
*   *Note: In local demo mode, any password will be accepted.*
