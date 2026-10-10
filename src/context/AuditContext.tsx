import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { 
  AuditSession, 
  AuditDocument, 
  AuditHistorySummary, 
  BackendHealthResponse,
  AuditVerificationResult,
  ClaimVerdict
} from '../types/audit';
import { api } from '../services/api';
import { SAMPLE_PRESETS } from '../data/sampleAnswers';

export type ScreenType = 'dashboard' | 'new-audit' | 'workspace' | 'report' | 'comparison' | 'correction' | 'history' | 'settings';
export type ClaimFilterType = 'all' | ClaimVerdict;

export interface CorrectionErrorState {
  message: string;
  status: number;
  isOffline?: boolean;
  isRateLimited?: boolean;
  details?: string;
}

interface AuditContextType {
  currentScreen: ScreenType;
  setScreen: (screen: ScreenType) => void;
  currentSession: AuditSession;
  history: AuditHistorySummary[];
  backendHealth: BackendHealthResponse | null;
  isCheckingBackend: boolean;
  isVerifying: boolean;
  isGeneratingCorrection: boolean;
  correctionError: CorrectionErrorState | null;
  isCorrectionModalOpen: boolean;
  openCorrectionModal: () => void;
  closeCorrectionModal: () => void;
  clearCorrectionError: () => void;
  selectedClaimId: string | null;
  setSelectedClaimId: (id: string | null) => void;
  claimFilter: ClaimFilterType;
  setClaimFilter: (filter: ClaimFilterType) => void;
  checkBackendStatus: () => Promise<void>;
  updateOriginalAnswer: (text: string) => void;
  addDocument: (doc: AuditDocument) => void;
  updateDocument: (id: string, updates: Partial<AuditDocument>) => void;
  removeDocument: (id: string) => void;
  loadSamplePreset: (presetId: string) => void;
  clearCurrentAnswer: () => void;
  createNewSession: () => void;
  loadSessionFromHistory: (id: string) => void;
  deleteSessionFromHistory: (id: string) => void;
  runVerification: () => Promise<void>;
  generateCorrection: (options?: { forceSimulation?: boolean }) => Promise<void>;
}



const DEFAULT_SESSION: AuditSession = {
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

const AuditContext = createContext<AuditContextType | undefined>(undefined);

const STORAGE_KEY_HISTORY = 'secondopinion_history_v1';
const STORAGE_KEY_CURRENT = 'secondopinion_current_session_v1';

export const AuditProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('new-audit');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isGeneratingCorrection, setIsGeneratingCorrection] = useState<boolean>(false);
  const [correctionError, setCorrectionError] = useState<CorrectionErrorState | null>(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState<boolean>(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
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
    return DEFAULT_SESSION;
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
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        documentCount: 1,
        wordCount: 172,
        status: 'completed',
        verifiedClaimsCount: 6,
        flaggedClaimsCount: 3,
        truthfulnessScore: 33,
      },
      {
        id: 'hist-demo-2',
        title: 'EU AI Act High-Risk Requirements Audit',
        createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
        documentCount: 1,
        wordCount: 114,
        status: 'completed',
        verifiedClaimsCount: 5,
        flaggedClaimsCount: 1,
        truthfulnessScore: 60,
      }
    ];
  });

  const [backendHealth, setBackendHealth] = useState<BackendHealthResponse | null>(null);
  const [isCheckingBackend, setIsCheckingBackend] = useState<boolean>(false);

  // Check backend health on mount
  const checkBackendStatus = async () => {
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
  };

  useEffect(() => {
    checkBackendStatus();
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

  // Automatically select the first claim when verification results change
  useEffect(() => {
    if (currentSession.verificationResult?.claims?.length) {
      if (!selectedClaimId || !currentSession.verificationResult.claims.some(c => c.id === selectedClaimId)) {
        setSelectedClaimId(currentSession.verificationResult.claims[0].id);
      }
    }
  }, [currentSession.verificationResult, selectedClaimId]);

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
      selectedClaimId: preset.verificationResult.claims[0]?.id,
    };

    setCurrentSession(newSession);
    setSelectedClaimId(preset.verificationResult.claims[0]?.id || null);

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
      ...prev.slice(0, 9)
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
      // Completed audit and verified claims are fully preserved
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

      setCurrentSession(prev => ({
        ...prev,
        verificationResult: result,
        status: 'completed',
        updatedAt: new Date().toISOString(),
      }));

      if (result.claims.length > 0) {
        setSelectedClaimId(result.claims[0].id);
      }
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

export const useAudit = (): AuditContextType => {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error('useAudit must be used within an AuditProvider');
  }
  return context;
};
