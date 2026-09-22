"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_ASSUMPTIONS, DEFAULT_METHODS, DEMO_COMPANY, DEMO_PEERS, EMPTY_COMPANY } from "@/data/demo";
import type { Assumptions, CompanyData, Mode, PeerCompany, TerminalMethod, ValuationMethod } from "@/types/valuation";

interface ValuationState {
  mode: Mode;
  company: CompanyData;
  assumptions: Assumptions;
  methods: ValuationMethod[];
  peers: PeerCompany[];
  terminalMethod: TerminalMethod;
  setMode: (mode: Mode) => void;
  setCompany: (company: CompanyData) => void;
  updateCompany: (patch: Partial<CompanyData>) => void;
  updateFinancial: (index: number, field: "revenue" | "ebit" | "netIncome", value: number) => void;
  updateAssumption: (field: keyof Assumptions, value: number) => void;
  toggleMethod: (method: ValuationMethod) => void;
  setTerminalMethod: (method: TerminalMethod) => void;
  setPeers: (peers: PeerCompany[]) => void;
  loadDemo: () => void;
  reset: () => void;
}

export const useValuationStore = create<ValuationState>()(
  persist(
    (set) => ({
      mode: "quick",
      company: DEMO_COMPANY,
      assumptions: DEFAULT_ASSUMPTIONS,
      methods: DEFAULT_METHODS,
      peers: DEMO_PEERS,
      terminalMethod: "gordon",
      setMode: (mode) => set({ mode }),
      setCompany: (company) => set({ company }),
      updateCompany: (patch) => set((state) => ({ company: { ...state.company, ...patch } })),
      updateFinancial: (index, field, value) => set((state) => ({
        company: {
          ...state.company,
          financials: state.company.financials.map((period, current) => current === index ? { ...period, [field]: value } : period),
        },
      })),
      updateAssumption: (field, value) => set((state) => ({ assumptions: { ...state.assumptions, [field]: value } })),
      toggleMethod: (method) => set((state) => ({
        methods: state.methods.includes(method) ? state.methods.filter((item) => item !== method) : [...state.methods, method],
      })),
      setTerminalMethod: (terminalMethod) => set({ terminalMethod }),
      setPeers: (peers) => set({ peers }),
      loadDemo: () => set({ company: DEMO_COMPANY, assumptions: DEFAULT_ASSUMPTIONS, methods: DEFAULT_METHODS, peers: DEMO_PEERS, mode: "quick" }),
      reset: () => set({ company: EMPTY_COMPANY, assumptions: DEFAULT_ASSUMPTIONS, methods: DEFAULT_METHODS, peers: [], mode: "quick" }),
    }),
    { name: "valuesite-valuation-v1" },
  ),
);
