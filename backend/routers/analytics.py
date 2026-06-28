from fastapi import APIRouter, Depends
from collections import defaultdict
from datetime import datetime
from database import get_db
from models import AnalyticsOut, UserRole
from auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


@router.get("", response_model=AnalyticsOut)
async def get_analytics(db=Depends(get_db), current_user=Depends(get_current_user)):
    if current_user["role"] not in (UserRole.ADMIN.value, UserRole.INSPECTOR.value):
        # Citizens get limited stats from reports endpoint; still allow read for dashboards
        pass

    reports = await db.reports.find({}).to_list(length=1000)

    damage_by_type: dict[str, int] = defaultdict(int)
    city_wise: dict[str, int] = defaultdict(int)
    severity_dist: dict[str, int] = defaultdict(int)
    monthly: dict[str, int] = defaultdict(int)
    repair_monthly: dict[str, dict[str, int]] = defaultdict(lambda: {"completed": 0, "assigned": 0})

    for r in reports:
        damage_by_type[r["damageType"]] += 1
        city_wise[r["location"]["city"]] += 1
        severity_dist[r["severity"]] += 1

        try:
            dt = datetime.fromisoformat(r["createdAt"].replace("Z", "+00:00"))
            month_key = MONTH_LABELS[dt.month - 1]
            monthly[month_key] += 1
            if r["status"] in ("assigned", "in_progress", "completed"):
                repair_monthly[month_key]["assigned"] += 1
            if r["status"] == "completed":
                repair_monthly[month_key]["completed"] += 1
        except (ValueError, TypeError):
            pass

    return {
        "damageByType": [{"type": k, "count": v} for k, v in damage_by_type.items()],
        "monthlyReports": [{"month": m, "count": monthly.get(m, 0)} for m in MONTH_LABELS[:6]],
        "cityWiseDamage": [{"city": k, "count": v} for k, v in city_wise.items()],
        "repairCompletion": [
            {"month": m, "completed": repair_monthly[m]["completed"], "assigned": repair_monthly[m]["assigned"]}
            for m in MONTH_LABELS[:6]
        ],
        "severityDistribution": [{"severity": k, "count": v} for k, v in severity_dist.items()],
    }
