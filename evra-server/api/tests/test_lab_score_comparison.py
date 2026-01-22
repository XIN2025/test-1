"""
Test script to compare old vs new lab report scoring system
Uses the actual lab report data provided by the user
"""
import sys
import os
import json
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock lab report data from the user's JSON
LAB_REPORT_DATA = {
    "test_title": "Comprehensive Lab Report",
    "test_description": "Complete blood count, metabolic panel, thyroid profile, and HbA1c analysis.",
    "properties": [
        {"property_name": "HbA1C- Glycated Haemoglobin", "value": "5.2", "unit": "%", "reference_range": "Non-diabetic: <= 5.6, Pre-diabetic: 5.7-6.4, Diabetic: >= 6.5", "status": "Normal"},
        {"property_name": "Estimated Average Glucose (eAG)", "value": "103", "unit": "mg/dL", "reference_range": "", "status": "Normal"},
        {"property_name": "Haemoglobin (Hb)", "value": "16.40", "unit": "gm/dL", "reference_range": "13.5-18", "status": "Normal"},
        {"property_name": "Erythrocyte (RBC) Count", "value": "5.67", "unit": "mill/cu.mm", "reference_range": "4.7-6.0", "status": "Normal"},
        {"property_name": "PCV (Packed Cell Volume)", "value": "47.7", "unit": "%", "reference_range": "42-52", "status": "Normal"},
        {"property_name": "MCV (Mean Corpuscular Volume)", "value": "84.1", "unit": "fL", "reference_range": "78-100", "status": "Normal"},
        {"property_name": "MCH (Mean Corpuscular Hb)", "value": "28.9", "unit": "pg", "reference_range": "27-31", "status": "Normal"},
        {"property_name": "MCHC (Mean Corpuscular Hb Concn.)", "value": "34.4", "unit": "gm/dL", "reference_range": "32-36", "status": "Normal"},
        {"property_name": "RDW (Red Cell Distribution Width)", "value": "14.9", "unit": "%", "reference_range": "11.5-14.0", "status": "High"},
        {"property_name": "Total Leucocytes (WBC) Count", "value": "8,550", "unit": "cells/cu.mm", "reference_range": "4000-10500", "status": "Normal"},
        {"property_name": "Absolute Neutrophils Count", "value": "3591", "unit": "cells/cu.mm", "reference_range": "2000-7000", "status": "Normal"},
        {"property_name": "Absolute Lymphocyte Count", "value": "3933", "unit": "cells/cu.mm", "reference_range": "1000-3000", "status": "High"},
        {"property_name": "Absolute Monocyte Count", "value": "855", "unit": "cells/cu.mm", "reference_range": "200-1000", "status": "Normal"},
        {"property_name": "Absolute Eosinophil Count", "value": "86", "unit": "cells/cu.mm", "reference_range": "20-500", "status": "Normal"},
        {"property_name": "Absolute Basophil Count", "value": "86", "unit": "cells/cu.mm", "reference_range": "20-100", "status": "Normal"},
        {"property_name": "Neutrophils", "value": "42", "unit": "%", "reference_range": "40-80", "status": "Normal"},
        {"property_name": "Lymphocytes", "value": "46", "unit": "%", "reference_range": "20-40", "status": "High"},
        {"property_name": "Monocytes", "value": "10", "unit": "%", "reference_range": "2.0-10", "status": "High"},
        {"property_name": "Eosinophils", "value": "1", "unit": "%", "reference_range": "1-6", "status": "Normal"},
        {"property_name": "Basophils", "value": "1", "unit": "%", "reference_range": "0-2", "status": "Normal"},
        {"property_name": "Platelet count", "value": "322800", "unit": "10 3/µL", "reference_range": "150000-450000", "status": "Normal"},
        {"property_name": "MPV (Mean Platelet Volume)", "value": "7.38", "unit": "fL", "reference_range": "6-9.5", "status": "Normal"},
        {"property_name": "PCT ( Platelet Haematocrit)", "value": "0.238", "unit": "%", "reference_range": "0.2-0.5", "status": "Normal"},
        {"property_name": "PDW (Platelet Distribution Width)", "value": "19.5", "unit": "%", "reference_range": "9-17", "status": "High"},
        {"property_name": "Calcium, Serum", "value": "9.3", "unit": "mg/dL", "reference_range": "8.4-10.2", "status": "Normal"},
        {"property_name": "Glucose Fasting", "value": "84", "unit": "mg/dL", "reference_range": "Normal: 70-99, Impaired Fasting Glucose(IFG): 100-125, Diabetes mellitus: >= 126", "status": "Normal"},
        {"property_name": "Cholesterol Total, Serum", "value": "148.00", "unit": "mg/dL", "reference_range": "Desirable: < 200, Borderline High: 200-239, High: >= 240", "status": "Normal"},
        {"property_name": "Triglycerides, Serum", "value": "66", "unit": "mg/dL", "reference_range": "Normal: < 150, Borderline High: 150-199, High: 200-499, Very High: >= 500", "status": "Normal"},
        {"property_name": "HDL Cholesterol Direct", "value": "48", "unit": "mg/dL", "reference_range": "Major risk factor for heart disease: < 40, Negative risk factor for heart disease: >= 60", "status": "Normal"},
        {"property_name": "Non HDL Cholesterol", "value": "100.5", "unit": "mg/dL", "reference_range": "Optimal: < 130, Desirable: 130-159, Borderline high: 159-189, High: 189-220, Very High: >= 220", "status": "Normal"},
        {"property_name": "LDL Cholesterol", "value": "87.3", "unit": "mg/dL", "reference_range": "Optimal: < 100, Near Optimal: 100-129, Borderline high: 130-159, High: 160-189, Very High: >= 190", "status": "Normal"},
        {"property_name": "VLDL Cholesterol", "value": "13.2", "unit": "mg/dL", "reference_range": "6-38", "status": "Normal"},
        {"property_name": "LDL/HDL Ratio", "value": "1.84", "unit": "", "reference_range": "2.5-3.5", "status": "Normal"},
        {"property_name": "Cholesterol / HDL Ratio", "value": "3.12", "unit": "", "reference_range": "3.5-5", "status": "Normal"},
        {"property_name": "Total Protein", "value": "6.98", "unit": "gm/dL", "reference_range": "6.4-8.3", "status": "Normal"},
        {"property_name": "Albumin, Serum", "value": "4.32", "unit": "gm/dL", "reference_range": "3.5-5.2", "status": "Normal"},
        {"property_name": "Globulin", "value": "2.66", "unit": "gm/dL", "reference_range": "1.8-3.6", "status": "Normal"},
        {"property_name": "Albumin/Globulin Ratio", "value": "1.62", "unit": "", "reference_range": "1.1-2.2", "status": "Normal"},
        {"property_name": "Bilirubin Total", "value": "0.78", "unit": "mg/dL", "reference_range": "0.2-1.2", "status": "Normal"},
        {"property_name": "Bilirubin Direct", "value": "0.31", "unit": "mg/dL", "reference_range": "0.0-0.5", "status": "Normal"},
        {"property_name": "Bilirubin- Indirect", "value": "0.47", "unit": "mg/dL", "reference_range": "0.1-1.0", "status": "Normal"},
        {"property_name": "SGPT (ALT)", "value": "10", "unit": "U/L", "reference_range": "0-45", "status": "Normal"},
        {"property_name": "SGOT (AST)", "value": "12", "unit": "U/L", "reference_range": "0-35", "status": "Normal"},
        {"property_name": "Alkaline Phosphatase, Serum", "value": "66", "unit": "U/L", "reference_range": "40-130", "status": "Normal"},
        {"property_name": "Gamma GT (GGTP)", "value": "12", "unit": "U/L", "reference_range": "12-64", "status": "Normal"},
        {"property_name": "Creatinine, Serum", "value": "0.79", "unit": "mg/dL", "reference_range": "0.72-1.25", "status": "Normal"},
        {"property_name": "BUN, Serum", "value": "8.0", "unit": "mg/dL", "reference_range": "8.9-20.6", "status": "Low"},
        {"property_name": "Sodium, Serum", "value": "143", "unit": "mmol/L", "reference_range": "136-145", "status": "Normal"},
        {"property_name": "Potassium, Serum", "value": "4.4", "unit": "mmol/L", "reference_range": "3.5-5.1", "status": "Normal"},
        {"property_name": "Chloride, Serum", "value": "98", "unit": "mmol/L", "reference_range": "98-107", "status": "Normal"},
        {"property_name": "Uric Acid, Serum", "value": "4.4", "unit": "mg/dL", "reference_range": "3.5-7.2", "status": "Normal"},
        {"property_name": "eGFR (CKD-EPI)", "value": "130", "unit": "mL/min/1.73m²", "reference_range": "Normal OR high: >= 90", "status": "Normal"},
        {"property_name": "ESR (Erythrocyte Sedimentation Rate)", "value": "2", "unit": "mm/hr", "reference_range": "0-15", "status": "Normal"},
        {"property_name": "T3 (Total Triiodothyronine)", "value": "96.85", "unit": "ng/dL", "reference_range": "70-204", "status": "Normal"},
        {"property_name": "T4 (Total Thyroxine)", "value": "7.18", "unit": "µg/dL", "reference_range": "5.1-14", "status": "Normal"},
        {"property_name": "TSH (Thyroid Stimulating Hormone) - Ultrasensitive, Serum", "value": "2.532", "unit": "µIU/mL", "reference_range": "0.45-4.5", "status": "Normal"},
    ],
    "test_date": "2025-11-06T00:00:00Z",
    "lab_name": "Bajaj FinseRV Health Limited",
    "doctor_name": "Dr. SHITAL TREVADIA"
}

