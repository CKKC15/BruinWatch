# BruinWatch

Turn your lecture videos into an AI-powered agent that you can chat with!

## Setup

Refer to '.env.example' and create a `.env` file in the `backend` directory.
<br>
Make sure your `.env` file is in `.gitignore`.
```bash
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

### Frontend

```bash
cd frontend
npm install
npm install -D vite # if missing vite installation
npm run dev # start frontend
```
Go to http://localhost:3000/ to see the website.

### Backend

```bash
cd backend
npm install # npm install <dependency> for installing further dependencies
node app.js # start backend
```
Go to http://localhost:5000/ to see the backend API.
