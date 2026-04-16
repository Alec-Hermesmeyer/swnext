/**
 * Shared state reducer for the Bid Assistant.
 * Coordinates state between the chat interface and document editor
 * so that chat suggestions can update the draft and vice-versa.
 */

import { useReducer, useCallback } from "react";
import { normalizeDraftPayload, getDefaultBidFitMetrics } from "./bid-assistant-utils";

// ── Action types ────────────────────────────────────────────────────

export const BID_ACTIONS = {
  // Document management
  SET_DOCUMENTS: "SET_DOCUMENTS",
  SELECT_DOCUMENT: "SELECT_DOCUMENT",
  SET_DOCUMENT_DETAIL: "SET_DOCUMENT_DETAIL",
  CLEAR_SELECTION: "CLEAR_SELECTION",

  // Draft management
  SET_DRAFT: "SET_DRAFT",
  UPDATE_DRAFT_FIELD: "UPDATE_DRAFT_FIELD",
  APPLY_CHAT_SUGGESTION: "APPLY_CHAT_SUGGESTION",
  REVERT_SECTION: "REVERT_SECTION",

  // Chat
  ADD_CHAT_MESSAGE: "ADD_CHAT_MESSAGE",
  SET_CHAT_LOADING: "SET_CHAT_LOADING",
  CLEAR_CHAT: "CLEAR_CHAT",

  // Metrics
  SET_METRICS: "SET_METRICS",
  UPDATE_METRIC_FIELD: "UPDATE_METRIC_FIELD",

  // Status / loading
  SET_STATUS: "SET_STATUS",
  SET_LOADING: "SET_LOADING",

  // Wizard
  SET_WIZARD_STEP: "SET_WIZARD_STEP",
  SET_WIZARD_ACTIVE: "SET_WIZARD_ACTIVE",

  // Sections
  TOGGLE_SECTION: "TOGGLE_SECTION",
};

// ── Initial state ───────────────────────────────────────────────────

export function getInitialState() {
  return {
    // Documents
    documents: [],
    selectedDoc: null,
    loadingDocs: false,

    // Draft
    draft: normalizeDraftPayload({}),
    draftHistory: [],
    loadingDraft: false,
    savingDraft: false,
    exportingDraft: false,

    // Chat (chatInput is managed locally in BidChatInterface)
    chatHistory: [],
    chatLoading: false,

    // Metrics
    metrics: getDefaultBidFitMetrics(),
    loadingMetrics: false,
    savingMetrics: false,

    // Status
    status: "",
    uploading: false,
    deletingDocId: "",
    vectorizingDocId: "",

    // Wizard
    wizardActive: false,
    wizardStep: 0,

    // UI sections
    expandedSections: {
      overview: true,
      financials: true,
      draft: false,
      insights: false,
      chat: false,
      debug: false,
    },
  };
}

// ── Reducer ─────────────────────────────────────────────────────────