def calculate_normal_proportion(properties):
    """Calculate proportion of normal values"""
    if not properties:
        return 1.0
    normal_count = sum(1 for prop in properties if prop.get("status", "").lower() in ["normal", ""])
    total_count = len(properties)
    return normal_count / total_count if total_count > 0 else 1.0

def old_scoring_system(lab_report_data, is_not_good=True):
    """Simulate the old scoring system"""
    lab_overall_score = 40
    
    if is_not_good:
        # Old system: fixed penalty
        test_title = lab_report_data.get("test_title", "").lower()
        WEIGHTED_LABS = ["cardiac markers", "cholesterol", "HbA1c"]
        
        if test_title in WEIGHTED_LABS:
            lab_overall_score -= 10
        else:
            lab_overall_score -= 5
    
    lab_overall_score = max(lab_overall_score, 0)
    weighted_lab_score = (lab_overall_score / 40) * 50
    
    return {
        "lab_overall_score": lab_overall_score,
        "weighted_lab_score": weighted_lab_score,
        "penalty_applied": 5 if not (lab_report_data.get("test_title", "").lower() in ["cardiac markers", "cholesterol", "HbA1c"]) else 10
    }

def new_scoring_system(lab_report_data, is_not_good=True):
    """Simulate the new scoring system with proportional penalties"""
    lab_overall_score = 40
    
    if is_not_good:
        properties = lab_report_data.get("properties", [])
        normal_proportion = calculate_normal_proportion(properties)
        
        test_title = lab_report_data.get("test_title", "").lower()
        WEIGHTED_LABS = ["cardiac markers", "cholesterol", "HbA1c"]
        
        # Base penalty
        if test_title in WEIGHTED_LABS:
            base_penalty = 10
        else:
            base_penalty = 5
        
        # Apply proportional reduction
        if normal_proportion >= 0.90:
            penalty = base_penalty * 0.25  # Only 25% of base penalty
        elif normal_proportion >= 0.80:
            penalty = base_penalty * 0.50  # 50% of base penalty
        elif normal_proportion >= 0.70:
            penalty = base_penalty * 0.75  # 75% of base penalty
        else:
            penalty = base_penalty  # Full penalty
        
        lab_overall_score -= penalty
    else:
        penalty = 0
    
    lab_overall_score = max(lab_overall_score, 0)
    weighted_lab_score = (lab_overall_score / 40) * 50
    
    return {
        "lab_overall_score": lab_overall_score,
        "weighted_lab_score": weighted_lab_score,
        "penalty_applied": penalty,
        "normal_proportion": calculate_normal_proportion(lab_report_data.get("properties", []))
    }

