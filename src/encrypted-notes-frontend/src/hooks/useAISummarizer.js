// AI Hook untuk integrasi dengan VaultNotes Backend
// src/encrypted-notes-frontend/src/hooks/useAISummarizer.js

import { useState } from 'react';
import { useInternetIdentity } from "ic-use-internet-identity";
import { Actor } from "@dfinity/agent";
import { encrypted_notes_backend } from "../../../declarations/encrypted-notes-backend";

export const useAISummarizer = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { identity } = useInternetIdentity();

    const summarizeText = async (text, contentType = 'general') => {
        setIsLoading(true);
        setError(null);

        try {
            // Check if user is authenticated
            if (!identity || identity.getPrincipal().isAnonymous()) {
                throw new Error("You must be logged in to use AI summary feature");
            }

            // Set identity for backend call
            Actor.agentOf(encrypted_notes_backend).replaceIdentity(identity);

            // Prepare request for backend AI service
            const summaryRequest = {
                text: text.trim(),
                content_type: contentType ? [contentType] : []
            };

            console.log("🤖 Calling backend AI summarize...");
            const response = await encrypted_notes_backend.ai_summarize(summaryRequest);

            console.log("🤖 AI Response:", response);

            setIsLoading(false);

            if (response.success) {
                return {
                    summary: response.summary,
                    success: true,
                    processing_time: response.processing_time,
                    compression_ratio: response.compression_ratio,
                    method: response.method,
                    original_length: text.length,
                    summary_length: response.summary.length,
                    content_type: contentType
                };
            } else {
                const errorMsg = response.error && response.error.length > 0 ? response.error[0] : "AI summarization failed";
                throw new Error(errorMsg);
            }

        } catch (err) {
            console.error("❌ AI Summarization failed:", err);
            setError(err.message);
            setIsLoading(false);
            
            // Fallback to local AI if backend fails
            console.log("🔄 Falling back to local AI...");
            return await fallbackToLocalAI(text, contentType);
        }
    };

    // Health check for AI service
    const healthCheck = async () => {
        try {
            if (!identity || identity.getPrincipal().isAnonymous()) {
                return { status: "error", message: "Not authenticated" };
            }

            Actor.agentOf(encrypted_notes_backend).replaceIdentity(identity);
            const status = await encrypted_notes_backend.ai_health_check();
            return { status: "ok", message: status };
        } catch (err) {
            return { status: "error", message: err.message };
        }
    };

    return {
        summarizeText,
        healthCheck,
        isLoading,
        error
    };
};

// Fallback to local AI implementation when backend fails
const fallbackToLocalAI = async (text, contentType) => {
    const startTime = Date.now();
    
    try {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const summary = extractiveSummarize(text, contentType);
        const processingTime = (Date.now() - startTime) / 1000;
        
        return {
            summary,
            success: true,
            processing_time: processingTime,
            original_length: text.length,
            summary_length: summary.length,
            compression_ratio: summary.length / text.length,
            method: 'js_extractive_fallback',
            content_type: contentType
        };
    } catch (error) {
        return {
            summary: '',
            success: false,
            error: error.message,
            processing_time: (Date.now() - startTime) / 1000
        };
    }
};

// Ultra Minimal AI implementation in JavaScript
const processWithUltraMinimalAI = async (text, contentType) => {
    const startTime = Date.now();
    
    try {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const summary = extractiveSummarize(text, contentType);
        const processingTime = (Date.now() - startTime) / 1000;
        
        return {
            summary,
            success: true,
            processing_time: processingTime,
            original_length: text.length,
            summary_length: summary.length,
            compression_ratio: summary.length / text.length,
            method: 'js_extractive',
            content_type: contentType
        };
    } catch (error) {
        return {
            summary: '',
            success: false,
            error: error.message,
            processing_time: (Date.now() - startTime) / 1000
        };
    }
};

