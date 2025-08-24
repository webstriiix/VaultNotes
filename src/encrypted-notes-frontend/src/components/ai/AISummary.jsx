// AI Summary Component untuk VaultNotes
// src/encrypted-notes-frontend/src/components/ai/AISummary.jsx

import React, { useState, useEffect } from 'react';
import { Button, Card, CardBody, CardHeader, Chip, Spinner } from "@heroui/react";
import { IoSparkles, IoRefresh, IoCopy, IoCheckmark } from "react-icons/io5";
import { useAISummarizer } from '../../hooks/useAISummarizer';

const AISummary = ({ 
    text, 
    contentType = 'general', 
    className = '',
    autoSummarize = false,
    compact = false 
}) => {
    const [summary, setSummary] = useState('');
    const [showSummary, setShowSummary] = useState(false);
    const [copied, setCopied] = useState(false);
    const { summarizeText, isLoading, error } = useAISummarizer();

    const handleSummarize = async () => {
        if (!text || text.length < 50) return;
        
        const result = await summarizeText(text, contentType);
        
        if (result.success) {
            setSummary(result.summary);
            setShowSummary(true);
        }
    };

    const handleCopy = async () => {
        if (!summary) return;
        
        try {
            await navigator.clipboard.writeText(summary);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Clipboard API failed:', err);
            // Fallback untuk browser yang memblokir Clipboard API
            try {
                const textarea = document.createElement('textarea');
                textarea.value = summary;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                textarea.setSelectionRange(0, 99999); // For mobile devices
                
                const successful = document.execCommand('copy');
                document.body.removeChild(textarea);
                
                if (successful) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                } else {
                    console.error('Fallback copy failed');
                }
            } catch (fallbackErr) {
                console.error('All copy methods failed:', fallbackErr);
            }
        }
    };

    const handleRefresh = () => {
        setShowSummary(false);
        setSummary('');
        handleSummarize();
    };

    // Auto-summarize on mount if enabled
    useEffect(() => {
        if (autoSummarize && text && text.length >= 50) {
            handleSummarize();
        }
    }, [text, autoSummarize]);

    if (compact) {
        return (
            <div className={`ai-summary-compact ${className}`}>
                {!showSummary ? (
                    <Button
                        size="sm"
                        color="secondary"
                        variant="light"
                        startContent={<IoSparkles className="h-3 w-3" />}
                        onClick={handleSummarize}
                        disabled={isLoading || !text || text.length < 50}
                    >
                        {isLoading ? 'Summarizing...' : 'AI Summary'}
                    </Button>
                ) : (
                    <div className="text-xs text-default-600 bg-secondary-50 p-2 rounded-lg">
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <IoSparkles className="h-3 w-3 text-secondary mt-0.5 flex-shrink-0" />
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                className="h-4 w-4 min-w-4"
                                onClick={() => setShowSummary(false)}
                            >
                                ×
                            </Button>
                        </div>
                        <p className="leading-relaxed">{summary}</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`ai-summary ${className}`}>
            {!showSummary ? (
                <Button
                    color="secondary"
                    variant="bordered"
                    startContent={<IoSparkles className="h-4 w-4" />}
                    onClick={handleSummarize}
                    disabled={isLoading || !text || text.length < 50}
                    className="mb-4 border-dashed"
                    fullWidth={compact}
                >
                    {isLoading ? (
                        <>
                            <Spinner size="sm" color="secondary" />
                            Generating Summary...
                        </>
                    ) : (
                        'Generate AI Summary'
                    )}
                </Button>
            ) : (
                <Card className="mb-4 border border-secondary-200 bg-gradient-to-r from-secondary-50 to-primary-50">
                    <CardHeader className="flex justify-between items-center pb-2">
                        <div className="flex items-center gap-2">
                            <IoSparkles className="h-5 w-5 text-secondary" />
                            <span className="font-semibold text-foreground">AI Summary</span>
                            <Chip 
                                size="sm" 
                                variant="flat" 
                                color="secondary"
                                className="capitalize"
                            >
                                {contentType}
                            </Chip>
                        </div>
                        <div className="flex gap-1">
                            {/* <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onClick={handleRefresh}
                                disabled={isLoading}
                                className="text-default-500 hover:text-secondary"
                            >
                                <IoRefresh className="h-4 w-4" />
                            </Button> */}
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onClick={handleCopy}
                                disabled={!summary}
                                className="text-default-500 hover:text-secondary"
                            >
                                {copied ? (
                                    <IoCheckmark className="h-4 w-4 text-success" />
                                ) : (
                                    <IoCopy className="h-4 w-4" />
                                )}
                            </Button>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onClick={() => setShowSummary(false)}
                                className="text-default-500 hover:text-danger"
                            >
                                ×
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className="pt-0">
                        <p className="text-sm leading-relaxed text-foreground">
                            {summary}
                        </p>
                        {error && (
                            <div className="mt-2 p-2 bg-danger-50 border border-danger-200 rounded">
                                <p className="text-danger text-xs">{error}</p>
                            </div>
                        )}
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-default-200">
                            <div className="flex items-center gap-4 text-xs text-default-500">
                                <span>
                                    Compression: {((summary.length / text.length) * 100).toFixed(0)}%
                                </span>
                                <span>
                                    {summary.length} of {text.length} chars
                                </span>
                            </div>
                            <Chip size="sm" variant="dot" color="success">
                                Ultra Fast AI
                            </Chip>
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
};

export default AISummary;
