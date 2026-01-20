# KatCake Pops - Professional POS for Bakeries

An ultra-premium Point of Sale system tailored for bakeries. Built with React (TypeScript), Node.js, and MongoDB.

## 🚀 Key Features
- **Modern POS Interface**: Fast search, category filters, and interactive cart.
- **Inventory Management**: Track stock levels, sub-categories, and images.
- **Premium Dashboard**: Real-time sales stats, upcoming orders, and trends.
- **Glassmorphism Design**: High-end look with animations and a responsive sidebar.
- **Auth & Roles**: Admin and Employee roles with granular permissions.

## 🛠️ Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express, Mongoose (MongoDB).
- **Authentication**: JWT & Bcrypt.
- **Storage**: Cloudinary (Product images).

## 📦 Local Setup
1. **Clone & Install**:
   ```bash
   # Root
   npm install
   ```
2. **Environment Variables**:
   Create a `.env` in the `backend/` folder based on `.env.example`.
3. **Run**:
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

## 🌐 Deployment (Vercel)
1. Fork this repository or create a new one on GitHub.
2. Link the repository to your Vercel account.
3. Add the following environment variables in Vercel:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. Deploy!

---
Developed by Antigravity AI for Kathcake.
