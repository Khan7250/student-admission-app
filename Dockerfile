FROM node:20-alpine

# Set the working directory
WORKDIR /app

# 1. Install and Build Frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# 2. Install Backend Dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install
COPY backend/ ./backend/

# 3. Expose the port your Express server uses
EXPOSE 5000

# 4. Set persistent environment variables
ENV PORT=5000
# This points the SQLite DB to the persistent volume we will create
ENV DATABASE_PATH=/data/database.sqlite

# 5. Start the server
CMD ["node", "backend/server.js"]
