from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "RoadVision API Running"}