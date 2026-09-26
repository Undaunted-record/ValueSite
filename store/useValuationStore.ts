"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_ASSUMPTIONS, DEFAULT_METHODS, DEMO_COMPANY, DEMO_PEERS, EMPTY_COMPANY } from "@/data/demo";
import { mergeDartCompany } from "@/lib/dart/merge";
import type { DartCompanyOverview, NormalizedDartFinancials } from "@/lib/dart/types";
import type { Assumptions, CompanyData, DartImportMeta, DataSource, Mode, PeerCompany, TerminalMethod, ValuationMethod } from "@/types/valuation";

interface ValuationState {
  mode: Mode;
  dataSource: DataSource;
  dartImport: DartImportMeta | null;
  company: CompanyData;
  assumptions: Assumptions;
  methods: ValuationMethod[];
  peers: PeerCompany[];
  terminalMethod: TerminalMethod;
  setMode: (mode: Mode) => void;
  setCompany: (company: CompanyData) => void;
  applyDartImport: (overview: DartCompanyOverview, imported: NormalizedDartFinancials, includeIdentity: boolean) => void;
  updateCompany: (patch: Partial<CompanyData>) => void;
  updateFinancial: (index: number, field: "revenue" | "ebit" | "netIncome", value: number) => void;
  updateAssumption: (field: keyof Assumptions, value: number) => void;
  toggleMethod: (method: ValuationMethod) => void;
  setTerminalMethod: (method: TerminalMethod) => void;
  setPeers: (peers: PeerCompany[]) => void;
  resetAssumptions: () => void;
  resetPeers: () => void;
  loadDemo: () => void;
  reset: () => void;
}

export const useValuationStore = create<ValuationState>()(
  persist(
    (set) => ({
      mode: "quick",
      dataSource: "empty",
      dartImport: null,
      company: EMPTY_COMPANY,
      assumptions: DEFAULT_ASSUMPTIONS,
      methods: DEFAULT_METHODS,
      peers: [],
      terminalMethod: "gordon",
      setMode: (mode) => set({ mode }),
      setCompany: (company) => set({ company, dataSource: "user", dartImport: null }),
      applyDartImport: (overview, imported, includeIdentity) => set((state) => ({
        company: mergeDartCompany(state.company, overview, imported, includeIdentity),
        dataSource: "dart",
        dartImport: { ...imported.metadata, corpName: overview.corpName, stockCode: overview.stockCode },
      })),
      updateCompany: (patch) => set((state) => ({
        company: { ...state.company, ...patch },
        dataSource: state.dataSource === "dart" ? "dart" : "user",
        dartImport: state.dartImport ? { ...state.dartImport, editedFields: [...new Set([...state.dartImport.editedFields, ...Object.keys(patch)])] } : null,
      })),
      updateFinancial: (index, field, value) => set((state) => ({
        company: {
          ...state.company,
          financials: state.company.financials.map((period, current) => current === index ? { ...period, [field]: value } : period),
        },
        dataSource: state.dataSource === "dart" ? "dart" : "user",
        dartImport: state.dartImport ? {
          ...state.dartImport,
          editedFields: [...new Set([...state.dartImport.editedFields, `financials.${state.company.financials[index]?.year.replace(/[AE]$/, "")}.${field}`])],
        } : null,
      })),
      updateAssumption: (field, value) => set((state) => ({ assumptions: { ...state.assumptions, [field]: value } })),
      toggleMethod: (method) => set((state) => {
        if (state.methods.includes(method) && state.methods.length === 1) return state;
        return { methods: state.methods.includes(method) ? state.methods.filter((item) => item !== method) : [...state.methods, method] };
      }),
      setTerminalMethod: (terminalMethod) => set({ terminalMethod }),
      setPeers: (peers) => set({ peers, dataSource: "user" }),
      resetAssumptions: () => set({ assumptions: DEFAULT_ASSUMPTIONS, terminalMethod: "gordon" }),
      resetPeers: () => set((state) => ({ peers: state.company.ticker === "DEMO" ? DEMO_PEERS : [] })),
      loadDemo: () => set({ company: DEMO_COMPANY, assumptions: DEFAULT_ASSUMPTIONS, methods: DEFAULT_METHODS, peers: DEMO_PEERS, mode: "quick", terminalMethod: "gordon", dataSource: "demo", dartImport: null }),
      reset: () => set({ company: EMPTY_COMPANY, assumptions: DEFAULT_ASSUMPTIONS, methods: DEFAULT_METHODS, peers: [], mode: "quick", terminalMethod: "gordon", dataSource: "empty", dartImport: null }),
    }),
    {
      name: "valuesite-valuation-ko-v3",
      version: 4,
      migrate: (persisted) => ({ ...(persisted as ValuationState), dartImport: null }),
    },
  ),
);
