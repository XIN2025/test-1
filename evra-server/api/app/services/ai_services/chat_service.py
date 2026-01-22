import asyncio
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict, field
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
import logging
from datetime import datetime, date, timezone, timedelta
from zoneinfo import ZoneInfo

from app.config import OPENAI_API_KEY, LLM_MODEL, LLM_TEMPERATURE
from app.services.ai_services.mongodb_vectorstore import get_vector_store
from app.utils.ai.prompts import ChatPrompts
from app.services.backend_services.db import get_db
from app.services.ai_services.lab_report_service import get_lab_report_service
from app.services.backend_services.health_alert_service import get_health_alert_service
from app.services.ai_services.memory_service import get_memory_service
from app.services.ai_services.personalization_profile_service import get_personalization_profile_service
from app.services.backend_services.mealogic_service import get_mealogic_service

logger = logging.getLogger(__name__)

@dataclass
class ChatState:
    query: str
    user_email: str
    context: List[str]
    response: str = ""
    follow_up_questions: List[str] = field(default_factory=list)
    reasoning: str = ""
    conversation_history: List[Dict[str, str]] = field(default_factory=list)
    is_health_related: bool = True
    memories: List[Dict[str, Any]] = None
    health_type: str = "NONE"  # SYMPTOM | WELLNESS | INFORMATIONAL | NONE
    medical_risk_level: str = "LOW"  # LOW | MODERATE | HIGH
    personalization_profile: Optional[Dict[str, Any]] = None
    meal_recommendations: Optional[str] = None  # MealoLogic meal block for LLM (must be in dataclass so LangGraph carries it)  


