import os
# Ensure stable thread allocation on Windows for OpenBLAS and Torch
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

import uvicorn

if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 8000))
    print("=" * 65)
    print("  CAMPUS PROBLEM INTELLIGENCE (CPI 360) - CAMPUSATHON 2026")
    print(f"  Starting server on {host}:{port}")
    print("=" * 65)
    uvicorn.run("app.main:app", host=host, port=port, reload=False, access_log=True)
