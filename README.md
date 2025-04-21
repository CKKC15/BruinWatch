# BruinWatch

## Setup

Create a `.env` file in the `backend` directory by copying from the example and setting your values:
Make sure `.env` is in `.gitignore`.
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

### Backend

```bash
cd backend
npm install # npm install <dependency> for installing further dependencies
node app.js # start backend
```