class ChatService:
    def __init__(self):
        self.llm = ChatOpenAI(
            model=LLM_MODEL,
            openai_api_key=OPENAI_API_KEY,
            temperature=float(LLM_TEMPERATURE),
        )
        self.vector_store = get_vector_store()
        self.db = get_db()
        self.user_collection = self.db["users"]
        self.preferences_collection = self.db["preferences"]
        self.lab_report_service = get_lab_report_service()
        self.health_alert_service = get_health_alert_service()
        self.memory_service = get_memory_service()
        self.personalization_service = get_personalization_profile_service()
        self.mealogic_service = get_mealogic_service()
        self.graph = self._build_graph()

    def _format_health_data_for_llm(
        self, health_data: Any, user_timezone: str
    ) -> str:
        """
        Converts raw HealthData (with UTC timestamps) into a localized, AI-friendly string.
        This ensures the LLM receives dates/times in the user's local timezone.
    
        """
        if not health_data:
            return ""
        
        try:
            tz_str = str(user_timezone).replace(" ", "_")
            local_tz = ZoneInfo(tz_str)
        except Exception:
            logger.warning(f"Invalid timezone '{tz_str}', defaulting to UTC")
            local_tz = ZoneInfo("UTC")
        
        def is_metric_available(metric_name: str) -> bool:
            """Check if any hourly data entry has this metric available"""
            if not health_data.hourly_data:
                return False
            for hour_data in health_data.hourly_data:
                if not hour_data.data:
                    continue
                metric = getattr(hour_data.data, metric_name, None)
                if metric and getattr(metric, 'isAvailable', False):
                    return True
            return False
        
        health_parts = []
        summary = health_data.aggregated_summary
        
        if summary and summary.date:
            # Convert UTC date to local timezone
            utc_date = summary.date
            if utc_date.tzinfo is None:
                # If naive datetime, assume UTC
                utc_date = utc_date.replace(tzinfo=timezone.utc)
            elif utc_date.tzinfo != timezone.utc:
                # Convert to UTC first if it's in another timezone
                utc_date = utc_date.astimezone(timezone.utc)
            
            local_date = utc_date.astimezone(local_tz)
            # Format nicely (e.g., "Sunday, Jan 4, 2026")
            date_str = local_date.strftime("%A, %B %d, %Y")
            time_str = local_date.strftime("%I:%M %p")
            
            health_parts.append(f"Health Data for {date_str} (Last sync: {time_str}):")
        else:
            health_parts.append("Health Data:")
        
        if summary:
            # Steps - can be 0, just check if available
            if summary.step and summary.step.total is not None and is_metric_available('steps'):
                health_parts.append(f"  • Total Steps: {summary.step.total:,}")
            
            # Heart Rate - must be available and > 0
            if (summary.heartRate and is_metric_available('heartRate') and 
                summary.heartRate.average and summary.heartRate.average > 0):
                max_hr = summary.heartRate.max if summary.heartRate.max is not None else 0
                min_hr = summary.heartRate.min if summary.heartRate.min is not None else 0
                health_parts.append(
                    f"  • Heart Rate: Avg {summary.heartRate.average:.0f} bpm "
                    f"(Max: {max_hr:.0f}, Min: {min_hr:.0f})"
                )
            
            # Active Energy - can be 0, just check if available
            if (summary.activeEnergy and summary.activeEnergy.total is not None and 
                is_metric_available('activeEnergy')):
                health_parts.append(f"  • Active Energy: {summary.activeEnergy.total:.0f} kcal")
            
            # Sleep - can be 0, just check if available
            if (summary.sleep and summary.sleep.totalHours is not None and 
                is_metric_available('sleep')):
                health_parts.append(f"  • Sleep: {summary.sleep.totalHours:.2f} hours")
            
            # Weight - must be available and > 0
            if (summary.weight and summary.weight.value and summary.weight.value > 0 and 
                is_metric_available('weight')):
                health_parts.append(f"  • Weight: {summary.weight.value:.2f} {summary.weight.unit}")
            
            # Body Fat - must be available and > 0
            if (summary.bodyFat and summary.bodyFat.value and summary.bodyFat.value > 0 and 
                is_metric_available('bodyFat')):
                health_parts.append(f"  • Body Fat: {summary.bodyFat.value:.2f} {summary.bodyFat.unit}")
            
            # Blood Glucose - must be available and > 0
            if (summary.bloodGlucose and is_metric_available('bloodGlucose') and 
                summary.bloodGlucose.average and summary.bloodGlucose.average > 0):
                max_bg = summary.bloodGlucose.max if summary.bloodGlucose.max is not None else 0
                min_bg = summary.bloodGlucose.min if summary.bloodGlucose.min is not None else 0
                health_parts.append(
                    f"  • Blood Glucose: Avg {summary.bloodGlucose.average:.2f} mg/dL "
                    f"(Max: {max_bg:.2f}, Min: {min_bg:.2f})"
                )
            
            # Oxygen Saturation - must be available and > 0
            if (summary.oxygenSaturation and is_metric_available('oxygenSaturation') and 
                summary.oxygenSaturation.average and summary.oxygenSaturation.average > 0):
                max_o2 = summary.oxygenSaturation.max if summary.oxygenSaturation.max is not None else 0
                min_o2 = summary.oxygenSaturation.min if summary.oxygenSaturation.min is not None else 0
                health_parts.append(
                    f"  • Oxygen Saturation: Avg {summary.oxygenSaturation.average:.1f}% "
                    f"(Max: {max_o2:.1f}%, Min: {min_o2:.1f}%)"
                )
        
        if health_data.hourly_data:
            recent_hours = health_data.hourly_data[-5:]
            health_parts.append(f"\n  Recent Hourly Data (Last {len(recent_hours)} hours):")
            
            for hour_data in recent_hours:
                if hour_data.created_at:
                    utc_time = hour_data.created_at
                    if utc_time.tzinfo is None:
                        utc_time = utc_time.replace(tzinfo=timezone.utc)
                    elif utc_time.tzinfo != timezone.utc:
                        utc_time = utc_time.astimezone(timezone.utc)
                    
                    local_time = utc_time.astimezone(local_tz)
                    hour_time = local_time.strftime("%I:%M %p")
                    day_str = local_time.strftime("%b %d")
                    if summary and summary.date:
                        main_local = summary.date.astimezone(local_tz) if summary.date.tzinfo else summary.date.replace(tzinfo=timezone.utc).astimezone(local_tz)
                        if local_time.date() != main_local.date():
                            hour_time = f"{day_str} {hour_time}"
                else:
                    hour_time = 'N/A'
                
                hour_metrics = []
                if hour_data.data:
                    # Only include metrics that are actually available
                    if hour_data.data.steps and getattr(hour_data.data.steps, 'isAvailable', False):
                        steps_val = getattr(hour_data.data.steps, 'value', None)
                        if steps_val is not None and isinstance(steps_val, (int, float)):
                            hour_metrics.append(f"Steps: {int(steps_val)}")
                    
                    if hour_data.data.heartRate and getattr(hour_data.data.heartRate, 'isAvailable', False):
                        hr_val = getattr(hour_data.data.heartRate, 'value', None)
                        if hr_val is not None and isinstance(hr_val, (int, float)) and hr_val > 0:
                            hour_metrics.append(f"HR: {int(hr_val)} bpm")
                    
                    if hour_data.data.sleep and getattr(hour_data.data.sleep, 'isAvailable', False):
                        sleep_val = getattr(hour_data.data.sleep, 'value', None)
                        if sleep_val is not None and isinstance(sleep_val, (int, float)) and sleep_val > 0:
                            hour_metrics.append(f"Sleep: {sleep_val:.2f}h")
                
                if hour_metrics:
                    health_parts.append(f"    [{hour_time}] {', '.join(hour_metrics)}")
        
        return "\n".join(health_parts) if health_parts else ""

    def _format_historical_health_data_for_llm(
        self, health_docs: List[Dict[str, Any]], user_timezone: str,
        metrics_to_include: List[str] = ["sleep", "steps", "heartRate"]
    ) -> str:
        """
        Efficiently converts a list of historical health data documents into a localized timeline string.
        Uses only aggregated_summary data (no hourly_data) for efficiency.
        
        """
        if not health_docs:
            return ""
        
        try:
            tz_str = str(user_timezone).replace(" ", "_")
            local_tz = ZoneInfo(tz_str)
        except Exception:
            logger.warning(f"Invalid timezone '{tz_str}', defaulting to UTC")
            local_tz = ZoneInfo("UTC")
        
        context_lines = []
        
        for doc in health_docs:
            summary = doc.get("aggregated_summary", {})
            if not summary:
                continue
            
            utc_date_val = summary.get("date")
            if not utc_date_val:
                utc_date_val = doc.get("created_at")
                if not utc_date_val:
                    continue
            
            # Handle string dates
            if isinstance(utc_date_val, str):
                try:
                    utc_date_val = datetime.fromisoformat(utc_date_val.replace("Z", "+00:00"))
                except Exception:
                    continue
            
            if utc_date_val.tzinfo is None:
                utc_date_val = utc_date_val.replace(tzinfo=timezone.utc)
            elif utc_date_val.tzinfo != timezone.utc:
                utc_date_val = utc_date_val.astimezone(timezone.utc)
            
            local_date = utc_date_val.astimezone(local_tz)
            date_str = local_date.strftime("%b %d") 
            
            parts = [f"{date_str}:"]
            
            if "sleep" in metrics_to_include:
                sleep_val = summary.get("sleep", {}).get("totalHours", 0)
                if sleep_val is not None and isinstance(sleep_val, (int, float)) and sleep_val > 0:
                    parts.append(f"Sleep {sleep_val:.1f}h")
            
            if "steps" in metrics_to_include:
                steps_val = summary.get("step", {}).get("total", 0)
                if steps_val is not None and isinstance(steps_val, (int, float)) and steps_val > 0:
                    parts.append(f"Steps {int(steps_val):,}")
            
            if "heartRate" in metrics_to_include:
                hr_val = summary.get("heartRate", {}).get("average", 0)
                if hr_val is not None and isinstance(hr_val, (int, float)) and hr_val > 0:
                    parts.append(f"Avg HR {int(hr_val)}")
            
            if "activeEnergy" in metrics_to_include:
                energy_val = summary.get("activeEnergy", {}).get("total", 0)
                if energy_val is not None and isinstance(energy_val, (int, float)) and energy_val > 0:
                    parts.append(f"Energy {int(energy_val)}kcal")
            
            if "weight" in metrics_to_include:
                weight_val = summary.get("weight", {}).get("value", 0)
                if weight_val is not None and isinstance(weight_val, (int, float)) and weight_val > 0:
                    weight_unit = summary.get("weight", {}).get("unit", "kg")
                    parts.append(f"Weight {weight_val:.1f}{weight_unit}")
            
            if "bloodGlucose" in metrics_to_include:
                bg_val = summary.get("bloodGlucose", {}).get("average", 0)
                if bg_val is not None and isinstance(bg_val, (int, float)) and bg_val > 0:
                    parts.append(f"BG {bg_val:.1f}mg/dL")
            
            if "oxygenSaturation" in metrics_to_include:
                o2_val = summary.get("oxygenSaturation", {}).get("average", 0)
                if o2_val is not None and isinstance(o2_val, (int, float)) and o2_val > 0:
                    parts.append(f"SpO2 {int(o2_val)}%")
            
            if len(parts) > 1:  
                context_lines.append(" | ".join(parts))
        
        if not context_lines:
            return ""
        
        return "\n".join(context_lines)

    def _build_graph(self) -> StateGraph:
        workflow = StateGraph(ChatState)
        workflow.add_node("health_relevance_check", self._health_relevance_check_node)
        workflow.add_node("context_retrieval", self._context_retrieval_node)
        workflow.add_node("response_generation", self._response_generation_node)
        workflow.add_node("follow_up_generation", self._follow_up_generation_node)
        workflow.set_entry_point("health_relevance_check")
        
        workflow.add_conditional_edges(
            "health_relevance_check",
            self._route_after_health_check,
            {
                "health_related": "context_retrieval",
                "not_health_related": "response_generation"
            }
        )
        
        workflow.add_edge("context_retrieval", "response_generation")
        workflow.add_edge("response_generation", "follow_up_generation")
        workflow.add_edge("follow_up_generation", END)
        return workflow.compile()
    
    def _route_after_health_check(self, state: ChatState) -> str:
        """Route based on health relevance classification"""
        if isinstance(state, dict): 
            state = ChatState(**state)
        
        # Use the boolean flag for routing
        if not state.is_health_related:
            return "not_health_related"
        else:
            return "health_related"

    async def _health_relevance_check_node(self, state: ChatState) -> dict:
        if isinstance(state, dict):
            state = ChatState(**state)

        logger.info(f"🛡️ [GUARDRAILS] Advanced health intent analysis for: '{state.query}'")

        context_info = ""
        
        if state.conversation_history and len(state.conversation_history) > 0:
            recent_history = state.conversation_history[-4:]  
            history_text = "\n".join([
                f"{msg.get('role', 'user').upper()}: {msg.get('content', '')}" 
                for msg in recent_history
            ])
            context_info += f"\n\nRECENT CONVERSATION CONTEXT:\n{history_text}\n"
        
        if state.memories and len(state.memories) > 0:
            memory_texts = []
            for mem in state.memories[:5]:  
                if isinstance(mem, str):
                    memory_texts.append(mem)
                elif isinstance(mem, dict):
                    mem_content = mem.get("memory", "") or mem.get("content", "") or mem.get("text", "")
                    if mem_content:
                        memory_texts.append(mem_content)
            
            if memory_texts:
                memories_str = "\n".join([f"- {m}" for m in memory_texts])
                context_info += f"\n\nUSER'S STORED PREFERENCES/CONTEXT:\n{memories_str}\n"

        classification_prompt = f"""
    You are a healthcare intent classifier for a clinical health assistant named EVRA.

    Analyze the user's CURRENT query along with the conversation context and stored preferences.

    IMPORTANT: If the query references previous conversation context (e.g., "my plan", "should I change it", "what about that"), 
    use the conversation history and stored preferences to understand what they're referring to.

    {context_info}

    CURRENT USER QUERY:
    "{state.query}"

    Return JSON with the following structure:

    {{
    "intent": "HEALTH" | "NOT_HEALTH",
    "health_type": "SYMPTOM" | "WELLNESS" | "INFORMATIONAL" | "NONE",
    "medical_risk_level": "LOW" | "MODERATE" | "HIGH"
    }}

    Definitions:

    HEALTH intent includes:
    - Symptoms, illness, pain, discomfort
    - Mental health concerns
    - Sleep, fatigue, stress, lifestyle changes
    - Fitness, diet, nutrition, meal planning, eating patterns
    - Exercise routines, workout programs, physical activity
    - Questions about medical conditions or prevention
    - Follow-up questions about previously discussed health topics
    - References to health plans, routines, or goals mentioned earlier

    NOT_HEALTH includes:
    - Sports scores, celebrities, entertainment, trivia, current events, politics, general knowledge
    - Topics completely unrelated to health/wellness

    health_type meanings:
    - SYMPTOM → user describing how they feel physically or mentally
    - WELLNESS → lifestyle improvement, fitness, nutrition, prevention
    - INFORMATIONAL → medical curiosity, learning about health topics
    - NONE → not health related

    medical_risk_level:
    - HIGH → severe symptoms, urgent risk (chest pain, breathlessness, fainting)
    - MODERATE → concerning but not critical
    - LOW → general or mild concerns

    Respond ONLY with valid JSON, no explanation.
    """

        try:
            response = await self.llm.ainvoke([HumanMessage(content=classification_prompt)])
            import json
            result = json.loads(response.content.strip())

            intent = result.get("intent")
            state.health_type = result.get("health_type", "NONE")
            state.medical_risk_level = result.get("medical_risk_level", "LOW")

            if intent == "HEALTH":
                state.is_health_related = True
                state.reasoning = f"Health intent detected ({state.health_type}, risk: {state.medical_risk_level})"
                return asdict(state)

            state.is_health_related = False
            state.response = (
                "I'm EVRA, your health companion 🩺 I focus on health, medical, sleep, "
                "fitness and wellbeing topics. For general information like sports or trivia, "
                "please use a general-purpose assistant."
            )
            state.context = []
            state.follow_up_questions = []
            state.reasoning = "Non-health intent detected"
            return asdict(state)

        except Exception as e:
            logger.error(f"❌ Guardrail parsing failure: {e}")
            state.is_health_related = True
            state.health_type = "INFORMATIONAL"
            state.medical_risk_level = "LOW"
            state.reasoning = "Classifier fallback"
            return asdict(state)

    async def _context_retrieval_node(self, state: ChatState) -> dict:
        if isinstance(state, dict): state = ChatState(**state)
        logger.info(f"🔍 [CONTEXT RETRIEVAL] Starting context retrieval for query: '{state.query}'")
        
        # Fetch all context in parallel
        async def fetch_vector_context():
            try:
                # Vector store search is synchronous, run it in thread pool to avoid blocking
                relevant_docs = await asyncio.to_thread(
                    self.vector_store.search,
                    state.query,
                    state.user_email,
                    10
                )
                logger.info(f"🔍 [CONTEXT RETRIEVAL] Retrieved {len(relevant_docs)} docs from vector store")
                context_pieces = [doc.get("text", "") for doc in relevant_docs if doc.get("text", "").strip()]
                return context_pieces
            except Exception as e:
                logger.error(f"❌ [CONTEXT RETRIEVAL] Error during vector context retrieval: {e}", exc_info=True)
                return []
        
        async def fetch_user():
            try:
                user = await self.user_collection.find_one({"email": state.user_email})
                return user
            except Exception as e:
                logger.error(f"❌ [CONTEXT RETRIEVAL] Error fetching user data: {e}")
                return None
        
        async def fetch_intake_form():
            try:
                intake = await self.preferences_collection.find_one({"email": state.user_email})
                if not intake:
                    return None
                return intake
            except Exception as e:
                logger.error(f"❌ [CONTEXT RETRIEVAL] Error fetching intake form: {e}")
                return None
        
        async def fetch_lab_reports():
            try:
                reports = await self.lab_report_service.get_lab_reports_by_user(state.user_email)
                if not reports:
                    return []
                # Get detailed reports for summary (limit to 5 most recent) - fetch in parallel
                report_tasks = [
                    self.lab_report_service.get_lab_report_by_id(report_summary.id, state.user_email)
                    for report_summary in reports[:5]
                ]
                detailed_results = await asyncio.gather(*report_tasks, return_exceptions=True)
                detailed_reports = []
                for result in detailed_results:
                    if isinstance(result, Exception):
                        logger.warning(f"Error fetching detailed lab report: {result}")
                        continue
                    if result:
                        detailed_reports.append(result)
                return detailed_reports
            except Exception as e:
                logger.error(f"❌ [CONTEXT RETRIEVAL] Error fetching lab reports: {e}")
                return []
        
        async def fetch_health_data():
            try:
                health_data = await self.health_alert_service.get_latest_health_data_by_user_email(state.user_email)
                return health_data
            except Exception as e:
                logger.error(f"❌ [CONTEXT RETRIEVAL] Error fetching health data: {e}")
                return None
        
        async def fetch_historical_health_data():
            """
            Fetch historical health data if the query seems to ask for trends/history.
            This is optional and can be triggered based on query analysis.
            """
            try:
                query_lower = state.query.lower()
                historical_keywords = ["week", "month", "days", "recent", "trend", "history", "over time", "past"]
                
                days = 7  
                if any(kw in query_lower for kw in ["month", "30"]):
                    days = 30
                elif any(kw in query_lower for kw in ["week", "7"]):
                    days = 7
                elif any(kw in query_lower for kw in ["days", "day"]):
                    import re
                    day_matches = re.findall(r'(\d+)\s*days?', query_lower)
                    if day_matches:
                        days = min(int(day_matches[0]), 90)  
                if any(kw in query_lower for kw in historical_keywords):
                    historical_docs = await self.health_alert_service.get_historical_health_data(
                        state.user_email, days=days
                    )
                    if historical_docs:
                        logger.info(f"📊 [CONTEXT RETRIEVAL] Fetched {len(historical_docs)} days of historical health data")
                    return historical_docs
                return []
            except Exception as e:
                logger.error(f"❌ [CONTEXT RETRIEVAL] Error fetching historical health data: {e}")
                return []
        
        async def fetch_personalization_profile():
            """Fetch or generate personalization profile if needed."""
            try:
                should_generate, reason = await self.personalization_service.should_generate_profile(state.user_email)
                
                if should_generate:
                    logger.info(f"🎯 [PERSONALIZATION] Generating new profile: {reason}")
                    try:
                        profile = await self.personalization_service.generate_profile(state.user_email)
                        logger.info(f"✅ [PERSONALIZATION] Profile generated successfully")
                        return profile
                    except Exception as e:
                        logger.warning(f"⚠️ [PERSONALIZATION] Failed to generate profile: {e}")
                        return None
                else:
                    profile = await self.personalization_service.get_cached_profile(state.user_email)
                    if profile:
                        logger.info(f"✅ [PERSONALIZATION] Using cached profile (reason: {reason})")
                    else:
                        logger.info(f"ℹ️ [PERSONALIZATION] No profile available (reason: {reason})")
                    return profile
            except Exception as e:
                logger.warning(f"⚠️ [PERSONALIZATION] Error handling profile: {e}")
                return None
        
        async def fetch_meal_recommendations():
            """Fetch meal recommendations from MealoLogic based on user's zip code."""
            try:
                return await self.mealogic_service.get_meal_recommendations(state.user_email)
            except Exception as e:
                logger.error("[MealoLogic] fetch_meal_recommendations error: %s", e)
                return None
        
        # Fetch all in parallel
        results = await asyncio.gather(
            fetch_vector_context(),
            fetch_user(),
            fetch_intake_form(),
            fetch_lab_reports(),
            fetch_health_data(),
            fetch_personalization_profile(),
            fetch_historical_health_data(),
            fetch_meal_recommendations(),
            return_exceptions=True
        )
        
        # Unpack results with error handling
        context_pieces = results[0] if not isinstance(results[0], Exception) else []
        user_data = results[1] if not isinstance(results[1], Exception) else None
        intake_data = results[2] if not isinstance(results[2], Exception) else None
        lab_reports = results[3] if not isinstance(results[3], Exception) else []
        health_data = results[4] if not isinstance(results[4], Exception) else None
        personalization_profile = results[5] if not isinstance(results[5], Exception) else None
        historical_health_data = results[6] if not isinstance(results[6], Exception) else []
        meal_recommendations = results[7] if not isinstance(results[7], Exception) else None
        
        # Store context in state
        if context_pieces:
            logger.info(f"✅ [CONTEXT RETRIEVAL] Extracted {len(context_pieces)} non-empty context pieces.")
        else:
            logger.warning("⚠️ [CONTEXT RETRIEVAL] No context found after search.")
        
        state.context = context_pieces
        state.reasoning = f"Retrieved {len(context_pieces)} relevant text chunks from vector store."
        
        # Store additional data in state for use in response generation
        if user_data:
            state._user_data = user_data
        if intake_data:
            state._intake_data = intake_data
        if lab_reports:
            state._lab_reports = lab_reports
        if health_data:
            state._health_data = health_data
        if personalization_profile:
            state.personalization_profile = personalization_profile
            logger.info(f"✅ [PERSONALIZATION] Profile added to state")
        
        state.meal_recommendations = meal_recommendations

        result_dict = asdict(state)
        if hasattr(state, '_user_data'):
            result_dict['_user_data'] = state._user_data
        if hasattr(state, '_intake_data'):
            result_dict['_intake_data'] = state._intake_data
        if hasattr(state, '_lab_reports'):
            result_dict['_lab_reports'] = state._lab_reports
        if hasattr(state, '_health_data'):
            result_dict['_health_data'] = state._health_data
        if historical_health_data:
            state._historical_health_data = historical_health_data
            result_dict['_historical_health_data'] = historical_health_data

        logger.info(f"✅ [CONTEXT RETRIEVAL] Retrieved vector docs + intake form + {len(lab_reports)} lab reports + health data + {len(historical_health_data)} days historical data + meal_recommendations={'yes' if meal_recommendations else 'no'}")
        return result_dict

    async def _response_generation_node(self, state: ChatState) -> dict:
        # Handle dict input and preserve underscore attributes
        if isinstance(state, dict):
            # Preserve underscore attributes before converting
            intake_data = state.get('_intake_data')
            lab_reports = state.get('_lab_reports', [])
            health_data = state.get('_health_data')
            user_data = state.get('_user_data')
            historical_health_data = state.get('_historical_health_data', [])
            
            state = ChatState(**{k: v for k, v in state.items() if not k.startswith('_')})
            
            if intake_data:
                state._intake_data = intake_data
            if lab_reports:
                state._lab_reports = lab_reports
            if health_data:
                state._health_data = health_data
            if user_data:
                state._user_data = user_data
            if historical_health_data:
                state._historical_health_data = historical_health_data
        
        if not state.is_health_related and state.response:
            logger.info(f"💬 [RESPONSE GENERATION] Non-health query with template response already set, skipping generation: '{state.query}'")
            return asdict(state)
        
        logger.info(f"💬 [RESPONSE GENERATION] Starting response generation for query: '{state.query}'")
        logger.info(f"💬 [RESPONSE GENERATION] Context pieces available: {len(state.context)}")

        user_context = "Patient details are not available."
        # Use pre-fetched user data if available (from context retrieval node)
        user = getattr(state, '_user_data', None)
        
        if not user:
            # Fallback: fetch user if not already fetched
            try:
                user = await self.user_collection.find_one({"email": state.user_email})
            except Exception as e:
                logger.error(f"❌ [RESPONSE GENERATION] Error fetching user data for {state.user_email}: {e}")
                user = None
        
        if user:
            def calculate_age(dob_str):
                if not dob_str: return "unknown"
                try:
                    dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
                    today = date.today()
                    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                except (ValueError, TypeError): return "unknown"
            
            user_name = user.get("name", "User")
            date_of_birth = user.get("date_of_birth")
            age = calculate_age(date_of_birth)
            blood_type = user.get("blood_type", "unknown")
            user_context = f"Patient's name is {user_name}. Age is {age}. Blood type is {blood_type}."
            logger.info(f"💬 [RESPONSE GENERATION] Found user context: {user_context}")
        else:
            logger.warning(f"⚠️ [RESPONSE GENERATION] User with email {state.user_email} not found in 'users' collection.")

        # Build additional context sections
        intake_form_context = ""
        lab_report_summary = ""
        health_data_context = ""
        
        # Format intake form data
        intake_data = getattr(state, '_intake_data', None)
        if intake_data:
            intake_parts = []
            if intake_data.get("age"):
                intake_parts.append(f"Age: {intake_data['age']}")
            if intake_data.get("gender"):
                intake_parts.append(f"Gender: {intake_data['gender']}")
            if intake_data.get("healthGoals"):
                goals = ", ".join(intake_data.get("healthGoals", []))
                intake_parts.append(f"Health Goals: {goals}")
            if intake_data.get("conditions"):
                conditions = ", ".join(intake_data.get("conditions", []))
                intake_parts.append(f"Current Conditions: {conditions}")
            if intake_data.get("atRiskConditions"):
                at_risk = ", ".join(intake_data.get("atRiskConditions", []))
                intake_parts.append(f"At-Risk Conditions: {at_risk}")
            if intake_data.get("communicationStyle"):
                intake_parts.append(f"Communication Style: {intake_data['communicationStyle']}")
            
            if intake_parts:
                intake_form_context = "\n".join(intake_parts)
        
        # Generate lab report summary
        lab_reports = getattr(state, '_lab_reports', [])
        if lab_reports:
            try:
                # Build summary of lab reports
                reports_text = []
                for report in lab_reports:
                    report_info = f"Test: {report.test_title}\n"
                    if report.test_date:
                        report_info += f"Date: {report.test_date.strftime('%Y-%m-%d')}\n"
                    if report.test_description:
                        report_info += f"Description: {report.test_description}\n"
                    report_info += "Key Results:\n"
                    
                    # Include notable results (abnormal or important values)
                    notable_props = []
                    properties = getattr(report, 'properties', []) or []
                    for prop in properties[:15]:
                        status = getattr(prop, 'status', None)
                        name = getattr(prop, 'property_name', 'Unknown')
                        value = getattr(prop, 'value', 'N/A')
                        if status and str(status).lower() in ['high', 'low', 'abnormal', 'critical']:
                            notable_props.append(f"  - {name}: {value} ({status})")
                        elif len(notable_props) < 5:  # Include some normal values too
                            notable_props.append(f"  - {name}: {value}")
                    
                    report_info += "\n".join(notable_props[:10])  # Limit to 10 results per report
                    reports_text.append(report_info)
                
                if reports_text:
                    # Generate AI summary
                    summary_prompt = f"""Summarize the following lab reports in a concise format (2-3 paragraphs max) that highlights:
1. Key findings and any abnormalities
2. Overall health trends
3. Areas that may need attention

Lab Reports:
{chr(10).join(reports_text)}

Provide a concise, actionable summary focusing on the most important insights."""
                    
                    summary_response = await self.llm.ainvoke([HumanMessage(content=summary_prompt)])
                    lab_report_summary = summary_response.content.strip()
            except Exception as e:
                logger.error(f"❌ [RESPONSE GENERATION] Error generating lab report summary: {e}")
                # Fallback to basic summary
                lab_report_summary = f"Lab Reports Available: {len(lab_reports)} recent test(s)."
        
        user_timezone = "UTC"  
        if getattr(state, '_user_data', None):
            user_timezone = state._user_data.get("timezone", "UTC")
        
        health_data = getattr(state, '_health_data', None)
        if health_data:
            health_data_context = self._format_health_data_for_llm(health_data, user_timezone)
        else:
            health_data_context = ""
        
        historical_health_data = getattr(state, '_historical_health_data', None)
        historical_context = ""
        if historical_health_data:
            historical_context = self._format_historical_health_data_for_llm(
                historical_health_data, user_timezone
            )
            if historical_context:
                health_data_context = (health_data_context + "\n\nHistorical Trends:\n" + historical_context) if health_data_context else ("Historical Trends:\n" + historical_context)

        # Format memories for prompt
        memories = getattr(state, 'memories', []) or []
        
        communication_style = ""
        if intake_data and intake_data.get("communicationStyle"):
            communication_style = intake_data.get("communicationStyle")
            logger.info(f"💬 [RESPONSE GENERATION] Using communication style: {communication_style}")
        
        personalization_context = ""
        if state.personalization_profile:
            try:
                personalization_context = self.personalization_service.format_profile_for_chat(
                    state.personalization_profile
                )
                if personalization_context:
                    logger.info(f"✅ [PERSONALIZATION] Added profile context to prompt ({len(personalization_context)} chars)")
            except Exception as e:
                logger.warning(f"⚠️ [PERSONALIZATION] Error formatting profile: {e}")
        
        meal_recommendations_context = getattr(state, 'meal_recommendations', None)

        try:
            rag_prompt = ChatPrompts.get_medical_rag_prompt(
                query=state.query,
                personal_info=user_context,
                medical_history=state.context,
                intake_form_context=intake_form_context,
                lab_report_summary=lab_report_summary,
                health_data_context=health_data_context,
                memories=memories,
                communication_style=communication_style
            )
            
            if personalization_context:
                rag_prompt += f"\n\n=== PERSONALIZED HEALTH PROFILE ===\n{personalization_context}\n\nUse this personalized profile to tailor your responses to the user's specific health goals, lifestyle, and therapeutic focus areas.\n"
            
            if meal_recommendations_context:
                rag_prompt += f"\n\n=== MEAL RECOMMENDATIONS (minified JSON) ===\nEach object has: name, sub, desc, price ($X.XX), macros (cal, pro, fat, carbs), macroNutrients (full), publicIngredients (full), tags.\n\n{meal_recommendations_context}\n\nUse these meal options when discussing nutrition or meal planning. Include concrete suggestions from this list when relevant. Match the user's health data, goals, and dietary restrictions (tags, publicIngredients) to suitable meals.\n\nDo not include meal IDs, variant IDs, or other internal metadata (e.g. \"ID 2553\") in your response to the user—only mention meal names, descriptions, macros, ingredients, and price.\n"
            
            system_safety_block = """
            You are EVRA, a compassionate health companion.

            You MUST follow these medical communication principles:
            - Do not provide diagnoses unless explicitly requested.
            - Never present advice as a substitute for professional medical consultation.
            - Use empathetic, calm language.
            - If symptoms may indicate risk, recommend consulting a doctor.
            - For high risk, include urgency such as:
            "Please seek immediate medical attention."

            Tone:
            - Supportive
            - Non-judgmental
            - Reassuring but not dismissive
            - Clear and grounded
            """
            rag_prompt = system_safety_block + "\n\n" + rag_prompt
            # HIGH RISK ESCALATION
            if getattr(state, "medical_risk_level", None) == "HIGH":
                rag_prompt += """
            IMPORTANT SAFETY NOTE:
            This user's symptoms may indicate a serious medical concern.
            Strongly advise urgent medical evaluation or emergency services.
            """

            # SYMPTOM BEHAVIOUR
            if getattr(state, "health_type", None) == "SYMPTOM":
                rag_prompt += """
            When responding, ask structured follow-up questions:
            - Duration of symptoms
            - Severity
            - Triggers
            - Associated symptoms
            """
            logger.info("💬 [RESPONSE GENERATION] Sending prompt to LLM...")
            
            response = await self.llm.ainvoke([HumanMessage(content=rag_prompt)])
            state.response = response.content.strip()
            logger.info("💬 [RESPONSE GENERATION] ✅ LLM response received successfully.")
        except Exception as e:
            logger.error(f"❌ [RESPONSE GENERATION] LLM call failed: {e}", exc_info=True)
            state.response = "I’m sorry, but I encountered an error while processing your request. Please try again later."
        
        return asdict(state)

    async def _follow_up_generation_node(self, state: ChatState) -> dict:
        if isinstance(state, dict): state = ChatState(**state)
        
        # Skip follow-ups for non-health responses or error responses
        if not state.is_health_related or not state.response or "sorry" in state.response.lower() or "error" in state.response.lower():
            state.follow_up_questions = []
            return asdict(state)

        follow_up_prompt = ChatPrompts.get_follow_up_questions_prompt(
            state.query, 
            state.response, 
            memories=state.memories if hasattr(state, 'memories') else None
        )
        try:
            response = await self.llm.ainvoke([HumanMessage(content=follow_up_prompt)])
            follow_up_questions = [q.strip().lstrip("- ").lstrip("* ") for q in response.content.strip().split('\n') if q.strip()]
            state.follow_up_questions = follow_up_questions[:4]
        except Exception as e:
            logger.error(f"Error generating follow-up questions: {e}")
            state.follow_up_questions = []
            
        return asdict(state)
    
    async def chat(self, query: str, user_email: str, conversation_history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        logger.info(f"🚀 [CHAT] Starting new chat for user '{user_email}' with query: '{query}'")
        try:
            # Retrieve relevant memories for the user
            memories = []
            try:
                memories = await self.memory_service.get_memories(user_email, query, limit=10)
                logger.info(f"🧠 [MEMORY] Retrieved {len(memories)} relevant memories for user {user_email}")
                if memories:
                    logger.debug(f"🧠 [MEMORY] Sample memories: {memories[:2]}")
            except Exception as e:
                logger.warning(f"⚠️ [MEMORY] Failed to retrieve memories: {e}")
            
            initial_state = ChatState(
                query=query, 
                user_email=user_email, 
                context=[], 
                follow_up_questions=[], 
                conversation_history=conversation_history or [],
                memories=memories
            )
            logger.info(f"🚀 [CHAT] Step 1: ✅ ChatState initialized: {initial_state}")
            
            logger.info("🚀 [CHAT] Step 2: Running LangGraph workflow...")
            result = await self.graph.ainvoke(initial_state)
            logger.info(f"🚀 [CHAT] Step 2: ✅ Workflow completed successfully!")
            
            # Store conversation in memory after successful completion
            if result.get("response"):
                try:
                    messages_to_store = [
                        {"role": "user", "content": query},
                        {"role": "assistant", "content": result.get("response", "")}
                    ]
                    
                    await self.memory_service.add_memory(user_email, messages_to_store)
                    logger.info(f"🧠 [MEMORY] Stored conversation in memory for user {user_email}")
                except Exception as e:
                    logger.warning(f"⚠️ [MEMORY] Failed to store memories: {e}")
            
            response_data = {
                "success": True,
                "response": result.get("response", ""),
                "follow_up_questions": result.get("follow_up_questions", []),
                "context_used": len(result.get("context", [])),
                "reasoning": result.get("reasoning", "")
            }
            logger.info(f"🚀 [CHAT] Step 3: ✅ Returning response: {response_data}")
            return response_data
            

        except Exception as e:
            logger.error(f"❌ [CHAT] Critical error in chat workflow for user '{user_email}': {e}", exc_info=True)
            return {
                "success": False,
                "response": "I apologize, but a critical error occurred. The technical team has been notified.",
                "follow_up_questions": [],
                "error": str(e)
            }

    async def chat_stream(self, query: str, user_email: str, conversation_history: List[Dict[str, str]] = None):
        try:
            # Retrieve relevant memories for the user
            memories = []
            try:
                memories = await self.memory_service.get_memories(user_email, query, limit=10)
                logger.info(f"🧠 [MEMORY] Retrieved {len(memories)} relevant memories for user {user_email}")
                if memories:
                    logger.debug(f"🧠 [MEMORY] Sample memories: {memories[:2]}")
            except Exception as e:
                logger.warning(f"⚠️ [MEMORY] Failed to retrieve memories: {e}")
            
            logger.info(f"🛡️ [STREAM CHAT] Checking health relevance for query: '{query}'")
            health_check_state = ChatState(
                query=query, 
                user_email=user_email, 
                context=[], 
                follow_up_questions=[], 
                conversation_history=conversation_history or [],
                memories=memories
            )
            
            health_result = await self._health_relevance_check_node(health_check_state)
            health_type = health_result.get("health_type")
            medical_risk_level = health_result.get("medical_risk_level")
            if not health_result.get("is_health_related", False):
                logger.info("🛡️ [STREAM CHAT] Non-health query detected, returning template response")
                response_text = health_result.get("response", "I'm a health-focused assistant and can only help with health, medical, and wellness questions.")
                # Stream the response as a single chunk
                yield {"type": "response_chunk", "content": response_text}
                yield {"type": "follow_up", "content": []}
                return
            
            logger.info(f"🔍 [STREAM CHAT] Health-related query, starting context retrieval for query: '{query}'")
            context_state = ChatState(query=query, user_email=user_email, context=[], follow_up_questions=[], conversation_history=conversation_history or [])
            
            context_result = await self._context_retrieval_node(context_state)
            context_pieces = context_result.get("context", [])
            
            # Get additional context from state (already fetched in _context_retrieval_node)
            user_data = context_result.get("_user_data")
            intake_data = context_result.get("_intake_data")
            lab_reports = context_result.get("_lab_reports", [])
            health_data = context_result.get("_health_data")
            personalization_profile = context_result.get("personalization_profile")
            meal_recommendations_context = context_result.get("meal_recommendations")
            
            # Format user context from pre-fetched data
            user_context = "Patient details are not available."
            if user_data:
                try:
                    def calculate_age(dob_str):
                        if not dob_str: return "unknown"
                        try:
                            dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
                            today = date.today()
                            return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                        except (ValueError, TypeError): return "unknown"
                    
                    user_name = user_data.get("name", "User")
                    date_of_birth = user_data.get("date_of_birth")
                    age = calculate_age(date_of_birth)
                    blood_type = user_data.get("blood_type", "unknown")
                    user_context = f"Patient's name is {user_name}. Age is {age}. Blood type is {blood_type}."
                except Exception as e:
                    logger.error(f"❌ [STREAM CHAT] Error formatting user data: {e}")
            
            # Format intake form data
            intake_form_context = ""
            if intake_data:
                intake_parts = []
                if intake_data.get("age"):
                    intake_parts.append(f"Age: {intake_data['age']}")
                if intake_data.get("gender"):
                    intake_parts.append(f"Gender: {intake_data['gender']}")
                if intake_data.get("healthGoals"):
                    goals = ", ".join(intake_data.get("healthGoals", []))
                    intake_parts.append(f"Health Goals: {goals}")
                if intake_data.get("conditions"):
                    conditions = ", ".join(intake_data.get("conditions", []))
                    intake_parts.append(f"Current Conditions: {conditions}")
                if intake_data.get("atRiskConditions"):
                    at_risk = ", ".join(intake_data.get("atRiskConditions", []))
                    intake_parts.append(f"At-Risk Conditions: {at_risk}")
                if intake_data.get("communicationStyle"):
                    intake_parts.append(f"Communication Style: {intake_data['communicationStyle']}")
                if intake_parts:
                    intake_form_context = "\n".join(intake_parts)
            
            # Generate lab report summary
            lab_report_summary = ""
            if lab_reports:
                try:
                    reports_text = []
                    for report in lab_reports:
                        report_info = f"Test: {report.test_title}\n"
                        if report.test_date:
                            report_info += f"Date: {report.test_date.strftime('%Y-%m-%d')}\n"
                        if report.test_description:
                            report_info += f"Description: {report.test_description}\n"
                        report_info += "Key Results:\n"
                        
                        notable_props = []
                        properties = getattr(report, 'properties', []) or []
                        for prop in properties[:15]:
                            status = getattr(prop, 'status', None)
                            name = getattr(prop, 'property_name', 'Unknown')
                            value = getattr(prop, 'value', 'N/A')
                            if status and str(status).lower() in ['high', 'low', 'abnormal', 'critical']:
                                notable_props.append(f"  - {name}: {value} ({status})")
                            elif len(notable_props) < 5:
                                notable_props.append(f"  - {name}: {value}")
                        
                        report_info += "\n".join(notable_props[:10])
                        reports_text.append(report_info)
                    
                    if reports_text:
                        summary_prompt = f"""Summarize the following lab reports in a concise format (2-3 paragraphs max) that highlights:
1. Key findings and any abnormalities
2. Overall health trends
3. Areas that may need attention

Lab Reports:
{chr(10).join(reports_text)}

Provide a concise, actionable summary focusing on the most important insights."""
                        
                        # Use async LLM call to avoid blocking
                        summary_response = await self.llm.ainvoke([HumanMessage(content=summary_prompt)])
                        lab_report_summary = summary_response.content.strip()
                except Exception as e:
                    logger.error(f"❌ [STREAM CHAT] Error generating lab report summary: {e}")
                    lab_report_summary = f"Lab Reports Available: {len(lab_reports)} recent test(s)."
            
            # 1. GET TIMEZONE ONCE from already-fetched user data
            user_timezone = "UTC"  # Default
            if user_data:
                user_timezone = user_data.get("timezone", "UTC")
            
            # 2. Format health data with timezone conversion (no DB call, pass timezone)
            health_data_context = ""
            if health_data:
                health_data_context = self._format_health_data_for_llm(health_data, user_timezone)
            
            # 3. Format historical health data if available (no DB call, pass timezone)
            historical_health_data = context_result.get("_historical_health_data", [])
            if historical_health_data:
                historical_context = self._format_historical_health_data_for_llm(
                    historical_health_data, user_timezone
                )
                if historical_context:
                    health_data_context = (health_data_context + "\n\nHistorical Trends:\n" + historical_context) if health_data_context else ("Historical Trends:\n" + historical_context)

            # Format memories for prompt
            memories = getattr(health_check_state, 'memories', []) or []
            
            # Extract communication style from intake data
            communication_style = ""
            if intake_data and intake_data.get("communicationStyle"):
                communication_style = intake_data.get("communicationStyle")
                logger.info(f"💬 [STREAM CHAT] Using communication style: {communication_style}")
            
            personalization_context = ""
            if personalization_profile:
                try:
                    personalization_context = self.personalization_service.format_profile_for_chat(
                        personalization_profile
                    )
                    if personalization_context:
                        logger.info(f"✅ [STREAM PERSONALIZATION] Added profile context to prompt ({len(personalization_context)} chars)")
                except Exception as e:
                    logger.warning(f"⚠️ [STREAM PERSONALIZATION] Error formatting profile: {e}")
            
            rag_prompt = ChatPrompts.get_medical_rag_prompt(
                query=query,
                personal_info=user_context,
                medical_history=context_pieces,
                intake_form_context=intake_form_context,
                lab_report_summary=lab_report_summary,
                health_data_context=health_data_context,
                memories=memories,
                communication_style=communication_style
            )
            
            if personalization_context:
                rag_prompt += f"\n\n=== PERSONALIZED HEALTH PROFILE ===\n{personalization_context}\n\nUse this personalized profile to tailor your responses to the user's specific health goals, lifestyle, and therapeutic focus areas.\n"

            if meal_recommendations_context:
                rag_prompt += f"\n\n=== MEAL RECOMMENDATIONS (minified JSON) ===\nEach object has: name, sub, desc, price ($X.XX), macros (cal, pro, fat, carbs), macroNutrients (full), publicIngredients (full), tags.\n\n{meal_recommendations_context}\n\nUse these meal options when discussing nutrition or meal planning. Include concrete suggestions from this list when relevant. Match the user's health data, goals, and dietary restrictions (tags, publicIngredients) to suitable meals.\n\nDo not include meal IDs, variant IDs, or other internal metadata (e.g. \"ID 2553\") in your response to the user—only mention meal names, descriptions, macros, ingredients, and price.\n"

            # ================= EVRA STREAMING CLINICAL SAFETY =================

            system_safety_block = """
            You are EVRA, a compassionate health companion.

            You MUST follow these medical communication principles:
            - Do not provide diagnoses unless explicitly requested.
            - Never present advice as a substitute for professional medical consultation.
            - Use empathetic, calm language.
            - If symptoms may indicate risk, recommend consulting a doctor.
            - For high risk, include urgency such as:
            "Please seek immediate medical attention."

            Tone:
            - Supportive
            - Non-judgmental
            - Reassuring but not dismissive
            - Clear and grounded
            """

            rag_prompt = system_safety_block + "\n\n" + rag_prompt

            # HIGH RISK ESCALATION
            if medical_risk_level == "HIGH":
                rag_prompt += """
            IMPORTANT SAFETY NOTE:
            This user's symptoms may indicate a serious medical concern.
            Strongly advise urgent medical evaluation or emergency services.
            """

            # SYMPTOM MODE
            if health_type == "SYMPTOM":
                rag_prompt += """
            When responding, ask structured follow-up questions:
            - Duration of symptoms
            - Severity
            - Triggers
            - Associated symptoms
            """

            logger.info("💬 [STREAM CHAT] Starting streaming response generation...")
            
            full_response = ""
            async for chunk in self.llm.astream([HumanMessage(content=rag_prompt)]):
                if hasattr(chunk, 'content') and chunk.content:
                    full_response += chunk.content
                    yield {"type": "response_chunk", "content": chunk.content}
                    # Small delay to allow UI thread to process
                    await asyncio.sleep(0.01)
            
            logger.info("💬 [STREAM CHAT] Generating follow-up questions...")
            if full_response and not ("sorry" in full_response.lower() or "error" in full_response.lower()):
                follow_up_prompt = ChatPrompts.get_follow_up_questions_prompt(query, full_response, memories=memories)
                try:
                    # Use async LLM call to avoid blocking
                    response = await self.llm.ainvoke([HumanMessage(content=follow_up_prompt)])
                    follow_up_questions = [q.strip().lstrip("- ").lstrip("* ") for q in response.content.strip().split('\n') if q.strip()]
                    yield {"type": "follow_up", "content": follow_up_questions[:4]}
                except Exception as e:
                    logger.error(f"Error generating follow-up questions: {e}")
                    yield {"type": "follow_up", "content": []}
            else:
                yield {"type": "follow_up", "content": []}
            
            # Store conversation in memory after successful completion
            if full_response:
                try:
                    messages_to_store = [
                        {"role": "user", "content": query},
                        {"role": "assistant", "content": full_response}
                    ]
                    
                    await self.memory_service.add_memory(user_email, messages_to_store)
                    logger.info(f"🧠 [MEMORY] Stored conversation in memory for user {user_email}")
                except Exception as e:
                    logger.warning(f"⚠️ [MEMORY] Failed to store memories: {e}")
                
        except Exception as e:
            logger.error(f"Error in streaming chat: {e}")
            yield {"type": "error", "content": "An error occurred during streaming."}

chat_service = None

def get_chat_service() -> ChatService:
    global chat_service
    if chat_service is None:
        chat_service = ChatService()
    return chat_service