const extractiveSummarize = (text, contentType) => {
    if (text.length < 50) {
        return text;
    }
    
    const sentences = text.split('.').map(s => s.trim()).filter(s => s.length > 0);
    
    if (sentences.length <= 2) {
        return sentences.join('. ') + '.';
    }
    
    switch (contentType) {
        case 'meeting':
            return extractMeetingSummary(sentences);
        case 'technical':
            return extractTechnicalSummary(sentences);
        case 'research':
            return extractResearchSummary(sentences);
        default:
            return extractGeneralSummary(sentences);
    }
};

const extractMeetingSummary = (sentences) => {
    const meetingKeywords = [
        'decided', 'agreed', 'action', 'timeline', 'deadline',
        'responsible', 'assigned', 'completed', 'progress', 'next steps'
    ];
    
    const importantSentences = [];
    
    sentences.forEach((sentence, index) => {
        const lowerSentence = sentence.toLowerCase();
        let score = 0;
        
        // Position bonus
        if (index === 0) score += 2;
        if (index === sentences.length - 1) score += 1;
        
        // Keyword scoring
        meetingKeywords.forEach(keyword => {
            if (lowerSentence.includes(keyword)) {
                score += 2;
            }
        });
        
        if (score > 0) {
            importantSentences.push({ sentence, score });
        }
    });
    
    // Sort by score and take top 2-3
    importantSentences.sort((a, b) => b.score - a.score);
    const selectedSentences = importantSentences.slice(0, 3).map(item => item.sentence);
    
    if (selectedSentences.length === 0) {
        return sentences.slice(0, 2).join('. ') + '.';
    }
    
    return selectedSentences.join('. ') + '.';
};

const extractTechnicalSummary = (sentences) => {
    const techKeywords = [
        'technology', 'system', 'algorithm', 'implementation', 'method',
        'process', 'architecture', 'framework', 'protocol', 'uses', 'enables'
    ];
    
    const scoredSentences = sentences.map((sentence, index) => {
        const lowerSentence = sentence.toLowerCase();
        let score = 0;
        
        // Position bonus
        if (index === 0) score += 2;
        
        // Technical keyword scoring
        techKeywords.forEach(keyword => {
            if (lowerSentence.includes(keyword)) {
                score += 1;
            }
        });
        
        return { sentence, score };
    });
    
    // Sort by score and take top 2
    scoredSentences.sort((a, b) => b.score - a.score);
    const selectedSentences = scoredSentences.slice(0, 2).map(item => item.sentence);
    
    return selectedSentences.join('. ') + '.';
};

const extractResearchSummary = (sentences) => {
    const researchKeywords = [
        'study', 'research', 'analysis', 'findings', 'results', 'conclusion',
        'evidence', 'data', 'survey', 'shows', 'indicates', 'reveals'
    ];
    
    const importantSentences = [];
    
    sentences.forEach((sentence, index) => {
        const lowerSentence = sentence.toLowerCase();
        let score = 0;
        
        // Position bonus
        if (index === 0) score += 1;
        if (index === sentences.length - 1) score += 1;
        
        // Research keyword scoring
        researchKeywords.forEach(keyword => {
            if (lowerSentence.includes(keyword)) {
                score += 1;
            }
        });
        
        // Numbers/statistics bonus
        if (/\d+/.test(sentence)) {
            score += 1;
        }
        
        if (score > 0) {
            importantSentences.push({ sentence, score });
        }
    });
    
    // Sort by score and take top 2
    importantSentences.sort((a, b) => b.score - a.score);
    const selectedSentences = importantSentences.slice(0, 2).map(item => item.sentence);
    
    if (selectedSentences.length === 0) {
        return sentences.slice(0, 2).join('. ') + '.';
    }
    
    return selectedSentences.join('. ') + '.';
};

const extractGeneralSummary = (sentences) => {
    // Simple approach: take first sentence and potentially the last
    if (sentences.length <= 2) {
        return sentences.join('. ') + '.';
    }
    
    const first = sentences[0];
    const last = sentences[sentences.length - 1];
    
    // If combined length is reasonable, use both
    if ((first + last).length <= 200) {
        return `${first}. ${last}.`;
    }
    
    // Otherwise just use first
    return first + '.';
};
