import os
# Ensure stable thread allocation on Windows for OpenBLAS and Torch
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

import uvicorn

if __name__ == "__main__":
    print("=" * 65)
    print("  CAMPUS PROBLEM INTELLIGENCE (CPI 360) - CAMPUSATHON 2026")
    print("  Starting server at http://127.0.0.1:8000")
    print("=" * 65)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False, access_log=True)
