"""
Embedding Service
Handles text embeddings and vector database operations for duplicate detection.
"""

import os
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import numpy as np

from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings

from config import EMBEDDING_MODEL, VECTOR_DB_PATH, VECTOR_DB_TYPE


@dataclass
class DuplicateCheckResult:
    is_duplicate: bool
    similarity_score: float
    existing_report_id: Optional[str]
    existing_report_data: Optional[Dict]
    reason: str


class EmbeddingService:
    """Service for generating embeddings and detecting duplicate complaints."""
    
    def __init__(self):
        self.embedding_model = None
        self.vector_db = None
        self.collection = None
        self._initialize()
    
    def _initialize(self):
        """Initialize embedding model and vector database."""
        try:
            # Load sentence transformer model
            self.embedding_model = SentenceTransformer(EMBEDDING_MODEL)
            
            # Initialize vector database
            if VECTOR_DB_TYPE == "chromadb":
                self._init_chromadb()
            elif VECTOR_DB_TYPE == "faiss":
                self._init_faiss()
            else:
                raise ValueError(f"Unknown vector database type: {VECTOR_DB_TYPE}")
                
        except Exception as e:
            print(f"Failed to initialize embedding service: {e}")
            self.embedding_model = None
            self.vector_db = None
    
    def _init_chromadb(self):
        """Initialize ChromaDB vector database."""
        os.makedirs(VECTOR_DB_PATH, exist_ok=True)
        
        self.vector_db = chromadb.PersistentClient(
            path=VECTOR_DB_PATH,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Get or create collection for complaints
        self.collection = self.vector_db.get_or_create_collection(
            name="complaints",
            metadata={"hnsw:space": "cosine"}
        )
    
    def _init_faiss(self):
        """Initialize FAISS vector database."""
        # FAISS implementation would go here
        raise NotImplementedError("FAISS not yet implemented")
    
    def generate_embedding(self, text: str) -> Optional[np.ndarray]:
        """
        Generate embedding for text.
        
        Args:
            text: Text to embed
        
        Returns:
            Embedding vector or None if failed
        """
        if self.embedding_model is None:
            return None
        
        try:
            embedding = self.embedding_model.encode(text, convert_to_numpy=True)
            return embedding
        except Exception as e:
            print(f"Failed to generate embedding: {e}")
            return None
    
    def add_complaint_to_vector_db(
        self,
        complaint_id: str,
        complaint_text: str,
        damage_type: str,
        location: str,
        metadata: Optional[Dict] = None
    ) -> bool:
        """
        Add a complaint to the vector database for duplicate detection.
        
        Args:
            complaint_id: Unique identifier for the complaint
            complaint_text: Complaint description
            damage_type: Type of damage
            location: Location of damage
            metadata: Additional metadata
        
        Returns:
            True if successful, False otherwise
        """
        if self.embedding_model is None or self.collection is None:
            return False
        
        try:
            # Combine text for embedding
            combined_text = f"{damage_type} at {location}. {complaint_text}"
            
            # Generate embedding
            embedding = self.generate_embedding(combined_text)
            if embedding is None:
                return False
            
            # Add to vector database
            self.collection.add(
                ids=[complaint_id],
                embeddings=[embedding.tolist()],
                metadatas=[{
                    "damage_type": damage_type,
                    "location": location,
                    "complaint_text": complaint_text,
                    **(metadata or {})
                }]
            )
            
            return True
        except Exception as e:
            print(f"Failed to add complaint to vector DB: {e}")
            return False
    
    def check_duplicate(
        self,
        complaint_text: str,
        damage_type: str,
        location: str,
        similarity_threshold: float = 0.85,
        time_window_days: int = 7
    ) -> DuplicateCheckResult:
        """
        Check if a complaint is a duplicate of existing complaints.
        
        Args:
            complaint_text: New complaint text
            damage_type: Type of damage
            location: Location of damage
            similarity_threshold: Threshold for considering as duplicate
            time_window_days: Only check complaints within this time window
        
        Returns:
            DuplicateCheckResult with duplicate status and details
        """
        if self.embedding_model is None or self.collection is None:
            return DuplicateCheckResult(
                is_duplicate=False,
                similarity_score=0.0,
                existing_report_id=None,
                existing_report_data=None,
                reason="Embedding service not available"
            )
        
        try:
            # Combine text for embedding
            combined_text = f"{damage_type} at {location}. {complaint_text}"
            
            # Generate embedding
            embedding = self.generate_embedding(combined_text)
            if embedding is None:
                return DuplicateCheckResult(
                    is_duplicate=False,
                    similarity_score=0.0,
                    existing_report_id=None,
                    existing_report_data=None,
                    reason="Failed to generate embedding"
                )
            
            # Query vector database
            results = self.collection.query(
                query_embeddings=[embedding.tolist()],
                n_results=5,
                include=["metadatas", "distances"]
            )
            
            # Check results
            if not results or not results["ids"] or not results["ids"][0]:
                return DuplicateCheckResult(
                    is_duplicate=False,
                    similarity_score=0.0,
                    existing_report_id=None,
                    existing_report_data=None,
                    reason="No similar complaints found"
                )
            
            # Find best match
            best_idx = 0
            best_distance = results["distances"][0][best_idx]
            best_id = results["ids"][0][best_idx]
            best_metadata = results["metadatas"][0][best_idx]
            
            # Convert distance to similarity (cosine distance to similarity)
            similarity = 1 - best_distance
            
            # Check if duplicate
            if similarity >= similarity_threshold:
                # Additional check: same damage type and similar location
                if (best_metadata.get("damage_type") == damage_type and
                    self._locations_similar(best_metadata.get("location", ""), location)):
                    
                    return DuplicateCheckResult(
                        is_duplicate=True,
                        similarity_score=similarity,
                        existing_report_id=best_id,
                        existing_report_data=best_metadata,
                        reason=f"Similar complaint found with {similarity:.2%} similarity"
                    )
            
            return DuplicateCheckResult(
                is_duplicate=False,
                similarity_score=similarity,
                existing_report_id=best_id if similarity > 0.7 else None,
                existing_report_data=best_metadata if similarity > 0.7 else None,
                reason="No duplicate found (similarity below threshold)"
            )
            
        except Exception as e:
            print(f"Failed to check duplicate: {e}")
            return DuplicateCheckResult(
                is_duplicate=False,
                similarity_score=0.0,
                existing_report_id=None,
                existing_report_data=None,
                reason=f"Error checking duplicate: {str(e)}"
            )
    
    def _locations_similar(self, loc1: str, loc2: str) -> bool:
        """Check if two location strings are similar."""
        # Simple string similarity check
        # In production, use more sophisticated location matching
        loc1_lower = loc1.lower()
        loc2_lower = loc2.lower()
        
        # Check if one contains the other
        if loc1_lower in loc2_lower or loc2_lower in loc1_lower:
            return True
        
        # Check for common words
        words1 = set(loc1_lower.split())
        words2 = set(loc2_lower.split())
        
        if words1 & words2:  # Intersection
            return True
        
        return False
    
    def delete_complaint_from_vector_db(self, complaint_id: str) -> bool:
        """
        Delete a complaint from the vector database.
        
        Args:
            complaint_id: ID of complaint to delete
        
        Returns:
            True if successful, False otherwise
        """
        if self.collection is None:
            return False
        
        try:
            self.collection.delete(ids=[complaint_id])
            return True
        except Exception as e:
            print(f"Failed to delete complaint from vector DB: {e}")
            return False
    
    def get_collection_stats(self) -> Dict:
        """
        Get statistics about the vector database collection.
        
        Returns:
            Dictionary with collection statistics
        """
        if self.collection is None:
            return {"count": 0, "status": "not_initialized"}
        
        try:
            count = self.collection.count()
            return {
                "count": count,
                "status": "active"
            }
        except Exception as e:
            return {
                "count": 0,
                "status": "error",
                "error": str(e)
            }
