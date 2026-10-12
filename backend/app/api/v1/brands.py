from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.services.brand_service import BrandService
from app.schemas.brand import BrandCreate, BrandResponse, BrandAssetCreate, BrandAssetResponse

router = APIRouter()


@router.get("/", response_model=List[BrandResponse])
def get_brands(db: Session = Depends(get_db)):
    """Retrieve all registered brands."""
    return BrandService.get_all_brands(db)


@router.post("/", response_model=BrandResponse, status_code=201)
def create_brand(brand_in: BrandCreate, db: Session = Depends(get_db)):
    """Register a new brand with official identity and assets."""
    existing = BrandService.get_brand_by_name(db, brand_in.name)
    if existing:
        raise HTTPException(status_code=400, detail=f"Brand with name '{brand_in.name}' is already registered.")
    return BrandService.create_brand(db, brand_in)


@router.get("/{brand_id}", response_model=BrandResponse)
def get_brand(brand_id: int, db: Session = Depends(get_db)):
    """Retrieve brand profile by ID."""
    brand = BrandService.get_brand_by_id(db, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found.")
    return brand


@router.post("/{brand_id}/assets", response_model=BrandAssetResponse, status_code=201)
def add_brand_asset(brand_id: int, asset_in: BrandAssetCreate, db: Session = Depends(get_db)):
    """Register an official brand asset (domain, handle, mobile app)."""
    brand = BrandService.get_brand_by_id(db, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found.")
    return BrandService.add_asset(db, brand_id, asset_in)


@router.delete("/{brand_id}/assets/{asset_id}")
def delete_brand_asset(brand_id: int, asset_id: int, db: Session = Depends(get_db)):
    """Remove an official brand asset."""
    success = BrandService.delete_asset(db, asset_id)
    if not success:
        raise HTTPException(status_code=404, detail="Asset not found.")
    return {"message": "Asset removed successfully."}


@router.delete("/{brand_id}")
def delete_brand(brand_id: int, db: Session = Depends(get_db)):
    """Delete a brand profile and all associated data."""
    success = BrandService.delete_brand(db, brand_id)
    if not success:
        raise HTTPException(status_code=404, detail="Brand not found.")
    return {"message": "Brand deleted successfully."}
