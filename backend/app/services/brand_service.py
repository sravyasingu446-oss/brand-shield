from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.brand import Brand, BrandAsset
from app.schemas.brand import BrandCreate, BrandUpdate, BrandAssetCreate


class BrandService:
    @staticmethod
    def get_all_brands(db: Session) -> List[Brand]:
        return db.query(Brand).order_by(Brand.created_at.desc()).all()

    @staticmethod
    def get_brand_by_id(db: Session, brand_id: int) -> Optional[Brand]:
        return db.query(Brand).filter(Brand.id == brand_id).first()

    @staticmethod
    def get_brand_by_name(db: Session, name: str) -> Optional[Brand]:
        return db.query(Brand).filter(Brand.name.ilike(name)).first()

    @staticmethod
    def create_brand(db: Session, brand_in: BrandCreate) -> Brand:
        brand = Brand(
            name=brand_in.name,
            organization_name=brand_in.organization_name,
            industry=brand_in.industry,
            description=brand_in.description,
            primary_domain=brand_in.primary_domain,
            logo_url=brand_in.logo_url,
            contact_email=brand_in.contact_email,
            trademark_names=brand_in.trademark_names
        )
        db.add(brand)
        db.commit()
        db.refresh(brand)

        # Add primary domain as initial asset
        domain_asset = BrandAsset(
            brand_id=brand.id,
            asset_type="DOMAIN",
            platform="WEB",
            value=brand.primary_domain,
            is_verified=True,
            notes="Primary verified domain"
        )
        db.add(domain_asset)

        # Add any initial assets passed
        if brand_in.initial_assets:
            for a in brand_in.initial_assets:
                asset = BrandAsset(
                    brand_id=brand.id,
                    asset_type=a.asset_type,
                    platform=a.platform,
                    value=a.value,
                    is_verified=a.is_verified,
                    notes=a.notes
                )
                db.add(asset)

        db.commit()
        db.refresh(brand)
        return brand

    @staticmethod
    def add_asset(db: Session, brand_id: int, asset_in: BrandAssetCreate) -> BrandAsset:
        asset = BrandAsset(
            brand_id=brand_id,
            asset_type=asset_in.asset_type,
            platform=asset_in.platform,
            value=asset_in.value,
            is_verified=asset_in.is_verified,
            notes=asset_in.notes
        )
        db.add(asset)
        db.commit()
        db.refresh(asset)
        return asset

    @staticmethod
    def delete_asset(db: Session, asset_id: int) -> bool:
        asset = db.query(BrandAsset).filter(BrandAsset.id == asset_id).first()
        if asset:
            db.delete(asset)
            db.commit()
            return True
        return False

    @staticmethod
    def delete_brand(db: Session, brand_id: int) -> bool:
        brand = db.query(Brand).filter(Brand.id == brand_id).first()
        if brand:
            db.delete(brand)
            db.commit()
            return True
        return False
