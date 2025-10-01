cd frontend
npm run dev &
cd ..

export PORT=5173 && python desktop.py
#uvicorn \
#  --reload \
#  --host 127.0.0.1 \
#  --port 8000 \
#  --log-level debug \
#  --reload-dir . \
#  backend.main:app