def main():
    print("=" * 80)
    print("LAB REPORT SCORING COMPARISON TEST")
    print("=" * 80)
    
    # Analyze the lab report
    properties = LAB_REPORT_DATA.get("properties", [])
    total_count = len(properties)
    normal_count = sum(1 for prop in properties if prop.get("status", "").lower() in ["normal", ""])
    high_count = sum(1 for prop in properties if prop.get("status", "").lower() == "high")
    low_count = sum(1 for prop in properties if prop.get("status", "").lower() == "low")
    normal_proportion = normal_count / total_count if total_count > 0 else 0
    
    print(f"\n📊 Lab Report Analysis:")
    print(f"  Total Properties: {total_count}")
    print(f"  Normal: {normal_count} ({normal_proportion*100:.1f}%)")
    print(f"  High: {high_count}")
    print(f"  Low: {low_count}")
    print(f"  Test Title: {LAB_REPORT_DATA.get('test_title')}")
    
    # Scenario 1: LLM scores as "Not Good" (worst case)
    print(f"\n{'='*80}")
    print("SCENARIO 1: LLM Scores Report as 'Not Good'")
    print(f"{'='*80}")
    
    old_result = old_scoring_system(LAB_REPORT_DATA, is_not_good=True)
    new_result = new_scoring_system(LAB_REPORT_DATA, is_not_good=True)
    
    print(f"\n🔴 OLD SCORING SYSTEM:")
    print(f"  Lab Overall Score: {old_result['lab_overall_score']}/40")
    print(f"  Weighted Lab Score: {old_result['weighted_lab_score']:.2f}/50")
    print(f"  Penalty Applied: -{old_result['penalty_applied']} points (fixed)")
    
    print(f"\n🟢 NEW SCORING SYSTEM:")
    print(f"  Lab Overall Score: {new_result['lab_overall_score']}/40")
    print(f"  Weighted Lab Score: {new_result['weighted_lab_score']:.2f}/50")
    print(f"  Penalty Applied: -{new_result['penalty_applied']:.2f} points (proportional)")
    print(f"  Normal Proportion: {new_result['normal_proportion']*100:.1f}%")
    
    score_improvement = new_result['weighted_lab_score'] - old_result['weighted_lab_score']
    print(f"\n📈 IMPROVEMENT:")
    print(f"  Score Increase: +{score_improvement:.2f} points")
    print(f"  Penalty Reduction: {old_result['penalty_applied'] - new_result['penalty_applied']:.2f} points")
    
    # Scenario 2: LLM scores as "Good" (best case with improved prompt)
    print(f"\n{'='*80}")
    print("SCENARIO 2: LLM Scores Report as 'Good' (with improved prompt)")
    print(f"{'='*80}")
    
    old_result_good = old_scoring_system(LAB_REPORT_DATA, is_not_good=False)
    new_result_good = new_scoring_system(LAB_REPORT_DATA, is_not_good=False)
    
    print(f"\n🔴 OLD SCORING SYSTEM:")
    print(f"  Lab Overall Score: {old_result_good['lab_overall_score']}/40")
    print(f"  Weighted Lab Score: {old_result_good['weighted_lab_score']:.2f}/50")
    
    print(f"\n🟢 NEW SCORING SYSTEM:")
    print(f"  Lab Overall Score: {new_result_good['lab_overall_score']}/40")
    print(f"  Weighted Lab Score: {new_result_good['weighted_lab_score']:.2f}/50")
    
    # Total score comparison (assuming same health_data_score and streak_score)
    # For a user starting at 50, with no health data or streaks:
    # Old: 0 (health_data) + 0 (streak) + 43.75 (lab) = 43.75
    # New (Not Good): 0 + 0 + 48.75 = 48.75
    # New (Good): 0 + 0 + 50 = 50
    
    print(f"\n{'='*80}")
    print("TOTAL EVRA SCORE COMPARISON")
    print("(Assuming: Health Data Score = 0, Streak Score = 0)")
    print(f"{'='*80}")
    
    health_data_score = 0
    streak_score = 0
    
    old_total = health_data_score + streak_score + old_result['weighted_lab_score']
    new_total_not_good = health_data_score + streak_score + new_result['weighted_lab_score']
    new_total_good = health_data_score + streak_score + new_result_good['weighted_lab_score']
    
    print(f"\n🔴 OLD SYSTEM (Not Good):")
    print(f"  Total Score: {old_total:.2f}")
    print(f"  Breakdown: Health Data (0) + Streak (0) + Lab ({old_result['weighted_lab_score']:.2f})")
    
    print(f"\n🟢 NEW SYSTEM (Not Good with proportional penalty):")
    print(f"  Total Score: {new_total_not_good:.2f}")
    print(f"  Breakdown: Health Data (0) + Streak (0) + Lab ({new_result['weighted_lab_score']:.2f})")
    print(f"  Improvement: +{new_total_not_good - old_total:.2f} points")
    
    print(f"\n🟢 NEW SYSTEM (Good - with improved prompt):")
    print(f"  Total Score: {new_total_good:.2f}")
    print(f"  Breakdown: Health Data (0) + Streak (0) + Lab ({new_result_good['weighted_lab_score']:.2f})")
    print(f"  Improvement: +{new_total_good - old_total:.2f} points")
    
    print(f"\n{'='*80}")
    print("SUMMARY")
    print(f"{'='*80}")
    print(f"✅ Improved prompt should score this report as 'Good' (90%+ normal values)")
    print(f"✅ Proportional penalty system reduces unfair penalties for mostly healthy reports")
    print(f"✅ Expected score improvement: +{new_total_good - old_total:.2f} to +{new_total_not_good - old_total:.2f} points")
    print(f"{'='*80}")

if __name__ == "__main__":
    main()

