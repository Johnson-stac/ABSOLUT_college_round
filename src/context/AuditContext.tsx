import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { 
  AuditSession, 
  AuditDocument, 
  AuditHistorySummary, 
  BackendHealthResponse,
  AuditVerificationResult
} from '../types/audit';
import { api } from '../services/api';
import { SAMPLE_PRESETS } from '../data/sampleAnswers';
import { 
  AuditContext,
  type ScreenType,
  type ClaimFilterType,
  type CorrectionErrorState
} from './auditContextDef';

const STORAGE_KEY_HISTORY = 'secondopinion_history_v2';
const STORAGE_KEY_CURRENT = 'secondopinion_current_session_v2';

export const AuditProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isGeneratingCorrection, setIsGeneratingCorrection] = useState<boolean>(false);
  const [correctionError, setCorrectionError] = useState<CorrectionErrorState | null>(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState<boolean>(false);
  const [claimFilter, setClaimFilter] = useState<ClaimFilterType>('all');
  
  // Load initial session from localStorage or use default
  const [currentSession, setCurrentSession] = useState<AuditSession>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    // Default to the rich EMPEROR-Preserved scenario for immediate wow factor
    const defaultPreset = SAMPLE_PRESETS[0];
    const words = defaultPreset.originalAnswer.trim().split(/\s+/).length;
    return {
      id: 'session-demo-emp',
      title: defaultPreset.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      originalAnswer: defaultPreset.originalAnswer,
      wordCount: words,
      charCount: defaultPreset.originalAnswer.length,
      documents: [{
        id: 'doc-sample-1',
        name: defaultPreset.documentName,
        size: defaultPreset.documentSize,
        type: 'application/pdf',
        uploadedAt: new Date().toISOString(),
        uploadProgress: 100,
        status: 'ready',
        statusMessage: 'Ready for audit verification',
        pageCount: defaultPreset.documentPages,
        extractedText: defaultPreset.extractedText,
        pages: [
          { pageNumber: 1, text: defaultPreset.extractedText.slice(0, 400), charCount: 400 },
          { pageNumber: 2, text: defaultPreset.extractedText.slice(400, 1000), charCount: 600 },
        ],
        isSimulated: true,
      }],
      status: 'completed',
      sampleType: defaultPreset.domain,
      verificationResult: defaultPreset.verificationResult,
      correctionResult: defaultPreset.correctionResult,
      selectedClaimId: defaultPreset.verificationResult.claims[0]?.id,
    };
  });

  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(() => {
    return currentSession.verificationResult?.claims[0]?.id || null;
  });

  // History list
  const [history, setHistory] = useState<AuditHistorySummary[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return [
      {
        id: 'hist-demo-1',
        title: 'EMPEROR-Preserved HFpEF Clinical Audit',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        documentCount: 1,
        wordCount: 172,
        status: 'completed',
        verifiedClaimsCount: 6,
        flaggedClaimsCount: 3,
        truthfulnessScore: 33,
        hasCorrection: true,
      },
      {
        id: 'hist-demo-2',
        title: 'EU AI Act High-Risk Requirements Audit',
        createdAt: new Date(Date.now() - 3600000 * 16).toISOString(),
        documentCount: 1,
        wordCount: 114,
        status: 'completed',
        verifiedClaimsCount: 5,
        flaggedClaimsCount: 1,
        truthfulnessScore: 60,
        hasCorrection: true,
      },
      {
        id: 'hist-demo-3',
        title: 'NVIDIA Q3 FY25 SEC 10-Q Financial Audit',
        createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
        documentCount: 1,
        wordCount: 145,
        status: 'completed',
        verifiedClaimsCount: 5,
        flaggedClaimsCount: 3,
        truthfulnessScore: 40,
        hasCorrection: true,
      }
    ];
  });

  const [backendHealth, setBackendHealth] = useState<BackendHealthResponse | null>(null);
  const [isCheckingBackend, setIsCheckingBackend] = useState<boolean>(false);

  // Check backend health on mount
  const checkBackendStatus = useCallback(async () => {
    setIsCheckingBackend(true);
    try {
      const health = await api.checkHealth();
      setBackendHealth(health);
    } catch {
      setBackendHealth({
        status: 'error',
        service: 'secondopinion-backend',
        version: '0.1.0',
        parserAvailable: false,
        provider: 'unconfigured',
      });
    } finally {
      setIsCheckingBackend(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    api.checkHealth().then((health) => {
      if (isMounted) setBackendHealth(health);
    }).catch(() => {
      if (isMounted) {
        setBackendHealth({
          status: 'error',
          service: 'secondopinion-backend',
          version: '0.1.0',
          parserAvailable: false,
          provider: 'unconfigured',
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Persist currentSession to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(currentSession));
    } catch {
      // Ignore
    }
  }, [currentSession]);

  // Persist history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch {
      // Ignore
    }
  }, [history]);

  const updateOriginalAnswer = (text: string) => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = text.length;

    setCurrentSession(prev => ({
      ...prev,
      originalAnswer: text,
      wordCount: words,
      charCount: chars,
      updatedAt: new Date().toISOString(),
      title: prev.title === 'Untitled Audit' && words > 3 
        ? trimmed.slice(0, 48) + '...'
        : prev.title,
      status: (prev.documents.some(d => d.status === 'ready') && words > 10) 
        ? (prev.verificationResult ? 'completed' : 'ready_for_audit') 
        : 'draft',
    }));
  };

  const addDocument = (doc: AuditDocument) => {
    setCurrentSession(prev => {
      const updatedDocs = [...prev.documents, doc];
      return {
        ...prev,
        documents: updatedDocs,
        updatedAt: new Date().toISOString(),
        status: (updatedDocs.some(d => d.status === 'ready') && prev.wordCount > 10)
          ? (prev.verificationResult ? 'completed' : 'ready_for_audit')
          : prev.status,
      };
    });
  };

  const updateDocument = (id: string, updates: Partial<AuditDocument>) => {
    setCurrentSession(prev => {
      const updatedDocs = prev.documents.map(d => d.id === id ? { ...d, ...updates } : d);
      return {
        ...prev,
        documents: updatedDocs,
        updatedAt: new Date().toISOString(),
        status: (updatedDocs.some(d => d.status === 'ready') && prev.wordCount > 10)
          ? (prev.verificationResult ? 'completed' : 'ready_for_audit')
          : prev.status,
      };
    });
  };

  const removeDocument = (id: string) => {
    setCurrentSession(prev => {
      const updatedDocs = prev.documents.filter(d => d.id !== id);
      return {
        ...prev,
        documents: updatedDocs,
        updatedAt: new Date().toISOString(),
        status: (updatedDocs.some(d => d.status === 'ready') && prev.wordCount > 10)
          ? prev.status
          : 'draft',
      };
    });
  };

  const loadSamplePreset = (presetId: string) => {
    const preset = SAMPLE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const words = preset.originalAnswer.trim().split(/\s+/).length;
    const chars = preset.originalAnswer.length;

    const sampleDoc: AuditDocument = {
      id: `doc-sample-${Date.now()}`,
      name: preset.documentName,
      size: preset.documentSize,
      type: 'application/pdf',
      uploadedAt: new Date().toISOString(),
      uploadProgress: 100,
      status: 'ready',
      statusMessage: 'Ready for audit verification',
      pageCount: preset.documentPages,
      extractedText: preset.extractedText,
      pages: [
        { pageNumber: 1, text: preset.extractedText.slice(0, 400), charCount: 400 },
        { pageNumber: 2, text: preset.extractedText.slice(400, 1000), charCount: 600 },
      ],
      isSimulated: true,
    };

    const firstClaimId = preset.verificationResult.claims[0]?.id || null;

    const newSession: AuditSession = {
      id: `session-${Date.now()}`,
      title: preset.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      originalAnswer: preset.originalAnswer,
      wordCount: words,
      charCount: chars,
      documents: [sampleDoc],
      status: 'completed',
      sampleType: preset.domain,
      verificationResult: preset.verificationResult,
      correctionResult: preset.correctionResult,
      selectedClaimId: firstClaimId || undefined,
    };

    setCurrentSession(newSession);
    setSelectedClaimId(firstClaimId);

    setHistory(prev => [
      {
        id: newSession.id,
        title: newSession.title,
        createdAt: newSession.createdAt,
        documentCount: 1,
        wordCount: words,
        status: 'completed',
        verifiedClaimsCount: preset.verificationResult.summary.totalClaims,
        flaggedClaimsCount: preset.verificationResult.summary.refutedCount,
        truthfulnessScore: preset.verificationResult.summary.truthfulnessScore,
        hasCorrection: true,
      },
      ...prev.filter(h => h.id !== newSession.id).slice(0, 8)
    ]);
  };

  const clearCurrentAnswer = () => {
    setCurrentSession(prev => ({
      ...prev,
      originalAnswer: '',
      wordCount: 0,
      charCount: 0,
      status: 'draft',
      updatedAt: new Date().toISOString(),
      verificationResult: undefined,
      correctionResult: undefined,
    }));
    setSelectedClaimId(null);
  };

  const createNewSession = () => {
    const newSession: AuditSession = {
      id: `session-${Date.now()}`,
      title: 'Untitled Audit',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      originalAnswer: '',
      wordCount: 0,
      charCount: 0,
      documents: [],
      status: 'draft',
    };
    setCurrentSession(newSession);
    setSelectedClaimId(null);
    setCurrentScreen('new-audit');
  };

  const openCorrectionModal = () => {
    setCorrectionError(null);
    setIsCorrectionModalOpen(true);
  };

  const closeCorrectionModal = () => {
    setIsCorrectionModalOpen(false);
  };

  const clearCorrectionError = () => {
    setCorrectionError(null);
  };

  const generateCorrection = async (options?: { forceSimulation?: boolean }) => {
    if (!currentSession.originalAnswer || !currentSession.verificationResult) return;

    setCorrectionError(null);

    // If explicit simulation requested (e.g., to preview UI during development)
    if (options?.forceSimulation) {
      const fixture = api.getSampleFixtureCorrection(currentSession.originalAnswer, currentSession.id);
      setCurrentSession(prev => ({
        ...prev,
        correctionResult: fixture,
        updatedAt: new Date().toISOString(),
      }));
      setIsCorrectionModalOpen(false);
      setCurrentScreen('correction');
      return;
    }

    setIsGeneratingCorrection(true);
    try {
      const corrResult = await api.correctAnswer(
        currentSession.id,
        currentSession.originalAnswer,
        currentSession.documents,
        currentSession.verificationResult.claims
      );

      setCurrentSession(prev => ({
        ...prev,
        correctionResult: corrResult,
        updatedAt: new Date().toISOString(),
      }));
      setIsCorrectionModalOpen(false);
      setCurrentScreen('correction');
    } catch (err: any) {
      const status = err?.status ?? 500;
      const message = err?.message ?? 'Failed to generate evidence-grounded correction with Gemini.';
      setCorrectionError({
        message,
        status,
        isOffline: status === 0,
        isRateLimited: status === 429,
        details: err?.details ? String(err.details) : undefined,
      });
    } finally {
      setIsGeneratingCorrection(false);
    }
  };

  const runVerification = async () => {
    if (!currentSession.originalAnswer || currentSession.documents.length === 0) return;

    setIsVerifying(true);
    setCorrectionError(null);
    try {
      const docIds = currentSession.documents.map(d => d.id);
      const result: AuditVerificationResult = await api.verifyClaims(
        currentSession.id,
        currentSession.originalAnswer,
        docIds
      );

      const firstClaimId = result.claims.length > 0 ? result.claims[0].id : null;

      setCurrentSession(prev => ({
        ...prev,
        verificationResult: result,
        status: 'completed',
        updatedAt: new Date().toISOString(),
      }));

      setSelectedClaimId(firstClaimId);
    } finally {
      setIsVerifying(false);
    }
  };

  const loadSessionFromHistory = (id: string) => {
    if (id === currentSession.id) {
      setCurrentScreen('workspace');
      return;
    }

    const match = history.find(h => h.id === id);
    if (match) {
      const preset = SAMPLE_PRESETS.find(p => p.name.includes(match.title) || match.title.includes(p.name));
      if (preset) {
        loadSamplePreset(preset.id);
        setCurrentScreen('workspace');
        return;
      }

      setCurrentSession(prev => ({
        ...prev,
        id: match.id,
        title: match.title,
        status: match.status,
      }));
    }
    setCurrentScreen('workspace');
  };

  const deleteSessionFromHistory = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  // Keyboard and index navigation
  const claims = currentSession.verificationResult?.claims || [];
  const currentClaimIndex = claims.findIndex(c => c.id === selectedClaimId);

  const goToNextClaim = () => {
    if (claims.length === 0) return;
    const nextIdx = currentClaimIndex < claims.length - 1 ? currentClaimIndex + 1 : 0;
    setSelectedClaimId(claims[nextIdx].id);
  };

  const goToPrevClaim = () => {
    if (claims.length === 0) return;
    const prevIdx = currentClaimIndex > 0 ? currentClaimIndex - 1 : claims.length - 1;
    setSelectedClaimId(claims[prevIdx].id);
  };

  return (
    <AuditContext.Provider
      value={{
        currentScreen,
        setScreen: setCurrentScreen,
        currentSession,
        history,
        backendHealth,
        isCheckingBackend,
        isVerifying,
        isGeneratingCorrection,
        correctionError,
        isCorrectionModalOpen,
        openCorrectionModal,
        closeCorrectionModal,
        clearCorrectionError,
        selectedClaimId,
        setSelectedClaimId,
        claimFilter,
        setClaimFilter,
        goToNextClaim,
        goToPrevClaim,
        checkBackendStatus,
        updateOriginalAnswer,
        addDocument,
        updateDocument,
        removeDocument,
        loadSamplePreset,
        clearCurrentAnswer,
        createNewSession,
        loadSessionFromHistory,
        deleteSessionFromHistory,
        runVerification,
        generateCorrection,
      }}
    >
      {children}
    </AuditContext.Provider>
  );
};

export type { ScreenType, ClaimFilterType, CorrectionErrorState, AuditContextType } from './auditContextDef';