function bidAssistantReducer(state, action) {
  switch (action.type) {
    // ── Documents ──
    case BID_ACTIONS.SET_DOCUMENTS:
      return { ...state, documents: action.payload };

    case BID_ACTIONS.SELECT_DOCUMENT:
      return {
        ...state,
        selectedDoc: action.payload,
        chatHistory: [],
        status: "",
      };

    case BID_ACTIONS.SET_DOCUMENT_DETAIL:
      return { ...state, selectedDoc: action.payload };

    case BID_ACTIONS.CLEAR_SELECTION:
      return {
        ...state,
        selectedDoc: null,
        draft: normalizeDraftPayload({}),
        chatHistory: [],
      };

    // ── Draft ──
    case BID_ACTIONS.SET_DRAFT:
      return { ...state, draft: normalizeDraftPayload(action.payload) };

    case BID_ACTIONS.UPDATE_DRAFT_FIELD:
      return {
        ...state,
        draft: { ...state.draft, [action.field]: action.value },
      };

    case BID_ACTIONS.APPLY_CHAT_SUGGESTION: {
      const { field, value, source } = action.payload;
      const snapshot = { ...state.draft };
      return {
        ...state,
        draft: { ...state.draft, [field]: value },
        draftHistory: [
          ...state.draftHistory,
          { timestamp: Date.now(), field, previous: snapshot[field], source: source || "chat" },
        ],
        chatHistory: [
          ...state.chatHistory,
          {
            role: "system",
            text: `Applied suggestion to ${field.replace(/_/g, " ")}.`,
            type: "action_applied",
          },
        ],
      };
    }

    case BID_ACTIONS.REVERT_SECTION: {
      const lastChange = [...state.draftHistory].reverse().find((h) => h.field === action.field);
      if (!lastChange) return state;
      return {
        ...state,
        draft: { ...state.draft, [action.field]: lastChange.previous },
        draftHistory: state.draftHistory.filter((h) => h !== lastChange),
      };
    }

    // ── Chat ──
    case BID_ACTIONS.ADD_CHAT_MESSAGE:
      return {
        ...state,
        chatHistory: [...state.chatHistory, action.payload],
      };

    case BID_ACTIONS.SET_CHAT_LOADING:
      return { ...state, chatLoading: action.payload };

    case BID_ACTIONS.CLEAR_CHAT:
      return { ...state, chatHistory: [], chatInput: "" };

    // ── Metrics ──
    case BID_ACTIONS.SET_METRICS:
      return { ...state, metrics: { ...getDefaultBidFitMetrics(), ...action.payload } };

    case BID_ACTIONS.UPDATE_METRIC_FIELD:
      return {
        ...state,
        metrics: { ...state.metrics, [action.field]: action.value },
      };

    // ── Status / loading ──
    case BID_ACTIONS.SET_STATUS:
      return { ...state, status: action.payload };

    case BID_ACTIONS.SET_LOADING:
      return { ...state, [action.key]: action.value };

    // ── Wizard ──
    case BID_ACTIONS.SET_WIZARD_STEP:
      return { ...state, wizardStep: action.payload };

    case BID_ACTIONS.SET_WIZARD_ACTIVE:
      return { ...state, wizardActive: action.payload, wizardStep: action.payload ? 0 : state.wizardStep };

    // ── Sections ──
    case BID_ACTIONS.TOGGLE_SECTION:
      return {
        ...state,
        expandedSections: {
          ...state.expandedSections,
          [action.key]: !state.expandedSections[action.key],
        },
      };

    default:
      return state;
  }
}

// ── Hook ────────────────────────────────────────────────────────────

export function useBidAssistantReducer() {
  const [state, dispatch] = useReducer(bidAssistantReducer, undefined, getInitialState);

  const actions = {
    setDocuments: useCallback((docs) => dispatch({ type: BID_ACTIONS.SET_DOCUMENTS, payload: docs }), []),
    selectDocument: useCallback((doc) => dispatch({ type: BID_ACTIONS.SELECT_DOCUMENT, payload: doc }), []),
    setDocumentDetail: useCallback((doc) => dispatch({ type: BID_ACTIONS.SET_DOCUMENT_DETAIL, payload: doc }), []),
    clearSelection: useCallback(() => dispatch({ type: BID_ACTIONS.CLEAR_SELECTION }), []),

    setDraft: useCallback((draft) => dispatch({ type: BID_ACTIONS.SET_DRAFT, payload: draft }), []),
    updateDraftField: useCallback((field, value) => dispatch({ type: BID_ACTIONS.UPDATE_DRAFT_FIELD, field, value }), []),
    applyChatSuggestion: useCallback((payload) => dispatch({ type: BID_ACTIONS.APPLY_CHAT_SUGGESTION, payload }), []),
    revertSection: useCallback((field) => dispatch({ type: BID_ACTIONS.REVERT_SECTION, field }), []),

    addChatMessage: useCallback((msg) => dispatch({ type: BID_ACTIONS.ADD_CHAT_MESSAGE, payload: msg }), []),
    setChatLoading: useCallback((v) => dispatch({ type: BID_ACTIONS.SET_CHAT_LOADING, payload: v }), []),
    clearChat: useCallback(() => dispatch({ type: BID_ACTIONS.CLEAR_CHAT }), []),

    setMetrics: useCallback((m) => dispatch({ type: BID_ACTIONS.SET_METRICS, payload: m }), []),
    updateMetricField: useCallback((field, value) => dispatch({ type: BID_ACTIONS.UPDATE_METRIC_FIELD, field, value }), []),

    setStatus: useCallback((s) => dispatch({ type: BID_ACTIONS.SET_STATUS, payload: s }), []),
    setLoading: useCallback((key, value) => dispatch({ type: BID_ACTIONS.SET_LOADING, key, value }), []),

    setWizardStep: useCallback((step) => dispatch({ type: BID_ACTIONS.SET_WIZARD_STEP, payload: step }), []),
    setWizardActive: useCallback((active) => dispatch({ type: BID_ACTIONS.SET_WIZARD_ACTIVE, payload: active }), []),

    toggleSection: useCallback((key) => dispatch({ type: BID_ACTIONS.TOGGLE_SECTION, key }), []),
  };

  return { state, dispatch, actions };
}
